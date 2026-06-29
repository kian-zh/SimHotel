import { useCallback, useMemo } from 'react'
import Map, { Marker, NavigationControl } from 'react-map-gl/mapbox'
import type { MapMouseEvent } from 'react-map-gl/mapbox'
import 'mapbox-gl/dist/mapbox-gl.css'
import { motion } from 'framer-motion'
import { cities, getCityName } from '../../data/cities'
import { boundsCenter, boundsToMaxBounds, fitBoundsZoom, getCityBounds } from '../../data/cities/bounds'
import { competitors } from '../../data/competitors'
import { isCellOccupied, snapToHexCell } from '../../data/grid/hexGrid'
import { useGameStore } from '../../stores/gameStore'
import { useTranslation } from 'react-i18next'
import { DataLayers } from './DataLayers'
import { LayerControl } from './LayerSwitcher'
import { CityBoundaryLayer } from './CityBoundaryLayer'
import { HexGridLayer } from './HexGridLayer'
import { FlyToController, OVERVIEW_CENTER, OVERVIEW_ZOOM } from './FlyToController'
import { CitySwitcher } from './CitySwitcher'

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN as string

interface GameMapProps {
  layout?: 'fullscreen' | 'embedded'
}

export function GameMap({ layout = 'fullscreen' }: GameMapProps) {
  const { i18n } = useTranslation()
  const lang = i18n.language === 'zh' ? 'zh' : 'en'
  const hotels = useGameStore((s) => s.hotels)
  const unlockedCities = useGameStore((s) => s.unlockedCities)
  const selectedCityId = useGameStore((s) => s.selectedCityId)
  const selectCity = useGameStore((s) => s.selectCity)
  const selectHotel = useGameStore((s) => s.selectHotel)
  const activeMapLayer = useGameStore((s) => s.activeMapLayer)
  const buildPlacementMode = useGameStore((s) => s.buildPlacementMode)
  const previewCoordinates = useGameStore((s) => s.previewCoordinates)
  const setPreviewCoordinates = useGameStore((s) => s.setPreviewCoordinates)
  const pendingBuildCityId = useGameStore((s) => s.pendingBuildCityId)
  const mapViewMode = useGameStore((s) => s.mapViewMode)
  const setShowStats = useGameStore((s) => s.setShowStats)

  const isOverview = mapViewMode === 'overview' || layout === 'embedded'
  const focusCityId = isOverview ? null : selectedCityId

  const cityConstraints = useMemo(() => {
    if (isOverview || !focusCityId || !unlockedCities.includes(focusCityId)) {
      return {
        initialView: {
          longitude: OVERVIEW_CENTER[0],
          latitude: OVERVIEW_CENTER[1],
          zoom: OVERVIEW_ZOOM,
          pitch: 0,
          bearing: 0,
        },
        maxBounds: undefined as [[number, number], [number, number]] | undefined,
        minZoom: OVERVIEW_ZOOM,
        maxZoom: OVERVIEW_ZOOM,
      }
    }
    const city = cities.find((c) => c.id === focusCityId)
    if (!city) {
      return {
        initialView: { longitude: 114.1694, latitude: 22.3193, zoom: 11, pitch: 0, bearing: 0 },
        maxBounds: undefined,
        minZoom: 9,
        maxZoom: 16,
      }
    }
    const bounds = getCityBounds(city)
    const center = boundsCenter(bounds)
    const minZoom = fitBoundsZoom(bounds)
    return {
      initialView: {
        longitude: center[0],
        latitude: center[1],
        zoom: minZoom,
        pitch: 0,
        bearing: 0,
      },
      maxBounds: boundsToMaxBounds(bounds),
      minZoom,
      maxZoom: 16,
    }
  }, [isOverview, focusCityId, unlockedCities])

  const competitorColors = useMemo(
    () => Object.fromEntries(competitors.map((c) => [c.id, c.color])),
    [],
  )

  const visibleHotels = useMemo(() => {
    if (isOverview) return hotels
    if (!focusCityId) return []
    return hotels.filter((h) => h.cityId === focusCityId)
  }, [hotels, isOverview, focusCityId])

  const onMapClick = useCallback(
    (e: MapMouseEvent) => {
      if (isOverview) return
      const { lng, lat } = e.lngLat

      if (buildPlacementMode && pendingBuildCityId) {
        const snap = snapToHexCell(lng, lat, pendingBuildCityId)
        if (!snap) return
        if (isCellOccupied(hotels, pendingBuildCityId, snap.cellId)) return
        setPreviewCoordinates([snap.lng, snap.lat])
        return
      }

      if (focusCityId) {
        const bounds = getCityBounds(cities.find((c) => c.id === focusCityId)!)
        if (lng < bounds.west || lng > bounds.east || lat < bounds.south || lat > bounds.north) return
      }
    },
    [isOverview, hotels, buildPlacementMode, pendingBuildCityId, setPreviewCoordinates, focusCityId],
  )

  return (
    <div className={layout === 'embedded' ? 'relative h-full w-full' : 'absolute inset-0'}>
      <Map
        initialViewState={cityConstraints.initialView}
        mapboxAccessToken={MAPBOX_TOKEN}
        mapStyle="mapbox://styles/mapbox/dark-v11"
        style={{ width: '100%', height: '100%' }}
        onClick={onMapClick}
        attributionControl={layout === 'fullscreen'}
        cursor={buildPlacementMode && !isOverview ? 'crosshair' : isOverview ? 'default' : 'grab'}
        maxBounds={isOverview ? undefined : cityConstraints.maxBounds}
        minZoom={cityConstraints.minZoom}
        maxZoom={cityConstraints.maxZoom}
        scrollZoom={!isOverview}
        dragPan={!isOverview}
        dragRotate={false}
        doubleClickZoom={!isOverview}
        touchZoomRotate={!isOverview}
        keyboard={!isOverview}
      >
        <FlyToController />
        {!isOverview && <NavigationControl position="bottom-right" />}
        {!isOverview && <LayerControl />}
        {!isOverview && <DataLayers activeLayer={activeMapLayer} cityId={focusCityId} />}
        {!isOverview && focusCityId && <CityBoundaryLayer cityId={focusCityId} />}
        {!isOverview && focusCityId && (
          <HexGridLayer cityId={focusCityId} visible />
        )}

        {isOverview &&
          cities.map((city) => {
            const unlocked = unlockedCities.includes(city.id)
            const playerCount = hotels.filter((h) => h.cityId === city.id && h.ownerId === 'player').length
            return (
              <Marker
                key={city.id}
                longitude={city.coordinates[0]}
                latitude={city.coordinates[1]}
                anchor="center"
                onClick={(e) => {
                  e.originalEvent.stopPropagation()
                  if (unlocked) selectCity(city.id)
                  else setShowStats(true)
                }}
              >
                <div
                  className={`rounded-full border px-2 py-0.5 text-[10px] font-medium ${
                    unlocked
                      ? 'border-teal bg-card/90 text-slate-800'
                      : 'border-slate-600 bg-slate-800/80 text-slate-500'
                  }`}
                >
                  {getCityName(city.id, lang)}
                  {playerCount > 0 && <span className="ml-1 text-accent">·{playerCount}</span>}
                </div>
              </Marker>
            )
          })}

        {!isOverview &&
          cities
            .filter((c) => c.id === focusCityId)
            .map((city) => {
              return (
                <Marker
                  key={city.id}
                  longitude={city.coordinates[0]}
                  latitude={city.coordinates[1]}
                  anchor="center"
                >
                  <div className="flex flex-col items-center">
                    <div className="rounded-full border-2 border-accent bg-accent/90 px-2 py-1 text-xs font-medium text-white backdrop-blur-sm">
                      {getCityName(city.id, lang)}
                    </div>
                  </div>
                </Marker>
              )
            })}

        {visibleHotels.map((hotel) => {
          const isPlayer = hotel.ownerId === 'player'
          const color = isPlayer ? '#ff6b4a' : competitorColors[hotel.ownerId] ?? '#94a3b8'
          return (
            <Marker
              key={hotel.id}
              longitude={hotel.coordinates[0]}
              latitude={hotel.coordinates[1]}
              anchor="bottom"
              onClick={(e) => {
                e.originalEvent.stopPropagation()
                selectHotel(hotel.id)
              }}
            >
              <motion.div
                initial={{ scale: 0, y: 10 }}
                animate={{ scale: 1, y: 0 }}
                whileHover={{ scale: 1.15 }}
                className="cursor-pointer"
              >
                <svg width="24" height="28" viewBox="0 0 24 28" fill="none">
                  <path d="M12 0C5.4 0 0 5.4 0 12c0 9 12 16 12 16s12-7 12-16c0-6.6-5.4-12-12-12z" fill={color} />
                  <text x="12" y="14" textAnchor="middle" fill="white" fontSize="10" fontWeight="bold">
                    {hotel.stars}★
                  </text>
                </svg>
              </motion.div>
            </Marker>
          )
        })}

        {previewCoordinates && !isOverview && (
          <Marker longitude={previewCoordinates[0]} latitude={previewCoordinates[1]} anchor="bottom">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
            >
              <svg width="28" height="32" viewBox="0 0 24 28" fill="none">
                <path d="M12 0C5.4 0 0 5.4 0 12c0 9 12 16 12 16s12-7 12-16c0-6.6-5.4-12-12-12z" fill="#2dd4bf" stroke="#fff" strokeWidth="2" />
              </svg>
            </motion.div>
          </Marker>
        )}
      </Map>
      {layout === 'fullscreen' && !isOverview && <CitySwitcher />}
    </div>
  )
}
