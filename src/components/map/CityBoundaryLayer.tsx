import { Layer, Source } from 'react-map-gl/mapbox'
import { useMemo } from 'react'
import { getCityBounds } from '../../data/cities/bounds'
import { cityMap } from '../../data/cities'

interface CityBoundaryLayerProps {
  cityId: string | null
}

export function CityBoundaryLayer({ cityId }: CityBoundaryLayerProps) {
  const geojson = useMemo(() => {
    if (!cityId || !cityMap[cityId]) return null
    const b = getCityBounds(cityMap[cityId])
    return {
      type: 'FeatureCollection' as const,
      features: [
        {
          type: 'Feature' as const,
          properties: { cityId },
          geometry: {
            type: 'Polygon' as const,
            coordinates: [
              [
                [b.west, b.south],
                [b.east, b.south],
                [b.east, b.north],
                [b.west, b.north],
                [b.west, b.south],
              ],
            ],
          },
        },
      ],
    }
  }, [cityId])

  if (!geojson) return null

  return (
    <Source id="city-boundary" type="geojson" data={geojson}>
      <Layer
        id="city-boundary-fill"
        type="fill"
        paint={{ 'fill-color': '#2dd4bf', 'fill-opacity': 0.04 }}
      />
      <Layer
        id="city-boundary-line"
        type="line"
        paint={{ 'line-color': '#2dd4bf', 'line-width': 2, 'line-opacity': 0.7 }}
      />
    </Source>
  )
}
