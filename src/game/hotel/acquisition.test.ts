import { describe, expect, it } from 'vitest'
import { initWorldMetrics } from '../world/worldSim'
import type { GameState } from '../types'
import { createTestHotel } from './testHelpers'
import {
  evaluateAcquisitionOffer,
  processHotelSales,
  processAIDistressListings,
} from './acquisition'
import {
  estimateHotelValue,
  getAcquisitionQuote,
  getDistressMultiplier,
  getListPriceBounds,
  isOwnerInDistress,
} from './valuation'
import { getCityById } from '../market/market'

const city = getCityById('hong-kong')

function mockState(overrides: Partial<GameState> = {}): GameState {
  return {
    date: { year: 1990, month: 1, day: 1 },
    cash: 10_000_000,
    dailyCashDelta: 0,
    reputation: 60,
    paused: false,
    hotels: [],
    competitors: [
      {
        id: 'comp-test',
        name: { zh: '测试集团', en: 'Test Group' },
        personality: 'aggressive',
        cash: 5_000_000,
        reputation: 70,
        color: '#000',
      },
    ],
    unlockedCities: ['hong-kong'],
    activeEvents: [],
    triggeredEventIds: [],
    cityMarkets: {},
    financeHistory: [],
    selectedCityId: 'hong-kong',
    selectedHotelId: null,
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
    brandName: 'TestBrand',
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

describe('hotel valuation', () => {
  it('returns positive value for a standard hotel', () => {
    const hotel = createTestHotel({ occupancy: 0.75, quality: 72 })
    const value = estimateHotelValue(hotel, city)
    expect(value).toBeGreaterThan(500_000)
  })

  it('values higher occupancy hotels more', () => {
    const low = createTestHotel({ occupancy: 0.3 })
    const high = createTestHotel({ occupancy: 0.9 })
    expect(estimateHotelValue(high, city)).toBeGreaterThan(estimateHotelValue(low, city))
  })

  it('provides list price bounds at ±20%', () => {
    const hotel = createTestHotel()
    const value = estimateHotelValue(hotel, city)
    const bounds = getListPriceBounds(value)
    expect(bounds.min).toBe(Math.round(value * 0.8))
    expect(bounds.max).toBe(Math.round(value * 1.2))
  })
})

describe('acquisition quote', () => {
  it('returns offer range within 0.85–1.15 of valuation', () => {
    const hotel = createTestHotel({ ownerId: 'comp-test', occupancy: 0.7 })
    const quote = getAcquisitionQuote(hotel, city)
    expect(quote.minOffer).toBeGreaterThanOrEqual(Math.round(quote.valuation * 0.85 * 0.7))
    expect(quote.maxOffer).toBe(Math.round(quote.valuation * 1.15))
    expect(quote.suggestedOffer).toBeGreaterThan(quote.minOffer)
    expect(quote.suggestedOffer).toBeLessThan(quote.maxOffer)
  })

  it('lowers distress multiplier when owner cash is tight', () => {
    const hotel = createTestHotel({ ownerId: 'comp-test', occupancy: 0.35 })
    const normal = getDistressMultiplier(hotel, 5_000_000)
    const distressed = getDistressMultiplier(hotel, -500_000)
    expect(distressed).toBeLessThan(normal)
    expect(isOwnerInDistress(hotel, -500_000)).toBe(true)
  })

  it('accepts fair offers and counters low ones', () => {
    const hotel = createTestHotel({ ownerId: 'comp-test', occupancy: 0.7 })
    const quote = getAcquisitionQuote(hotel, city)
    const accepted = evaluateAcquisitionOffer(quote.valuation, quote, false)
    expect(accepted.outcome).toBe('accepted')

    const low = evaluateAcquisitionOffer(quote.minOffer - 1, quote, false)
    expect(low.outcome).toBe('rejected')

    const mid = evaluateAcquisitionOffer(quote.minOffer + 100, quote, false)
    expect(mid.outcome).toBe('counter')
    expect(mid.counterOffer).toBeGreaterThan(quote.minOffer)
  })

  it('accepts lower offers when owner is distressed', () => {
    const hotel = createTestHotel({ ownerId: 'comp-test', occupancy: 0.3 })
    const quote = getAcquisitionQuote(hotel, city, undefined, 200_000)
    const threshold = quote.valuation * quote.distressMultiplier * 0.88
    const offer = Math.round(threshold)
    const result = evaluateAcquisitionOffer(offer, quote, true)
    expect(result.outcome).toBe('accepted')
  })
})

describe('hotel sales simulation', () => {
  it('removes listed player hotels when a buyer accepts', () => {
    const hotel = createTestHotel({
      ownerId: 'player',
      saleListing: { listPrice: 1_000_000 },
    })
    const state = mockState({ hotels: [hotel], cash: 5_000_000 })

    const originalRandom = Math.random
    Math.random = () => 0.01

    const result = processHotelSales(state)
    expect(result.soldHotelIds).toContain(hotel.id)
    expect(result.hotels).toHaveLength(0)
    expect(result.cashDelta).toBeGreaterThan(0)

    Math.random = originalRandom
  })

  it('lists AI hotels when competitor is in distress', () => {
    const hotel = createTestHotel({ ownerId: 'comp-test', occupancy: 0.25 })
    const hotels = [hotel]
    const competitors = [
      {
        id: 'comp-test',
        name: { zh: '测试', en: 'Test' },
        personality: 'aggressive' as const,
        cash: -1_000_000,
        reputation: 50,
        color: '#000',
      },
    ]

    const originalRandom = Math.random
    Math.random = () => 0.01

    processAIDistressListings(hotels, competitors)
    expect(hotels[0].saleListing).toBeDefined()
    expect(hotels[0].saleListing!.listPrice).toBeGreaterThan(0)

    Math.random = originalRandom
  })
})
