import { describe, expect, it } from 'vitest'
import { initWorldMetrics, computeWorldMetrics } from './worldSim'

describe('worldSim', () => {
  it('initWorldMetrics uses 1990 real baseline', () => {
    const m = initWorldMetrics(42)
    expect(m['hong-kong'].population).toBeGreaterThan(30)
    expect(m['shenzhen'].population).toBeLessThan(m['hong-kong'].population)
    expect(m['new-york'].economy).toBeGreaterThan(m['shenzhen'].economy)
  })

  it('computeWorldMetrics changes with year', () => {
    const base = initWorldMetrics(42)
    const m1990 = computeWorldMetrics(base, 42, 1990, [])
    const m2000 = computeWorldMetrics(base, 42, 2000, [])
    expect(m2000['shenzhen'].population).toBeGreaterThan(m1990['shenzhen'].population)
  })
})
