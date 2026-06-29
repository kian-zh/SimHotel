import { majorEvents } from './major'
import { minorEvents } from './minor'
import type { GameEventConfig } from '../../game/types'

export const gameEvents: GameEventConfig[] = [...majorEvents, ...minorEvents].sort((a, b) =>
  a.date.localeCompare(b.date),
)

export { majorEvents, minorEvents }
