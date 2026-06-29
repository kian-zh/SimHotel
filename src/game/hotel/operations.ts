import type { FacilityId, Hotel, HotelStaff, TechId } from '../types'
import { FACILITIES, ROOM_TYPES } from '../types'
import { calcTotalRooms, validateBuildConfig } from './space'

export function calcExpansionCost(hotel: Hotel, additionalSpace: number): number {
  return Math.round(additionalSpace * 85_000 * (1 + hotel.spaceTotal / 40))
}

export function calcExpansionDays(additionalSpace: number): number {
  return Math.max(14, Math.round(additionalSpace * 6))
}

export function getStaffLimits(hotel: Hotel): Record<keyof HotelStaff, { min: number; max: number }> {
  const rooms = calcTotalRooms(hotel.roomInventory)
  const hasFoodService = hotel.facilities.some((f) => f === 'restaurant' || f === 'fine_dining')
  return {
    frontDesk: { min: 1, max: Math.max(3, Math.ceil(rooms / 8) + 4) },
    housekeeping: { min: 1, max: Math.max(3, Math.ceil(rooms / 6) + 6) },
    foodService: { min: hasFoodService ? 1 : 0, max: Math.max(2, Math.ceil(rooms / 25) + 4) },
    engineering: { min: 1, max: Math.max(2, Math.ceil(rooms / 50) + 4) },
  }
}

export function clampStaff(staff: HotelStaff, hotel: Hotel): HotelStaff {
  const limits = getStaffLimits(hotel)
  return {
    frontDesk: clamp(staff.frontDesk, limits.frontDesk.min, limits.frontDesk.max),
    housekeeping: clamp(staff.housekeeping, limits.housekeeping.min, limits.housekeeping.max),
    foodService: clamp(staff.foodService, limits.foodService.min, limits.foodService.max),
    engineering: clamp(staff.engineering, limits.engineering.min, limits.engineering.max),
  }
}

export function canRemoveFacility(
  hotel: Hotel,
  facilityId: FacilityId,
  unlockedTechs: TechId[],
): boolean {
  if (facilityId === 'lobby') return false
  const nextFacilities = hotel.facilities.filter((f) => f !== facilityId)
  const check = validateBuildConfig(hotel.roomInventory, nextFacilities, hotel.spaceTotal, unlockedTechs)
  return check.ok
}

export function getFacilityBonusSummary(facilities: Hotel['facilities']): {
  demandPct: number
  revenuePct: number
  costReductionPct: number
} {
  let demand = 0
  let revenue = 0
  let costReduction = 0
  for (const id of facilities) {
    const config = FACILITIES[id]
    if (!config) continue
    demand += config.demandBonus
    revenue += config.revenueBonus
    costReduction += config.costReduction
  }
  return {
    demandPct: Math.round(demand * 100),
    revenuePct: Math.round(revenue * 100),
    costReductionPct: Math.round(Math.min(0.25, costReduction) * 100),
  }
}

export function processHotelDailyMaintenance(hotel: Hotel): void {
  if ((hotel.renovationCooldownDays ?? 0) > 0) {
    hotel.renovationCooldownDays = (hotel.renovationCooldownDays ?? 0) - 1
  }

  if ((hotel.expansionDaysRemaining ?? 0) > 0) {
    hotel.expansionDaysRemaining = (hotel.expansionDaysRemaining ?? 0) - 1
    if (hotel.expansionDaysRemaining === 0 && (hotel.pendingExpansionSpace ?? 0) > 0) {
      hotel.spaceTotal += hotel.pendingExpansionSpace ?? 0
      hotel.pendingExpansionSpace = 0
    }
  }
}

export function roomTypeSpaceCost(roomType: keyof typeof ROOM_TYPES): number {
  return ROOM_TYPES[roomType]?.spaceCost ?? 0
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, Math.round(value)))
}
