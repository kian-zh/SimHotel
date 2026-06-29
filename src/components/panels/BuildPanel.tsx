import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { cityMap } from '../../data/cities'
import { snapToHexCell, isCellOccupied } from '../../data/grid/hexGrid'
import { rebuildGrid } from '../../game/market/gridIndex'
import { estimateDemandBonus, sampleLocationFactors } from '../../game/market/market'
import type { HotelFacilityList, HotelRoomInventory, HotelStar } from '../../game/types'
import { STAR_CONFIG } from '../../game/types'
import { useGameStore } from '../../stores/gameStore'
import { Button } from '../ui/Button'
import { Card } from '../ui/Card'
import { SlidePanel } from '../ui/SlidePanel'
import { createDefaultBuildConfig, HotelBuildWizard } from './HotelBuildWizard'

const RIGHT_PANEL_POS =
  'inset-x-0 top-20 bottom-0 w-full sm:inset-x-auto sm:right-0 sm:left-auto sm:top-16 sm:bottom-2 sm:w-72'
const PANEL_CARD = 'h-full overflow-y-auto p-2.5 shadow-xl sm:p-3'

type BuildStep = 'site' | 'space'

export function BuildPanel() {
  const { t, i18n } = useTranslation()
  const lang = i18n.language === 'zh' ? 'zh' : 'en'
  const showBuildPanel = useGameStore((s) => s.showBuildPanel)
  const pendingBuildCityId = useGameStore((s) => s.pendingBuildCityId)
  const unlockedCities = useGameStore((s) => s.unlockedCities)
  const previewCoordinates = useGameStore((s) => s.previewCoordinates)
  const worldMetrics = useGameStore((s) => s.worldMetrics)
  const worldSeed = useGameStore((s) => s.worldSeed)
  const date = useGameStore((s) => s.date)
  const activeEvents = useGameStore((s) => s.activeEvents)
  const gridVersion = useGameStore((s) => s.gridVersion)
  const setShowBuildPanel = useGameStore((s) => s.setShowBuildPanel)
  const buildHotel = useGameStore((s) => s.buildHotel)

  const [step, setStep] = useState<BuildStep>('site')
  const [cityId, setCityId] = useState('hong-kong')
  const [stars, setStars] = useState<HotelStar>(3)
  const [roomInventory, setRoomInventory] = useState<HotelRoomInventory>(() => createDefaultBuildConfig(3).roomInventory)
  const [facilities, setFacilities] = useState<HotelFacilityList>(() => createDefaultBuildConfig(3).facilities)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    if (pendingBuildCityId) setCityId(pendingBuildCityId)
  }, [pendingBuildCityId])

  useEffect(() => {
    if (showBuildPanel) {
      setError('')
      setSuccess('')
      setStep('site')
      const defaults = createDefaultBuildConfig(stars)
      setRoomInventory(defaults.roomInventory)
      setFacilities(defaults.facilities)
    }
  }, [showBuildPanel])

  const selectedCity = cityId ? cityMap[cityId] : null

  const gridPoints = useMemo(() => {
    void gridVersion
    return rebuildGrid(worldMetrics, worldSeed, date.year, activeEvents)
  }, [worldMetrics, worldSeed, date.year, activeEvents, gridVersion])

  const locationPreview = useMemo(() => {
    if (!previewCoordinates || !cityId) return null
    const snap = snapToHexCell(previewCoordinates[0], previewCoordinates[1], cityId)
    if (!snap) return { invalid: true as const }
    const occupied = isCellOccupied(useGameStore.getState().hotels, cityId, snap.cellId)
    const factors = sampleLocationFactors(gridPoints, snap.lng, snap.lat, cityId)
    const grid = gridPoints.find((p) => p.cellId === snap.cellId && p.cityId === cityId)
    return {
      invalid: false as const,
      occupied,
      snap,
      factors,
      bonus: estimateDemandBonus(factors),
      grid: grid ?? { population: 50, economy: 50, tourism: 50 },
    }
  }, [previewCoordinates, gridPoints, cityId])

  const canProceedToSpace =
    !!previewCoordinates &&
    !!locationPreview &&
    !locationPreview.invalid &&
    !locationPreview.occupied

  const handleBuild = () => {
    if (!selectedCity || !previewCoordinates || !locationPreview || locationPreview.invalid || locationPreview.occupied) {
      return
    }
    const config = STAR_CONFIG[stars]
    const ok = buildHotel({
      cityId,
      stars,
      price: config.basePrice,
      coordinates: [locationPreview.snap.lng, locationPreview.snap.lat],
      gridCellId: locationPreview.snap.cellId,
      roomInventory,
      facilities,
    })
    if (!ok) setError(t('insufficientFunds'))
    else {
      setError('')
      setSuccess(t('hotelBuiltBrief', { city: selectedCity.name[lang] }))
    }
  }

  return (
    <SlidePanel open={showBuildPanel} side="right" className={RIGHT_PANEL_POS}>
      <Card className={PANEL_CARD}>
        <div className="mb-2 flex items-center justify-between gap-2">
          <h2 className="text-sm font-bold">{t('buildHotel')}</h2>
          <Button variant="ghost" size="sm" onClick={() => setShowBuildPanel(false)}>
            {t('close')}
          </Button>
        </div>

        {step === 'site' ? (
          <>
            <div className="mb-2 flex items-center gap-1 text-[10px] text-muted">
              <span className="rounded-full bg-teal/20 px-2 py-0.5 font-medium text-teal-dark">{t('buildStepSite')}</span>
              <span>→</span>
              <span className="rounded-full bg-card-dark px-2 py-0.5">{t('buildStepSpace')}</span>
            </div>

            <p className="mb-2 rounded-md bg-teal/10 px-2 py-1.5 text-[11px] leading-snug text-teal-dark">
              {t('clickHexToPlace')}
            </p>

            <label className="mb-0.5 block text-[11px] text-muted">{t('selectCity')}</label>
            <select
              className="mb-2 w-full rounded-md border border-border bg-white px-2 py-1.5 text-xs"
              value={cityId}
              onChange={(e) => {
                const next = e.target.value
                setCityId(next)
                useGameStore.getState().setShowBuildPanel(true, next)
              }}
            >
              {unlockedCities.map((id) => (
                <option key={id} value={id}>
                  {cityMap[id]?.name[lang]}
                </option>
              ))}
            </select>

            {locationPreview && !locationPreview.invalid && (
              <div className="mb-2 rounded-md border border-teal/30 bg-teal/5 p-2 text-[11px]">
                <div className="mb-1 font-medium text-teal-dark">{t('locationPreview')}</div>
                {locationPreview.occupied && (
                  <p className="mb-1 text-red-500">{t('cellOccupied')}</p>
                )}
                <div className="grid grid-cols-3 gap-1">
                  <div>
                    <div className="text-muted">{t('layerTourism')}</div>
                    <div className="font-semibold">{Math.round(locationPreview.grid.tourism)}</div>
                  </div>
                  <div>
                    <div className="text-muted">{t('layerEconomy')}</div>
                    <div className="font-semibold">{Math.round(locationPreview.grid.economy)}</div>
                  </div>
                  <div>
                    <div className="text-muted">{t('layerPopulation')}</div>
                    <div className="font-semibold">{Math.round(locationPreview.grid.population)}</div>
                  </div>
                </div>
                <div className="mt-1 text-accent">
                  {t('demandBonus', {
                    bonus: locationPreview.bonus >= 0 ? `+${locationPreview.bonus}` : locationPreview.bonus,
                  })}
                </div>
              </div>
            )}

            <Button
              className="w-full"
              size="sm"
              onClick={() => setStep('space')}
              disabled={!canProceedToSpace}
            >
              {t('buildNextStep')}
            </Button>
          </>
        ) : (
          <HotelBuildWizard
            cityId={cityId}
            stars={stars}
            roomInventory={roomInventory}
            facilities={facilities}
            onStarsChange={setStars}
            onRoomInventoryChange={setRoomInventory}
            onFacilitiesChange={setFacilities}
            onBack={() => setStep('site')}
            onConfirm={handleBuild}
            error={error}
            success={success}
          />
        )}
      </Card>
    </SlidePanel>
  )
}
