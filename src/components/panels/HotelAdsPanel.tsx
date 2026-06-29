import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  AD_TYPES,
  canStartHotelAd,
  getActiveHotelAdsForHotel,
  getAdTypeIds,
} from '../../game/marketing/ads'
import type { AdTypeId, Hotel } from '../../game/types'
import { useGameStore } from '../../stores/gameStore'
import { Button } from '../ui/Button'

export function HotelAdsPanel({ hotel, lang }: { hotel: Hotel; lang: 'zh' | 'en' }) {
  const { t } = useTranslation()
  const cash = useGameStore((s) => s.cash)
  const hotelAds = useGameStore((s) => s.hotelAds)
  const startHotelAd = useGameStore((s) => s.startHotelAd)
  const stopHotelAd = useGameStore((s) => s.stopHotelAd)

  const [adType, setAdType] = useState<AdTypeId>('metro')
  const [dailyBudget, setDailyBudget] = useState(String(AD_TYPES.metro.dailyCostMin))
  const [durationDays, setDurationDays] = useState(String(AD_TYPES.metro.durationDays))
  const [message, setMessage] = useState('')

  const activeCampaigns = getActiveHotelAdsForHotel(hotelAds, hotel.id)
  const config = AD_TYPES[adType]
  const budget = Number(dailyBudget)
  const duration = Number(durationDays)
  const canStart = canStartHotelAd({ hotels: [hotel], hotelAds }, hotel.id, adType, budget, duration).ok

  const handleTypeChange = (nextType: AdTypeId) => {
    setAdType(nextType)
    setDailyBudget(String(AD_TYPES[nextType].dailyCostMin))
    setDurationDays(String(AD_TYPES[nextType].durationDays))
    setMessage('')
  }

  const handleStart = () => {
    const ok = startHotelAd(hotel.id, adType, budget, duration)
    if (!ok) {
      const check = canStartHotelAd({ hotels: [hotel], hotelAds }, hotel.id, adType, budget, duration)
      if (!check.ok && check.reason === 'duplicate') setMessage(t('hotelAdDuplicate'))
      else if (!check.ok && check.reason === 'invalid_budget') setMessage(t('invalidAdBudget'))
      else setMessage(t('opsActionFailed'))
      return
    }
    setMessage(t('hotelAdStarted'))
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-xs font-semibold">{t('hotelAdvertising')}</h3>
        <p className="text-[11px] text-muted">{t('hotelAdvertisingDesc')}</p>
      </div>

      {activeCampaigns.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-xs font-medium">{t('activeAdCampaigns')}</h4>
          {activeCampaigns.map((campaign) => (
            <div key={campaign.id} className="rounded-lg border border-teal/30 bg-teal/5 p-2.5 text-xs">
              <div className="mb-1 font-medium">{AD_TYPES[campaign.adType].name[lang]}</div>
              <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-muted">
                <span>
                  {t('adDailyBudget')}: ${campaign.dailyBudget.toLocaleString()}
                </span>
                <span>
                  {t('adDaysRemaining')}: {campaign.daysRemaining}
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="mt-2 h-7 px-2 text-[11px]"
                onClick={() => {
                  const ok = stopHotelAd(campaign.id)
                  setMessage(ok ? t('hotelAdStopped') : t('opsActionFailed'))
                }}
              >
                {t('stopHotelAd')}
              </Button>
            </div>
          ))}
        </div>
      )}

      <div className="rounded-lg border border-border p-3">
        <h4 className="mb-2 text-xs font-semibold">{t('startHotelAd')}</h4>
        <div className="mb-3 grid grid-cols-1 gap-2">
          {getAdTypeIds().map((typeId) => {
            const typeConfig = AD_TYPES[typeId]
            const selected = adType === typeId
            const alreadyRunning = activeCampaigns.some((campaign) => campaign.adType === typeId)
            return (
              <button
                key={typeId}
                type="button"
                disabled={alreadyRunning}
                onClick={() => handleTypeChange(typeId)}
                className={`rounded-md border p-2 text-left text-xs transition ${
                  selected
                    ? 'border-accent bg-accent/10'
                    : alreadyRunning
                      ? 'cursor-not-allowed border-border bg-card-dark/60 opacity-60'
                      : 'border-border bg-white hover:border-teal/50'
                }`}
              >
                <div className="font-medium">{typeConfig.name[lang]}</div>
                <div className="mt-0.5 text-[10px] text-muted">{typeConfig.description[lang]}</div>
              </button>
            )
          })}
        </div>

        <div className="mb-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="text-xs">
            <span className="mb-1 block text-muted">{t('adDailyBudget')}</span>
            <input
              type="number"
              min={config.dailyCostMin}
              max={config.dailyCostMax}
              value={dailyBudget}
              onChange={(e) => setDailyBudget(e.target.value)}
              className="w-full rounded-md border border-border px-2 py-1.5 text-sm"
            />
          </label>
          <label className="text-xs">
            <span className="mb-1 block text-muted">{t('adDurationDays')}</span>
            <input
              type="number"
              min={1}
              max={90}
              value={durationDays}
              onChange={(e) => setDurationDays(e.target.value)}
              className="w-full rounded-md border border-border px-2 py-1.5 text-sm"
            />
          </label>
        </div>

        <div className="mb-3 text-[11px] text-muted">
          {t('adEstimatedTotalCost', { total: (budget * duration || 0).toLocaleString() })}
        </div>

        <Button size="sm" disabled={!canStart || cash < budget} onClick={handleStart}>
          {t('launchAdCampaign')}
        </Button>
      </div>

      {message && <p className="rounded-md bg-card-dark px-2 py-1.5 text-xs text-slate-600">{message}</p>}
    </div>
  )
}
