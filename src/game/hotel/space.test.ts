import { describe, expect, it } from 'vitest'
import { defaultOpeningConfig, emptyRoomInventory } from './defaults'
import {
  calcSpaceFree,
  calcSpaceUsed,
  calcTotalRooms,
  canAddRoom,
  getEffectivePrice,
  validateOpeningConfig,
} from './space'
import type { Hotel } from '../types'
import { STAR_CONFIG } from '../types'

function mockHotel(overrides: Partial<Hotel> = {}): Hotel {
  const opening = defaultOpeningConfig(3)
  return {
    id: 'hotel-test',
    name: 'Test',
    cityId: 'hong-kong',
    ownerId: 'player',
    coordinates: [114.17, 22.32],
    gridCellId: '0,0',
    stars: 3,
    spaceTotal: STAR_CONFIG[3].spaceTotal,
    roomInventory: opening.roomInventory,
    facilities: opening.facilities,
    staff: { frontDesk: 2, housekeeping: 2, foodService: 1, engineering: 1 },
    history: [],
    price: 120,
    quality: 55,
    occupancy: 0,
    dailyRevenue: 0,
    builtAt: { year: 1990, month: 1, day: 1 },
    ...overrides,
  }
}

describe('hotel space model', () => {
  it('calculates space used from rooms and facilities', () => {
    const inventory = emptyRoomInventory()
    inventory.king = 3
    inventory.dorm6 = 2
    const facilities = ['lobby', 'laundry'] as const

    expect(calcSpaceUsed(inventory, [...facilities])).toBe(3 + 3 + 2 * 1.5 + 2)
  })

  it('calculates free space and total rooms', () => {
    const hotel = mockHotel()
    expect(calcTotalRooms(hotel.roomInventory)).toBeGreaterThanOrEqual(3)
    expect(calcSpaceFree(hotel)).toBeGreaterThanOrEqual(0)
    expect(calcSpaceFree(hotel)).toBe(hotel.spaceTotal - calcSpaceUsed(hotel.roomInventory, hotel.facilities))
  })

  it('validates opening config requirements', () => {
    const inventory = emptyRoomInventory()
    inventory.king = 2
    expect(validateOpeningConfig(inventory, ['lobby']).ok).toBe(false)

    inventory.king = 3
    expect(validateOpeningConfig(inventory, ['lobby']).ok).toBe(true)

    expect(validateOpeningConfig(inventory, []).ok).toBe(false)
  })

  it('checks whether a room type fits remaining space', () => {
    const hotel = mockHotel({ spaceTotal: 7, roomInventory: emptyRoomInventory(), facilities: ['lobby'] })
    expect(canAddRoom(hotel, 'king')).toBe(true)
    expect(canAddRoom(hotel, 'luxury_resort_suite')).toBe(false)
  })

  it('computes weighted effective price from inventory', () => {
    const inventory = emptyRoomInventory()
    inventory.king = 2
    inventory.dorm6 = 2
    const hotel = mockHotel({ roomInventory: inventory, price: 120 })
    expect(getEffectivePrice(hotel)).toBeGreaterThan(0)
  })
})
