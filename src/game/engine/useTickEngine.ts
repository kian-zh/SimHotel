import { useEffect, useRef } from 'react'
import { useGameStore } from '../../stores/gameStore'

/** Real-time milliseconds per in-game day (fixed pace; no speed multiplier). */
export const MS_PER_GAME_DAY = 5000

export function useTickEngine() {
  const tick = useGameStore((s) => s.tick)
  const paused = useGameStore((s) => s.paused)
  const gameStarted = useGameStore((s) => s.gameStarted)
  const accumulator = useRef(0)
  const lastTime = useRef(performance.now())

  useEffect(() => {
    if (!gameStarted) return

    let frameId: number

    const loop = (now: number) => {
      const delta = now - lastTime.current
      lastTime.current = now

      if (!paused) {
        accumulator.current += delta
        while (accumulator.current >= MS_PER_GAME_DAY) {
          accumulator.current -= MS_PER_GAME_DAY
          tick()
        }
      }

      frameId = requestAnimationFrame(loop)
    }

    lastTime.current = performance.now()
    frameId = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(frameId)
  }, [paused, gameStarted, tick])
}
