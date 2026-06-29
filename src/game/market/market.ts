import { cityMap } from '../../data/cities'
import type { ActiveEvent, AdCampaign, BrandAdCampaign, CityConfig, CityMetrics, GameDate, GridPoint, Hotel, MarketModifiers } from '../types'
import { getBrandDemandMultiplier, getHotelAdAttractivenessMultiplier } from '../marketing/ads'
import { clamp, getSeasonMultiplier } from '../engine/date'
import { calcStaffDailyCost } from '../hotel/defaults'
import {
  calcTotalRooms,
  getEffectivePrice,
  getFacilityCostReduction,
  getFacilityDemandMultiplier,
  getFacilityRevenueMultiplier,
  getRoomMixAttractivenessBonus,
} from '../hotel/space'
import { getStarLocationMultiplier, sampleLocationFactors } from './location'

export function getEventModifiersForCity(
  cityId: string,
  activeEvents: ActiveEvent[],
): MarketModifiers {
  const modifiers: MarketModifiers = { tourism: 0, businessTravel: 0, demand: 0, population: 0, economy: 0 }
  for (const event of activeEvents) {
    if (!event.affectedMarkets.includes(cityId) && !event.affectedMarkets.includes('global')) {
      continue
    }
    modifiers.tourism = (modifiers.tourism ?? 0) + (event.modifiers.tourism ?? 0)
    modifiers.businessTravel = (modifiers.businessTravel ?? 0) + (event.modifiers.businessTravel ?? 0)
    modifiers.demand = (modifiers.demand ?? 0) + (event.modifiers.demand ?? 0)
    modifiers.population = (modifiers.population ?? 0) + (event.modifiers.population ?? 0)
    modifiers.economy = (modifiers.economy ?? 0) + (event.modifiers.economy ?? 0)
  }
  return modifiers
}

export function calculateDailyDemand(
  city: CityConfig,
  date: GameDate,
  hotels: Hotel[],
  activeEvents: ActiveEvent[],
  worldMetrics?: CityMetrics,
  gridPoints?: GridPoint[],
  adContext?: {
    brandAd: BrandAdCampaign | null
    hotelAds: AdCampaign[]
  },
): number {
  const { market } = city
  const eventMods = getEventModifiersForCity(city.id, activeEvents)
  const wm = worldMetrics ?? { population: 50, economy: 50, tourism: 50 }

  const tourismFactor = ((market.tourism + wm.tourism) / 200) * (1 + (eventMods.tourism ?? 0))
  const businessFactor = ((market.businessTravel + wm.economy) / 200) * (1 + (eventMods.businessTravel ?? 0))
  const season = getSeasonMultiplier(date.month, market.seasonality.peak, market.seasonality.multiplier)
  const popScale = 1 + (wm.population - 50) / 200
  let demandBase = market.basePopulation * 0.0008 * popScale * (tourismFactor * 0.55 + businessFactor * 0.45) * season

  if (gridPoints && gridPoints.length > 0) {
    const cityHotels = hotels.filter((h) => h.cityId === city.id)
    if (cityHotels.length > 0) {
      const avgLoc =
        cityHotels.reduce((sum, h) => {
          const f = sampleLocationFactors(gridPoints, h.coordinates[0], h.coordinates[1], h.cityId)
          return sum + f.base
        }, 0) / cityHotels.length
      demandBase *= avgLoc
    }
  }

  const cityHotels = hotels.filter((h) => h.cityId === city.id)
  const avgPrice =
    cityHotels.length > 0
      ? cityHotels.reduce((sum, h) => sum + getEffectivePrice(h), 0) / cityHotels.length
      : market.willingnessToPay

  const priceRatio = avgPrice / market.willingnessToPay
  const priceEffect = clamp(1 - market.priceElasticity * (priceRatio - 0.8), 0.35, 1.4)
  const eventDemand = 1 + (eventMods.demand ?? 0)

  const playerHotelsInCity = cityHotels.filter((h) => h.ownerId === 'player')
  if (adContext && playerHotelsInCity.length > 0) {
    demandBase *= getBrandDemandMultiplier(adContext.brandAd, adContext.hotelAds, activeEvents)
  }

  if (cityHotels.length > 0) {
    const avgFacilityBoost =
      cityHotels.reduce((sum, h) => sum + getFacilityDemandMultiplier(h.facilities), 0) / cityHotels.length
    demandBase *= avgFacilityBoost
  }

  return Math.round(demandBase * priceEffect * eventDemand)
}

