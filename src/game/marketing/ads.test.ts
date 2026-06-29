import { describe, expect, it } from 'vitest'
import { simulateDay } from '../engine/simulate'
import { calculateAttractiveness, calculateDailyDemand } from '../market/market'
import { getCityById } from '../market/market'
import { createTestHotel } from '../hotel/testHelpers'
import {
  AD_TYPES,
  applyStartBrandAd,
  applyStartHotelAd,
  budgetEffectiveness,
  canStartBrandAd,
  canStartHotelAd,
  getBrandDemandMultiplier,
  getHotelAdAttractivenessMultiplier,
  processDailyAdBilling,
  stackedBoostContribution,
  validateAdBudget,
} from './ads'
import type { AdCampaign, GameState } from '../types'

function mockState(overrides: Partial<GameState> = {}): GameState {
  return {
    date: { year: 1990, month: 1, day: 1 },
    cash: 8_000_000,
    dailyCashDelta: 0,
    reputation: 60,
    paused: false,
    hotels: [],
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
    worldSeed: 1,
    worldMetrics: {},
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

describe('ad configuration', () => {
  it('defines all six ad formats with budget ranges', () => {
    expect(Object.keys(AD_TYPES)).toHaveLength(6)
    for (const config of Object.values(AD_TYPES)) {
      expect(config.dailyCostMin).toBeLessThan(config.dailyCostMax)
      expect(config.durationDays).toBeGreaterThan(0)
      expect(config.demandBoost).toBeGreaterThan(0)
    }
  })

  it('validates budget within min/max', () => {
    expect(validateAdBudget('metro', 800)).toBe(true)
    expect(validateAdBudget('metro', 500)).toBe(false)
    expect(validateAdBudget('luxury_mag', 25_000)).toBe(true)
  })
})

describe('diminishing returns', () => {
  it('reduces marginal boost for stacked same-type ads', () => {
    const single = stackedBoostContribution(0.1, 1)
    const stacked = stackedBoostContribution(0.1, 1) + stackedBoostContribution(0.1, 2)
    expect(single).toBe(0.1)
    expect(stacked).toBeLessThan(0.2)
    expect(stacked).toBeCloseTo(0.15)
  })

  it('scales effectiveness with budget', () => {
    const low = budgetEffectiveness('social', AD_TYPES.social.dailyCostMin)
    const high = budgetEffectiveness('social', AD_TYPES.social.dailyCostMax)
    expect(high).toBeGreaterThan(low)
  })
})

describe('start/stop campaigns', () => {
  const hotel = createTestHotel({ ownerId: 'player' })

  it('starts hotel ad when valid', () => {
    const state = mockState({ hotels: [hotel] })
    const campaign = applyStartHotelAd(state, hotel.id, 'metro', 1_000, 14)
    expect(campaign).toMatchObject({
      hotelId: hotel.id,
      adType: 'metro',
      dailyBudget: 1_000,
      daysRemaining: 14,
    })
  })

  it('blocks duplicate hotel ad of same type', () => {
    const existing: AdCampaign = {
      id: 'ad-1',
      hotelId: hotel.id,
      adType: 'metro',
      dailyBudget: 1_000,
      daysRemaining: 5,
      startedAt: { year: 1990, month: 1, day: 1 },
    }
    expect(
      canStartHotelAd({ hotels: [hotel], hotelAds: [existing] }, hotel.id, 'metro', 1_000, 7).ok,
    ).toBe(false)
  })

  it('blocks brand ad when one is active', () => {
    expect(
      canStartBrandAd(
        { brandAd: { adType: 'ota', dailyBudget: 2_000, daysRemaining: 10 } },
        'metro',
        1_000,
        14,
      ).ok,
    ).toBe(false)
  })

  it('allows brand ad when slot is free', () => {
    const campaign = applyStartBrandAd({ brandAd: null }, 'ota', 2_000, 21)
    expect(campaign).toEqual({ adType: 'ota', dailyBudget: 2_000, daysRemaining: 21 })
  })
})

describe('daily billing', () => {
  it('deducts daily budgets and decrements remaining days', () => {
    const result = processDailyAdBilling(
      [
        {
          id: 'ad-1',
          hotelId: 'h1',
          adType: 'metro',
          dailyBudget: 900,
          daysRemaining: 1,
          startedAt: { year: 1990, month: 1, day: 1 },
        },
      ],
      { adType: 'ota', dailyBudget: 2_000, daysRemaining: 2 },
    )
    expect(result.expense).toBe(2_900)
    expect(result.hotelAds).toHaveLength(0)
    expect(result.brandAd).toEqual({ adType: 'ota', dailyBudget: 2_000, daysRemaining: 1 })
  })
})

describe('demand effects', () => {
  const city = getCityById('hong-kong')
  const hotel = createTestHotel({ ownerId: 'player' })

  it('boosts brand baseline demand when brand ad active', () => {
    const base = calculateDailyDemand(city, mockState().date, [hotel], [], undefined, undefined, {
      brandAd: null,
      hotelAds: [],
    })
    const boosted = calculateDailyDemand(city, mockState().date, [hotel], [], undefined, undefined, {
      brandAd: { adType: 'ota', dailyBudget: 4_000, daysRemaining: 10 },
      hotelAds: [],
    })
    expect(boosted).toBeGreaterThan(base)
  })

  it('boosts hotel attractiveness with segment-matched ad', () => {
    const dormHotel = createTestHotel({
      ownerId: 'player',
      roomInventory: { king: 0, twin: 0, dorm6: 10, suite: 0, deluxe_suite: 0, executive_suite: 0, luxury_resort_suite: 0 },
    })
    const base = calculateAttractiveness(dormHotel, 60)
    const withAd = calculateAttractiveness(dormHotel, 60, undefined, {
      brandAd: null,
      hotelAds: [
        {
          id: 'ad-social',
          hotelId: dormHotel.id,
          adType: 'social',
          dailyBudget: 1_500,
          daysRemaining: 7,
          startedAt: { year: 1990, month: 1, day: 1 },
        },
      ],
    })
    expect(withAd).toBeGreaterThan(base)
  })

  it('applies diminishing returns when brand and hotel share ad type', () => {
    const brandOnly = getBrandDemandMultiplier(
      { adType: 'airport', dailyBudget: 5_000, daysRemaining: 5 },
      [],
    )
    const combined = getBrandDemandMultiplier(
      { adType: 'airport', dailyBudget: 5_000, daysRemaining: 5 },
      [
        {
          id: 'ad-1',
          hotelId: hotel.id,
          adType: 'airport',
          dailyBudget: 5_000,
          daysRemaining: 5,
          startedAt: { year: 1990, month: 1, day: 1 },
        },
      ],
    )
    expect(combined - 1).toBeLessThan((brandOnly - 1) * 2)
  })

  it('integrates ad spend into simulateDay expenses', () => {
    const state = mockState({
      hotels: [hotel],
      hotelAds: [
        {
          id: 'ad-1',
          hotelId: hotel.id,
          adType: 'metro',
          dailyBudget: 1_200,
          daysRemaining: 3,
          startedAt: { year: 1990, month: 1, day: 1 },
        },
      ],
      brandAd: { adType: 'ota', dailyBudget: 2_500, daysRemaining: 2 },
    })
    const result = simulateDay(state)
    expect(result.hotelAds?.[0]?.daysRemaining).toBe(2)
    expect(result.brandAd?.daysRemaining).toBe(1)
    // Ad spend should be reflected in daily expenses
    const lastEntry = result.financeHistory?.[result.financeHistory.length - 1]
    expect(lastEntry?.dailyExpense).toBeGreaterThan(1_200 + 2_500)
  })
})

describe('hotel ad multiplier', () => {
  it('returns 1 when no active campaigns', () => {
    const hotel = createTestHotel({ ownerId: 'player' })
    expect(getHotelAdAttractivenessMultiplier(hotel, [], null)).toBe(1)
  })
})
