import type { CityConfig, GridPoint, Hotel } from '../types'
import { sampleLocationFactors } from '../market/location'
import { calcTotalRooms } from './space'

export interface BuyerState {
  cash: number
}

export interface AcquisitionQuote {
  valuation: number
  minOffer: number
  maxOffer: number
  suggestedOffer: number
  distressMultiplier: number
}

export function isOwnerInDistress(hotel: Hotel, ownerCash?: number): boolean {
  if (hotel.occupancy < 0.4) return true
  if (ownerCash !== undefined && ownerCash < 1_000_000) return true
  return false
}

export function getDistressMultiplier(hotel: Hotel, ownerCash?: number): number {
  let multiplier = 1
  if (hotel.occupancy < 0.4) multiplier -= 0.1
  if (ownerCash !== undefined && ownerCash < 0) multiplier -= 0.15
  else if (ownerCash !== undefined && ownerCash < 1_000_000) multiplier -= 0.08
  return Math.max(0.7, multiplier)
}

export function estimateHotelValue(hotel: Hotel, city: CityConfig, gridPoints?: GridPoint[]): number {
  const totalRooms = calcTotalRooms(hotel.roomInventory)
  const baseAsset = totalRooms * hotel.stars * 55_000 * (hotel.quality / 75)
  const facilityValue = hotel.facilities.length * 120_000
  const spacePremium = hotel.spaceTotal * 25_000

  let locationFactor = 1
  if (gridPoints && gridPoints.length > 0) {
    const factors = sampleLocationFactors(
      gridPoints,
      hotel.coordinates[0],
      hotel.coordinates[1],
      hotel.cityId,
    )
    locationFactor = 0.75 + factors.base * 0.5
  }

  const operatingFactor = 0.85 + hotel.occupancy * 0.3
  const reputationFactor = 0.9 + hotel.quality / 500
  const regulatoryFactor = 1 - city.market.regulatoryCost / 400

  return Math.round(
    (baseAsset + facilityValue + spacePremium) *
      locationFactor *
      operatingFactor *
      reputationFactor *
      regulatoryFactor,
  )
}

export function getAcquisitionQuote(
  hotel: Hotel,
  city: CityConfig,
  gridPoints?: GridPoint[],
  ownerCash?: number,
): AcquisitionQuote {
  const valuation = estimateHotelValue(hotel, city, gridPoints)
  const distressMultiplier = getDistressMultiplier(hotel, ownerCash)

  const minOffer = Math.round(valuation * 0.85 * distressMultiplier)
  const maxOffer = Math.round(valuation * 1.15)
  const suggestedOffer = Math.round(valuation * (0.92 + (1 - distressMultiplier) * 0.08))

  return { valuation, minOffer, maxOffer, suggestedOffer, distressMultiplier }
}

export function getListPriceBounds(valuation: number): { min: number; max: number } {
  return {
    min: Math.round(valuation * 0.8),
    max: Math.round(valuation * 1.2),
  }
}
