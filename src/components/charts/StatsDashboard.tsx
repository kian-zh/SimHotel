import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { cities, getCityName } from '../../data/cities'
import { gameEvents } from '../../data/events'
import {
  getAnnualInterestRate,
  getAverageOccupancy,
  getBorrowingLimit,
  getLeverageRatio,
  getPlayerDailyPnL,
  getRevPAR,
} from '../../game/finance/finance'
import { STRATEGY_POLICIES } from '../../game/types'
import type { StrategyPolicyId } from '../../game/types'
import { useGameStore } from '../../stores/gameStore'
import { Button } from '../ui/Button'
import { Card } from '../ui/Card'
import { SlidePanel } from '../ui/SlidePanel'
import { ExpansionTab } from './ExpansionTab'
import { MarketingTab } from './MarketingTab'
import { TechTab } from './TechTab'

type Tab = 'finance' | 'business' | 'market' | 'macro' | 'strategy' | 'expansion' | 'tech' | 'marketing'

const TAB_COLORS = ['#ff6b4a', '#2dd4bf', '#8b5cf6', '#3b82f6', '#f59e0b', '#ef4444', '#10b981']

export function StatsDashboard({ embedded = false }: { embedded?: boolean }) {
  const { t, i18n } = useTranslation()
  const lang = i18n.language === 'zh' ? 'zh' : 'en'
  const showStats = useGameStore((s) => s.showStats)
  const setShowStats = useGameStore((s) => s.setShowStats)
  const [tab, setTab] = useState<Tab>('expansion')

  const tabs: { id: Tab; label: string }[] = [
    { id: 'expansion', label: t('expansion') },
    { id: 'tech', label: t('tech') },
    { id: 'marketing', label: t('marketing') },
    { id: 'finance', label: t('finance') },
    { id: 'business', label: t('business') },
    { id: 'market', label: t('market') },
    { id: 'macro', label: t('macro') },
    { id: 'strategy', label: t('strategy') },
  ]

  const panelBody = (
    <>
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="scrollbar-hide flex min-w-0 flex-1 gap-1 overflow-x-auto">
          {tabs.map((tb) => (
            <Button
              key={tb.id}
              variant={tab === tb.id ? 'primary' : 'ghost'}
              size="sm"
              className="shrink-0"
              onClick={() => setTab(tb.id)}
            >
              {tb.label}
            </Button>
          ))}
        </div>
        <Button variant="ghost" size="sm" onClick={() => setShowStats(false)}>
          {t('backToCity')}
        </Button>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto">
        {tab === 'expansion' && <ExpansionTab lang={lang} />}
        {tab === 'tech' && <TechTab lang={lang} />}
        {tab === 'marketing' && <MarketingTab lang={lang} />}
        {tab === 'finance' && <FinanceTab />}
        {tab === 'business' && <BusinessTab />}
        {tab === 'market' && <MarketTab lang={lang} />}
        {tab === 'macro' && <MacroTab lang={lang} />}
        {tab === 'strategy' && <StrategyTab lang={lang} />}
      </div>
    </>
  )

  if (embedded) {
    return (
      <Card className="flex h-full flex-col rounded-none border-0 shadow-none">
        {panelBody}
      </Card>
    )
  }

  if (!showStats) return null

  return (
    <SlidePanel open={showStats} side="bottom" className="safe-bottom inset-x-0 bottom-0 h-[60vh] sm:left-4 sm:right-4 sm:h-[45vh]">
      <Card className="flex h-full flex-col rounded-b-none shadow-2xl sm:rounded-xl">
        {panelBody}
      </Card>
    </SlidePanel>
  )
}

