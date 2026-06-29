import { describe, expect, it } from 'vitest'
import { computeLocationFactors, getStarLocationMultiplier, estimateDemandBonus } from './location'
import type { GridPoint } from '../types'

const sampleGrid: GridPoint = {
  lng: 114.17,
  lat: 22.32,
  population: 80,
  economy: 70,
  tourism: 90,
  cityId: 'hong-kong',
  cellId: '0,0',
}

describe('location', () => {
  it('computeLocationFactors stays in expected range', () => {
    const f = computeLocationFactors(sampleGrid)
    expect(f.tourism).toBeGreaterThanOrEqual(0.6)
    expect(f.tourism).toBeLessThanOrEqual(1.4)
    expect(f.business).toBeGreaterThanOrEqual(0.6)
    expect(f.base).toBeGreaterThanOrEqual(0.85)
  })

  it('getStarLocationMultiplier weights by star rating', () => {
    const f = computeLocationFactors(sampleGrid)
    expect(getStarLocationMultiplier(3, f)).toBe(f.tourism)
    expect(getStarLocationMultiplier(5, f)).toBe(f.business)
    expect(getStarLocationMultiplier(4, f)).toBeCloseTo((f.tourism + f.business) / 2)
  })

  it('estimateDemandBonus reflects above-average location', () => {
    const f = computeLocationFactors(sampleGrid)
    expect(estimateDemandBonus(f)).toBeGreaterThan(0)
  })
})
