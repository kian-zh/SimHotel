import { useMemo } from 'react'
import { Layer, Source } from 'react-map-gl/mapbox'
import { generateHexCellsForCity, hexCellsToGeoJSON, snapToHexCell } from '../../data/grid/hexGrid'
import { useGameStore } from '../../stores/gameStore'

interface HexGridLayerProps {
  cityId: string | null
  visible: boolean
}

export function HexGridLayer({ cityId, visible }: HexGridLayerProps) {
  const hotels = useGameStore((s) => s.hotels)
  const previewCoordinates = useGameStore((s) => s.previewCoordinates)
  const pendingBuildCityId = useGameStore((s) => s.pendingBuildCityId)

  const geojson = useMemo(() => {
    if (!cityId || !visible) return null
    const cells = generateHexCellsForCity(cityId)
    const occupied = new Set(
      hotels.filter((h) => h.cityId === cityId && h.gridCellId).map((h) => h.gridCellId),
    )
    let previewId: string | null = null
    if (previewCoordinates && pendingBuildCityId === cityId) {
      const snap = snapToHexCell(previewCoordinates[0], previewCoordinates[1], cityId)
      previewId = snap?.cellId ?? null
    }
    return hexCellsToGeoJSON(cells, occupied, previewId)
  }, [cityId, visible, hotels, previewCoordinates, pendingBuildCityId])

  if (!geojson) return null

  return (
    <Source id="hex-grid" type="geojson" data={geojson}>
      <Layer
        id="hex-grid-fill"
        type="fill"
        paint={{
          'fill-color': [
            'case',
            ['get', 'preview'],
            '#2dd4bf',
            ['get', 'occupied'],
            '#64748b',
            '#1e293b',
          ],
          'fill-opacity': [
            'case',
            ['get', 'preview'],
            0.55,
            ['get', 'occupied'],
            0.35,
            0.12,
          ],
        }}
      />
      <Layer
        id="hex-grid-line"
        type="line"
        paint={{
          'line-color': [
            'case',
            ['get', 'preview'],
            '#2dd4bf',
            ['get', 'occupied'],
            '#94a3b8',
            '#475569',
          ],
          'line-width': ['case', ['get', 'preview'], 2, 1],
          'line-opacity': 0.8,
        }}
      />
    </Source>
  )
}
