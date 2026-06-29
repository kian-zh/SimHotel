import type {
  CityConfig,
  HotelFacilityList,
  HotelRoomInventory,
  HotelStar,
  RoomTypeId,
  StrategyPolicyId,
} from '../types'
import { FACILITIES, STAR_CONFIG, STRATEGY_POLICIES } from '../types'

const FACILITY_BUILD_RATE = 62_000
const ROOM_FITOUT_COST: Record<RoomTypeId, number> = {
  king: 95_000,
  twin: 105_000,
  dorm6: 38_000,
  suite: 185_000,
  deluxe_suite: 260_000,
  executive_suite: 320_000,
  luxury_resort_suite: 420_000,
}

export interface BuildCostBreakdown {
  landFee: number
  facilityCost: number
  roomCost: number
  total: number
}

function cityAndPolicyMultiplier(city: CityConfig, policyId: StrategyPolicyId): number {
  const policy = STRATEGY_POLICIES[policyId]
  return (1 + city.market.regulatoryCost / 200) * policy.buildCostMultiplier
}

export function estimateLandFee(stars: HotelStar, city: CityConfig, policyId: StrategyPolicyId): number {
  const mult = cityAndPolicyMultiplier(city, policyId)
  return Math.round(STAR_CONFIG[stars].buildCost * 0.36 * mult)
}

export function estimateFacilityBuildCost(
  facilities: HotelFacilityList,
  city: CityConfig,
  policyId: StrategyPolicyId,
): number {
  const mult = cityAndPolicyMultiplier(city, policyId)
  let raw = 0
  for (const id of facilities) {
    if (id === 'lobby') continue
    raw += (FACILITIES[id]?.spaceCost ?? 0) * FACILITY_BUILD_RATE
  }
  return Math.round(raw * mult)
}

export function estimateRoomFitoutCost(
  inventory: HotelRoomInventory,
  city: CityConfig,
  policyId: StrategyPolicyId,
): number {
  const mult = cityAndPolicyMultiplier(city, policyId)
  let raw = 0
  for (const [id, count] of Object.entries(inventory) as [RoomTypeId, number][]) {
    if (count <= 0) continue
    raw += count * ROOM_FITOUT_COST[id]
  }
  return Math.round(raw * mult)
}

export function estimateBuildCostBreakdown(params: {
  stars: HotelStar
  city: CityConfig
  roomInventory: HotelRoomInventory
  facilities: HotelFacilityList
  strategyPolicy: StrategyPolicyId
}): BuildCostBreakdown {
  const landFee = estimateLandFee(params.stars, params.city, params.strategyPolicy)
  const facilityCost = estimateFacilityBuildCost(params.facilities, params.city, params.strategyPolicy)
  const roomCost = estimateRoomFitoutCost(params.roomInventory, params.city, params.strategyPolicy)
  const rawTotal = landFee + facilityCost + roomCost
  const minTotal = Math.round(
    STAR_CONFIG[params.stars].buildCost *
      cityAndPolicyMultiplier(params.city, params.strategyPolicy),
  )
  const total = Math.max(rawTotal, minTotal)
  return { landFee, facilityCost, roomCost, total }
}
