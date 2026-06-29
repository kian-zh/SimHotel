import { AnimatePresence, motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { useGameStore } from '../../stores/gameStore'
import { Button } from '../ui/Button'
import { Card } from '../ui/Card'
import type { MarketModifiers } from '../../game/types'

function formatImpact(modifiers: MarketModifiers, t: (key: string) => string) {
  return Object.entries(modifiers)
    .filter(([, value]) => value != null && value !== 0)
    .map(([key, value]) => ({
      key,
      label: t(`effect_${key}`),
      value: `${value! > 0 ? '+' : ''}${Math.round(value! * 100)}%`,
      positive: value! > 0,
    }))
}

export function EventModal() {
  const { t, i18n } = useTranslation()
  const lang = i18n.language === 'zh' ? 'zh' : 'en'
  const pendingEvent = useGameStore((s) => s.pendingEvent)
  const clearPendingEvent = useGameStore((s) => s.clearPendingEvent)

  return (
    <AnimatePresence>
      {pendingEvent && pendingEvent.tier === 'major' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="pointer-events-auto absolute inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            transition={{ type: 'spring', damping: 22 }}
            className="w-full max-w-md"
          >
            <Card className="shadow-2xl">
              <div className="mb-1 text-xs font-medium uppercase tracking-wide text-accent">
                {t('historicalEvent')} · {t('major')}
              </div>
              <h2 className="mb-2 text-xl font-bold">{pendingEvent.title[lang]}</h2>
              <p className="mb-4 text-sm text-slate-600">{pendingEvent.description[lang]}</p>
              <div className="mb-4 rounded-lg bg-card-dark p-3">
                <div className="mb-2 text-xs font-semibold text-slate-700">{t('eventImpact')}</div>
                <div className="flex flex-wrap gap-1.5">
                  {formatImpact(pendingEvent.modifiers, t).map((impact) => (
                    <span
                      key={impact.key}
                      className={`rounded-full px-2 py-0.5 text-xs ${
                        impact.positive ? 'bg-teal/15 text-teal-dark' : 'bg-accent/15 text-accent'
                      }`}
                    >
                      {impact.label} {impact.value}
                    </span>
                  ))}
                </div>
              </div>
              <div className="mb-4 flex flex-wrap gap-1">
                {pendingEvent.affectedMarkets.map((m) => (
                  <span key={m} className="rounded-full bg-accent/15 px-2 py-0.5 text-xs text-accent">
                    {m}
                  </span>
                ))}
              </div>
              <Button className="w-full" onClick={clearPendingEvent}>
                {t('confirm')}
              </Button>
            </Card>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