function StrategyTab({ lang }: { lang: 'zh' | 'en' }) {
  const { t } = useTranslation()
  const strategyPolicy = useGameStore((s) => s.strategyPolicy)
  const setStrategyPolicy = useGameStore((s) => s.setStrategyPolicy)
  const policyIds = Object.keys(STRATEGY_POLICIES) as StrategyPolicyId[]

  return (
    <div className="grid grid-cols-1 gap-3 lg:grid-cols-5">
      {policyIds.map((id) => {
        const policy = STRATEGY_POLICIES[id]
        const active = strategyPolicy === id
        return (
          <button
            key={id}
            type="button"
            onClick={() => setStrategyPolicy(id)}
            className={`group rounded-lg border p-3 text-left transition duration-200 hover:-translate-y-0.5 hover:shadow-md ${
              active ? 'border-accent bg-accent/10 shadow-sm' : 'border-border bg-white hover:border-teal/60'
            }`}
          >
            <div className="mb-2 flex items-start justify-between gap-2">
              <div>
                <div className="text-sm font-semibold">{policy.name[lang]}</div>
                <div className="text-[11px] text-muted">{active ? t('activeStrategy') : t('selectStrategy')}</div>
              </div>
              <span className={`h-2.5 w-2.5 rounded-full ${active ? 'bg-accent' : 'bg-slate-300 group-hover:bg-teal'}`} />
            </div>
            <p className="mb-3 min-h-12 text-xs leading-relaxed text-slate-600">{policy.description[lang]}</p>
            <div className="space-y-1 text-[11px]">
              <StrategyMetric label={t('buildCost')} value={policy.buildCostMultiplier} inverse />
              <StrategyMetric label={t('operatingCost')} value={policy.operatingCostMultiplier} inverse />
              <StrategyMetric label={t('marketAppeal')} value={policy.demandScoreMultiplier} />
            </div>
            <div className="mt-3 rounded bg-card-dark px-2 py-1.5 text-[11px] text-muted">{policy.riskNote[lang]}</div>
          </button>
        )
      })}
    </div>
  )
}

function StrategyMetric({ label, value, inverse = false }: { label: string; value: number; inverse?: boolean }) {
  const pct = Math.round((value - 1) * 100)
  const good = inverse ? pct <= 0 : pct >= 0
  const text = pct === 0 ? '0%' : `${pct > 0 ? '+' : ''}${pct}%`
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-muted">{label}</span>
      <span className={good ? 'font-semibold text-teal-dark' : 'font-semibold text-accent'}>{text}</span>
    </div>
  )
}

function FinanceTab() {
  const { t } = useTranslation()
  const financeHistory = useGameStore((s) => s.financeHistory)
  const cash = useGameStore((s) => s.cash)
  const debt = useGameStore((s) => s.debt)
  const creditRating = useGameStore((s) => s.creditRating)
  const borrowFunds = useGameStore((s) => s.borrowFunds)
  const repayDebt = useGameStore((s) => s.repayDebt)
  const pnl = getPlayerDailyPnL(useGameStore.getState())
  const state = useGameStore.getState()
  const borrowingLimit = getBorrowingLimit(state)
  const availableCredit = Math.max(0, borrowingLimit - debt)
  const leverage = getLeverageRatio(state)
  const annualRate = getAnnualInterestRate(state)
  const borrowAmount = Math.min(2_000_000, availableCredit)
  const repayAmount = Math.min(1_000_000, debt, cash)

  return (
    <div className="grid h-full grid-cols-1 gap-4 lg:grid-cols-3">
      <div>
        <h4 className="mb-2 text-sm font-semibold">{t('cash')} · ${cash.toLocaleString()}</h4>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={financeHistory}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={(v: string) => v.slice(5)} />
            <YAxis tick={{ fontSize: 10 }} />
            <Tooltip />
            <Area type="monotone" dataKey="cash" stroke="#ff6b4a" fill="#ff6b4a33" animationDuration={600} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div>
        <h4 className="mb-2 text-sm font-semibold">
          {t('dailyRevenue')} / {t('dailyExpense')}
        </h4>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart
            data={[
              { name: t('dailyRevenue'), value: pnl.revenue },
              { name: t('dailyExpense'), value: pnl.expense },
            ]}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="name" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} />
            <Tooltip />
            <Bar dataKey="value" animationDuration={600}>
              <Cell fill="#2dd4bf" />
              <Cell fill="#ff6b4a" />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="rounded-lg border border-border bg-white p-3">
        <div className="mb-3 flex items-center justify-between gap-2">
          <div>
            <h4 className="text-sm font-semibold">{t('capitalMarkets')}</h4>
            <p className="text-xs text-muted">{t('capitalMarketsDesc')}</p>
          </div>
          <span className={`rounded px-2 py-1 text-xs font-semibold ${creditRating === 'Distressed' ? 'bg-accent/15 text-accent' : 'bg-teal/15 text-teal-dark'}`}>
            {creditRating}
          </span>
        </div>
        <div className="mb-3 grid grid-cols-2 gap-2 text-xs">
          <CapitalMetric label={t('debt')} value={`$${Math.round(debt).toLocaleString()}`} />
          <CapitalMetric label={t('creditLine')} value={`$${Math.round(availableCredit).toLocaleString()}`} />
          <CapitalMetric label={t('leverage')} value={`${Math.round(leverage * 100)}%`} />
          <CapitalMetric label={t('annualInterest')} value={`${(annualRate * 100).toFixed(1)}%`} />
        </div>
        <div className="mb-3 h-2 overflow-hidden rounded-full bg-card-dark">
          <div
            className={`h-full rounded-full ${leverage > 0.65 ? 'bg-accent' : 'bg-teal'}`}
            style={{ width: `${Math.min(100, Math.round(leverage * 100))}%` }}
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" onClick={() => borrowFunds(borrowAmount)} disabled={borrowAmount <= 0}>
            {t('borrow')} $ {borrowAmount.toLocaleString()}
          </Button>
          <Button variant="secondary" size="sm" onClick={() => repayDebt(repayAmount)} disabled={repayAmount <= 0}>
            {t('repay')} $ {repayAmount.toLocaleString()}
          </Button>
        </div>
      </div>
    </div>
  )
}

function CapitalMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded bg-card-dark p-2">
      <div className="text-muted">{label}</div>
      <div className="font-semibold">{value}</div>
    </div>
  )
}

function BusinessTab() {
  const { t } = useTranslation()
  const hotels = useGameStore((s) => s.hotels.filter((h) => h.ownerId === 'player'))
  const avgOcc = getAverageOccupancy(useGameStore.getState())
  const revpar = getRevPAR(useGameStore.getState())

  const starData = [3, 4, 5].map((s) => ({
    name: `${s}★`,
    count: hotels.filter((h) => h.stars === s).length,
  }))

  const occData = hotels.map((h) => ({
    name: h.name.slice(0, 8),
    occupancy: Math.round(h.occupancy * 100),
    revenue: h.dailyRevenue,
  }))

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <div className="rounded-lg bg-card-dark p-3">
        <div className="text-xs text-muted">{t('occupancy')}</div>
        <div className="text-2xl font-bold text-accent">{Math.round(avgOcc * 100)}%</div>
      </div>
      <div className="rounded-lg bg-card-dark p-3">
        <div className="text-xs text-muted">{t('revpar')}</div>
        <div className="text-2xl font-bold text-teal-dark">${Math.round(revpar)}</div>
      </div>
      <div className="rounded-lg bg-card-dark p-3">
        <div className="text-xs text-muted">{t('hotels')}</div>
        <div className="text-2xl font-bold">{hotels.length}</div>
      </div>
      <div className="sm:col-span-2">
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={occData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="name" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} />
            <Tooltip />
            <Bar dataKey="occupancy" fill="#2dd4bf" isAnimationActive={false} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div>
        <ResponsiveContainer width="100%" height={180}>
          <PieChart>
            <Pie data={starData} dataKey="count" nameKey="name" cx="50%" cy="50%" outerRadius={60} label isAnimationActive={false}>
              {starData.map((_, i) => (
                <Cell key={i} fill={TAB_COLORS[i % TAB_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

function MarketTab({ lang }: { lang: 'zh' | 'en' }) {
  const { t } = useTranslation()
  const cityMarkets = useGameStore((s) => s.cityMarkets)
  const unlockedCities = useGameStore((s) => s.unlockedCities)

  const shareData = unlockedCities.map((id) => ({
    name: getCityName(id, lang).slice(0, 6),
    share: Math.round((cityMarkets[id]?.playerShare ?? 0) * 100),
    demand: cityMarkets[id]?.dailyDemand ?? 0,
  }))

  return (
    <ResponsiveContainer width="100%" height={240}>
      <LineChart data={shareData}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis dataKey="name" tick={{ fontSize: 10 }} />
        <YAxis tick={{ fontSize: 10 }} />
        <Tooltip />
        <Line type="monotone" dataKey="share" stroke="#ff6b4a" strokeWidth={2} animationDuration={600} name={t('marketShare') + ' %'} />
        <Line type="monotone" dataKey="demand" stroke="#2dd4bf" strokeWidth={2} animationDuration={600} name={t('demand')} />
      </LineChart>
    </ResponsiveContainer>
  )
}

function MacroTab({ lang }: { lang: 'zh' | 'en' }) {
  const { t } = useTranslation()
  const unlockedCities = useGameStore((s) => s.unlockedCities)
  const hotels = useGameStore((s) => s.hotels)
  const activeEvents = useGameStore((s) => s.activeEvents)
  const triggeredEventIds = useGameStore((s) => s.triggeredEventIds)
  const date = useGameStore((s) => s.date)

  const expansion = cities.map((c) => ({
    name: getCityName(c.id, lang),
    year: c.unlockYear,
    unlocked: unlockedCities.includes(c.id),
    fee: c.unlockFee,
  }))

  const pastEvents = gameEvents.filter((e) => triggeredEventIds.includes(e.id))
  const upcoming = gameEvents.filter((e) => !triggeredEventIds.includes(e.id) && e.date >= `${date.year}-01-01`).slice(0, 5)
  const regionalBalance = Object.values(
    cities.reduce<Record<string, { region: string; total: number; unlocked: number; playerHotels: number }>>((acc, city) => {
      acc[city.region] ??= { region: city.region, total: 0, unlocked: 0, playerHotels: 0 }
      acc[city.region].total += 1
      if (unlockedCities.includes(city.id)) acc[city.region].unlocked += 1
      acc[city.region].playerHotels += hotels.filter((h) => h.ownerId === 'player' && h.cityId === city.id).length
      return acc
    }, {}),
  ).sort((a, b) => b.unlocked - a.unlocked || b.playerHotels - a.playerHotels)

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <div>
        <h4 className="mb-2 text-sm font-semibold">{t('regionalBalance')}</h4>
        <div className="space-y-2">
          {regionalBalance.map((region) => {
            const pct = region.total > 0 ? Math.round((region.unlocked / region.total) * 100) : 0
            return (
              <div key={region.region} className="rounded-lg bg-white p-2 text-sm">
                <div className="mb-1 flex items-center justify-between gap-2">
                  <span className="font-medium">{t(`region_${region.region}`)}</span>
                  <span className="text-xs text-muted">
                    {region.unlocked}/{region.total} · {region.playerHotels} {t('hotels')}
                  </span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-card-dark">
                  <div className="h-full rounded-full bg-teal" style={{ width: `${pct}%` }} />
                </div>
              </div>
            )
          })}
        </div>
      </div>
      <div>
        <h4 className="mb-2 text-sm font-semibold">{t('expansion')}</h4>
        <div className="space-y-1">
          {expansion.map((c) => (
            <div key={c.name} className="flex items-center gap-2 text-sm">
              <div className={`h-2 w-2 rounded-full ${c.unlocked ? 'bg-teal' : 'bg-slate-300'}`} />
              <span className={c.unlocked ? 'font-medium' : 'text-muted'}>{c.name}</span>
              <span className="ml-auto text-xs text-muted">
                {c.unlocked ? t('unlocked') : `$${(c.fee / 1_000_000).toFixed(1)}M · ${c.year}`}
              </span>
            </div>
          ))}
        </div>
      </div>
      <div>
        <h4 className="mb-2 text-sm font-semibold">{t('eventTimeline')}</h4>
        {activeEvents.length > 0 && (
          <div className="mb-2">
            <div className="text-xs text-accent">{t('activeEvents')}</div>
            {activeEvents.map((e) => (
              <div key={e.eventId} className="text-sm">{e.title[lang]} ({e.remainingDays}d)</div>
            ))}
          </div>
        )}
        <div className="space-y-1 text-sm">
          {pastEvents.slice(-3).map((e) => (
            <div key={e.id} className="text-muted">
              ✓ {e.title[lang]}
              <span className={`ml-1 rounded px-1 text-[10px] ${e.tier === 'major' ? 'bg-accent/20 text-accent' : 'bg-slate-200 text-slate-600'}`}>
                {e.tier === 'major' ? t('major') : e.category}
              </span>
            </div>
          ))}
          {upcoming.map((e) => (
            <div key={e.id} className="text-slate-600">
              → {e.date} {e.title[lang]}
              {e.tier === 'major' && <span className="ml-1 text-[10px] text-accent">({t('major')})</span>}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
