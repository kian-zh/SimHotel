import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { cities, getCityName } from '../../data/cities'
import { getCityProfile } from '../../data/cities/dossiers'
import { canPurchaseCity } from '../../game/market/cityUnlock'
import { useGameStore } from '../../stores/gameStore'
import { CityPortrait } from '../ui/CityPortrait'
import { Button } from '../ui/Button'

export function ExpansionTab({ lang }: { lang: 'zh' | 'en' }) {
  const { t } = useTranslation()
  const unlockedCities = useGameStore((s) => s.unlockedCities)
  const cash = useGameStore((s) => s.cash)
  const hotels = useGameStore((s) => s.hotels)
  const purchaseCity = useGameStore((s) => s.purchaseCity)
  const gameSnapshot = useGameStore((s) => s)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [error, setError] = useState('')

  const selected = selectedId ? cities.find((c) => c.id === selectedId) : null
  const profile = selectedId ? getCityProfile(selectedId) : null
  const unlocked = selectedId ? unlockedCities.includes(selectedId) : false
  const purchaseCheck = selectedId ? canPurchaseCity(gameSnapshot, selectedId) : null

  const handlePurchase = () => {
    if (!selectedId) return
    const ok = purchaseCity(selectedId)
    if (!ok) {
      const check = canPurchaseCity(useGameStore.getState(), selectedId)
      if (!check.ok) {
        if (check.reason === 'funds') setError(t('insufficientFunds'))
        else setError(t('cannotUnlockCity'))
      }
      return
    }
    setError('')
  }

  return (
    <div className="grid h-full grid-cols-1 gap-4 lg:grid-cols-5">
      <div className="lg:col-span-2">
        <h4 className="mb-2 text-sm font-semibold">{t('cityExpansion')}</h4>
        <p className="mb-3 text-xs text-muted">{t('cityExpansionDesc')}</p>
        <div className="grid max-h-[min(52vh,420px)] grid-cols-2 gap-2 overflow-y-auto pr-1 sm:grid-cols-2">
          {cities.map((city) => {
            const isUnlocked = unlockedCities.includes(city.id)
            const playerHotels = hotels.filter((h) => h.cityId === city.id && h.ownerId === 'player').length
            const canBuy = canPurchaseCity(gameSnapshot, city.id).ok
            const active = selectedId === city.id
            return (
              <button
                key={city.id}
                type="button"
                onClick={() => {
                  setSelectedId(city.id)
                  setError('')
                }}
                className={`overflow-hidden rounded-lg border text-left transition hover:shadow-md ${
                  active ? 'border-accent ring-2 ring-accent/30' : 'border-border bg-white hover:border-teal/50'
                }`}
              >
                <CityPortrait cityId={city.id} lang={lang} className="h-20 w-full rounded-none" />
                <div className="p-2">
                  <div className="flex items-center justify-between gap-1">
                    <span className="truncate text-xs font-semibold">{getCityName(city.id, lang)}</span>
                    {isUnlocked ? (
                      <span className="shrink-0 rounded-full bg-teal/15 px-1.5 py-0.5 text-[9px] text-teal-dark">{t('unlocked')}</span>
                    ) : (
                      <span className="shrink-0 text-[9px] text-muted">${(city.unlockFee / 1_000_000).toFixed(1)}M</span>
                    )}
                  </div>
                  {!isUnlocked && canBuy && (
                    <div className="mt-0.5 text-[9px] text-teal-dark">{t('readyToUnlock')}</div>
                  )}
                  {playerHotels > 0 && (
                    <div className="mt-0.5 text-[9px] text-muted">{playerHotels} {t('hotels')}</div>
                  )}
                </div>
              </button>
            )
          })}
        </div>
      </div>

      <div className="lg:col-span-3">
        {!selected || !profile ? (
          <div className="flex h-full min-h-48 items-center justify-center rounded-lg border border-dashed border-border bg-card-dark/50 p-6 text-center text-sm text-muted">
            {t('selectCityToViewProfile')}
          </div>
        ) : (
          <div className="rounded-lg border border-border bg-white p-3">
            <CityPortrait cityId={selected.id} lang={lang} className="mb-3 h-36 w-full" />
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <h3 className="text-base font-bold">{getCityName(selected.id, lang)}</h3>
              <span className="rounded-full bg-card-dark px-2 py-0.5 text-[10px] text-muted">{t(`region_${selected.region}`)}</span>
              <span className="rounded-full bg-card-dark px-2 py-0.5 text-[10px] text-muted">{profile.archetype[lang]}</span>
            </div>

            <div className="mb-3 space-y-2 text-xs leading-relaxed">
              <ProfileSection title={t('cityHistory')} text={profile.history[lang]} />
              <ProfileSection title={t('hotelIndustry')} text={profile.hotelIndustry[lang]} />
              <ProfileSection title={t('opportunity')} text={profile.opportunity[lang]} tone="good" />
              <ProfileSection title={t('risk')} text={profile.risk[lang]} tone="risk" />
              <ProfileSection title={t('recommendation')} text={profile.recommendation[lang]} />
            </div>

            <div className="flex flex-wrap items-center gap-2 border-t border-border pt-3">
              {unlocked ? (
                <span className="text-sm font-medium text-teal-dark">{t('marketAlreadyOpen')}</span>
              ) : (
                <>
                  <div className="text-sm">
                    <span className="text-muted">{t('unlockFee')}: </span>
                    <span className="font-semibold text-accent">${selected.unlockFee.toLocaleString()}</span>
                  </div>
                  <Button
                    size="sm"
                    onClick={handlePurchase}
                    disabled={!purchaseCheck?.ok}
                  >
                    {t('unlockCity')} · ${selected.unlockFee.toLocaleString()}
                  </Button>
                </>
              )}
              {error && <p className="w-full text-xs text-accent">{error}</p>}
              {!unlocked && purchaseCheck && !purchaseCheck.ok && purchaseCheck.reason === 'funds' && cash < selected.unlockFee && (
                <p className="w-full text-xs text-muted">{t('insufficientFunds')}</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function ProfileSection({
  title,
  text,
  tone = 'neutral',
}: {
  title: string
  text: string
  tone?: 'good' | 'risk' | 'neutral'
}) {
  const border =
    tone === 'good' ? 'border-teal/30 bg-teal/5' : tone === 'risk' ? 'border-accent/30 bg-accent/5' : 'border-border bg-card-dark/40'
  return (
    <div className={`rounded-md border px-2.5 py-2 ${border}`}>
      <div className="mb-1 text-[11px] font-semibold text-slate-700">{title}</div>
      <p className="text-slate-600">{text}</p>
    </div>
  )
}
