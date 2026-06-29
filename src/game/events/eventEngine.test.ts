import { describe, expect, it } from 'vitest'
import { checkAndTriggerEvents } from './eventEngine'
import { initWorldMetrics } from '../world/worldSim'
import type { GameState } from '../types'

function mockState(overrides: Partial<GameState> = {}): GameState {
  return {
    date: { year: 1997, month: 7, day: 1 },
    cash: 0,
    dailyCashDelta: 0,
    reputation: 50,
    paused: false,
    hotels: [],
    competitors: [],
    unlockedCities: ['hong-kong'],
    activeEvents: [],
    triggeredEventIds: [],
    cityMarkets: {},
    financeHistory: [],
    selectedCityId: null,
    selectedHotelId: null,
    showCityPanel: false,
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

describe('eventEngine', () => {
  it('triggers major event with pause', () => {
    const result = checkAndTriggerEvents(mockState())
    expect(result.pendingMajorEvent).not.toBeNull()
    expect(result.pendingMajorEvent?.eventId).toBe('hk-handover')
    expect(result.newsItems.length).toBe(1)
  })

  it('triggers minor event without major pending', () => {
    const result = checkAndTriggerEvents(
      mockState({ date: { year: 1990, month: 4, day: 18 } }),
    )
    expect(result.pendingMajorEvent).toBeNull()
    expect(result.newsItems[0]?.tier).toBe('minor')
  })
})
