import { useTranslation } from 'react-i18next'
import { cityMap } from '../../data/cities'
import { getCityProfile } from '../../data/cities/dossiers'
import { calcTotalRooms } from '../../game/hotel/space'
import { useGameStore } from '../../stores/gameStore'
import { Button } from '../ui/Button'
import { Card } from '../ui/Card'
import { SlidePanel } from '../ui/SlidePanel'
import { CityPortrait } from '../ui/CityPortrait'

const LEFT_PANEL_POS = 'inset-x-0 top-[4.5rem] bottom-0 w-full sm:inset-x-auto sm:left-0 sm:right-auto sm:top-14 sm:bottom-2 sm:w-64'
const PANEL_CARD = 'h-full overflow-y-auto p-2.5 shadow-xl sm:p-3'

export function CityPanel() {
  const { t, i18n } = useTranslation()
  const lang = i18n.language === 'zh' ? 'zh' : 'en'
  const selectedCityId = useGameStore((s) => s.selectedCityId)
  const showCityPanel = useGameStore((s) => s.showCityPanel)
  const cityMarkets = useGameStore((s) => s.cityMarkets)
  const worldMetrics = useGameStore((s) => s.worldMetrics)
  const hotels = useGameStore((s) => s.hotels)
  const unlockedCities = useGameStore((s) => s.unlockedCities)
  const setShowCityPanel = useGameStore((s) => s.setShowCityPanel)
  const setShowBuildPanel = useGameStore((s) => s.setShowBuildPanel)

  if (!selectedCityId) return null
  const city = cityMap[selectedCityId]
  if (!city) return null

  const unlocked = unlockedCities.includes(selectedCityId)
  const market = cityMarkets[selectedCityId]
  const wm = worldMetrics[selectedCityId]
  const cityHotels = hotels.filter((h) => h.cityId === selectedCityId)
  const dossier = getCityProfile(selectedCityId)

  return (
    <SlidePanel open={showCityPanel} side="left" className={LEFT_PANEL_POS}>
      <Card className={PANEL_CARD}>
        <div className="mb-2 flex items-center justify-between gap-2">
          <h2 className="text-sm font-bold">{city.name[lang]}</h2>
          <Button variant="ghost" size="sm" onClick={() => setShowCityPanel(false)}>
            {t('close')}
          </Button>
        </div>

        <CityPortrait cityId={selectedCityId} lang={lang} className="mb-2 h-28 w-full" />

        <div className="mb-2 inline-block rounded-full bg-teal/20 px-2 py-0.5 text-[10px] text-teal-dark">
          {unlocked ? t('unlocked') : `${t('unlockFee')}: $${city.unlockFee.toLocaleString()}`}
        </div>

        {!unlocked && (
          <p className="mb-2 text-[11px] text-muted">{t('unlockCityHint')}</p>
        )}

        {wm && (
          <div className="mb-2 grid grid-cols-3 gap-1 text-[10px]">
            <div className="rounded bg-card-dark p-1 text-center">
              <div className="text-muted">{t('layerPopulation')}</div>
              <div className="font-semibold">{Math.round(wm.population)}</div>
            </div>
            <div className="rounded bg-card-dark p-1 text-center">
              <div className="text-muted">{t('layerEconomy')}</div>
              <div className="font-semibold">{Math.round(wm.economy)}</div>
            </div>
            <div className="rounded bg-card-dark p-1 text-center">
              <div className="text-muted">{t('layerTourism')}</div>
              <div className="font-semibold">{Math.round(wm.tourism)}</div>
            </div>
          </div>
        )}

        {market && (
          <div className="mb-2 grid grid-cols-2 gap-1 text-xs">
            <div className="rounded-md bg-card-dark p-1.5">
              <div className="text-[10px] text-muted">{t('demand')}</div>
              <div className="font-semibold">{market.dailyDemand.toLocaleString()}</div>
            </div>
            <div className="rounded-md bg-card-dark p-1.5">
              <div className="text-[10px] text-muted">{t('avgPrice')}</div>
              <div className="font-semibold">${Math.round(market.avgPrice)}</div>
            </div>
            <div className="rounded-md bg-card-dark p-1.5">
              <div className="text-[10px] text-muted">{t('marketShare')}</div>
              <div className="font-semibold">{Math.round(market.playerShare * 100)}%</div>
            </div>
            <div className="rounded-md bg-card-dark p-1.5">
              <div className="text-[10px] text-muted">{t('hotels')}</div>
              <div className="font-semibold">{cityHotels.length}</div>
            </div>
          </div>
        )}

        <div className="mb-2 rounded-md border border-border bg-white p-2 text-xs">
          <div className="mb-1 flex items-center justify-between gap-1">
            <h3 className="text-xs font-semibold">{t('cityDossier')}</h3>
            <span className="rounded-full bg-card-dark px-1.5 py-0.5 text-[9px] text-muted">{dossier.archetype[lang]}</span>
          </div>
          <div className="space-y-1 text-[11px] leading-snug">
            <DossierLine label={t('cityHistory')} value={dossier.history[lang]} tone="neutral" />
            <DossierLine label={t('hotelIndustry')} value={dossier.hotelIndustry[lang]} tone="neutral" />
            <DossierLine label={t('opportunity')} value={dossier.opportunity[lang]} tone="good" />
            <DossierLine label={t('risk')} value={dossier.risk[lang]} tone="risk" />
            <DossierLine label={t('recommendation')} value={dossier.recommendation[lang]} tone="neutral" />
          </div>
        </div>

        {unlocked && (
          <Button className="mb-2 w-full" size="sm" onClick={() => setShowBuildPanel(true, selectedCityId)}>
            {t('build')}
          </Button>
        )}

        <h3 className="mb-1 text-xs font-semibold">{t('hotels')}</h3>
        <div className="space-y-1.5">
          {cityHotels.length === 0 && <p className="text-xs text-muted">{t('noHotels')}</p>}
          {cityHotels.map((h) => (
            <HotelCard key={h.id} hotelId={h.id} />
          ))}
        </div>
      </Card>
    </SlidePanel>
  )
}

