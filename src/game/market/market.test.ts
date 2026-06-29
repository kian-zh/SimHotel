import { describe, expect, it } from 'vitest'
import { cities } from '../../data/cities'
import { calculateDailyDemand, calculateAttractiveness } from './market'
import { createTestHotel } from '../hotel/testHelpers'

describe('market model', () => {
  const hk = cities[0]
  const date = { year: 1990, month: 6, day: 15 }

  it('calculates positive demand for Hong Kong', () => {
    const demand = calculateDailyDemand(hk, date, [], [])
    expect(demand).toBeGreaterThan(0)
  })

  it('higher prices reduce demand indirectly via allocation', () => {
    const cheapHotel = createTestHotel({ id: 'h1', stars: 3, price: 100, quality: 60 })
    const expensive = { ...cheapHotel, id: 'h2', price: 500 }
    const lowDemand = calculateDailyDemand(hk, date, [expensive], [])
    const highDemand = calculateDailyDemand(hk, date, [cheapHotel], [])
    expect(highDemand).toBeGreaterThanOrEqual(lowDemand)
  })

  it('premium hotels have higher attractiveness', () => {
    const base = createTestHotel({ id: 'h1', stars: 3, price: 150, quality: 60 })
    const premium = { ...base, stars: 5 as const, quality: 90, price: 400 }
    expect(calculateAttractiveness(premium, 70)).toBeGreaterThan(calculateAttractiveness(base, 70))
  })
})
