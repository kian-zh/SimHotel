import { baselineMap } from './cityBaselines'

export interface RealMetrics {
  population: number
  economy: number
  tourism: number
}

export function getRealMetrics(cityId: string, year: number): RealMetrics {
  const base = baselineMap[cityId]
  if (!base) return { population: 50, economy: 50, tourism: 50 }

  const yearsSince1990 = Math.max(0, year - 1990)
  const pop = base.population1990 * Math.pow(1 + base.populationGrowthRate, yearsSince1990)
  const gdp = base.gdpIndex1990 * (1 + yearsSince1990 * 0.015)
  const visitors = base.visitorArrivals1990 * (1 + yearsSince1990 * 0.04)

  const popNorm = Math.min(100, (pop / 15_000_000) * 100)
  const economyNorm = Math.min(100, gdp * 0.5 + base.businessHubScore * 0.5)
  const tourismNorm = Math.min(100, (visitors / 700) * 80 + base.businessHubScore * 0.1)

  return {
    population: popNorm,
    economy: economyNorm,
    tourism: tourismNorm,
  }
}
