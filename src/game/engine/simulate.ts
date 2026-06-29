import { pickAvailableHexCell } from '../../data/grid/hexGrid'
import { competitors } from '../../data/competitors'
import { runAIDecisions } from '../ai/ai'
import { checkAndTriggerEvents } from '../events/eventEngine'
import { addDays, formatGameDate, parseGameDate, uid } from './date'
import { calculateCreditRating, getDailyInterestExpense, getReputationMap } from '../finance/finance'
import { rebuildGrid } from '../market/gridIndex'
import {
  allocateMarketShare,
  calculateDailyDemand,
  getCityById,
  getOperatingCost,
} from '../market/market'
import { computeWorldMetrics } from '../world/worldSim'
import {
  defaultOpeningConfig,
  defaultStaffForRooms,
} from '../hotel/defaults'
import { calcSpaceUsed, calcTotalRooms } from '../hotel/space'
import { processHotelSales } from '../hotel/acquisition'
import { processHotelDailyMaintenance } from '../hotel/operations'
import { advanceResearchDay } from '../tech/tech'
import { processDailyAdBilling } from '../marketing/ads'
import { generateAllCityWeather } from './weather'
import type { CompetitorPersonality, GameState, Hotel, HotelFacilityList, HotelRoomInventory, HotelStar } from '../types'
import { STAR_CONFIG, STRATEGY_POLICIES } from '../types'

export function simulateDay(state: GameState): Partial<GameState> & {
  pendingMajorEvent?: GameState['activeEvents'][0] | null
  newNews?: GameState['newsFeed']
} {
  const policy = STRATEGY_POLICIES[state.strategyPolicy ?? 'balanced']
  const reputations = getReputationMap(state)
  reputations.player = Math.max(1, reputations.player * policy.demandScoreMultiplier)
  const updatedHotels: Hotel[] = state.hotels.map((h) => ({ ...h }))
  const updatedCompetitors = state.competitors.map((c) => ({ ...c }))
  let totalRevenue = 0
  let totalExpense = 0
  const cityMarkets: GameState['cityMarkets'] = { ...state.cityMarkets }

  const worldMetrics = computeWorldMetrics(
    state.worldMetrics,
    state.worldSeed,
    state.date.year,
    state.activeEvents,
  )
  const gridPoints = rebuildGrid(state.worldMetrics, state.worldSeed, state.date.year, state.activeEvents)
  const adContext = { brandAd: state.brandAd, hotelAds: state.hotelAds ?? [] }

  // Collect city climates and generate weather
  const cityClimates: Record<string, import('../types').ClimateZone> = {}
  for (const cityId of state.unlockedCities) {
    const city = getCityById(cityId)
    cityClimates[cityId] = city.climate
  }
  const cityWeathers = generateAllCityWeather(state.unlockedCities, cityClimates, state.date)

  for (const cityId of state.unlockedCities) {
    const city = getCityById(cityId)
    const demand = calculateDailyDemand(
      city,
      state.date,
      updatedHotels,
      state.activeEvents,
      worldMetrics[cityId],
      gridPoints,
      adContext,
      cityWeathers[cityId],
    )
    const allocation = allocateMarketShare(
      cityId,
      demand,
      updatedHotels,
      reputations,
      gridPoints,
      { ...adContext, activeEvents: state.activeEvents },
    )

    let playerShare = 0
    const cityHotels = updatedHotels.filter((h) => h.cityId === cityId)
    const playerHotels = cityHotels.filter((h) => h.ownerId === 'player')

    for (const hotel of cityHotels) {
      const result = allocation.get(hotel.id)
      if (!result) continue
      hotel.occupancy = result.occupancy
      hotel.dailyRevenue = result.revenue

      processHotelDailyMaintenance(hotel)

      const baseCost = getOperatingCost(hotel, city)
      const cost = hotel.ownerId === 'player'
        ? Math.round(baseCost * policy.operatingCostMultiplier)
        : baseCost

      appendHotelHistory(hotel, formatGameDate(state.date), cost)

      if (hotel.ownerId === 'player') {
        totalRevenue += result.revenue
        totalExpense += cost
        playerShare += result.occupancy
      } else {
        const comp = updatedCompetitors.find((c) => c.id === hotel.ownerId)
        if (comp) comp.cash += result.revenue - cost
      }
    }

    cityMarkets[cityId] = {
      cityId,
      dailyDemand: demand,
      avgPrice:
        cityHotels.reduce((sum, h) => sum + h.price, 0) / Math.max(1, cityHotels.length),
      playerShare: playerHotels.length > 0 ? playerShare / playerHotels.length : 0,
    }
  }

  const newDate = addDays(state.date, 1)

  const researchUpdate = advanceResearchDay(state)

  const adBilling = processDailyAdBilling(state.hotelAds ?? [], state.brandAd ?? null)
  totalExpense += adBilling.expense

  const decayedEvents = state.activeEvents
    .map((e) => ({ ...e, remainingDays: e.remainingDays - 1 }))
    .filter((e) => e.remainingDays > 0)

  const eventResult = checkAndTriggerEvents({
    ...state,
    date: newDate,
    activeEvents: decayedEvents,
  })

  const activeEvents = eventResult.activeEvents
  const triggeredEventIds = eventResult.triggeredEventIds
  const newsFeed = [...eventResult.newsItems, ...state.newsFeed].slice(0, 100)

  const updatedWorldMetrics = computeWorldMetrics(
    state.worldMetrics,
    state.worldSeed,
    newDate.year,
    activeEvents,
  )

  const gridVersion = state.gridVersion + (newDate.year !== state.date.year || eventResult.newsItems.length > 0 ? 1 : 0)

  const interimState: GameState = {
    ...state,
    date: newDate,
    hotels: updatedHotels,
    competitors: updatedCompetitors,
    cash: state.cash + totalRevenue - totalExpense,
    activeEvents,
    triggeredEventIds,
    worldMetrics: updatedWorldMetrics,
    newsFeed,
    gridVersion,
  }

  const aiResult = runAIDecisions(interimState, newDate.day % 7 === 0)

  const salesResult = processHotelSales({
    ...interimState,
    hotels: aiResult.hotels ?? updatedHotels,
    competitors: aiResult.competitors ?? updatedCompetitors,
  })

  const finalHotels = salesResult.hotels
  const cashFromSales = salesResult.cashDelta

  const interestExpense = getDailyInterestExpense(interimState)
  const cashAfterFinance =
    state.cash + totalRevenue - totalExpense - interestExpense + cashFromSales
  const dailyCashDelta = totalRevenue - totalExpense - interestExpense
  const creditRating = calculateCreditRating({
    ...interimState,
    cash: cashAfterFinance,
  })

  const financeHistory = [...state.financeHistory]
  financeHistory.push({
    date: formatGameDate(state.date),
    cash: cashAfterFinance,
    dailyRevenue: totalRevenue,
    dailyExpense: totalExpense + interestExpense,
    debt: state.debt,
    interestExpense,
  })
  if (financeHistory.length > 120) financeHistory.shift()

  return {
    date: newDate,
    hotels: finalHotels,
    competitors: aiResult.competitors ?? updatedCompetitors,
    cash: cashAfterFinance,
    dailyCashDelta,
    cityMarkets,
    unlockedCities: state.unlockedCities,
    unlockedTechs: researchUpdate.unlockedTechs,
    researchingTech: researchUpdate.researchingTech,
    activeEvents,
    triggeredEventIds,
    financeHistory,
    reputation: clampReputation(state.reputation, totalRevenue, totalExpense, policy.reputationDelta),
    worldMetrics: updatedWorldMetrics,
    newsFeed,
    gridVersion,
    creditRating,
    pendingMajorEvent: eventResult.pendingMajorEvent,
    hotelAds: adBilling.hotelAds,
    brandAd: adBilling.brandAd,
    cityWeathers,
  }
}

