import { cityMap } from '../../data/cities'
import { calcTotalRooms } from '../hotel/space'
import { estimateHotelValue } from '../hotel/valuation'
import type { CreditRating, GameState } from '../types'

export function getReputationMap(state: GameState): Record<string, number> {
  const map: Record<string, number> = { player: state.reputation }
  for (const comp of state.competitors) {
    map[comp.id] = comp.reputation
  }
  return map
}

export function getPlayerDailyPnL(state: GameState): { revenue: number; expense: number; profit: number } {
  let revenue = 0
  let expense = 0
  for (const hotel of state.hotels.filter((h) => h.ownerId === 'player')) {
    revenue += hotel.dailyRevenue
  }
  const last = state.financeHistory[state.financeHistory.length - 1]
  expense = last?.dailyExpense ?? 0
  return { revenue, expense, profit: revenue - expense }
}

export function getAssetValue(state: GameState) {
  return state.hotels
    .filter((h) => h.ownerId === 'player')
    .reduce((sum, hotel) => {
      const city = cityMap[hotel.cityId]
      if (!city) {
        const totalRooms = calcTotalRooms(hotel.roomInventory)
        return sum + totalRooms * hotel.stars * 55_000 * (hotel.quality / 75)
      }
      return sum + estimateHotelValue(hotel, city)
    }, 0)
}

export function getBorrowingLimit(state: GameState): number {
  const assetValue = getAssetValue(state)
  const reputationFactor = 0.35 + state.reputation / 220
  return Math.max(2_000_000, Math.round(assetValue * reputationFactor))
}

export function getLeverageRatio(state: GameState): number {
  const assetValue = getAssetValue(state)
  if (assetValue <= 0) return state.debt > 0 ? 1 : 0
  return state.debt / assetValue
}

export function calculateCreditRating(state: GameState): CreditRating {
  const leverage = getLeverageRatio(state)
  const cashBuffer = state.cash / Math.max(1, state.debt)
  if (state.debt <= 0 || (leverage < 0.18 && state.reputation >= 72)) return 'AAA'
  if (leverage < 0.35 && state.reputation >= 58) return 'A'
  if (leverage < 0.55 && cashBuffer > 0.12) return 'BBB'
  if (leverage < 0.78 && cashBuffer > 0.04) return 'B'
  return 'Distressed'
}

export function getAnnualInterestRate(state: GameState): number {
  const rating = state.creditRating || calculateCreditRating(state)
  const spread: Record<CreditRating, number> = {
    AAA: 0,
    A: 0.012,
    BBB: 0.028,
    B: 0.055,
    Distressed: 0.11,
  }
  return (state.baseInterestRate || 0.055) + spread[rating]
}

export function getDailyInterestExpense(state: GameState): number {
  if (state.debt <= 0) return 0
  return Math.round((state.debt * getAnnualInterestRate(state)) / 365)
}

export function getTotalPlayerRooms(state: GameState): number {
  return state.hotels
    .filter((h) => h.ownerId === 'player')
    .reduce((s, h) => s + calcTotalRooms(h.roomInventory), 0)
}

export function getAverageOccupancy(state: GameState): number {
  const playerHotels = state.hotels.filter((h) => h.ownerId === 'player')
  if (playerHotels.length === 0) return 0
  return playerHotels.reduce((s, h) => s + h.occupancy, 0) / playerHotels.length
}

export function getRevPAR(state: GameState): number {
  const playerHotels = state.hotels.filter((h) => h.ownerId === 'player')
  if (playerHotels.length === 0) return 0
  const total = playerHotels.reduce((s, h) => s + h.price * h.occupancy, 0)
  return total / playerHotels.length
}
