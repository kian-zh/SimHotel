import type { CityMetrics, GridPoint } from '../../game/types'
import { cities } from '../cities'
import { getCityBounds } from '../cities/bounds'
import { attractions } from '../attractions'
import { generateHexCellsForCity } from './hexGrid'
import { cellNoise, poiNoise } from './noise'

function gaussian(dist: number, sigma: number): number {
  return Math.exp(-(dist * dist) / (2 * sigma * sigma))
}

export function generateGrid(
  worldMetrics: Record<string, CityMetrics>,
  seed: number,
): GridPoint[] {
  const points: GridPoint[] = []

  for (const city of cities) {
    const metrics = worldMetrics[city.id]
    if (!metrics) continue

    const bounds = getCityBounds(city)
    const [clng, clat] = city.coordinates
    const cells = generateHexCellsForCity(city.id, bounds)
    const sigma = Math.max(bounds.east - bounds.west, bounds.north - bounds.south) / 4

    for (const cell of cells) {
      const dist = Math.hypot(cell.lng - clng, cell.lat - clat)
      const w = gaussian(dist, sigma)
      const noise = cellNoise(seed, `${city.id}_${cell.cellId}`)
      points.push({
        lng: cell.lng,
        lat: cell.lat,
        population: Math.min(100, metrics.population * w * noise),
        economy: Math.min(100, metrics.economy * w * noise),
        tourism: Math.min(100, metrics.tourism * w * noise),
        cityId: city.id,
        cellId: cell.cellId,
      })
    }
  }

  const cellMap = new Map(points.map((p) => [`${p.cityId}_${p.cellId}`, p]))

  for (const poi of attractions) {
    const [plng, plat] = poi.coordinates
    const poiSigma = 0.08
    const boost = poiNoise(seed, poi.id)
    const city = cities.find((c) => c.id === poi.cityId)
    if (!city) continue
    const cells = generateHexCellsForCity(poi.cityId)

    for (const cell of cells) {
      const dist = Math.hypot(cell.lng - plng, cell.lat - plat)
      if (dist > 0.15) continue
      const w = gaussian(dist, poiSigma) * boost
      const key = `${poi.cityId}_${cell.cellId}`
      const existing = cellMap.get(key)
      if (!existing) continue
      existing.tourism = Math.min(100, existing.tourism + (poi.tourismWeight ?? 50) * w * 0.15)
      if (poi.economyWeight) {
        existing.economy = Math.min(100, existing.economy + poi.economyWeight * w * 0.1)
      }
    }
  }

  return points
}

export function gridToGeoJSON(points: GridPoint[]) {
  return {
    type: 'FeatureCollection' as const,
    features: points.map((p) => ({
      type: 'Feature' as const,
      properties: {
        population: p.population,
        economy: p.economy,
        tourism: p.tourism,
        cityId: p.cityId,
        cellId: p.cellId,
      },
      geometry: { type: 'Point' as const, coordinates: [p.lng, p.lat] },
    })),
  }
}
