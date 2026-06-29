import { describe, expect, it } from 'vitest'
import { cityMap } from '../../data/cities'
import { defaultOpeningConfig, emptyRoomInventory } from './defaults'
import { estimateBuildCostBreakdown } from './buildCost'
import { calcSpaceUsed, validateBuildConfig } from './space'
import { INITIAL_SPACE_TOTAL } from '../types'

describe('build cost estimation', () => {
  it('breaks down land, facility, and room costs', () => {
    const city = cityMap['hong-kong']
    const opening = defaultOpeningConfig(3)
    const breakdown = estimateBuildCostBreakdown({
      stars: 3,
      city,
      roomInventory: opening.roomInventory,
      facilities: opening.facilities,
      strategyPolicy: 'balanced',
    })

    expect(breakdown.landFee).toBeGreaterThan(0)
    expect(breakdown.facilityCost).toBeGreaterThan(0)
    expect(breakdown.roomCost).toBeGreaterThan(0)
    expect(breakdown.total).toBeGreaterThanOrEqual(
      breakdown.landFee + breakdown.facilityCost + breakdown.roomCost,
    )
    expect(breakdown.total).toBeGreaterThanOrEqual(2_000_000)
  })
})

describe('validateBuildConfig', () => {
  it('rejects configs that exceed space total', () => {
    const inventory = emptyRoomInventory()
    inventory.king = 20
    const result = validateBuildConfig(inventory, ['lobby'], INITIAL_SPACE_TOTAL, ['basic_ops'])
    expect(result.ok).toBe(false)
    expect(result.errors.some((e) => e.startsWith('space_exceeded'))).toBe(true)
  })

  it('rejects locked facilities without required tech', () => {
    const inventory = emptyRoomInventory()
    inventory.king = 3
    const result = validateBuildConfig(inventory, ['lobby', 'pool'], INITIAL_SPACE_TOTAL, ['basic_ops'])
    expect(result.ok).toBe(false)
    expect(result.errors.some((e) => e.startsWith('tech_required_facility'))).toBe(true)
  })

  it('accepts valid opening configuration', () => {
    const opening = defaultOpeningConfig(3)
    const result = validateBuildConfig(
      opening.roomInventory,
      opening.facilities,
      INITIAL_SPACE_TOTAL,
      ['basic_ops'],
    )
    expect(result.ok).toBe(true)
    expect(calcSpaceUsed(opening.roomInventory, opening.facilities)).toBeLessThanOrEqual(INITIAL_SPACE_TOTAL)
  })
})
