import { describe, expect, it } from 'vitest'
import { cellNoise, yearlyDrift } from './noise'

describe('noise', () => {
  it('cellNoise is reproducible', () => {
    expect(cellNoise(42, 'cell-1')).toBe(cellNoise(42, 'cell-1'))
  })

  it('yearlyDrift stays within bounds', () => {
    const d = yearlyDrift(123, 'hong-kong', 1995)
    expect(d).toBeGreaterThanOrEqual(0.95)
    expect(d).toBeLessThanOrEqual(1.05)
  })
})
