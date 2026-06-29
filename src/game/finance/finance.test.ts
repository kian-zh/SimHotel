import { describe, expect, it } from 'vitest'
import { initWorldMetrics } from '../world/worldSim'
import type { GameState } from '../types'
import { createTestHotel } from '../hotel/testHelpers'
import { distributeLegacyRooms } from '../hotel/defaults'
import {
  calculateCreditRating,
  getAnnualInterestRate,
  getBorrowingLimit,
  getDailyInterestExpense,
  getLeverageRatio,
} from './finance'

const hotel = createTestHotel({
  roomInventory: distributeLegacyRooms(120, 4),
})

function mockState(overrides: Partial<GameState> = {}): GameState {
  return {
    date: { year: 1990, month: 1, day: 1 },
    cash: 8_000_000,
    dailyCashDelta: 0,
    reputation: 70,
    paused: false,
    hotels: [hotel],
    competitors: [],
    unlockedCities: ['hong-kong'],
    activeEvents: [],
    triggeredEventIds: [],
    cityMarkets: {},
    financeHistory: [],
    selectedCityId: 'hong-kong',
    selectedHotelId: null,
    showCityPanel: true,
    showHotelDetail: false,
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
    worldMetrics: initWorldMetrics(42),
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
    ...overrides,
  }
}

describe('finance capital markets', () => {
  it('derives a borrowing limit from player assets', () => {
    expect(getBorrowingLimit(mockState())).toBeGreaterThan(2_000_000)
  })

  it('downgrades credit rating as leverage rises', () => {
    const healthy = mockState({ debt: 1_000_000 })
    const stressed = mockState({ debt: 25_000_000, cash: 500_000 })
    expect(['AAA', 'A']).toContain(calculateCreditRating(healthy))
    expect(calculateCreditRating(stressed)).toBe('Distressed')
  })

  it('calculates leverage and daily interest expense', () => {
    const state = mockState({ debt: 5_000_000, creditRating: 'BBB' })
    expect(getLeverageRatio(state)).toBeGreaterThan(0)
    expect(getAnnualInterestRate(state)).toBeGreaterThan(state.baseInterestRate)
    expect(getDailyInterestExpense(state)).toBeGreaterThan(0)
  })
})
