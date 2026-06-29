import { AnimatePresence, motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { gameEvents } from '../../data/events'
import { useGameStore } from '../../stores/gameStore'
import { Button } from '../ui/Button'
import { Card } from '../ui/Card'
import { SlidePanel } from '../ui/SlidePanel'

const RIGHT_PANEL_POS = 'inset-x-0 top-[4.5rem] bottom-0 w-full sm:inset-x-auto sm:right-0 sm:left-auto sm:top-14 sm:bottom-2 sm:w-64'
import type { MarketModifiers } from '../../game/types'

const CATEGORY_COLORS: Record<string, string> = {
  politics: 'bg-purple-100 text-purple-700',
  economy: 'bg-amber-100 text-amber-700',
  disaster: 'bg-red-100 text-red-700',
  tourism: 'bg-orange-100 text-orange-700',
  technology: 'bg-blue-100 text-blue-700',
  health: 'bg-rose-100 text-rose-700',
  infrastructure: 'bg-teal-100 text-teal-700',
}

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

export function NewsPanel() {
  const { t, i18n } = useTranslation()
  const lang = i18n.language === 'zh' ? 'zh' : 'en'
  const showNews = useGameStore((s) => s.showNews)
  const setShowNews = useGameStore((s) => s.setShowNews)
  const newsFeed = useGameStore((s) => s.newsFeed)
  const markAllNewsRead = useGameStore((s) => s.markAllNewsRead)

  const unreadCount = newsFeed.filter((n) => !n.read).length

  return (
    <SlidePanel open={showNews} side="right" className={RIGHT_PANEL_POS}>
      <Card className="flex h-full flex-col p-2.5 shadow-xl sm:p-3">
        <div className="mb-2 flex items-center justify-between gap-2">
          <h2 className="text-sm font-bold">
            {t('news')}
            {unreadCount > 0 && (
              <span className="ml-1.5 rounded-full bg-accent px-1.5 py-0.5 text-[10px] text-white">{unreadCount}</span>
            )}
          </h2>
          <div className="flex shrink-0 gap-0.5">
            {unreadCount > 0 && (
              <Button variant="ghost" size="sm" onClick={markAllNewsRead}>
                {t('markAllRead')}
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={() => setShowNews(false)}>
              {t('close')}
            </Button>
          </div>
        </div>

        <div className="min-h-0 flex-1 space-y-1.5 overflow-y-auto">
          <AnimatePresence>
            {newsFeed.length === 0 && (
              <p className="text-xs text-muted">{t('noNews')}</p>
            )}
            {newsFeed.map((item) => (
              <NewsCard key={item.id} item={item} lang={lang} />
            ))}
          </AnimatePresence>
        </div>
      </Card>
    </SlidePanel>
  )
}

function NewsCard({ item, lang }: { item: ReturnType<typeof useGameStore.getState>['newsFeed'][number]; lang: 'zh' | 'en' }) {
  const { t } = useTranslation()
  const sourceEvent = gameEvents.find((event) => `news-${event.id}` === item.id)
  const impacts = sourceEvent ? formatImpact(sourceEvent.modifiers, t) : []

  return (
    <motion.div
      key={item.id}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-md p-2 text-xs ${
        item.tier === 'major' ? 'border-2 border-accent bg-accent/5' : 'bg-card-dark'
      } ${!item.read ? 'ring-1 ring-accent/30' : ''}`}
    >
      <div className="mb-0.5 flex items-center gap-1.5">
        <span className="text-xs text-muted">{item.date}</span>
        <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${CATEGORY_COLORS[item.category] ?? 'bg-slate-100'}`}>
          {t(`cat_${item.category}`)}
        </span>
        {item.tier === 'major' && (
          <span className="rounded bg-accent px-1.5 py-0.5 text-[10px] text-white">{t('major')}</span>
        )}
      </div>
      <div className="text-xs font-medium">{item.title[lang]}</div>
      <p className="mt-0.5 text-[11px] leading-snug text-muted">{item.summary[lang]}</p>
      {impacts.length > 0 && (
        <div className="mt-1.5 flex flex-wrap gap-1">
          {impacts.map((impact) => (
            <span
              key={impact.key}
              className={`rounded-full px-2 py-0.5 text-[10px] ${
                impact.positive ? 'bg-teal/15 text-teal-dark' : 'bg-accent/15 text-accent'
              }`}
            >
              {impact.label} {impact.value}
            </span>
          ))}
        </div>
      )}
    </motion.div>
  )
}

export function NewsBadge() {
  const newsFeed = useGameStore((s) => s.newsFeed)
  const unread = newsFeed.filter((n) => !n.read).length
  if (unread === 0) return null
  return (
    <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-accent text-[10px] font-bold text-white">
      {unread > 9 ? '9+' : unread}
    </span>
  )
}
