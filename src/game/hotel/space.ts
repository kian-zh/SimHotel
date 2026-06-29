import type { Hotel, HotelFacilityList, HotelRoomInventory, RoomTypeId, TechId } from '../types'
import { FACILITIES, MIN_OPENING_REQUIREMENTS, ROOM_TYPES, STAR_CONFIG } from '../types'

export function isTechUnlocked(techId: TechId | undefined, unlockedTechs: TechId[]): boolean {
  if (!techId) return true
  return unlockedTechs.includes(techId)
}

export function canSelectFacility(facilityId: keyof typeof FACILITIES, unlockedTechs: TechId[]): boolean {
  const required = FACILITIES[facilityId]?.requiredTech
  return isTechUnlocked(required, unlockedTechs)
}

export function canSelectRoomType(
  roomType: RoomTypeId,
  facilities: HotelFacilityList,
  unlockedTechs: TechId[],
): boolean {
  const config = ROOM_TYPES[roomType]
  if (!config) return false
  if (!isTechUnlocked(config.requiredTech, unlockedTechs)) return false
  if (config.requiredFacility && !facilities.includes(config.requiredFacility)) return false
  return true
}

export function calcSpaceUsed(inventory: HotelRoomInventory, facilities: HotelFacilityList): number {
  let used = 0
  for (const [id, count] of Object.entries(inventory) as [RoomTypeId, number][]) {
    used += (ROOM_TYPES[id]?.spaceCost ?? 0) * count
  }
  for (const facilityId of facilities) {
    used += FACILITIES[facilityId]?.spaceCost ?? 0
  }
  return used
}

export function calcSpaceFree(hotel: Hotel): number {
  return Math.max(0, hotel.spaceTotal - calcSpaceUsed(hotel.roomInventory, hotel.facilities))
}

export function calcTotalRooms(inventory: HotelRoomInventory): number {
  return Object.values(inventory).reduce((sum, count) => sum + count, 0)
}

export function validateOpeningConfig(
  inventory: HotelRoomInventory,
  facilities: HotelFacilityList,
): { ok: boolean; errors: string[] } {
  const errors: string[] = []

  for (const required of MIN_OPENING_REQUIREMENTS.requiredFacilities) {
    if (!facilities.includes(required)) {
      errors.push(`missing_required_facility:${required}`)
    }
  }

  const totalRooms = calcTotalRooms(inventory)
  if (totalRooms < MIN_OPENING_REQUIREMENTS.minRooms) {
    errors.push(`insufficient_rooms:${totalRooms}`)
  }

  return { ok: errors.length === 0, errors }
}

export function validateRoomInventoryUpdate(
  inventory: HotelRoomInventory,
  facilities: HotelFacilityList,
  spaceTotal: number,
  unlockedTechs: TechId[],
): { ok: boolean; errors: string[] } {
  const errors = [...validateOpeningConfig(inventory, facilities).errors]

  const spaceUsed = calcSpaceUsed(inventory, facilities)
  if (spaceUsed > spaceTotal) {
    errors.push(`space_exceeded:${spaceUsed}:${spaceTotal}`)
  }

  for (const [roomType, count] of Object.entries(inventory) as [RoomTypeId, number][]) {
    if (count <= 0) continue
    const config = ROOM_TYPES[roomType]
    if (!isTechUnlocked(config?.requiredTech, unlockedTechs)) {
      errors.push(`tech_required_room:${roomType}`)
    }
    if (config?.requiredFacility && !facilities.includes(config.requiredFacility)) {
      errors.push(`facility_required_room:${roomType}:${config.requiredFacility}`)
    }
  }

  return { ok: errors.length === 0, errors }
}

export function validateBuildConfig(
  inventory: HotelRoomInventory,
  facilities: HotelFacilityList,
  spaceTotal: number,
  unlockedTechs: TechId[],
): { ok: boolean; errors: string[] } {
  const errors = [...validateOpeningConfig(inventory, facilities).errors]

  const spaceUsed = calcSpaceUsed(inventory, facilities)
  if (spaceUsed > spaceTotal) {
    errors.push(`space_exceeded:${spaceUsed}:${spaceTotal}`)
  }

  for (const facilityId of facilities) {
    if (!canSelectFacility(facilityId, unlockedTechs)) {
      errors.push(`tech_required_facility:${facilityId}`)
    }
  }

  for (const [roomType, count] of Object.entries(inventory) as [RoomTypeId, number][]) {
    if (count <= 0) continue
    const config = ROOM_TYPES[roomType]
    if (!isTechUnlocked(config?.requiredTech, unlockedTechs)) {
      errors.push(`tech_required_room:${roomType}`)
    }
    if (config?.requiredFacility && !facilities.includes(config.requiredFacility)) {
      errors.push(`facility_required_room:${roomType}:${config.requiredFacility}`)
    }
  }

  return { ok: errors.length === 0, errors }
}

export function canAddRoom(hotel: Hotel, roomType: RoomTypeId): boolean {
  const cost = ROOM_TYPES[roomType]?.spaceCost ?? 0
  return calcSpaceFree(hotel) >= cost
}

export function getEffectivePrice(hotel: Hotel): number {
  const inventory = hotel.roomInventory
  let totalRooms = 0
  let weighted = 0

  for (const [id, count] of Object.entries(inventory) as [RoomTypeId, number][]) {
    if (count <= 0) continue
    const config = ROOM_TYPES[id]
    totalRooms += count
    weighted += count * config.basePrice
  }

  if (totalRooms === 0) return hotel.price

  const catalogAvg = weighted / totalRooms
  const starBase = STAR_CONFIG[hotel.stars].basePrice
  return Math.round(catalogAvg * (hotel.price / starBase))
}

export function getFacilityDemandMultiplier(facilities: HotelFacilityList): number {
  let multiplier = 1
  for (const id of facilities) {
    multiplier += FACILITIES[id]?.demandBonus ?? 0
  }
  return multiplier
}

export function getFacilityRevenueMultiplier(facilities: HotelFacilityList): number {
  let multiplier = 1
  for (const id of facilities) {
    multiplier += FACILITIES[id]?.revenueBonus ?? 0
  }
  return multiplier
}

export function getFacilityCostReduction(facilities: HotelFacilityList): number {
  let reduction = 0
  for (const id of facilities) {
    reduction += FACILITIES[id]?.costReduction ?? 0
  }
  return Math.min(0.25, reduction)
}

export function getRoomMixAttractivenessBonus(hotel: Hotel): number {
  const total = calcTotalRooms(hotel.roomInventory)
  if (total === 0) return 1

  const inv = hotel.roomInventory
  const premium =
    (inv.suite + inv.deluxe_suite + inv.executive_suite + inv.luxury_resort_suite) / total
  const budget = (inv.dorm6 + inv.king) / total

  if (hotel.stars >= 4) return 1 + premium * 0.15
  if (hotel.stars === 3) return 1 + budget * 0.1
  return 1
}
