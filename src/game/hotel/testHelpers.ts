import type { Hotel, HotelStar } from '../types'
import { defaultOpeningConfig, defaultStaffForRooms } from './defaults'
import { INITIAL_SPACE_TOTAL } from '../types'

export function createTestHotel(overrides: Partial<Hotel> = {}): Hotel {
  const stars = (overrides.stars ?? 4) as HotelStar
  const opening = defaultOpeningConfig(stars)
  const roomInventory = overrides.roomInventory ?? opening.roomInventory
  const facilities = overrides.facilities ?? opening.facilities
  const totalRooms = Object.values(roomInventory).reduce((sum, count) => sum + count, 0)

  return {
    id: 'hotel-test',
    name: 'Test Hotel',
    cityId: 'hong-kong',
    ownerId: 'player',
    coordinates: [114.1694, 22.3193],
    gridCellId: '0,0',
    stars,
    spaceTotal: overrides.spaceTotal ?? INITIAL_SPACE_TOTAL,
    roomInventory,
    facilities,
    staff: overrides.staff ?? defaultStaffForRooms(totalRooms),
    history: [],
    price: overrides.price ?? 220,
    quality: overrides.quality ?? 72,
    occupancy: overrides.occupancy ?? 0.75,
    dailyRevenue: overrides.dailyRevenue ?? 15_000,
    builtAt: { year: 1990, month: 1, day: 1 },
    ...overrides,
  }
}
