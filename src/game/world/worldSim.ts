import { getRealMetrics } from '../../data/real/yearCurves'
import { cities } from '../../data/cities'
import { yearlyDrift } from '../../data/grid/noise'
import type { ActiveEvent, CityMetrics } from '../types'

export function initWorldMetrics(seed: number): Record<string, CityMetrics> {
  const metrics: Record<string, CityMetrics> = {}
  for (const city of cities) {
    const real = getRealMetrics(city.id, 1990)
    const drift = yearlyDrift(seed, city.id, 1990)
    metrics[city.id] = {
      population: real.population * drift,
      economy: real.economy * drift,
      tourism: real.tourism * drift,
    }
  }
  return metrics
}

export function applyYearlyDrift(
  metrics: Record<string, CityMetrics>,
  seed: number,
  year: number,
): Record<string, CityMetrics> {
  const next: Record<string, CityMetrics> = {}
  for (const city of cities) {
    const real = getRealMetrics(city.id, year)
    const drift = yearlyDrift(seed, city.id, year)
    const prev = metrics[city.id]
    next[city.id] = {
      population: real.population * drift,
      economy: (prev?.economy ?? real.economy) * 0.3 + real.economy * drift * 0.7,
      tourism: (prev?.tourism ?? real.tourism) * 0.3 + real.tourism * drift * 0.7,
    }
  }
  return next
}

export function applyEventModifiers(
  metrics: Record<string, CityMetrics>,
  activeEvents: ActiveEvent[],
): Record<string, CityMetrics> {
  const result: Record<string, CityMetrics> = {}
  for (const city of cities) {
    const base = metrics[city.id] ?? { population: 50, economy: 50, tourism: 50 }
    let pop = base.population
    let econ = base.economy
    let tour = base.tourism

    for (const event of activeEvents) {
      if (!event.affectedMarkets.includes(city.id) && !event.affectedMarkets.includes('global')) continue
      const m = event.modifiers
      if (m.population) pop *= 1 + m.population
      if (m.economy) econ *= 1 + m.economy
      if (m.tourism) tour *= 1 + m.tourism
      if (m.businessTravel) econ *= 1 + m.businessTravel * 0.5
      if (m.demand) {
        pop *= 1 + m.demand * 0.3
        tour *= 1 + m.demand * 0.3
      }
    }

    result[city.id] = {
      population: Math.min(100, Math.max(5, pop)),
      economy: Math.min(100, Math.max(5, econ)),
      tourism: Math.min(100, Math.max(5, tour)),
    }
  }
  return result
}

export function computeWorldMetrics(
  baseMetrics: Record<string, CityMetrics>,
  seed: number,
  year: number,
  activeEvents: ActiveEvent[] = [],
): Record<string, CityMetrics> {
  const withYear = applyYearlyDrift(baseMetrics, seed, year)
  return applyEventModifiers(withYear, activeEvents)
}
