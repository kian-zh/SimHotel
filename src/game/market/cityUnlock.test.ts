import { describe, expect, it } from 'vitest'
import { canPurchaseCity } from './cityUnlock'
import type { GameState } from '../types'

function mockState(overrides: Partial<GameState> = {}): GameState {
  return {
    date: { year: 1995, month: 1, day: 1 },
    cash: 5_000_000,
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

describe('canPurchaseCity', () => {
  it('allows purchase when funds are sufficient', () => {
    expect(canPurchaseCity(mockState(), 'shenzhen')).toEqual({ ok: true })
  })

  it('blocks already unlocked cities', () => {
    expect(canPurchaseCity(mockState({ unlockedCities: ['hong-kong', 'shenzhen'] }), 'shenzhen')).toEqual({
      ok: false,
      reason: 'already_unlocked',
    })
  })

  it('allows purchase when funds are sufficient regardless of year', () => {
    expect(canPurchaseCity(mockState({ date: { year: 1990, month: 1, day: 1 } }), 'shanghai')).toEqual({ ok: true })
  })

  it('blocks when cash is insufficient', () => {
    expect(canPurchaseCity(mockState({ cash: 100_000 }), 'shenzhen')).toEqual({
      ok: false,
      reason: 'funds',
    })
  })
})
