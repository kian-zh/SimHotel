import type { ClimateZone, GameDate, WeatherType } from '../types'
import { CLIMATE_WEATHER } from '../types'
import { pseudoRandom } from '../market/market'

/**
 * Generate deterministic weather for a specific city and date.
 * Uses the date as a seed so the same date always produces the same weather.
 */
export function generateCityWeather(
  cityId: string,
  climate: ClimateZone,
  date: GameDate,
): WeatherType {
  const probs = CLIMATE_WEATHER[climate]?.[date.month]
  if (!probs) return 'cloudy'

  // Mix cityId into seed so weather differs per city on the same date
  const citySeed = hashCityId(cityId)
  const r = pseudoRandom({ year: date.year, month: date.month, day: date.day + citySeed })

  let cumulative = 0
  const weatherTypes: WeatherType[] = ['sunny', 'cloudy', 'rainy', 'stormy', 'snowy']
  for (let i = 0; i < weatherTypes.length; i++) {
    cumulative += probs[i]
    if (r < cumulative) return weatherTypes[i]
  }

  return 'cloudy'
}

/** Simple string hash for city IDs to get different weather seeds */
function hashCityId(id: string): number {
  let hash = 0
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 31 + id.charCodeAt(i)) | 0
  }
  return Math.abs(hash) % 100
}

/**
 * Generate weather for all unlocked cities.
 * Returns a record mapping cityId → WeatherType.
 */
export function generateAllCityWeather(
  unlockedCities: string[],
  cityClimates: Record<string, ClimateZone>,
  date: GameDate,
): Record<string, WeatherType> {
  const result: Record<string, WeatherType> = {}
  for (const cityId of unlockedCities) {
    const climate = cityClimates[cityId]
    if (climate) {
      result[cityId] = generateCityWeather(cityId, climate, date)
    }
  }
  return result
}
