import type { CityMetrics, GridPoint } from '../types'
import { generateGrid } from '../../data/grid/generateGrid'
import { initWorldMetrics, computeWorldMetrics } from '../world/worldSim'

let cachedPoints: GridPoint[] = []
let cachedKey = ''

export function buildGridIndex(
  worldMetrics: Record<string, CityMetrics>,
  seed: number,
): GridPoint[] {
  const key = `${seed}-${Object.entries(worldMetrics).map(([k, v]) => `${k}:${v.population.toFixed(1)}:${v.economy.toFixed(1)}:${v.tourism.toFixed(1)}`).join('|')}`
  if (key === cachedKey) return cachedPoints
  cachedPoints = generateGrid(worldMetrics, seed)
  cachedKey = key
  return cachedPoints
}

export function rebuildGrid(
  baseMetrics: Record<string, CityMetrics>,
  seed: number,
  year: number,
  activeEvents: Parameters<typeof computeWorldMetrics>[3] = [],
): GridPoint[] {
  const world = computeWorldMetrics(baseMetrics, seed, year, activeEvents)
  return buildGridIndex(world, seed)
}

export function sampleGridAt(
  points: GridPoint[],
  lng: number,
  lat: number,
  cityId?: string,
): GridPoint {
  if (points.length === 0) {
    return { lng, lat, population: 50, economy: 50, tourism: 50, cityId: cityId ?? '', cellId: '' }
  }

  const pool = cityId ? points.filter((p) => p.cityId === cityId) : points
  const search = pool.length > 0 ? pool : points

  let nearest = search[0]
  let minDist = Infinity
  for (const p of search) {
    const d = Math.hypot(p.lng - lng, p.lat - lat)
    if (d < minDist) {
      minDist = d
      nearest = p
    }
  }
  return nearest
}

export function initGrid(seed: number): GridPoint[] {
  const metrics = initWorldMetrics(seed)
  return buildGridIndex(metrics, seed)
}

export function invalidateGridCache(): void {
  cachedKey = ''
  cachedPoints = []
}

export { initWorldMetrics }
