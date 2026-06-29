import { useMemo, useState, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { cityMap } from '../../data/cities'
import { competitors } from '../../data/competitors'
import { rebuildGrid } from '../../game/market/gridIndex'
import { estimateDemandBonus, getUpgradeCost, sampleLocationFactors } from '../../game/market/market'
import { calcStaffDailyCost } from '../../game/hotel/defaults'
import {
  calcExpansionCost,
  calcExpansionDays,
  getFacilityBonusSummary,
  getStaffLimits,
  roomTypeSpaceCost,
} from '../../game/hotel/operations'
import {
  calcSpaceFree,
  calcSpaceUsed,
  calcTotalRooms,
  canSelectFacility,
  canSelectRoomType,
} from '../../game/hotel/space'
import { estimateHotelValue, getAcquisitionQuote, getListPriceBounds } from '../../game/hotel/valuation'
import type { FacilityId, Hotel, HotelStaff, RoomTypeId } from '../../game/types'
import { FACILITIES, ROOM_TYPES } from '../../game/types'
import { useGameStore } from '../../stores/gameStore'
import { Button } from '../ui/Button'
import { Card } from '../ui/Card'
import { HotelAdsPanel } from './HotelAdsPanel'

type DetailTab = 'overview' | 'stats' | 'operations' | 'advertising' | 'acquisition'
type HistoryRange = 7 | 30 | 90
type StaffRole = keyof HotelStaff

const ROOM_TYPE_IDS = Object.keys(ROOM_TYPES) as RoomTypeId[]
const OPTIONAL_FACILITIES = (Object.keys(FACILITIES) as FacilityId[]).filter((id) => id !== 'lobby')
const DEFAULT_EXPAND_AMOUNT = 5

const CHART_COLORS = {
  occupancy: '#2dd4bf',
  revenue: '#ff6b4a',
  expense: '#8b5cf6',
  profit: '#3b82f6',
}

function getOwnerLabel(hotel: Hotel, lang: 'zh' | 'en', t: (key: string) => string): string {
  if (hotel.ownerId === 'player') return t('player')
  const comp = competitors.find((c) => c.id === hotel.ownerId)
  return comp?.name[lang] ?? hotel.ownerId
}

export function HotelDetailModal() {
  const { t, i18n } = useTranslation()
  const lang = i18n.language === 'zh' ? 'zh' : 'en'

  const showHotelDetail = useGameStore((s) => s.showHotelDetail)
  const selectedHotelId = useGameStore((s) => s.selectedHotelId)
  const hotels = useGameStore((s) => s.hotels)
  const cash = useGameStore((s) => s.cash)
  const worldMetrics = useGameStore((s) => s.worldMetrics)
  const worldSeed = useGameStore((s) => s.worldSeed)
  const date = useGameStore((s) => s.date)
  const activeEvents = useGameStore((s) => s.activeEvents)
  const gridVersion = useGameStore((s) => s.gridVersion)

  const setShowHotelDetail = useGameStore((s) => s.setShowHotelDetail)
  const setHotelPrice = useGameStore((s) => s.setHotelPrice)
  const renovateHotel = useGameStore((s) => s.renovateHotel)
  const expandHotelSpace = useGameStore((s) => s.expandHotelSpace)
  const setRoomInventory = useGameStore((s) => s.setRoomInventory)
  const addFacility = useGameStore((s) => s.addFacility)
  const removeFacility = useGameStore((s) => s.removeFacility)
  const hireStaff = useGameStore((s) => s.hireStaff)
  const unlockedTechs = useGameStore((s) => s.unlockedTechs)
  const listHotelForSale = useGameStore((s) => s.listHotelForSale)
  const cancelHotelSale = useGameStore((s) => s.cancelHotelSale)
  const acquireHotel = useGameStore((s) => s.acquireHotel)
  const brandName = useGameStore((s) => s.brandName)
  const gameCompetitors = useGameStore((s) => s.competitors)

  const [tab, setTab] = useState<DetailTab>('overview')
  const [historyRange, setHistoryRange] = useState<HistoryRange>(30)
  const [expandAmount, setExpandAmount] = useState(DEFAULT_EXPAND_AMOUNT)
  const [listPrice, setListPrice] = useState('')
  const [offerPrice, setOfferPrice] = useState('')
  const [opsMessage, setOpsMessage] = useState('')
  const [acquisitionStatus, setAcquisitionStatus] = useState<'idle' | 'accepted' | 'rejected' | 'counter'>('idle')

  const hotel = hotels.find((h) => h.id === selectedHotelId)
  const isPlayer = hotel?.ownerId === 'player'

  const gridPoints = useMemo(() => {
    void gridVersion
    return rebuildGrid(worldMetrics, worldSeed, date.year, activeEvents)
  }, [worldMetrics, worldSeed, date.year, activeEvents, gridVersion])

  const locationBonus = useMemo(() => {
    if (!hotel) return 0
    const factors = sampleLocationFactors(gridPoints, hotel.coordinates[0], hotel.coordinates[1], hotel.cityId)
    return estimateDemandBonus(factors)
  }, [hotel, gridPoints])

  const valuation = useMemo(() => {
    if (!hotel) return null
    const city = cityMap[hotel.cityId]
    if (!city) return null
    const value = estimateHotelValue(hotel, city, gridPoints)
    const bounds = getListPriceBounds(value)
    return {
      value,
      min: bounds.min,
      max: bounds.max,
    }
  }, [hotel, gridPoints])

  const acquisitionQuote = useMemo(() => {
    if (!hotel || isPlayer) return null
    const city = cityMap[hotel.cityId]
    if (!city) return null
    const ownerCash = gameCompetitors.find((c) => c.id === hotel.ownerId)?.cash
    return getAcquisitionQuote(hotel, city, gridPoints, ownerCash)
  }, [hotel, isPlayer, gridPoints, gameCompetitors])

  const chartData = useMemo(() => {
    if (!hotel) return []
    return hotel.history.slice(-historyRange).map((entry) => ({
      date: entry.date.slice(5),
      occupancy: Math.round(entry.occupancy * 100),
      revenue: entry.revenue,
      expense: entry.expense,
      profit: entry.profit,
    }))
  }, [hotel, historyRange])

  const tabs = useMemo(() => {
    const base: { id: DetailTab; label: string }[] = [
      { id: 'overview', label: t('hotelDetailOverview') },
      { id: 'stats', label: t('hotelDetailStats') },
    ]
    if (isPlayer) {
      base.push({ id: 'operations', label: t('hotelDetailOperations') })
      base.push({ id: 'advertising', label: t('hotelDetailAdvertising') })
    } else base.push({ id: 'acquisition', label: t('hotelDetailAcquisition') })
    return base
  }, [isPlayer, t])

  const close = () => setShowHotelDetail(false)

  if (!showHotelDetail || !hotel) return null

  const city = cityMap[hotel.cityId]
  const spaceUsed = calcSpaceUsed(hotel.roomInventory, hotel.facilities)
  const spaceFree = calcSpaceFree(hotel)
  const totalRooms = calcTotalRooms(hotel.roomInventory)
  const staffTotal =
    hotel.staff.frontDesk + hotel.staff.housekeeping + hotel.staff.foodService + hotel.staff.engineering
  const staffDailyCost = calcStaffDailyCost(hotel.staff)
  const facilityBonus = getFacilityBonusSummary(hotel.facilities)
  const staffLimits = getStaffLimits(hotel)
  const renovateCost = getUpgradeCost(hotel)
  const expandCost = calcExpansionCost(hotel, expandAmount)
  const expandDays = calcExpansionDays(expandAmount)

  const roomEntries = (Object.entries(hotel.roomInventory) as [RoomTypeId, number][]).filter(
    ([, count]) => count > 0,
  )

  return (
    <AnimatePresence>
      {showHotelDetail && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="pointer-events-auto fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 backdrop-blur-sm sm:items-center sm:p-4"
          onClick={close}
        >
          <motion.div
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 26, stiffness: 280 }}
            className="flex h-[92vh] w-full flex-col sm:h-auto sm:max-h-[90vh] sm:max-w-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <Card className="flex h-full flex-col overflow-hidden shadow-2xl">
              <div className="shrink-0 border-b border-border p-3 sm:p-4">
                <div className="mb-2 flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="mb-0.5 text-xs font-medium uppercase tracking-wide text-accent">
                      {city?.name[lang]} · {getOwnerLabel(hotel, lang, t)}
                    </div>
                    <h2 className="truncate text-lg font-bold sm:text-xl">{hotel.name}</h2>
                    <div className="mt-0.5 text-xs text-muted">
                      {hotel.stars}★ · {t('locationScore')}: {locationBonus >= 0 ? '+' : ''}
                      {locationBonus}%
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={close} aria-label={t('close')}>
                    ✕
                  </Button>
                </div>

                <div className="scrollbar-hide flex gap-1 overflow-x-auto">
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
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto p-3 sm:p-4">
                {tab === 'overview' && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
                      <MetricCard label={t('occupancy')} value={`${Math.round(hotel.occupancy * 100)}%`} />
                      <MetricCard
                        label={t('dailyRevenue')}
                        value={`$${hotel.dailyRevenue.toLocaleString()}`}
                      />
                      <MetricCard label={t('quality')} value={`${Math.round(hotel.quality)}`} />
                      <MetricCard label={t('rooms')} value={`${totalRooms}`} />
                    </div>

                    <div className="rounded-lg bg-card-dark p-3">
                      <div className="mb-1.5 flex justify-between text-xs">
                        <span className="font-medium">{t('hotelSpace')}</span>
                        <span className="text-muted">
                          {spaceUsed}/{hotel.spaceTotal} · {t('spaceFree')}: {spaceFree}
                        </span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-border">
                        <div
                          className="h-full rounded-full bg-teal transition-all"
                          style={{ width: `${Math.min(100, (spaceUsed / hotel.spaceTotal) * 100)}%` }}
                        />
                      </div>
                    </div>

                    <div className="rounded-lg border border-border p-3">
                      <h3 className="mb-2 text-xs font-semibold">{t('roomComposition')}</h3>
                      {roomEntries.length === 0 ? (
                        <p className="text-xs text-muted">{t('noRooms')}</p>
                      ) : (
                        <div className="space-y-1">
                          {roomEntries.map(([typeId, count]) => (
                            <div key={typeId} className="flex justify-between text-xs">
                              <span>{t(`room_${typeId}`)}</span>
                              <span className="font-medium">
                                {count} ({totalRooms > 0 ? Math.round((count / totalRooms) * 100) : 0}%)
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="rounded-lg border border-border p-3">
                      <h3 className="mb-2 text-xs font-semibold">{t('facilities')}</h3>
                      <div className="flex flex-wrap gap-1.5">
                        {hotel.facilities.map((f) => (
                          <span
                            key={f}
                            className="rounded-full bg-teal/15 px-2 py-0.5 text-xs text-teal-dark"
                          >
                            {t(`facility_${f}`)}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="rounded-lg border border-border p-3">
                      <h3 className="mb-2 text-xs font-semibold">{t('staff')}</h3>
                      <div className="grid grid-cols-2 gap-1.5 text-xs sm:grid-cols-4">
                        <StaffItem label={t('staffFrontDesk')} value={hotel.staff.frontDesk} />
                        <StaffItem label={t('staffHousekeeping')} value={hotel.staff.housekeeping} />
                        <StaffItem label={t('staffFoodService')} value={hotel.staff.foodService} />
                        <StaffItem label={t('staffEngineering')} value={hotel.staff.engineering} />
                      </div>
                      <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-muted">
                        <span>
                          {t('staffTotal')}: {staffTotal}
                        </span>
                        <span>
                          {t('staffDailyCost')}: ${staffDailyCost.toLocaleString()}
                        </span>
                      </div>
                    </div>

                    {(facilityBonus.demandPct > 0 ||
                      facilityBonus.revenuePct > 0 ||
                      facilityBonus.costReductionPct > 0) && (
                      <div className="rounded-lg border border-border p-3">
                        <h3 className="mb-2 text-xs font-semibold">{t('facilityBonusSummary')}</h3>
                        <div className="flex flex-wrap gap-2 text-xs">
                          {facilityBonus.demandPct > 0 && (
                            <span className="rounded-full bg-teal/15 px-2 py-0.5 text-teal-dark">
                              {t('facilityDemandBonus', { pct: facilityBonus.demandPct })}
                            </span>
                          )}
                          {facilityBonus.revenuePct > 0 && (
                            <span className="rounded-full bg-accent/15 px-2 py-0.5 text-accent">
                              {t('facilityRevenueBonus', { pct: facilityBonus.revenuePct })}
                            </span>
                          )}
                          {facilityBonus.costReductionPct > 0 && (
                            <span className="rounded-full bg-blue-500/15 px-2 py-0.5 text-blue-600">
                              {t('facilityCostReduction', { pct: facilityBonus.costReductionPct })}
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {tab === 'stats' && (
                  <div className="space-y-3">
                    <div className="flex gap-1">
                      {([7, 30, 90] as HistoryRange[]).map((range) => (
                        <Button
                          key={range}
                          variant={historyRange === range ? 'primary' : 'secondary'}
                          size="sm"
                          onClick={() => setHistoryRange(range)}
                        >
                          {t('historyDays', { days: range })}
                        </Button>
                      ))}
                    </div>

                    {chartData.length === 0 ? (
                      <p className="py-8 text-center text-sm text-muted">{t('noHistoryData')}</p>
                    ) : (
                      <>
                        <ChartBlock title={t('occupancy')}>
                          <ResponsiveContainer width="100%" height={160}>
                            <LineChart data={chartData}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                              <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                              <YAxis tick={{ fontSize: 10 }} unit="%" />
                              <Tooltip />
                              <Line
                                type="monotone"
                                dataKey="occupancy"
                                stroke={CHART_COLORS.occupancy}
                                strokeWidth={2}
                                dot={false}
                                name={t('occupancy')}
                              />
                            </LineChart>
                          </ResponsiveContainer>
                        </ChartBlock>

                        <ChartBlock title={t('hotelDetailFinancials')}>
                          <ResponsiveContainer width="100%" height={200}>
                            <LineChart data={chartData}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                              <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                              <YAxis tick={{ fontSize: 10 }} />
                              <Tooltip />
                              <Legend wrapperStyle={{ fontSize: 11 }} />
                              <Line
                                type="monotone"
                                dataKey="revenue"
                                stroke={CHART_COLORS.revenue}
                                strokeWidth={2}
                                dot={false}
                                name={t('dailyRevenue')}
                              />
                              <Line
                                type="monotone"
                                dataKey="expense"
                                stroke={CHART_COLORS.expense}
                                strokeWidth={2}
                                dot={false}
                                name={t('dailyExpense')}
                              />
                              <Line
                                type="monotone"
                                dataKey="profit"
                                stroke={CHART_COLORS.profit}
                                strokeWidth={2}
                                dot={false}
                                name={t('netProfit')}
                              />
                            </LineChart>
                          </ResponsiveContainer>
                        </ChartBlock>
                      </>
                    )}
                  </div>
                )}

                {tab === 'operations' && isPlayer && (
                  <div className="space-y-4">
                    <Section title={t('price')}>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted">$</span>
                        <input
                          type="number"
                          value={hotel.price}
                          onChange={(e) => setHotelPrice(hotel.id, Number(e.target.value))}
                          className="w-24 rounded-md border border-border px-2 py-1.5 text-sm"
                        />
                        <span className="text-[11px] text-muted">{t('avgPriceHint')}</span>
                      </div>
                    </Section>

                    <Section title={t('renovate')}>
                      <p className="mb-2 text-[11px] text-muted">{t('renovateDesc')}</p>
                      <Button
                        variant="secondary"
                        size="sm"
                        disabled={
                          cash < renovateCost ||
                          hotel.quality >= 95 ||
                          (hotel.renovationCooldownDays ?? 0) > 0
                        }
                        onClick={() => {
                          const ok = renovateHotel(hotel.id)
                          setOpsMessage(ok ? t('renovateStarted') : t('insufficientFunds'))
                        }}
                      >
                        {t('renovate')} (${renovateCost.toLocaleString()})
                      </Button>
                      {(hotel.renovationCooldownDays ?? 0) > 0 && (
                        <p className="mt-1 text-xs text-accent">
                          {t('renovationCooldown', { days: hotel.renovationCooldownDays })}
                        </p>
                      )}
                    </Section>

                    <Section title={t('expandSpace')}>
                      <p className="mb-2 text-[11px] text-muted">{t('expandSpaceDesc')}</p>
                      <div className="mb-2 space-y-1 text-xs">
                        <div className="flex justify-between">
                          <span className="text-muted">{t('hotelSpace')}</span>
                          <span>
                            {spaceUsed}/{hotel.spaceTotal}
                            {(hotel.pendingExpansionSpace ?? 0) > 0 && (
                              <span className="ml-1 text-teal-dark">
                                (+{hotel.pendingExpansionSpace} {t('expansionInProgress', { days: hotel.expansionDaysRemaining ?? 0 })})
                              </span>
                            )}
                          </span>
                        </div>
                        <div className="flex justify-between font-medium text-accent">
                          <span>{t('expansionNextTier', { space: expandAmount })}</span>
                          <span>
                            ${expandCost.toLocaleString()} · {t('expansionDuration', { days: expandDays })}
                          </span>
                        </div>
                      </div>
                      <div className="mb-2 flex items-center gap-2">
                        <input
                          type="number"
                          min={1}
                          max={20}
                          value={expandAmount}
                          onChange={(e) => setExpandAmount(Math.max(1, Number(e.target.value)))}
                          className="w-16 rounded-md border border-border px-2 py-1 text-sm"
                        />
                        <span className="text-xs text-muted">{t('spaceUnits')}</span>
                      </div>
                      <Button
                        variant="secondary"
                        size="sm"
                        disabled={cash < expandCost || (hotel.expansionDaysRemaining ?? 0) > 0}
                        onClick={() => {
                          const ok = expandHotelSpace(hotel.id, expandAmount)
                          setOpsMessage(ok ? t('expansionStarted') : t('opsActionFailed'))
                        }}
                      >
                        {t('expandSpace')}
                      </Button>
                      {(hotel.expansionDaysRemaining ?? 0) > 0 && (
                        <p className="mt-1 text-xs text-teal-dark">
                          {t('expansionInProgress', { days: hotel.expansionDaysRemaining })}
                          {(hotel.pendingExpansionSpace ?? 0) > 0 &&
                            ` (+${hotel.pendingExpansionSpace} ${t('spaceUnits')})`}
                        </p>
                      )}
                    </Section>

                    <Section title={t('roomManagement')}>
                      <p className="mb-2 text-[11px] text-muted">
                        {t('spaceFree')}: {spaceFree} / {hotel.spaceTotal}
                      </p>
                      <div className="space-y-2">
                        {ROOM_TYPE_IDS.map((roomType) => {
                          const count = hotel.roomInventory[roomType]
                          const spaceCost = roomTypeSpaceCost(roomType)
                          const locked = !canSelectRoomType(roomType, hotel.facilities, unlockedTechs)
                          const atMaxSpace =
                            calcSpaceUsed(
                              { ...hotel.roomInventory, [roomType]: count + 1 },
                              hotel.facilities,
                            ) > hotel.spaceTotal
                          return (
                            <div
                              key={roomType}
                              className={`flex items-center justify-between gap-2 rounded-md px-2 py-1.5 text-xs ${locked ? 'opacity-50' : 'bg-card-dark'}`}
                            >
                              <div className="min-w-0">
                                <div className="font-medium">{t(`room_${roomType}`)}</div>
                                <div className="text-[10px] text-muted">
                                  {t('spaceCostLabel', { cost: spaceCost })}
                                  {locked && ` · ${t('techLocked')}`}
                                </div>
                              </div>
                              <Stepper
                                value={count}
                                disabled={locked}
                                canDecrease={count > 0}
                                canIncrease={!locked && !atMaxSpace}
                                onChange={(delta) => {
                                  const next = {
                                    ...hotel.roomInventory,
                                    [roomType]: Math.max(0, count + delta),
                                  }
                                  const ok = setRoomInventory(hotel.id, next)
                                  setOpsMessage(ok ? '' : t('opsActionFailed'))
                                }}
                              />
                            </div>
                          )
                        })}
                      </div>
                    </Section>

                    <Section title={t('facilityManagement')}>
                      <div className="mb-3 space-y-1">
                        {hotel.facilities.map((facilityId) => (
                          <div
                            key={facilityId}
                            className="flex items-center justify-between rounded-md bg-card-dark px-2 py-1.5 text-xs"
                          >
                            <div>
                              <span className="font-medium">{t(`facility_${facilityId}`)}</span>
                              <span className="ml-2 text-[10px] text-muted">
                                {t('spaceCostLabel', { cost: FACILITIES[facilityId].spaceCost })}
                              </span>
                            </div>
                            {facilityId !== 'lobby' && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 px-2 text-[11px]"
                                onClick={() => {
                                  const ok = removeFacility(hotel.id, facilityId)
                                  setOpsMessage(ok ? t('opsActionSuccess') : t('opsActionFailed'))
                                }}
                              >
                                {t('removeFacility')}
                              </Button>
                            )}
                          </div>
                        ))}
                      </div>
                      <p className="mb-2 text-[11px] font-medium text-muted">{t('addFacility')}</p>
                      <div className="flex flex-wrap gap-1.5">
                        {OPTIONAL_FACILITIES.filter((id) => !hotel.facilities.includes(id)).map(
                          (facilityId) => {
                            const locked = !canSelectFacility(facilityId, unlockedTechs)
                            const noSpace =
                              calcSpaceFree(hotel) < (FACILITIES[facilityId]?.spaceCost ?? 0)
                            return (
                              <Button
                                key={facilityId}
                                variant="secondary"
                                size="sm"
                                className="text-[11px]"
                                disabled={locked || noSpace}
                                onClick={() => {
                                  const ok = addFacility(hotel.id, facilityId)
                                  setOpsMessage(ok ? t('opsActionSuccess') : t('opsActionFailed'))
                                }}
                              >
                                {t(`facility_${facilityId}`)}
                                {locked && ` (${t('techLocked')})`}
                              </Button>
                            )
                          },
                        )}
                      </div>
                    </Section>

                    <Section title={t('staffHiring')}>
                      <p className="mb-2 text-[11px] text-muted">
                        {t('staffDailyCost')}: ${staffDailyCost.toLocaleString()}
                      </p>
                      <div className="space-y-2">
                        {(
                          [
                            ['frontDesk', 'staffFrontDesk'],
                            ['housekeeping', 'staffHousekeeping'],
                            ['foodService', 'staffFoodService'],
                            ['engineering', 'staffEngineering'],
                          ] as [StaffRole, string][]
                        ).map(([role, labelKey]) => {
                          const limits = staffLimits[role]
                          return (
                            <div
                              key={role}
                              className="flex items-center justify-between rounded-md bg-card-dark px-2 py-1.5 text-xs"
                            >
                              <div>
                                <div className="font-medium">{t(labelKey)}</div>
                                <div className="text-[10px] text-muted">
                                  {limits.min}–{limits.max}
                                </div>
                              </div>
                              <Stepper
                                value={hotel.staff[role]}
                                canDecrease={hotel.staff[role] > limits.min}
                                canIncrease={hotel.staff[role] < limits.max}
                                onChange={(delta) => {
                                  const ok = hireStaff(hotel.id, {
                                    [role]: hotel.staff[role] + delta,
                                  })
                                  setOpsMessage(ok ? '' : t('opsActionFailed'))
                                }}
                              />
                            </div>
                          )
                        })}
                      </div>
                    </Section>

                    <Section title={t('sellHotel')}>
                      <p className="mb-2 text-[11px] text-muted">
                        {valuation
                          ? t('valuationRange', {
                              min: valuation.min.toLocaleString(),
                              max: valuation.max.toLocaleString(),
                            })
                          : ''}
                      </p>
                      {hotel.saleListing ? (
                        <div className="space-y-2">
                          <p className="text-xs text-teal-dark">
                            {t('listedForSale', { price: hotel.saleListing.listPrice.toLocaleString() })}
                          </p>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => {
                              const ok = cancelHotelSale(hotel.id)
                              setOpsMessage(ok ? t('saleCancelled') : t('opsActionFailed'))
                            }}
                          >
                            {t('cancelListing')}
                          </Button>
                        </div>
                      ) : (
                        <div className="flex flex-wrap items-center gap-2">
                          <input
                            type="number"
                            placeholder={valuation ? String(valuation.value) : ''}
                            value={listPrice}
                            onChange={(e) => setListPrice(e.target.value)}
                            className="w-32 rounded-md border border-border px-2 py-1.5 text-sm"
                          />
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => {
                              const price = Number(listPrice)
                              const ok = listHotelForSale(hotel.id, price)
                              setOpsMessage(
                                ok ? t('hotelListed') : t('invalidListPrice'),
                              )
                            }}
                          >
                            {t('listForSale')}
                          </Button>
                        </div>
                      )}
                    </Section>

                    {opsMessage && (
                      <p className="rounded-md bg-card-dark px-2 py-1.5 text-xs text-slate-600">{opsMessage}</p>
                    )}
                  </div>
                )}

                {tab === 'advertising' && isPlayer && (
                  <HotelAdsPanel hotel={hotel} lang={lang} />
                )}

                {tab === 'acquisition' && !isPlayer && (
                  <div className="space-y-4">
                    <div className="rounded-lg bg-card-dark p-3 text-sm">
                      <p className="mb-2 text-xs text-muted">{t('acquisitionDesc')}</p>
                      {acquisitionQuote && (
                        <div className="space-y-1 text-xs">
                          <div className="flex justify-between">
                            <span>{t('estimatedValue')}</span>
                            <span className="font-semibold">
                              ${acquisitionQuote.valuation.toLocaleString()}
                            </span>
                          </div>
                          <div className="flex justify-between text-muted">
                            <span>{t('offerRange')}</span>
                            <span>
                              ${acquisitionQuote.minOffer.toLocaleString()} – $
                              {acquisitionQuote.maxOffer.toLocaleString()}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>{t('suggestedOffer')}</span>
                            <span className="font-medium text-teal-dark">
                              ${acquisitionQuote.suggestedOffer.toLocaleString()}
                            </span>
                          </div>
                          {acquisitionQuote.distressMultiplier < 1 && (
                            <p className="mt-1 text-[11px] text-accent">{t('distressAcquisitionHint')}</p>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="rounded-lg border border-border p-3">
                      <h3 className="mb-2 text-xs font-semibold">{t('publicInfo')}</h3>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <MetricCard label={t('occupancy')} value={`${Math.round(hotel.occupancy * 100)}%`} />
                        <MetricCard
                          label={t('dailyRevenue')}
                          value={`$${hotel.dailyRevenue.toLocaleString()}`}
                        />
                        <MetricCard label={t('quality')} value={`${Math.round(hotel.quality)}`} />
                        <MetricCard label={t('rooms')} value={`${totalRooms}`} />
                      </div>
                    </div>

                    <div className="rounded-lg border border-border p-3">
                      <h3 className="mb-2 text-xs font-semibold">{t('makeOffer')}</h3>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs text-muted">$</span>
                        <input
                          type="number"
                          placeholder={
                            acquisitionQuote ? String(acquisitionQuote.suggestedOffer) : ''
                          }
                          value={offerPrice}
                          onChange={(e) => {
                            setOfferPrice(e.target.value)
                            setAcquisitionStatus('idle')
                          }}
                          className="w-36 rounded-md border border-border px-2 py-1.5 text-sm"
                        />
                        {acquisitionQuote && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setOfferPrice(String(acquisitionQuote.suggestedOffer))}
                          >
                            {t('useSuggestedOffer')}
                          </Button>
                        )}
                      </div>
                      <Button
                        className="mt-2 w-full"
                        disabled={!offerPrice || cash < Number(offerPrice)}
                        onClick={() => {
                          const price = Number(offerPrice)
                          const result = acquireHotel(hotel.id, price)
                          if (result.ok) {
                            setAcquisitionStatus('accepted')
                            setOpsMessage(t('acquisitionAccepted', { name: `${brandName}·${city?.name[lang] ?? ''}` }))
                          } else if (result.status === 'counter' && result.counterOffer) {
                            setAcquisitionStatus('counter')
                            setOpsMessage(
                              t('acquisitionCounter', { price: result.counterOffer.toLocaleString() }),
                            )
                            setOfferPrice(String(result.counterOffer))
                          } else if (result.status === 'rejected') {
                            setAcquisitionStatus('rejected')
                            setOpsMessage(t('acquisitionRejected'))
                          } else if (result.error === 'insufficient_funds') {
                            setOpsMessage(t('insufficientFunds'))
                          } else {
                            setOpsMessage(t('invalidOfferPrice'))
                          }
                        }}
                      >
                        {t('initiateAcquisition')}
                      </Button>
                    </div>

                    {opsMessage && (
                      <p
                        className={`rounded-md px-2 py-1.5 text-xs ${
                          acquisitionStatus === 'accepted'
                            ? 'bg-teal/10 text-teal-dark'
                            : acquisitionStatus === 'rejected'
                              ? 'bg-red-50 text-red-600'
                              : acquisitionStatus === 'counter'
                                ? 'bg-amber-50 text-amber-700'
                                : 'bg-card-dark text-slate-600'
                        }`}
                      >
                        {opsMessage}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </Card>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-card-dark p-2 text-center">
      <div className="text-[10px] text-muted">{label}</div>
      <div className="font-semibold">{value}</div>
    </div>
  )
}

function StaffItem({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded bg-card-dark p-1.5 text-center">
      <div className="text-[10px] text-muted">{label}</div>
      <div className="font-semibold">{value}</div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-lg border border-border p-3">
      <h3 className="mb-2 text-xs font-semibold">{title}</h3>
      {children}
    </div>
  )
}

function ChartBlock({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-lg border border-border p-2">
      <h3 className="mb-1 text-xs font-semibold">{title}</h3>
      {children}
    </div>
  )
}

function Stepper({
  value,
  onChange,
  canDecrease = true,
  canIncrease = true,
  disabled = false,
}: {
  value: number
  onChange: (delta: number) => void
  canDecrease?: boolean
  canIncrease?: boolean
  disabled?: boolean
}) {
  return (
    <div className={`flex items-center gap-1.5 ${disabled ? 'pointer-events-none' : ''}`}>
      <button
        type="button"
        className="flex h-7 w-7 items-center justify-center rounded border border-border bg-white text-sm disabled:opacity-30"
        disabled={disabled || !canDecrease}
        onClick={() => onChange(-1)}
        aria-label="decrease"
      >
        −
      </button>
      <span className="w-6 text-center font-semibold">{value}</span>
      <button
        type="button"
        className="flex h-7 w-7 items-center justify-center rounded border border-border bg-white text-sm disabled:opacity-30"
        disabled={disabled || !canIncrease}
        onClick={() => onChange(1)}
        aria-label="increase"
      >
        +
      </button>
    </div>
  )
}
