import { useTranslation } from 'react-i18next'
import { useGameStore } from '../../stores/gameStore'
import { AnimatedNumber } from '../ui/AnimatedNumber'
import { Button } from '../ui/Button'
import { NewsBadge } from '../panels/NewsPanel'

function formatCashDelta(delta: number): string {
  const sign = delta >= 0 ? '+' : '-'
  return `(${sign}$${Math.abs(Math.round(delta)).toLocaleString()})`
}

export function GameHUD({ compact = false }: { compact?: boolean }) {
  const { t, i18n } = useTranslation()
  const date = useGameStore((s) => s.date)
  const cash = useGameStore((s) => s.cash)
  const dailyCashDelta = useGameStore((s) => s.dailyCashDelta)
  const reputation = useGameStore((s) => s.reputation)
  const paused = useGameStore((s) => s.paused)
  const brandName = useGameStore((s) => s.brandName)
  const debt = useGameStore((s) => s.debt)
  const creditRating = useGameStore((s) => s.creditRating)
  const togglePause = useGameStore((s) => s.togglePause)
  const fastForwardToNextMonth = useGameStore((s) => s.fastForwardToNextMonth)
  const setShowStats = useGameStore((s) => s.setShowStats)
  const setShowBuildPanel = useGameStore((s) => s.setShowBuildPanel)
  const setShowNews = useGameStore((s) => s.setShowNews)
  const selectedCityId = useGameStore((s) => s.selectedCityId)

  const dateStr = i18n.language === 'zh'
    ? `${date.year}年${date.month}月${date.day}日`
    : `${date.year}/${date.month}/${date.day}`

  const deltaClass = dailyCashDelta >= 0 ? 'text-teal-dark' : 'text-accent'

  return (
    <div className={`safe-top safe-x pointer-events-auto absolute left-0 right-0 top-0 z-30 flex flex-col gap-2 px-2 pt-2 sm:left-4 sm:right-4 sm:top-4 sm:px-0 sm:pt-0 ${compact ? 'sm:flex-row sm:items-center' : 'sm:flex-row sm:items-start sm:justify-between sm:gap-4'}`}>
      <div className={`flex w-full items-center justify-between gap-2 rounded-xl bg-card/95 px-3 py-2 backdrop-blur-sm sm:w-auto sm:justify-start sm:gap-3 sm:px-4 ${compact ? 'py-1.5' : 'sm:py-2.5'}`}>
        <div className="min-w-0">
          <div className="truncate text-[10px] text-muted sm:text-xs">{brandName}</div>
          <div className="text-xs font-semibold sm:text-sm">{dateStr}</div>
        </div>
        <div className="hidden h-8 w-px bg-border sm:block" />
        <div className="text-right sm:text-left">
          <div className="text-[10px] text-muted sm:text-xs">{t('cash')}</div>
          <div className="flex items-baseline justify-end gap-0.5 sm:justify-start">
            <AnimatedNumber value={cash} format={(n) => `$${n.toLocaleString()}`} className="text-xs font-semibold text-accent sm:text-sm" />
            <span className={`text-[10px] font-mono font-medium sm:text-xs ${deltaClass}`}>
              {formatCashDelta(dailyCashDelta)}
            </span>
          </div>
        </div>
        <div className="hidden h-8 w-px bg-border sm:block" />
        <div className="text-right sm:text-left">
          <div className="text-[10px] text-muted sm:text-xs">{t('reputation')}</div>
          <AnimatedNumber value={reputation} format={(n) => `${Math.round(n)}`} className="text-xs font-semibold text-teal-dark sm:text-sm" />
        </div>
        <div className="hidden h-8 w-px bg-border md:block" />
        <div className="hidden text-right md:block md:text-left">
          <div className="text-[10px] text-muted sm:text-xs">{t('credit')}</div>
          <div className={creditRating === 'Distressed' ? 'text-xs font-semibold text-accent sm:text-sm' : 'text-xs font-semibold text-slate-700 sm:text-sm'}>
            {creditRating} · ${(debt / 1_000_000).toFixed(1)}M
          </div>
        </div>
      </div>

      <div className="scrollbar-hide flex w-full items-center gap-1 overflow-x-auto rounded-xl bg-card/95 p-1.5 backdrop-blur-sm sm:w-auto sm:gap-2 sm:p-2">
        <Button variant="secondary" size="sm" className="shrink-0" onClick={togglePause}>
          {paused ? t('resume') : t('pause')}
        </Button>
        <Button variant="secondary" size="sm" className="shrink-0" onClick={fastForwardToNextMonth}>
          {t('fastForwardMonth')}
        </Button>
        <div className="mx-0.5 hidden h-6 w-px shrink-0 bg-border sm:mx-1 sm:block" />
        {!compact && (
          <>
            <Button variant="secondary" size="sm" className="shrink-0" onClick={() => setShowBuildPanel(true, selectedCityId ?? 'hong-kong')}>
              {t('build')}
            </Button>
          </>
        )}
        {!compact && (
          <Button variant="secondary" size="sm" className="shrink-0" onClick={() => setShowStats(true)}>
            {t('stats')}
          </Button>
        )}
        <Button variant="secondary" size="sm" className="relative shrink-0" onClick={() => setShowNews(true)}>
          {t('news')}
          <NewsBadge />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="shrink-0"
          onClick={() => i18n.changeLanguage(i18n.language === 'zh' ? 'en' : 'zh')}
        >
          {i18n.language === 'zh' ? 'EN' : '中'}
        </Button>
      </div>
    </div>
  )
}
