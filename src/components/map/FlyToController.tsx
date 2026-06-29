import { useEffect } from 'react'
import { useMap } from 'react-map-gl/mapbox'
import { cityMap } from '../../data/cities'
import { boundsCenter, fitBoundsZoom, getCityBounds } from '../../data/cities/bounds'
import { useGameStore } from '../../stores/gameStore'

const OVERVIEW_CENTER: [number, number] = [20, 25]
const OVERVIEW_ZOOM = 1.4

export function FlyToController() {
  const mapRef = useMap()
  const flyToCity = useGameStore((s) => s.flyToCity)
  const mapViewMode = useGameStore((s) => s.mapViewMode)
  const setFlyToCity = useGameStore((s) => s.setFlyToCity)

  useEffect(() => {
    const map = mapRef.current?.getMap()
    if (!map) return

    if (mapViewMode === 'overview') {
      map.flyTo({
        center: OVERVIEW_CENTER,
        zoom: OVERVIEW_ZOOM,
        pitch: 0,
        bearing: 0,
        duration: 1400,
        essential: true,
      })
      setFlyToCity(null)
      return
    }

    if (!flyToCity || !cityMap[flyToCity]) return
    const city = cityMap[flyToCity]
    const bounds = getCityBounds(city)
    const zoom = fitBoundsZoom(bounds)
    map.flyTo({
      center: boundsCenter(bounds),
      zoom,
      pitch: 0,
      bearing: 0,
      duration: 1200,
      essential: true,
    })
    setFlyToCity(null)
  }, [flyToCity, mapViewMode, mapRef, setFlyToCity])

  return null
}

export { OVERVIEW_CENTER, OVERVIEW_ZOOM }
