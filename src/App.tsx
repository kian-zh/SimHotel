import { lazy, Suspense, useEffect, useState } from 'react'
import { GameHUD } from './components/hud/GameHUD'
import { StatsDashboard } from './components/charts/StatsDashboard'
import { BuildPanel } from './components/panels/BuildPanel'
import { CityPanel } from './components/panels/SidePanels'
import { NewsPanel } from './components/panels/NewsPanel'
import { EventModal } from './components/panels/EventModal'
import { HotelDetailModal } from './components/panels/HotelDetailModal'
import { StartScreen, TutorialOverlay } from './components/panels/StartScreen'
import { useTickEngine } from './game/engine/useTickEngine'
import { markHydrationComplete, setupAutoSave } from './game/save/persist'
import { useGameStore } from './stores/gameStore'

const GameMap = lazy(() => import('./components/map/GameMap').then((m) => ({ default: m.GameMap })))

function GameShell() {
  useTickEngine()
  const showStats = useGameStore((s) => s.showStats)

  if (showStats) {
    return (
      <div className="flex h-full w-full flex-col overflow-hidden">
        <div className="relative h-[45vh] min-h-[200px] shrink-0 border-b border-border">
          <Suspense fallback={<div className="flex h-full items-center justify-center bg-map-bg text-slate-400">Loading map…</div>}>
            <GameMap layout="embedded" />
          </Suspense>
          <GameHUD compact />
        </div>
        <div className="min-h-0 flex-1">
          <StatsDashboard embedded />
        </div>
        <NewsPanel />
        <EventModal />
        <HotelDetailModal />
        <TutorialOverlay />
      </div>
    )
  }

  return (
    <div className="relative h-full w-full overflow-hidden">
      <Suspense fallback={<div className="absolute inset-0 flex items-center justify-center bg-map-bg text-slate-400">Loading map…</div>}>
        <GameMap layout="fullscreen" />
      </Suspense>
      <GameHUD />
      <CityPanel />
      <BuildPanel />
      <NewsPanel />
      <EventModal />
      <HotelDetailModal />
      <TutorialOverlay />
    </div>
  )
}

function App() {
  const gameStarted = useGameStore((s) => s.gameStarted)
  const load = useGameStore((s) => s.load)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const cleanupAutoSave = setupAutoSave()
    void load().finally(() => {
      markHydrationComplete()
      setReady(true)
    })
    return cleanupAutoSave
  }, [load])

  if (!ready) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-map-bg text-sm text-muted">
        Loading…
      </div>
    )
  }

  return (
    <>
      <StartScreen />
      {gameStarted && <GameShell />}
    </>
  )
}

export default App