function DossierLine({ label, value, tone }: { label: string; value: string; tone: 'good' | 'risk' | 'neutral' }) {
  const dotClass = tone === 'good' ? 'bg-teal' : tone === 'risk' ? 'bg-accent' : 'bg-slate-400'
  return (
    <div className="flex gap-1.5">
      <span className={`mt-1 h-1.5 w-1.5 shrink-0 rounded-full ${dotClass}`} />
      <div>
        <span className="font-medium">{label}: </span>
        <span className="text-slate-600">{value}</span>
      </div>
    </div>
  )
}

function HotelCard({ hotelId }: { hotelId: string }) {
  const { t } = useTranslation()
  const hotel = useGameStore((s) => s.hotels.find((h) => h.id === hotelId))
  const selectHotel = useGameStore((s) => s.selectHotel)

  if (!hotel) return null
  const isPlayer = hotel.ownerId === 'player'

  return (
    <button
      type="button"
      onClick={() => selectHotel(hotel.id)}
      className={`w-full rounded-md p-2 text-left text-xs transition-colors hover:ring-1 hover:ring-accent/40 ${
        isPlayer ? 'border border-accent/30 bg-accent/10' : 'bg-card-dark'
      }`}
    >
      <div className="mb-0.5 font-medium">{hotel.name}</div>
      <div className="text-[10px] text-muted">
        {hotel.stars}★ · {calcTotalRooms(hotel.roomInventory)} {t('rooms')} · {Math.round(hotel.occupancy * 100)}%{' '}
        {t('occupancy')}
      </div>
      <div className="mt-1 text-[10px] text-accent">{t('viewDetails')}</div>
    </button>
  )
}
