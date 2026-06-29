import type { CityBounds } from '../../game/types'
import { getCityBounds } from '../cities/bounds'
import { cityMap } from '../cities'
import { isWithinBounds } from '../cities/bounds'

/**
 * Circumradius (center → vertex) in degrees (horizontal / lng axis).
 * Flat-top hex edge length equals this value along flat edges.
 */
export const HEX_SIZE_DEG = 0.011

/** Vertical squash: < 1 makes hex shorter (flatter) in latitude. */
export const HEX_LAT_SCALE = 0.62

const SQRT3 = Math.sqrt(3)

export interface HexCell {
  q: number
  r: number
  lng: number
  lat: number
  cellId: string
  cityId: string
}

export function hexCellId(q: number, r: number): string {
  return `${q},${r}`
}

export function parseHexCellId(cellId: string): { q: number; r: number } {
  const [q, r] = cellId.split(',').map(Number)
  return { q, r }
}

/** Flat-top axial hex → lng/lat offset from city center. */
export function hexToLatLng(
  q: number,
  r: number,
  originLng: number,
  originLat: number,
): [number, number] {
  const x = HEX_SIZE_DEG * (1.5 * q)
  const y = HEX_SIZE_DEG * (SQRT3 * (q / 2 + r)) * HEX_LAT_SCALE
  return [originLng + x, originLat + y]
}

/** lng/lat → nearest axial hex (flat-top layout). */
export function latLngToHex(
  lng: number,
  lat: number,
  originLng: number,
  originLat: number,
): { q: number; r: number } {
  const dx = (lng - originLng) / HEX_SIZE_DEG
  const dy = (lat - originLat) / (HEX_SIZE_DEG * HEX_LAT_SCALE)
  const q = (2 / 3) * dx
  const r = (-1 / 3) * dx + (SQRT3 / 3) * dy
  return axialRound(q, r)
}

function axialRound(q: number, r: number): { q: number; r: number } {
  const s = -q - r
  let rq = Math.round(q)
  let rr = Math.round(r)
  const rs = Math.round(s)
  const qDiff = Math.abs(rq - q)
  const rDiff = Math.abs(rr - r)
  const sDiff = Math.abs(rs - s)
  if (qDiff > rDiff && qDiff > sDiff) rq = -rr - rs
  else if (rDiff > sDiff) rr = -rq - rs
  return { q: rq, r: rr }
}

export function generateHexCellsForCity(cityId: string, bounds?: CityBounds): HexCell[] {
  const city = cityMap[cityId]
  if (!city) return []
  const b = bounds ?? getCityBounds(city)
  const [originLng, originLat] = city.coordinates
  const cells: HexCell[] = []
  const seen = new Set<string>()

  const qRange = Math.ceil((b.east - b.west) / (HEX_SIZE_DEG * 1.5)) + 2
  const rRange = Math.ceil((b.north - b.south) / (HEX_SIZE_DEG * SQRT3 * HEX_LAT_SCALE)) + 2

  for (let q = -qRange; q <= qRange; q++) {
    for (let r = -rRange; r <= rRange; r++) {
      const [lng, lat] = hexToLatLng(q, r, originLng, originLat)
      if (!isWithinBounds(lng, lat, b)) continue
      const cellId = hexCellId(q, r)
      if (seen.has(cellId)) continue
      seen.add(cellId)
      cells.push({ q, r, lng, lat, cellId, cityId })
    }
  }
  return cells
}

/**
 * Flat-top hex polygon: top and bottom edges are horizontal (0°/180°),
 * left and right are vertices.
 */
export function hexPolygon(
  lng: number,
  lat: number,
  circumradius = HEX_SIZE_DEG,
): [number, number][] {
  const corners: [number, number][] = []
  for (let i = 0; i < 6; i++) {
    const angle = ((60 * i) * Math.PI) / 180
    corners.push([
      lng + circumradius * Math.cos(angle),
      lat + circumradius * Math.sin(angle) * HEX_LAT_SCALE,
    ])
  }
  corners.push(corners[0])
  return corners
}

export function snapToHexCell(
  lng: number,
  lat: number,
  cityId: string,
): HexCell | null {
  const city = cityMap[cityId]
  if (!city) return null
  const bounds = getCityBounds(city)
  if (!isWithinBounds(lng, lat, bounds)) return null
  const [originLng, originLat] = city.coordinates
  const { q, r } = latLngToHex(lng, lat, originLng, originLat)
  const [cellLng, cellLat] = hexToLatLng(q, r, originLng, originLat)
  if (!isWithinBounds(cellLng, cellLat, bounds)) return null
  return { q, r, lng: cellLng, lat: cellLat, cellId: hexCellId(q, r), cityId }
}

export function isCellOccupied(
  hotels: { cityId: string; gridCellId?: string }[],
  cityId: string,
  cellId: string,
): boolean {
  return hotels.some((h) => h.cityId === cityId && h.gridCellId === cellId)
}

export function pickAvailableHexCell(
  cityId: string,
  hotels: { cityId: string; gridCellId?: string }[],
  seed: number,
): HexCell | null {
  const cells = generateHexCellsForCity(cityId)
  const available = cells.filter((c) => !isCellOccupied(hotels, cityId, c.cellId))
  if (available.length === 0) return null
  const idx = Math.abs(seed) % available.length
  return available[idx]
}

export function hexCellsToGeoJSON(
  cells: HexCell[],
  occupiedIds: Set<string>,
  previewId?: string | null,
) {
  return {
    type: 'FeatureCollection' as const,
    features: cells.map((c) => ({
      type: 'Feature' as const,
      properties: {
        cellId: c.cellId,
        occupied: occupiedIds.has(c.cellId),
        preview: c.cellId === previewId,
      },
      geometry: {
        type: 'Polygon' as const,
        coordinates: [hexPolygon(c.lng, c.lat)],
      },
    })),
  }
}

/** Distance between centers of hex (0,0) and (1,0) neighbors. */
export function hexNeighborDistance(): number {
  const dx = HEX_SIZE_DEG * 1.5
  const dy = HEX_SIZE_DEG * (SQRT3 / 2) * HEX_LAT_SCALE
  return Math.hypot(dx, dy)
}