function appendHotelHistory(hotel: Hotel, date: string, expense: number): void {
  const entry = {
    date,
    occupancy: hotel.occupancy,
    revenue: hotel.dailyRevenue,
    expense,
    profit: hotel.dailyRevenue - expense,
  }
  hotel.history = [...(hotel.history ?? []), entry].slice(-90)
}

function clampReputation(current: number, revenue: number, expense: number, strategyDelta: number): number {
  if (revenue > expense * 1.2) return Math.min(100, current + 0.02 + strategyDelta)
  if (revenue < expense * 0.8) return Math.max(20, current - 0.01 + strategyDelta)
  return current
}

export function createHotelFromConfig(
  params: {
    name: string
    cityId: string
    ownerId: string
    coordinates: [number, number]
    gridCellId: string
    stars: HotelStar
    price: number
    quality: number
    builtAt: GameState['date']
    personality?: CompetitorPersonality
    roomInventory?: HotelRoomInventory
    facilities?: HotelFacilityList
    spaceTotal?: number
  },
): Hotel {
  const { roomInventory, facilities } =
    params.roomInventory && params.facilities
      ? { roomInventory: params.roomInventory, facilities: params.facilities }
      : defaultOpeningConfig(params.stars, params.personality)

  const totalRooms = calcTotalRooms(roomInventory)
  const spaceUsed = calcSpaceUsed(roomInventory, facilities)

  return {
    id: uid('hotel'),
    name: params.name,
    cityId: params.cityId,
    ownerId: params.ownerId,
    coordinates: params.coordinates,
    gridCellId: params.gridCellId,
    stars: params.stars,
    spaceTotal: params.spaceTotal ?? Math.max(STAR_CONFIG[params.stars].spaceTotal, Math.ceil(spaceUsed)),
    roomInventory,
    facilities,
    staff: defaultStaffForRooms(totalRooms),
    history: [],
    price: params.price,
    quality: params.quality,
    occupancy: 0,
    dailyRevenue: 0,
    builtAt: { ...params.builtAt },
    renovationCooldownDays: 0,
    expansionDaysRemaining: 0,
    pendingExpansionSpace: 0,
  }
}

export function createInitialHotels(): Hotel[] {
  const initialCompetitors = competitors.slice(0, 2)
  const hotels: Hotel[] = []

  for (let i = 0; i < initialCompetitors.length; i++) {
    const comp = initialCompetitors[i]
    const stars = comp.personality === 'premium' ? 5 : 4
    const config = STAR_CONFIG[stars as HotelStar]
    const cell = pickAvailableHexCell('hong-kong', hotels, 100 + i)
    if (!cell) continue

    hotels.push(
      createHotelFromConfig({
        name: `${comp.name.zh}酒店`,
        cityId: 'hong-kong',
        ownerId: comp.id,
        coordinates: [cell.lng, cell.lat],
        gridCellId: cell.cellId,
        stars: stars as HotelStar,
        price: config.basePrice * (comp.personality === 'premium' ? 1.3 : 1),
        quality: config.baseQuality,
        builtAt: parseGameDate('1990-01-01'),
        personality: comp.personality,
      }),
    )
  }

  return hotels
}
