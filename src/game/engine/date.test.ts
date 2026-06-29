import { describe, expect, it } from 'vitest'
import { addDays, formatGameDate, parseGameDate } from './date'

describe('game date utilities', () => {
  it('formats and parses dates', () => {
    const date = { year: 1990, month: 1, day: 1 }
    expect(formatGameDate(date)).toBe('1990-01-01')
    expect(parseGameDate('1997-07-01')).toEqual({ year: 1997, month: 7, day: 1 })
  })

  it('adds days across month boundary', () => {
    const result = addDays({ year: 1990, month: 1, day: 31 }, 1)
    expect(result).toEqual({ year: 1990, month: 2, day: 1 })
  })
})
