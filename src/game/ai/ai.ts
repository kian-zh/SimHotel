import { pickAvailableHexCell } from '../../data/grid/hexGrid'
import type { Competitor, GameState, Hotel, HotelStar } from '../types'
import { STAR_CONFIG } from '../types'
import { getCityById } from '../market/market'
import { createHotelFromConfig } from '../engine/simulate'
import { processAIDistressListings, tryAcquireListedHotel } from '../hotel/acquisition'

function pickExpansionCity(comp: Competitor, state: GameState): string | null {
  const available = state.unlockedCities.filter(
    (cityId) => !state.hotels.some((h) => h.cityId === cityId && h.ownerId === comp.id),
  )
  if (available.length === 0) return null

  if (comp.personality === 'regional') {
    const asia = available.filter((id) => ['hong-kong', 'shenzhen', 'guangzhou', 'singapore'].includes(id))
    if (asia.length > 0) return asia[Math.floor(Math.random() * asia.length)]
  }

  return available[Math.floor(Math.random() * available.length)]
}

function buildAIHotel(comp: Competitor, cityId: string, state: GameState): Hotel | null {
  const city = getCityById(cityId)
  const stars: HotelStar =
    comp.personality === 'premium' ? 5 : comp.personality === 'price_warrior' ? 3 : 4
  const config = STAR_CONFIG[stars]
  const cost = config.buildCost * (1 + city.market.regulatoryCost / 200)

  if (comp.cash < cost) return null

  const cell = pickAvailableHexCell(cityId, state.hotels, comp.cash + state.date.year)
  if (!cell) return null

  comp.cash -= cost
  return createHotelFromConfig({
    name: `${comp.name.zh}·${city.name.zh}`,
    cityId,
    ownerId: comp.id,
    coordinates: [cell.lng, cell.lat],
    gridCellId: cell.cellId,
    stars,
    price: config.basePrice * (comp.personality === 'price_warrior' ? 0.85 : 1),
    quality: config.baseQuality,
    builtAt: { ...state.date },
    personality: comp.personality,
  })
}

function adjustAIPricing(comp: Competitor, hotels: Hotel[], state: GameState): void {
  const compHotels = hotels.filter((h) => h.ownerId === comp.id)
  const playerHotels = state.hotels.filter((h) => h.ownerId === 'player')

  for (const hotel of compHotels) {
    const city = getCityById(hotel.cityId)
    const localPlayer = playerHotels.filter((h) => h.cityId === hotel.cityId)
    const avgPlayerPrice =
      localPlayer.length > 0 ? localPlayer.reduce((s, h) => s + h.price, 0) / localPlayer.length : city.market.willingnessToPay

    if (comp.personality === 'price_warrior' && hotel.price > avgPlayerPrice * 0.95) {
      hotel.price = Math.round(avgPlayerPrice * 0.9)
    } else if (comp.personality === 'premium') {
      hotel.price = Math.round(city.market.willingnessToPay * 1.1)
    } else if (comp.personality === 'aggressive' && hotel.occupancy < 0.5) {
      hotel.price = Math.round(hotel.price * 0.95)
    } else if (hotel.occupancy > 0.85) {
      hotel.price = Math.round(hotel.price * 1.03)
    }
  }
}

export function runAIDecisions(
  state: GameState,
  shouldRun: boolean,
): { hotels?: Hotel[]; competitors?: Competitor[]; cashDelta?: number } {
  if (!shouldRun) return {}

  const competitors = state.competitors.map((c) => ({ ...c }))
  const hotels = state.hotels.map((h) => ({ ...h }))

  for (const comp of competitors) {
    adjustAIPricing(comp, hotels, state)

    const expandChance =
      comp.personality === 'aggressive' ? 0.35 : comp.personality === 'regional' ? 0.25 : 0.15

    if (Math.random() < expandChance) {
      const cityId = pickExpansionCity(comp, state)
      if (cityId) {
        const newHotel = buildAIHotel(comp, cityId, state)
        if (newHotel) hotels.push(newHotel)
      }
    }

    tryAcquireListedHotel(comp, hotels, state)
  }

  processAIDistressListings(hotels, competitors)

  return { hotels, competitors }
}

export function seedCompetitorHotels(state: GameState): Hotel[] {
  const hotels = [...state.hotels]
  for (const comp of state.competitors.slice(2)) {
    const cityId = pickExpansionCity(comp, state)
    if (!cityId) continue
    const hotel = buildAIHotel(comp, cityId, state)
    if (hotel) hotels.push(hotel)
  }
  return hotels
}
