import { describe, expect, it } from 'vitest'
import {
  generateHexCellsForCity,
  hexCellId,
  hexNeighborDistance,
  hexPolygon,
  hexToLatLng,
  isCellOccupied,
  latLngToHex,
  HEX_SIZE_DEG,
  snapToHexCell,
} from './hexGrid'
import { getCityBounds } from '../cities/bounds'

describe('hexGrid', () => {
  it('generates cells within city bounds', () => {
    const cells = generateHexCellsForCity('hong-kong')
    expect(cells.length).toBeGreaterThan(20)
    const bounds = getCityBounds({ id: 'hong-kong', coordinates: [114.1694, 22.3193], name: { zh: '', en: '' }, unlockYear: 1990, unlockFee: 0, region: 'asia', market: {} as never })
    for (const cell of cells) {
      expect(cell.lng).toBeGreaterThanOrEqual(bounds.west)
      expect(cell.lng).toBeLessThanOrEqual(bounds.east)
      expect(cell.lat).toBeGreaterThanOrEqual(bounds.south)
      expect(cell.lat).toBeLessThanOrEqual(bounds.north)
    }
  })

  it('snaps lng/lat to consistent hex id', () => {
    const snap = snapToHexCell(114.17, 22.32, 'hong-kong')
    expect(snap).not.toBeNull()
    expect(snap!.cellId).toBe(hexCellId(snap!.q, snap!.r))
  })

  it('tracks cell occupation', () => {
    const snap = snapToHexCell(114.17, 22.32, 'hong-kong')!
    const hotels = [{ cityId: 'hong-kong', gridCellId: snap.cellId }]
    expect(isCellOccupied(hotels, 'hong-kong', snap.cellId)).toBe(true)
    expect(isCellOccupied(hotels, 'hong-kong', '99,99')).toBe(false)
  })

  it('round-trips axial coordinates', () => {
    const origin = [114.1694, 22.3193] as const
    const { q, r } = latLngToHex(114.18, 22.33, origin[0], origin[1])
    const snap = snapToHexCell(114.18, 22.33, 'hong-kong')
    expect(snap?.q).toBe(q)
    expect(snap?.r).toBe(r)
  })

  it('tessellates flat-top hexes without gaps', () => {
    const origin: [number, number] = [114.17, 22.32]
    const [lng0, lat0] = hexToLatLng(0, 0, origin[0], origin[1])
    const [lng1, lat1] = hexToLatLng(1, 0, origin[0], origin[1])
    const dist = Math.hypot(lng1 - lng0, lat1 - lat0)
    expect(dist).toBeCloseTo(hexNeighborDistance(), 10)

    const poly0 = hexPolygon(lng0, lat0)
    const poly1 = hexPolygon(lng1, lat1)
    // East vertex (0°) of center hex meets SW vertex (240°) of (q+1) neighbor.
    const eastVertex = poly0[0]
    const swVertex = poly1[4]
    expect(eastVertex[0]).toBeCloseTo(swVertex[0], 10)
    expect(eastVertex[1]).toBeCloseTo(swVertex[1], 10)

    // Flat top edge (horizontal) keeps length R in lng.
    const topEdgeLen = Math.hypot(poly0[2][0] - poly0[1][0], poly0[2][1] - poly0[1][1])
    expect(topEdgeLen).toBeCloseTo(HEX_SIZE_DEG, 10)
  })

  it('uses smaller circumradius than previous default', () => {
    expect(HEX_SIZE_DEG).toBeLessThan(0.018)
  })
})
