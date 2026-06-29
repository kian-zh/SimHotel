import { describe, expect, it } from 'vitest'
import { initGrid } from './gridIndex'
import { sampleLocationFactors } from './location'

describe('gridIndex', () => {
  it('generates grid points', () => {
    const points = initGrid(42)
    expect(points.length).toBeGreaterThan(100)
  })

  it('tourism higher near attractions', () => {
    const points = initGrid(42)
    const nearBund = sampleLocationFactors(points, 121.49, 31.24)
    const remote = sampleLocationFactors(points, 121.0, 31.0)
    expect(nearBund.tourism).toBeGreaterThanOrEqual(remote.tourism)
  })
})
