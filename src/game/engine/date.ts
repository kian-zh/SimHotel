import type { GameDate } from '../types'

export function formatGameDate(date: GameDate): string {
  return `${date.year}-${String(date.month).padStart(2, '0')}-${String(date.day).padStart(2, '0')}`
}

export function parseGameDate(value: string): GameDate {
  const [year, month, day] = value.split('-').map(Number)
  return { year, month, day }
}

export function compareDates(a: GameDate, b: GameDate): number {
  const av = a.year * 10000 + a.month * 100 + a.day
  const bv = b.year * 10000 + b.month * 100 + b.day
  return av - bv
}

export function addDays(date: GameDate, days: number): GameDate {
  const d = new Date(date.year, date.month - 1, date.day)
  d.setDate(d.getDate() + days)
  return { year: d.getFullYear(), month: d.getMonth() + 1, day: d.getDate() }
}

export function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate()
}

export function isMonthEnd(date: GameDate): boolean {
  return date.day === daysInMonth(date.year, date.month)
}

/** Days from `date` (inclusive) until the 1st of the following calendar month. */
export function getDaysUntilNextMonth(date: GameDate): number {
  return daysInMonth(date.year, date.month) - date.day + 1
}

export function isYearEnd(date: GameDate): boolean {
  return date.month === 12 && date.day === 31
}

export function getSeasonMultiplier(month: number, peak: number[], multiplier: number): number {
  return peak.includes(month) ? multiplier : 1
}

export function uid(prefix = 'id'): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}
