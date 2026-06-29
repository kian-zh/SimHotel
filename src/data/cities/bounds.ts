import type { CityBounds, CityConfig } from '../../game/types'

/** Default metropolitan span in degrees (lng × lat). */
const DEFAULT_SPAN: Record<string, [number, number]> = {
  default: [0.22, 0.18],
  large: [0.35, 0.28],
  medium: [0.26, 0.22],
  compact: [0.18, 0.14],
}

const CITY_SPAN: Record<string, [number, number]> = {
  'hong-kong': DEFAULT_SPAN.compact,
  shenzhen: DEFAULT_SPAN.medium,
  guangzhou: DEFAULT_SPAN.large,
  shanghai: DEFAULT_SPAN.large,
  beijing: DEFAULT_SPAN.large,
  singapore: DEFAULT_SPAN.compact,
  'kuala-lumpur': DEFAULT_SPAN.medium,
  tokyo: DEFAULT_SPAN.large,
  seoul: DEFAULT_SPAN.large,
  'new-york': DEFAULT_SPAN.large,
  'los-angeles': DEFAULT_SPAN.large,
  'san-francisco': DEFAULT_SPAN.medium,
  london: DEFAULT_SPAN.large,
  paris: DEFAULT_SPAN.medium,
  dubai: DEFAULT_SPAN.medium,
  bangkok: DEFAULT_SPAN.large,
  sydney: DEFAULT_SPAN.large,
  mumbai: DEFAULT_SPAN.large,
  jakarta: DEFAULT_SPAN.large,
  taipei: DEFAULT_SPAN.medium,
}

export function makeBounds(center: [number, number], spanLng: number, spanLat: number): CityBounds {
  const [lng, lat] = center
  return {
    west: lng - spanLng / 2,
    east: lng + spanLng / 2,
    south: lat - spanLat / 2,
    north: lat + spanLat / 2,
  }
}

export function getCityBounds(city: CityConfig): CityBounds {
  if (city.bounds) return city.bounds
  const [spanLng, spanLat] = CITY_SPAN[city.id] ?? DEFAULT_SPAN.default
  return makeBounds(city.coordinates, spanLng, spanLat)
}

export function isWithinBounds(lng: number, lat: number, bounds: CityBounds): boolean {
  return lng >= bounds.west && lng <= bounds.east && lat >= bounds.south && lat <= bounds.north
}

export function boundsToMaxBounds(bounds: CityBounds): [[number, number], [number, number]] {
  return [
    [bounds.west, bounds.south],
    [bounds.east, bounds.north],
  ]
}

/** Approximate min zoom so the full city bounds fit in a typical viewport. */
export function fitBoundsZoom(bounds: CityBounds, viewportWidth = 800, viewportHeight = 600): number {
  const lngSpan = bounds.east - bounds.west
  const latSpan = bounds.north - bounds.south
  const centerLat = (bounds.south + bounds.north) / 2
  const latRad = (centerLat * Math.PI) / 180
  const lngZoom = Math.log2((viewportWidth * 360) / (256 * lngSpan * Math.cos(latRad)))
  const latZoom = Math.log2((viewportHeight * 180) / (256 * latSpan))
  return Math.max(8, Math.min(14, Math.min(lngZoom, latZoom) - 0.3))
}

export function boundsCenter(bounds: CityBounds): [number, number] {
  return [(bounds.west + bounds.east) / 2, (bounds.south + bounds.north) / 2]
}
