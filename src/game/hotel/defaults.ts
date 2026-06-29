import type {
  CompetitorPersonality,
  Hotel,
  HotelFacilityList,
  HotelRoomInventory,
  HotelStaff,
  HotelStar,
} from '../types'
import { INITIAL_SPACE_TOTAL, STAR_CONFIG } from '../types'
import { calcSpaceUsed, calcTotalRooms, getFacilityDemandMultiplier } from './space'

export function emptyRoomInventory(): HotelRoomInventory {
  return {
    king: 0,
    twin: 0,
    dorm6: 0,
    suite: 0,
    deluxe_suite: 0,
    executive_suite: 0,
    luxury_resort_suite: 0,
  }
}

export function defaultStaffForRooms(totalRooms: number): HotelStaff {
  return {
    frontDesk: Math.max(2, Math.ceil(totalRooms / 40)),
    housekeeping: Math.max(2, Math.ceil(totalRooms / 15)),
    foodService: Math.max(1, Math.ceil(totalRooms / 50)),
    engineering: Math.max(1, Math.ceil(totalRooms / 60)),
  }
}

export function defaultOpeningConfig(
  stars: HotelStar,
  personality?: CompetitorPersonality,
): { roomInventory: HotelRoomInventory; facilities: HotelFacilityList } {
  const roomInventory = emptyRoomInventory()
  const facilities: HotelFacilityList = ['lobby']
  const config = STAR_CONFIG[stars]

  if (personality === 'price_warrior') {
    // Budget-focused: lots of dorm+king, fewer premium
    roomInventory.dorm6 = Math.floor(config.rooms * 0.25)
    roomInventory.king = Math.floor(config.rooms * 0.35)
    roomInventory.twin = Math.floor(config.rooms * 0.1)
    facilities.push('laundry', 'restaurant')
    return { roomInventory, facilities }
  }

  switch (stars) {
    case 3:
      roomInventory.king = Math.floor(config.rooms * 0.55)
      roomInventory.twin = Math.floor(config.rooms * 0.2)
      roomInventory.dorm6 = Math.floor(config.rooms * 0.08)
      facilities.push('laundry', 'restaurant')
      break
    case 4:
      roomInventory.king = Math.floor(config.rooms * 0.35)
      roomInventory.twin = Math.floor(config.rooms * 0.25)
      roomInventory.suite = Math.floor(config.rooms * 0.15)
      roomInventory.dorm6 = Math.floor(config.rooms * 0.05)
      facilities.push('restaurant', 'laundry', 'gym')
      break
    case 5:
      roomInventory.king = Math.floor(config.rooms * 0.2)
      roomInventory.suite = Math.floor(config.rooms * 0.25)
      roomInventory.deluxe_suite = Math.floor(config.rooms * 0.15)
      roomInventory.twin = Math.floor(config.rooms * 0.1)
      roomInventory.executive_suite = Math.floor(config.rooms * 0.05)
      facilities.push('restaurant', 'pool', 'gym')
      break
  }

  if (personality === 'premium' && stars === 5) {
    roomInventory.luxury_resort_suite = Math.floor(config.rooms * 0.05)
    roomInventory.king = Math.max(0, roomInventory.king - 3)
    if (!facilities.includes('spa')) facilities.push('spa')
  }

  return { roomInventory, facilities }
}

export function distributeLegacyRooms(totalRooms: number, stars: HotelStar): HotelRoomInventory {
  const roomInventory = emptyRoomInventory()
  if (stars === 3) {
    roomInventory.king = Math.floor(totalRooms * 0.6)
    roomInventory.dorm6 = totalRooms - roomInventory.king
  } else if (stars === 4) {
    roomInventory.king = Math.floor(totalRooms * 0.5)
    roomInventory.twin = Math.floor(totalRooms * 0.3)
    roomInventory.suite = totalRooms - roomInventory.king - roomInventory.twin
  } else {
    roomInventory.king = Math.floor(totalRooms * 0.3)
    roomInventory.suite = Math.floor(totalRooms * 0.4)
    roomInventory.deluxe_suite = totalRooms - roomInventory.king - roomInventory.suite
  }
  return roomInventory
}

export function defaultFacilitiesForStars(stars: HotelStar): HotelFacilityList {
  const facilities: HotelFacilityList = ['lobby', 'restaurant', 'laundry']
  if (stars >= 4) facilities.push('gym')
  if (stars >= 5) facilities.push('pool')
  return facilities
}

type LegacyHotel = Hotel & { rooms?: number }

export function migrateHotelToSpaceModel(hotel: LegacyHotel): Hotel {
  if (hotel.spaceTotal != null && hotel.roomInventory != null) {
    return {
      ...hotel,
      staff: hotel.staff ?? defaultStaffForRooms(calcTotalRooms(hotel.roomInventory)),
      history: hotel.history ?? [],
      facilities: hotel.facilities ?? ['lobby'],
    }
  }

  const legacyRooms = hotel.rooms ?? STAR_CONFIG[hotel.stars].rooms
  const roomInventory = distributeLegacyRooms(legacyRooms, hotel.stars)
  const facilities = defaultFacilitiesForStars(hotel.stars)
  const totalRooms = calcTotalRooms(roomInventory)
  const spaceUsed = calcSpaceUsed(roomInventory, facilities)

  const { rooms: _rooms, ...rest } = hotel
  return {
    ...rest,
    spaceTotal: Math.max(STAR_CONFIG[hotel.stars].spaceTotal, Math.ceil(spaceUsed)),
    roomInventory,
    facilities,
    staff: defaultStaffForRooms(totalRooms),
    history: hotel.history ?? [],
    renovationCooldownDays: hotel.renovationCooldownDays ?? 0,
    expansionDaysRemaining: hotel.expansionDaysRemaining ?? 0,
    pendingExpansionSpace: hotel.pendingExpansionSpace ?? 0,
  }
}

export function calcStaffDailyCost(staff: HotelStaff): number {
  return (
    staff.frontDesk * 90 +
    staff.housekeeping * 60 +
    staff.foodService * 75 +
    staff.engineering * 85
  )
}

export function getFacilityDemandMultiplierFromList(facilities: HotelFacilityList): number {
  return getFacilityDemandMultiplier(facilities)
}