export function calculateAttractiveness(
  hotel: Hotel,
  ownerReputation: number,
  gridPoints?: GridPoint[],
  adContext?: {
    brandAd: BrandAdCampaign | null
    hotelAds: AdCampaign[]
    activeEvents?: ActiveEvent[]
  },
): number {
  const starWeight = hotel.stars * 18
  const qualityWeight = hotel.quality * 0.6
  const effectivePrice = getEffectivePrice(hotel)
  const priceWeight = clamp(120 / effectivePrice, 0.4, 1.2) * 30
  const reputationWeight = ownerReputation * 0.25
  let score =
    (starWeight + qualityWeight + priceWeight + reputationWeight) *
    getFacilityDemandMultiplier(hotel.facilities) *
    getRoomMixAttractivenessBonus(hotel)

  if (gridPoints && gridPoints.length > 0) {
    const factors = sampleLocationFactors(gridPoints, hotel.coordinates[0], hotel.coordinates[1], hotel.cityId)
    score *= getStarLocationMultiplier(hotel.stars, factors)
  }

  if (adContext && hotel.ownerId === 'player') {
    score *= getHotelAdAttractivenessMultiplier(
      hotel,
      adContext.hotelAds,
      adContext.brandAd,
      adContext.activeEvents ?? [],
    )
  }

  return score
}

export function allocateMarketShare(
  cityId: string,
  dailyDemand: number,
  hotels: Hotel[],
  reputations: Record<string, number>,
  gridPoints?: GridPoint[],
  adContext?: {
    brandAd: BrandAdCampaign | null
    hotelAds: AdCampaign[]
    activeEvents?: ActiveEvent[]
  },
): Map<string, { occupancy: number; revenue: number }> {
  const cityHotels = hotels.filter((h) => h.cityId === cityId)
  if (cityHotels.length === 0) return new Map()

  const attractiveness = cityHotels.map((h) => ({
    hotel: h,
    score: calculateAttractiveness(h, reputations[h.ownerId] ?? 50, gridPoints, adContext),
  }))
  const totalScore = attractiveness.reduce((sum, item) => sum + item.score, 0)
  const results = new Map<string, { occupancy: number; revenue: number }>()

  for (const item of attractiveness) {
    const share = item.score / totalScore
    const roomCapacity = calcTotalRooms(item.hotel.roomInventory)
    const occupiedRooms = Math.min(roomCapacity, Math.round(dailyDemand * share))
    const occupancy = roomCapacity > 0 ? occupiedRooms / roomCapacity : 0
    const effectivePrice = getEffectivePrice(item.hotel)
    const revenue = Math.round(
      occupiedRooms * effectivePrice * getFacilityRevenueMultiplier(item.hotel.facilities),
    )
    results.set(item.hotel.id, { occupancy, revenue })
  }

  return results
}

export function getOperatingCost(hotel: Hotel, city: CityConfig): number {
  const totalRooms = calcTotalRooms(hotel.roomInventory)
  const base = totalRooms * (hotel.stars * 8 + 40)
  const regulatory = (city.market.regulatoryCost / 100) * base * 0.3
  const qualityStaff = hotel.quality * totalRooms * 0.15
  const facilityOverhead = hotel.facilities.length * 180
  const staffCost = calcStaffDailyCost(hotel.staff)
  const costReduction = getFacilityCostReduction(hotel.facilities)
  const gross = base + regulatory + qualityStaff + facilityOverhead + staffCost
  return Math.round(gross * (1 - costReduction))
}

export function getUpgradeCost(hotel: Hotel): number {
  const totalRooms = calcTotalRooms(hotel.roomInventory)
  return Math.round(totalRooms * hotel.stars * 120 * (1 - hotel.quality / 200))
}

export function getCityById(cityId: string): CityConfig {
  const city = cityMap[cityId]
  if (!city) throw new Error(`Unknown city: ${cityId}`)
  return city
}

export { computeLocationFactors, sampleLocationFactors, estimateDemandBonus } from './location'
