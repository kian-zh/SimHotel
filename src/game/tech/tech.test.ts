import { describe, expect, it } from 'vitest'
import { simulateDay } from '../engine/simulate'
import {
  advanceResearchDay,
  applyStartResearch,
  canStartResearch,
  getTechStatus,
} from './tech'
import type { GameState } from '../types'

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

describe('startResearch', () => {
  it('starts research when prerequisites met and funds sufficient', () => {
    const state = mockState()
    const result = applyStartResearch(state, 'leisure_1')
    expect(result).toEqual({
      cash: 8_000_000 - 350_000,
      researchingTech: { techId: 'leisure_1', daysRemaining: 30 },
    })
  })

  it('blocks when prerequisites not met', () => {
    expect(canStartResearch(mockState({ unlockedTechs: [] }), 'leisure_1')).toEqual({
      ok: false,
      reason: 'prerequisites',
    })
  })

  it('blocks when already unlocked', () => {
    expect(canStartResearch(mockState({ unlockedTechs: ['basic_ops', 'leisure_1'] }), 'leisure_1')).toEqual({
      ok: false,
      reason: 'already_unlocked',
    })
  })

  it('blocks when research already in progress', () => {
    expect(
      canStartResearch(
        mockState({ researchingTech: { techId: 'dining_excellence', daysRemaining: 10 } }),
        'leisure_1',
      ),
    ).toEqual({ ok: false, reason: 'already_researching' })
  })

  it('blocks when funds insufficient', () => {
    expect(canStartResearch(mockState({ cash: 100_000 }), 'leisure_1')).toEqual({
      ok: false,
      reason: 'funds',
    })
  })
})

describe('advanceResearchDay', () => {
  it('completes research and unlocks tech when days reach zero', () => {
    const state = mockState({
      researchingTech: { techId: 'leisure_1', daysRemaining: 1 },
    })
    expect(advanceResearchDay(state)).toEqual({
      unlockedTechs: ['basic_ops', 'leisure_1'],
      researchingTech: null,
    })
  })

  it('decrements days remaining while in progress', () => {
    const state = mockState({
      researchingTech: { techId: 'leisure_1', daysRemaining: 5 },
    })
    expect(advanceResearchDay(state)).toEqual({
      unlockedTechs: ['basic_ops'],
      researchingTech: { techId: 'leisure_1', daysRemaining: 4 },
    })
  })
})

describe('simulateDay research integration', () => {
  it('completes research over simulated days', () => {
    let state = mockState({
      researchingTech: { techId: 'leisure_1', daysRemaining: 2 },
      cash: 7_650_000,
    })

    const day1 = simulateDay(state)
    state = { ...state, ...day1 }
    expect(state.researchingTech).toEqual({ techId: 'leisure_1', daysRemaining: 1 })
    expect(state.unlockedTechs).toEqual(['basic_ops'])

    const day2 = simulateDay(state)
    state = { ...state, ...day2 }
    expect(state.researchingTech).toBeNull()
    expect(state.unlockedTechs).toEqual(['basic_ops', 'leisure_1'])
  })
})

describe('getTechStatus', () => {
  it('returns correct status for each phase', () => {
    const state = mockState()
    expect(getTechStatus(state, 'basic_ops')).toBe('unlocked')
    expect(getTechStatus(state, 'leisure_1')).toBe('available')
    expect(getTechStatus(state, 'resort_luxury')).toBe('locked')
    expect(
      getTechStatus(
        mockState({ researchingTech: { techId: 'leisure_1', daysRemaining: 10 } }),
        'leisure_1',
      ),
    ).toBe('researching')
  })
})
