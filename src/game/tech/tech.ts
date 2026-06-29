import type { GameState, TechId } from '../types'
import { TECH_TREE } from '../types'

export type TechStatus = 'unlocked' | 'researching' | 'available' | 'locked'

export type StartResearchBlockReason =
  | 'already_unlocked'
  | 'prerequisites'
  | 'already_researching'
  | 'funds'

export function getTechStatus(
  state: Pick<GameState, 'unlockedTechs' | 'researchingTech'>,
  techId: TechId,
): TechStatus {
  if (state.unlockedTechs.includes(techId)) return 'unlocked'
  if (state.researchingTech?.techId === techId) return 'researching'
  const config = TECH_TREE[techId]
  const prereqsMet = config.prerequisites.every((p) => state.unlockedTechs.includes(p))
  if (!prereqsMet) return 'locked'
  return 'available'
}

export function canStartResearch(
  state: Pick<GameState, 'cash' | 'unlockedTechs' | 'researchingTech'>,
  techId: TechId,
): { ok: true } | { ok: false; reason: StartResearchBlockReason } {
  const config = TECH_TREE[techId]
  if (state.unlockedTechs.includes(techId)) return { ok: false, reason: 'already_unlocked' }
  if (state.researchingTech) return { ok: false, reason: 'already_researching' }
  if (!config.prerequisites.every((p) => state.unlockedTechs.includes(p))) {
    return { ok: false, reason: 'prerequisites' }
  }
  if (state.cash < config.cost) return { ok: false, reason: 'funds' }
  return { ok: true }
}

export function applyStartResearch(
  state: Pick<GameState, 'cash' | 'unlockedTechs' | 'researchingTech'>,
  techId: TechId,
): { cash: number; researchingTech: NonNullable<GameState['researchingTech']> } | null {
  const check = canStartResearch(state, techId)
  if (!check.ok) return null
  const config = TECH_TREE[techId]
  return {
    cash: state.cash - config.cost,
    researchingTech: { techId, daysRemaining: config.durationDays },
  }
}

export function advanceResearchDay(
  state: Pick<GameState, 'unlockedTechs' | 'researchingTech'>,
): Pick<GameState, 'unlockedTechs' | 'researchingTech'> {
  if (!state.researchingTech) {
    return { unlockedTechs: state.unlockedTechs, researchingTech: null }
  }

  const daysRemaining = state.researchingTech.daysRemaining - 1
  if (daysRemaining <= 0) {
    const techId = state.researchingTech.techId
    const unlockedTechs = state.unlockedTechs.includes(techId)
      ? state.unlockedTechs
      : [...state.unlockedTechs, techId]
    return { unlockedTechs, researchingTech: null }
  }

  return {
    unlockedTechs: state.unlockedTechs,
    researchingTech: { ...state.researchingTech, daysRemaining },
  }
}

/** Display order: roots first, then by prerequisite depth */
export function getTechDisplayOrder(): TechId[] {
  const depth = (id: TechId, seen = new Set<TechId>()): number => {
    if (seen.has(id)) return 0
    seen.add(id)
    const prereqs = TECH_TREE[id].prerequisites
    if (prereqs.length === 0) return 0
    return 1 + Math.max(...prereqs.map((p) => depth(p, seen)))
  }
  return (Object.keys(TECH_TREE) as TechId[]).sort((a, b) => depth(a) - depth(b) || a.localeCompare(b))
}
