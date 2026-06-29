import { describe, expect, it, beforeEach } from 'vitest'
import { simulateDay } from '../engine/simulate'
import { emptyRoomInventory } from './defaults'
import { createTestHotel } from './testHelpers'
import {
  calcExpansionCost,
  calcExpansionDays,
  canRemoveFacility,
  clampStaff,
  getStaffLimits,
  processHotelDailyMaintenance,
} from './operations'
import type { GameState } from '../types'
import { useGameStore } from '../../stores/gameStore'

function baseGameState(hotel = createTestHotel({ ownerId: 'player' })): GameState {
  return {
    date: { year: 1990, month: 1, day: 1 },
    cash: 10_000_000,
    dailyCashDelta: 0,
    reputation: 60,
    paused: false,
    hotels: [hotel],
    competitors: [],
    unlockedCities: ['hong-kong'],
    activeEvents: [],
    triggeredEventIds: [],
    cityMarkets: {},
    financeHistory: [],
    selectedCityId: 'hong-kong',
    selectedHotelId: hotel.id,
    showHotelDetail: false,
    showCityPanel: true,
    showStats: false,
    mapViewMode: 'city',
    showBuildPanel: false,
    pendingBuildCityId: null,
    tutorialStep: 0,
    tutorialDismissed: false,
    lastAutoSaveAt: null,
    gameStarted: true,
    brandName: 'Test',
    worldSeed: 42,
    worldMetrics: {
      'hong-kong': { population: 50, economy: 50, tourism: 50 },
    },
    newsFeed: [],
    activeMapLayer: 'none',
    buildPlacementMode: false,
    previewCoordinates: null,
    showNews: false,
    gridVersion: 0,
    strategyPolicy: 'balanced',
    debt: 0,
    creditRating: 'AAA',
    baseInterestRate: 0.055,
    unlockedTechs: ['basic_ops'],
    researchingTech: null,
    hotelAds: [],
    brandAd: null,
  }
}

describe('hotel operations helpers', () => {
  it('calculates expansion cost and duration', () => {
    const hotel = createTestHotel({ spaceTotal: 20 })
    expect(calcExpansionCost(hotel, 5)).toBe(Math.round(5 * 85_000 * (1 + 20 / 40)))
    expect(calcExpansionDays(5)).toBe(30)
  })

  it('applies pending expansion when construction completes', () => {
    const hotel = createTestHotel({
      spaceTotal: 20,
      pendingExpansionSpace: 5,
      expansionDaysRemaining: 1,
    })
    processHotelDailyMaintenance(hotel)
    expect(hotel.expansionDaysRemaining).toBe(0)
    expect(hotel.spaceTotal).toBe(25)
    expect(hotel.pendingExpansionSpace).toBe(0)
  })

  it('decrements renovation cooldown daily', () => {
    const hotel = createTestHotel({ renovationCooldownDays: 3 })
    processHotelDailyMaintenance(hotel)
    expect(hotel.renovationCooldownDays).toBe(2)
  })

  it('clamps staff within role limits', () => {
    const hotel = createTestHotel()
    const limits = getStaffLimits(hotel)
    const clamped = clampStaff(
      {
        frontDesk: limits.frontDesk.max + 10,
        housekeeping: 0,
        foodService: 0,
        engineering: 0,
      },
      hotel,
    )
    expect(clamped.frontDesk).toBe(limits.frontDesk.max)
    expect(clamped.housekeeping).toBe(limits.housekeeping.min)
    expect(clamped.foodService).toBe(limits.foodService.min)
    expect(clamped.engineering).toBe(limits.engineering.min)
  })

  it('blocks removing facilities required by room mix', () => {
    const hotel = createTestHotel({
      roomInventory: { ...emptyRoomInventory(), king: 3, deluxe_suite: 1 },
      facilities: ['lobby', 'restaurant'],
    })
    expect(canRemoveFacility(hotel, 'restaurant', ['basic_ops'])).toBe(false)
    expect(canRemoveFacility(hotel, 'lobby', ['basic_ops'])).toBe(false)
  })
})

