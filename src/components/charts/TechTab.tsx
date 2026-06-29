import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { canStartResearch, getTechDisplayOrder, getTechStatus } from '../../game/tech/tech'
import type { FacilityId, RoomTypeId, TechId } from '../../game/types'
import { TECH_TREE } from '../../game/types'
import { useGameStore } from '../../stores/gameStore'
import { Button } from '../ui/Button'

const STATUS_STYLES = {
  unlocked: 'border-teal/40 bg-teal/5',
  researching: 'border-accent/40 bg-accent/5',
  available: 'border-border bg-white',
  locked: 'border-border bg-card-dark/40 opacity-80',
} as const

const STATUS_BADGE = {
  unlocked: 'bg-teal/15 text-teal-dark',
  researching: 'bg-accent/15 text-accent',
  available: 'bg-slate-100 text-slate-700',
  locked: 'bg-slate-200 text-slate-500',
} as const

export function TechTab({ lang }: { lang: 'zh' | 'en' }) {
  const { t } = useTranslation()
  const cash = useGameStore((s) => s.cash)
  const unlockedTechs = useGameStore((s) => s.unlockedTechs)
  const researchingTech = useGameStore((s) => s.researchingTech)
  const startResearch = useGameStore((s) => s.startResearch)
  const [error, setError] = useState('')

  const snapshot = { cash, unlockedTechs, researchingTech }
  const order = getTechDisplayOrder()

  const handleStart = (techId: TechId) => {
    const ok = startResearch(techId)
    if (!ok) {
      const check = canStartResearch(useGameStore.getState(), techId)
      if (!check.ok) {
        if (check.reason === 'funds') setError(t('insufficientFunds'))
        else if (check.reason === 'already_researching') setError(t('techAlreadyResearching'))
        else setError(t('opsActionFailed'))
      }
      return
    }
    setError('')
  }

  return (
    <div className="space-y-3">
      <div>
        <h4 className="text-sm font-semibold">{t('techTree')}</h4>
        <p className="text-xs text-muted">{t('techTreeDesc')}</p>
      </div>

      {researchingTech && (
        <div className="rounded-lg border border-accent/30 bg-accent/5 px-3 py-2 text-xs">
          <span className="font-medium text-accent">{t('techResearching')}: </span>
          {TECH_TREE[researchingTech.techId].name[lang]}
          <span className="ml-2 text-muted">
            {t('techResearchProgress', { days: researchingTech.daysRemaining })}
          </span>
        </div>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {order.map((techId) => {
          const config = TECH_TREE[techId]
          const status = getTechStatus(snapshot, techId)
          const canStart = canStartResearch(snapshot, techId).ok
          const progress =
            status === 'researching' && researchingTech?.techId === techId
              ? Math.round(
                  ((config.durationDays - researchingTech.daysRemaining) / Math.max(1, config.durationDays)) * 100,
                )
              : 0

          return (
            <div
              key={techId}
              className={`rounded-lg border p-3 transition ${STATUS_STYLES[status]}`}
            >
              <div className="mb-2 flex items-start justify-between gap-2">
                <div>
                  <div className="text-sm font-semibold">{config.name[lang]}</div>
                  <div className="text-[11px] text-muted">{config.description[lang]}</div>
                </div>
                <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${STATUS_BADGE[status]}`}>
                  {t(`techStatus_${status}`)}
                </span>
              </div>

              {config.prerequisites.length > 0 && (
                <div className="mb-2 text-[11px] text-muted">
                  {t('techPrerequisites')}:{' '}
                  {config.prerequisites.map((p) => TECH_TREE[p].name[lang]).join(lang === 'zh' ? '、' : ', ')}
                </div>
              )}

              <div className="mb-2 grid grid-cols-2 gap-1 text-[11px]">
                <div className="rounded bg-white/60 px-2 py-1">
                  <span className="text-muted">{t('techResearchCost')}: </span>
                  <span className="font-medium">${config.cost.toLocaleString()}</span>
                </div>
                <div className="rounded bg-white/60 px-2 py-1">
                  <span className="text-muted">{t('techResearchDays')}: </span>
                  <span className="font-medium">{config.durationDays}</span>
                </div>
              </div>

              <UnlockContent
                lang={lang}
                facilities={config.unlocksFacilities}
                roomTypes={config.unlocksRoomTypes}
              />

              {status === 'researching' && (
                <div className="mt-2">
                  <div className="mb-1 flex justify-between text-[10px] text-muted">
                    <span>{t('techResearching')}</span>
                    <span>{t('techResearchProgress', { days: researchingTech?.daysRemaining ?? 0 })}</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-card-dark">
                    <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${progress}%` }} />
                  </div>
                </div>
              )}

              {status === 'available' && (
                <Button
                  size="sm"
                  className="mt-2 w-full"
                  onClick={() => handleStart(techId)}
                  disabled={!canStart}
                >
                  {t('techStartResearch')} · ${config.cost.toLocaleString()}
                </Button>
              )}
            </div>
          )
        })}
      </div>

      {error && <p className="text-xs text-accent">{error}</p>}
    </div>
  )
}

function UnlockContent({
  lang,
  facilities,
  roomTypes,
}: {
  lang: 'zh' | 'en'
  facilities?: FacilityId[]
  roomTypes?: RoomTypeId[]
}) {
  const { t } = useTranslation()
  if ((!facilities || facilities.length === 0) && (!roomTypes || roomTypes.length === 0)) {
    return null
  }

  const labels: string[] = []
  for (const f of facilities ?? []) labels.push(t(`facility_${f}`))
  for (const r of roomTypes ?? []) labels.push(t(`room_${r}`))

  return (
    <div className="text-[11px]">
      <span className="text-muted">{t('techUnlocks')}: </span>
      <span className="text-slate-700">{labels.join(lang === 'zh' ? '、' : ', ')}</span>
    </div>
  )
}
