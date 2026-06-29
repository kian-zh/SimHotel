import type { GridPoint, HotelStar } from '../types'
import { sampleGridAt } from './gridIndex'

export interface LocationFactors {
  tourism: number
  business: number
  base: number
}

export function computeLocationFactors(grid: GridPoint): LocationFactors {
  return {
    tourism: 0.4 * (grid.tourism / 50) + 0.6,
    business: 0.4 * (grid.economy / 50) + 0.6,
    base: 0.3 * (grid.population / 50) + 0.85,
  }
}

export function getStarLocationMultiplier(stars: HotelStar, factors: LocationFactors): number {
  if (stars === 3) return factors.tourism
  if (stars === 5) return factors.business
  return (factors.tourism + factors.business) / 2
}

export function estimateDemandBonus(factors: LocationFactors): number {
  const avg = (factors.tourism + factors.business + factors.base) / 3
  return Math.round((avg - 1) * 100)
}

export function sampleLocationFactors(
  gridPoints: GridPoint[],
  lng: number,
  lat: number,
  cityId?: string,
): LocationFactors {
  const grid = sampleGridAt(gridPoints, lng, lat, cityId)
  return computeLocationFactors(grid)
}