describe('gameStore hotel operations', () => {
  beforeEach(() => {
    const hotel = createTestHotel({
      ownerId: 'player',
      id: 'player-hotel-1',
      stars: 3,
      facilities: ['lobby', 'restaurant', 'laundry'],
      roomInventory: { ...emptyRoomInventory(), king: 5, twin: 0, dorm6: 0, suite: 0, deluxe_suite: 0, executive_suite: 0, luxury_resort_suite: 0 },
    })
    useGameStore.setState({
      ...baseGameState(hotel),
      flyToCity: null,
      pendingEvent: null,
    } as ReturnType<typeof useGameStore.getState>)
  })

  it('starts expansion without immediately increasing space', () => {
    const hotelId = 'player-hotel-1'
    const before = useGameStore.getState().hotels[0].spaceTotal
    const cost = calcExpansionCost(useGameStore.getState().hotels[0], 5)
    const cashBefore = useGameStore.getState().cash

    const ok = useGameStore.getState().expandHotelSpace(hotelId, 5)
    const state = useGameStore.getState()

    expect(ok).toBe(true)
    expect(state.cash).toBe(cashBefore - cost)
    expect(state.hotels[0].spaceTotal).toBe(before)
    expect(state.hotels[0].pendingExpansionSpace).toBe(5)
    expect(state.hotels[0].expansionDaysRemaining).toBe(30)
  })

  it('rejects room inventory that violates tech or space rules', () => {
    const hotelId = 'player-hotel-1'
    const invalid = emptyRoomInventory()
    invalid.executive_suite = 2
    expect(useGameStore.getState().setRoomInventory(hotelId, invalid)).toBe(false)

    const valid = emptyRoomInventory()
    valid.king = 6
    valid.twin = 2
    expect(useGameStore.getState().setRoomInventory(hotelId, valid)).toBe(true)
  })

  it('adds and removes optional facilities with validation', () => {
    const hotelId = 'player-hotel-1'
    expect(useGameStore.getState().addFacility(hotelId, 'pool')).toBe(false)

    expect(useGameStore.getState().removeFacility(hotelId, 'laundry')).toBe(true)
    expect(useGameStore.getState().hotels[0].facilities).not.toContain('laundry')

    expect(useGameStore.getState().addFacility(hotelId, 'laundry')).toBe(true)
    expect(useGameStore.getState().hotels[0].facilities).toContain('laundry')

    expect(useGameStore.getState().removeFacility(hotelId, 'lobby')).toBe(false)
    expect(useGameStore.getState().removeFacility(hotelId, 'laundry')).toBe(true)
  })

  it('renovates hotel and sets cooldown', () => {
    const hotelId = 'player-hotel-1'
    const qualityBefore = useGameStore.getState().hotels[0].quality
    const ok = useGameStore.getState().renovateHotel(hotelId)
    const hotel = useGameStore.getState().hotels[0]
    expect(ok).toBe(true)
    expect(hotel.quality).toBeGreaterThan(qualityBefore)
    expect(hotel.renovationCooldownDays).toBe(14)
  })

  it('hires staff within limits and rejects out-of-range values', () => {
    const hotelId = 'player-hotel-1'
    const hotel = useGameStore.getState().hotels[0]
    const limits = getStaffLimits(hotel)

    expect(
      useGameStore.getState().hireStaff(hotelId, {
        frontDesk: limits.frontDesk.min + 1,
      }),
    ).toBe(true)

    expect(
      useGameStore.getState().hireStaff(hotelId, {
        frontDesk: limits.frontDesk.max + 5,
      }),
    ).toBe(false)
  })
})

describe('simulateDay hotel maintenance', () => {
  it('completes expansion after remaining days elapse', () => {
    const hotel = createTestHotel({
      ownerId: 'player',
      spaceTotal: 20,
      pendingExpansionSpace: 5,
      expansionDaysRemaining: 1,
      renovationCooldownDays: 2,
    })
    const state = baseGameState(hotel)
    const result = simulateDay(state)
    const updated = result.hotels?.find((h) => h.id === hotel.id)
    expect(updated?.expansionDaysRemaining).toBe(0)
    expect(updated?.spaceTotal).toBe(25)
    expect(updated?.renovationCooldownDays).toBe(1)
  })
})
