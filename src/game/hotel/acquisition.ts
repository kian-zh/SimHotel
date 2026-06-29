import type { Competitor, GameState, Hotel } from '../types'
import { getCityById } from '../market/market'
import { rebuildGrid } from '../market/gridIndex'
import {
  estimateHotelValue,
  getAcquisitionQuote,
  getDistressMultiplier,
  type AcquisitionQuote,
} from './valuation'

export type AcquisitionOutcome = 'accepted' | 'rejected' | 'counter'

export interface AcquisitionResponse {
  outcome: AcquisitionOutcome
  counterOffer?: number
  acceptThreshold: number
}

export interface AcquireHotelResult {
  ok: boolean
  status: 'accepted' | 'rejected' | 'counter' | 'error'
  error?: 'not_found' | 'already_owned' | 'insufficient_funds' | 'invalid_offer'
  counterOffer?: number
}

export function getAcceptThreshold(quote: AcquisitionQuote, distressed: boolean): number {
  const base = distressed ? 0.88 : 1.0
  return base * quote.distressMultiplier
}

export function evaluateAcquisitionOffer(
  offerPrice: number,
  quote: AcquisitionQuote,
  distressed: boolean,
): AcquisitionResponse {
  const threshold = getAcceptThreshold(quote, distressed)
  const minAccept = Math.round(quote.valuation * threshold)

  if (offerPrice >= minAccept) {
    return { outcome: 'accepted', acceptThreshold: threshold }
  }

  if (offerPrice >= quote.minOffer) {
    const counterOffer = Math.round(Math.max(offerPrice + 1, (offerPrice + quote.valuation) / 2))
    return { outcome: 'counter', counterOffer, acceptThreshold: threshold }
  }

  return { outcome: 'rejected', acceptThreshold: threshold }
}

export function buildAcquisitionQuote(
  hotel: Hotel,
  state: GameState,
  gridPoints?: ReturnType<typeof rebuildGrid>,
): AcquisitionQuote {
  const city = getCityById(hotel.cityId)
  const points = gridPoints ?? rebuildGrid(state.worldMetrics, state.worldSeed, state.date.year, state.activeEvents)
  const ownerCash = state.competitors.find((c) => c.id === hotel.ownerId)?.cash
  return getAcquisitionQuote(hotel, city, points, ownerCash)
}

export function processHotelSales(state: GameState): {
  hotels: Hotel[]
  cashDelta: number
  soldHotelIds: string[]
} {
  const hotels = state.hotels.map((h) => ({ ...h }))
  let cashDelta = 0
  const soldHotelIds: string[] = []

  const gridPoints = rebuildGrid(state.worldMetrics, state.worldSeed, state.date.year, state.activeEvents)

  for (let i = hotels.length - 1; i >= 0; i--) {
    const hotel = hotels[i]
    if (hotel.ownerId !== 'player' || !hotel.saleListing) continue

    const listPrice = hotel.saleListing.listPrice
    const city = getCityById(hotel.cityId)
    const valuation = estimateHotelValue(hotel, city, gridPoints)

    const buyerChance = 0.04 + (listPrice <= valuation ? 0.03 : 0)
    if (Math.random() > buyerChance) continue

    const offerRatio = 0.88 + Math.random() * 0.12
    const offerPrice = Math.round(listPrice * offerRatio)

    if (offerPrice >= listPrice * 0.85) {
      cashDelta += offerPrice
      soldHotelIds.push(hotel.id)
      hotels.splice(i, 1)
    }
  }

  return { hotels, cashDelta, soldHotelIds }
}

export function processAIDistressListings(
  hotels: Hotel[],
  competitors: Competitor[],
): void {
  for (const comp of competitors) {
    const compHotels = hotels.filter((h) => h.ownerId === comp.id && !h.saleListing)
    for (const hotel of compHotels) {
      const distressed =
        comp.cash < 0 || hotel.occupancy < 0.35 || (hotel.dailyRevenue < 500 && hotel.occupancy < 0.5)

      const listChance =
        comp.cash < 0 ? 0.25 : hotel.occupancy < 0.35 ? 0.12 : hotel.occupancy < 0.5 ? 0.05 : 0

      if (!distressed || Math.random() > listChance) continue

      const city = getCityById(hotel.cityId)
      const valuation = estimateHotelValue(hotel, city)
      const distressMultiplier = getDistressMultiplier(hotel, comp.cash)
      const listPrice = Math.round(valuation * 0.82 * distressMultiplier)
      hotel.saleListing = { listPrice }
    }
  }
}

export function tryAcquireListedHotel(
  buyer: Competitor,
  hotels: Hotel[],
  state: GameState,
): { acquired: boolean; hotelId?: string; price?: number } {
  const listed = hotels.filter((h) => h.saleListing && h.ownerId !== 'player' && h.ownerId !== buyer.id)
  if (listed.length === 0 || buyer.cash < 500_000) return { acquired: false }

  const target = listed[Math.floor(Math.random() * listed.length)]
  const listPrice = target.saleListing!.listPrice

  if (buyer.cash < listPrice * 0.9) return { acquired: false }

  const offerRatio = 0.9 + Math.random() * 0.1
  const offerPrice = Math.round(listPrice * offerRatio)

  if (offerPrice >= listPrice * 0.92 && buyer.cash >= offerPrice) {
    buyer.cash -= offerPrice
    const seller = state.competitors.find((c) => c.id === target.ownerId)
    if (seller) seller.cash += offerPrice
    target.ownerId = buyer.id
    target.saleListing = undefined
    target.name = `${buyer.name.zh}·${getCityById(target.cityId).name.zh}`
    return { acquired: true, hotelId: target.id, price: offerPrice }
  }

  return { acquired: false }
}
