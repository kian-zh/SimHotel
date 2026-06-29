import { useGameStore } from '../../stores/gameStore'
import type { GameState } from '../types'
import { saveGame } from './db'

export function pickPersistedState(state: GameState): GameState {
  return {
    date: state.date,
    cash: state.cash,
    reputation: state.reputation,
    paused: state.paused,
    dailyCashDelta: state.dailyCashDelta,
    hotels: state.hotels,
    competitors: state.competitors,
    unlockedCities: state.unlockedCities,
    activeEvents: state.activeEvents,
    triggeredEventIds: state.triggeredEventIds,
    cityMarkets: state.cityMarkets,
    financeHistory: state.financeHistory,
    selectedCityId: state.selectedCityId,
    selectedHotelId: state.selectedHotelId,
    showHotelDetail: false,
    showCityPanel: state.showCityPanel,
    showStats: state.showStats,
    mapViewMode: state.mapViewMode,
    showBuildPanel: state.showBuildPanel,
    pendingBuildCityId: state.pendingBuildCityId,
    tutorialStep: state.tutorialStep,
    tutorialDismissed: state.tutorialDismissed,
    lastAutoSaveAt: state.lastAutoSaveAt,
    gameStarted: state.gameStarted,
    brandName: state.brandName,
    worldSeed: state.worldSeed,
    worldMetrics: state.worldMetrics,
    newsFeed: state.newsFeed,
    activeMapLayer: state.activeMapLayer,
    buildPlacementMode: state.buildPlacementMode,
    previewCoordinates: state.previewCoordinates,
    showNews: state.showNews,
    gridVersion: state.gridVersion,
    strategyPolicy: state.strategyPolicy,
    debt: state.debt,
    creditRating: state.creditRating,
    baseInterestRate: state.baseInterestRate,
    unlockedTechs: state.unlockedTechs ?? ['basic_ops'],
    researchingTech: state.researchingTech ?? null,
    hotelAds: state.hotelAds ?? [],
    brandAd: state.brandAd ?? null,
  }
}

const DEBOUNCE_MS = 400

let saveTimer: ReturnType<typeof setTimeout> | null = null
let hydrating = true
let pendingFlush: GameState | null = null

function scheduleSave(state: GameState) {
  pendingFlush = pickPersistedState(state)
  if (saveTimer) clearTimeout(saveTimer)
  saveTimer = setTimeout(() => {
    void flushSave()
  }, DEBOUNCE_MS)
}

async function flushSave() {
  if (!pendingFlush) return
  const snapshot = pendingFlush
  pendingFlush = null
  if (saveTimer) {
    clearTimeout(saveTimer)
    saveTimer = null
  }
  await saveGame(snapshot)
  useGameStore.setState({ lastAutoSaveAt: new Date().toISOString() })
}

function cancelPendingSave() {
  if (saveTimer) {
    clearTimeout(saveTimer)
    saveTimer = null
  }
  pendingFlush = null
}

export function markHydrationComplete() {
  hydrating = false
}

export function setupAutoSave() {
  const unsubscribe = useGameStore.subscribe((state) => {
    if (hydrating) return
    if (!state.gameStarted) {
      cancelPendingSave()
      return
    }
    scheduleSave(state)
  })

  const flushOnHide = () => {
    if (document.visibilityState !== 'hidden') return
    const state = useGameStore.getState()
    if (!state.gameStarted) return
    pendingFlush = pickPersistedState(state)
    void flushSave()
  }

  document.addEventListener('visibilitychange', flushOnHide)
  window.addEventListener('pagehide', flushOnHide)

  return () => {
    unsubscribe()
    document.removeEventListener('visibilitychange', flushOnHide)
    window.removeEventListener('pagehide', flushOnHide)
  }
}
