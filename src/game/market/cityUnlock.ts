import { cityMap } from '../../data/cities'
import type { GameState } from '../types'

export type PurchaseBlockReason = 'already_unlocked' | 'funds' | 'unknown'

export function getCityUnlockFee(cityId: string): number {
  return cityMap[cityId]?.unlockFee ?? Number.POSITIVE_INFINITY
}

export function canPurchaseCity(
  state: GameState,
  cityId: string,
): { ok: true } | { ok: false; reason: PurchaseBlockReason } {
  const city = cityMap[cityId]
  if (!city) return { ok: false, reason: 'unknown' }
  if (state.unlockedCities.includes(cityId)) return { ok: false, reason: 'already_unlocked' }
  if (state.cash < city.unlockFee) return { ok: false, reason: 'funds' }
  return { ok: true }
}
