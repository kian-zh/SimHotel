import { useMemo } from 'react'
import { Layer, Source } from 'react-map-gl/mapbox'
import type { HeatmapLayerSpecification } from 'react-map-gl/mapbox'
import type { MapLayerId } from '../../game/types'
import { gridToGeoJSON } from '../../data/grid/generateGrid'
import { rebuildGrid } from '../../game/market/gridIndex'
import { useGameStore } from '../../stores/gameStore'

type DataLayerId = Exclude<MapLayerId, 'none'>

const HEATMAP_COLORS: Record<DataLayerId, NonNullable<HeatmapLayerSpecification['paint']>> = {
  population: {
    'heatmap-color': [
      'interpolate',
      ['linear'],
      ['heatmap-density'],
      0,
      'rgba(45, 212, 191, 0)',
      0.3,
      'rgba(45, 212, 191, 0.4)',
      0.6,
      'rgba(20, 184, 166, 0.7)',
      1,
      'rgba(13, 148, 136, 1)',
    ],
  },
  economy: {
    'heatmap-color': [
      'interpolate',
      ['linear'],
      ['heatmap-density'],
      0,
      'rgba(251, 191, 36, 0)',
      0.3,
      'rgba(251, 191, 36, 0.4)',
      0.6,
      'rgba(245, 158, 11, 0.7)',
      1,
      'rgba(217, 119, 6, 1)',
    ],
  },
  tourism: {
    'heatmap-color': [
      'interpolate',
      ['linear'],
      ['heatmap-density'],
      0,
      'rgba(255, 107, 74, 0)',
      0.3,
      'rgba(255, 107, 74, 0.4)',
      0.6,
      'rgba(255, 85, 51, 0.7)',
      1,
      'rgba(239, 68, 68, 1)',
    ],
  },
}

const DATA_LAYERS: DataLayerId[] = ['population', 'economy', 'tourism']

const HEATMAP_PAINT_BASE: NonNullable<HeatmapLayerSpecification['paint']> = {
  'heatmap-intensity': 0.8,
  'heatmap-radius': 28,
  'heatmap-opacity': 0.55,
}

interface DataLayersProps {
  activeLayer: MapLayerId
  cityId?: string | null
}

export function DataLayers({ activeLayer, cityId }: DataLayersProps) {
  const worldMetrics = useGameStore((s) => s.worldMetrics)
  const worldSeed = useGameStore((s) => s.worldSeed)
  const date = useGameStore((s) => s.date)
  const activeEvents = useGameStore((s) => s.activeEvents)
  const gridVersion = useGameStore((s) => s.gridVersion)

  const geojson = useMemo(() => {
    void gridVersion
    const points = rebuildGrid(worldMetrics, worldSeed, date.year, activeEvents)
    const filtered = cityId ? points.filter((p) => p.cityId === cityId) : points
    return gridToGeoJSON(filtered)
  }, [worldMetrics, worldSeed, date.year, activeEvents, gridVersion, cityId])

  return (
    <Source id="grid-data" type="geojson" data={geojson}>
      {DATA_LAYERS.map((layerId) => (
        <Layer
          key={layerId}
          id={`grid-heatmap-${layerId}`}
          type="heatmap"
          layout={{
            visibility: activeLayer === layerId ? 'visible' : 'none',
          }}
          paint={{
            ...HEATMAP_PAINT_BASE,
            ...HEATMAP_COLORS[layerId],
            'heatmap-weight': ['get', layerId],
          }}
        />
      ))}
    </Source>
  )
}
