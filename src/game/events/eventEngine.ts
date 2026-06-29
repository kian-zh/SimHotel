import { gameEvents } from '../../data/events'
import { formatGameDate } from '../engine/date'
import type { ActiveEvent, GameState, NewsItem } from '../types'

export interface EventTriggerResult {
  activeEvents: GameState['activeEvents']
  triggeredEventIds: string[]
  newsItems: NewsItem[]
  pendingMajorEvent: ActiveEvent | null
}

export function checkAndTriggerEvents(state: GameState): EventTriggerResult {
  const dateStr = formatGameDate(state.date)
  const activeEvents = [...state.activeEvents]
  const triggeredEventIds = [...state.triggeredEventIds]
  const newsItems: NewsItem[] = []
  let pendingMajorEvent: ActiveEvent | null = null

  for (const event of gameEvents) {
    if (triggeredEventIds.includes(event.id)) continue
    if (event.date !== dateStr) continue

    triggeredEventIds.push(event.id)
    const active: ActiveEvent = {
      eventId: event.id,
      tier: event.tier,
      category: event.category,
      title: event.title,
      description: event.description,
      affectedMarkets: event.affectedMarkets,
      modifiers: event.modifiers,
      remainingDays: event.durationDays,
    }
    activeEvents.push(active)

    newsItems.push({
      id: `news-${event.id}`,
      date: dateStr,
      tier: event.tier,
      category: event.category,
      title: event.title,
      summary: event.description,
      read: false,
    })

    if (event.tier === 'major') {
      pendingMajorEvent = active
    }
  }

  return { activeEvents, triggeredEventIds, newsItems, pendingMajorEvent }
}
