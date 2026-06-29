import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  AD_TYPES,
  canStartBrandAd,
  getAdTypeIds,
} from '../../game/marketing/ads'
import type { AdTypeId } from '../../game/types'
import { useGameStore } from '../../stores/gameStore'
import { Button } from '../ui/Button'

export function MarketingTab({ lang }: { lang: 'zh' | 'en' }) {
  const { t } = useTranslation()
  const cash = useGameStore((s) => s.cash)
  const brandAd = useGameStore((s) => s.brandAd)
  const startBrandAd = useGameStore((s) => s.startBrandAd)
  const stopBrandAd = useGameStore((s) => s.stopBrandAd)

  const [adType, setAdType] = useState<AdTypeId>('metro')
  const [dailyBudget, setDailyBudget] = useState(String(AD_TYPES.metro.dailyCostMin))
  const [durationDays, setDurationDays] = useState(String(AD_TYPES.metro.durationDays))
  const [message, setMessage] = useState('')

  const config = AD_TYPES[adType]
  const budget = Number(dailyBudget)
  const duration = Number(durationDays)
  const canStart = canStartBrandAd({ brandAd }, adType, budget, duration).ok

  const handleTypeChange = (nextType: AdTypeId) => {
    setAdType(nextType)
    setDailyBudget(String(AD_TYPES[nextType].dailyCostMin))
    setDurationDays(String(AD_TYPES[nextType].durationDays))
    setMessage('')
  }

  const handleStart = () => {
    const ok = startBrandAd(adType, budget, duration)
    if (!ok) {
      const check = canStartBrandAd({ brandAd }, adType, budget, duration)
      if (!check.ok && check.reason === 'brand_active') setMessage(t('brandAdAlreadyActive'))
      else if (!check.ok && check.reason === 'invalid_budget') setMessage(t('invalidAdBudget'))
      else setMessage(t('opsActionFailed'))
      return
    }
    setMessage(t('brandAdStarted'))
  }

  const handleStop = () => {
    const ok = stopBrandAd()
    setMessage(ok ? t('brandAdStopped') : t('opsActionFailed'))
  }

  return (
    <div className="space-y-4">
      <div>
        <h4 className="text-sm font-semibold">{t('brandAdvertising')}</h4>
        <p className="text-xs text-muted">{t('brandAdvertisingDesc')}</p>
      </div>

      {brandAd && brandAd.daysRemaining > 0 ? (
        <div className="rounded-lg border border-teal/30 bg-teal/5 p-3">
          <div className="mb-2 text-xs font-semibold text-teal-dark">{t('brandAdActive')}</div>
          <div className="space-y-1 text-xs">
            <div className="flex justify-between">
              <span className="text-muted">{t('adType')}</span>
              <span className="font-medium">{AD_TYPES[brandAd.adType].name[lang]}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">{t('adDailyBudget')}</span>
              <span>${brandAd.dailyBudget.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">{t('adDaysRemaining')}</span>
              <span>{brandAd.daysRemaining}</span>
            </div>
          </div>
          <Button variant="secondary" size="sm" className="mt-3" onClick={handleStop}>
            {t('stopBrandAd')}
          </Button>
        </div>
      ) : (
        <div className="rounded-lg border border-border p-3">
          <div className="mb-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
            {getAdTypeIds().map((typeId) => {
              const typeConfig = AD_TYPES[typeId]
              const selected = adType === typeId
              return (
                <button
                  key={typeId}
                  type="button"
                  onClick={() => handleTypeChange(typeId)}
                  className={`rounded-lg border p-2 text-left text-xs transition ${
                    selected ? 'border-accent bg-accent/10' : 'border-border bg-white hover:border-teal/50'
                  }`}
                >
                  <div className="font-semibold">{typeConfig.name[lang]}</div>
                  <div className="mt-1 text-[11px] text-muted">{typeConfig.description[lang]}</div>
                  <div className="mt-1 text-[10px] text-muted">
                    ${typeConfig.dailyCostMin.toLocaleString()}–${typeConfig.dailyCostMax.toLocaleString()} ·{' '}
                    {t('adDefaultDuration', { days: typeConfig.durationDays })}
                  </div>
                </button>
              )
            })}
          </div>

          <div className="mb-3 rounded bg-card-dark p-2 text-[11px] text-muted">
            {t('adDemandBoostHint', { pct: Math.round(config.demandBoost * 100) })}
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
              <span className="mt-1 block text-[10px] text-muted">
                ${config.dailyCostMin.toLocaleString()} – ${config.dailyCostMax.toLocaleString()}
              </span>
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

          <div className="mb-3 text-xs text-muted">
            {t('adEstimatedTotalCost', {
              total: (budget * duration || 0).toLocaleString(),
            })}
            {' · '}
            {t('cash')}: ${cash.toLocaleString()}
          </div>

          <Button size="sm" disabled={!canStart || cash < budget} onClick={handleStart}>
            {t('startBrandAd')}
          </Button>
        </div>
      )}

      {message && <p className="rounded-md bg-card-dark px-2 py-1.5 text-xs text-slate-600">{message}</p>}
    </div>
  )
}
