import { motion } from 'framer-motion'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useGameStore } from '../../stores/gameStore'
import { Button } from '../ui/Button'
import { Card } from '../ui/Card'

const TUTORIAL_STEPS = [
  { title: 'tutorial1Title', body: 'tutorial1', action: 'tutorialActionBriefing' },
  { title: 'tutorial2Title', body: 'tutorial2', action: 'tutorialActionInspectCity' },
  { title: 'tutorial3Title', body: 'tutorial3', action: 'tutorialActionOpenBuild' },
  { title: 'tutorial4Title', body: 'tutorial4', action: 'tutorialActionPlaceHotel' },
  { title: 'tutorial5Title', body: 'tutorial5', action: 'tutorialActionOpenStrategy' },
  { title: 'tutorial6Title', body: 'tutorial6', action: 'tutorialActionOpenNews' },
] as const

export function TutorialOverlay() {
  const { t } = useTranslation()
  const tutorialDismissed = useGameStore((s) => s.tutorialDismissed)
  const tutorialStep = useGameStore((s) => s.tutorialStep)
  const nextTutorialStep = useGameStore((s) => s.nextTutorialStep)
  const dismissTutorial = useGameStore((s) => s.dismissTutorial)
  const gameStarted = useGameStore((s) => s.gameStarted)
  const selectedCityId = useGameStore((s) => s.selectedCityId)
  const showBuildPanel = useGameStore((s) => s.showBuildPanel)
  const previewCoordinates = useGameStore((s) => s.previewCoordinates)
  const hotels = useGameStore((s) => s.hotels)
  const showStats = useGameStore((s) => s.showStats)
  const showNews = useGameStore((s) => s.showNews)
  const selectCity = useGameStore((s) => s.selectCity)
  const setShowBuildPanel = useGameStore((s) => s.setShowBuildPanel)
  const setShowStats = useGameStore((s) => s.setShowStats)
  const setShowNews = useGameStore((s) => s.setShowNews)

  if (!gameStarted || tutorialDismissed || tutorialStep >= TUTORIAL_STEPS.length) return null

  const step = TUTORIAL_STEPS[tutorialStep]
  const playerHotels = hotels.filter((h) => h.ownerId === 'player')
  const completed =
    tutorialStep === 0 ||
    (tutorialStep === 1 && selectedCityId != null) ||
    (tutorialStep === 2 && showBuildPanel) ||
    (tutorialStep === 3 && (previewCoordinates != null || playerHotels.length > 0)) ||
    (tutorialStep === 4 && showStats) ||
    (tutorialStep === 5 && showNews)

  const runStepAction = () => {
    if (tutorialStep === 1) selectCity('hong-kong')
    if (tutorialStep === 2 || tutorialStep === 3) setShowBuildPanel(true, selectedCityId ?? 'hong-kong')
    if (tutorialStep === 4) setShowStats(true)
    if (tutorialStep === 5) setShowNews(true)
  }

  return (
    <motion.div
      key={tutorialStep}
      initial={{ opacity: 0, y: 24, scale: 0.98 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 12 }}
      className="pointer-events-auto absolute bottom-4 left-4 right-4 z-40 sm:bottom-6 sm:left-1/2 sm:right-auto sm:w-96 sm:-translate-x-1/2"
    >
      <Card className="shadow-2xl">
        <div className="mb-3 flex items-center gap-3">
          <img src="/assets/hotel-isometric.svg" alt="" className="h-14 w-20 rounded-lg object-cover" />
          <div>
            <div className="text-xs font-medium text-accent">{t('narrativeHook')}</div>
            <h2 className="text-base font-bold">{t(step.title)}</h2>
          </div>
        </div>
        <p className="mb-3 text-sm leading-relaxed text-slate-700">{t(step.body)}</p>
        <div className={`mb-3 rounded-lg px-3 py-2 text-xs ${completed ? 'bg-teal/10 text-teal-dark' : 'bg-card-dark text-muted'}`}>
          {completed ? t('tutorialTaskDone') : t('tutorialTaskPending')}
        </div>
        <div className="mb-4 flex gap-1">
          {TUTORIAL_STEPS.map((_, i) => (
            <div key={i} className={`h-1.5 flex-1 rounded-full ${i <= tutorialStep ? 'bg-accent' : 'bg-card-dark'}`} />
          ))}
        </div>
        <div className="flex flex-wrap justify-between gap-2">
          <Button variant="ghost" size="sm" onClick={dismissTutorial}>
            {t('skip')}
          </Button>
          <div className="flex gap-2">
            {tutorialStep > 0 && tutorialStep < TUTORIAL_STEPS.length && (
              <Button variant="secondary" size="sm" onClick={runStepAction}>
                {t(step.action)}
              </Button>
            )}
            <Button size="sm" onClick={nextTutorialStep} disabled={!completed}>
              {t('next')} ({tutorialStep + 1}/{TUTORIAL_STEPS.length})
            </Button>
          </div>
        </div>
      </Card>
    </motion.div>
  )
}

export function StartScreen() {
  const { t } = useTranslation()
  const gameStarted = useGameStore((s) => s.gameStarted)
  const startGame = useGameStore((s) => s.startGame)
  const [brandName, setBrandName] = useState('星程酒店')

  if (gameStarted) return null

  return (
    <div className="safe-top safe-bottom safe-x absolute inset-0 z-50 flex items-center justify-center overflow-hidden bg-map-bg p-4">
      <img
        src="/assets/history-map-scene.svg"
        alt=""
        className="absolute inset-0 h-full w-full object-cover opacity-80"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-map-bg/20 via-map-bg/45 to-map-bg/85" />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative grid w-full max-w-5xl grid-cols-1 gap-4 md:grid-cols-[1.1fr_0.9fr]"
      >
        <div className="flex min-h-64 flex-col justify-end rounded-xl border border-white/10 bg-slate-950/30 p-6 text-white shadow-2xl backdrop-blur-sm">
          <div className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-teal">{t('visualArchive')}</div>
          <h1 className="max-w-xl text-4xl font-bold leading-tight sm:text-5xl">{t('appName')}</h1>
          <p className="mt-4 max-w-lg text-sm leading-relaxed text-slate-200">{t('startBriefing')}</p>
        </div>
        <Card className="shadow-2xl">
          <div className="mb-5">
            <img src="/assets/hotel-isometric.svg" alt="" className="mb-4 h-36 w-full rounded-lg object-cover" />
            <h2 className="text-2xl font-bold text-slate-800">{t('appSubtitle')}</h2>
            <p className="text-sm text-muted">{t('brandPlaceholder')}</p>
          </div>
          <input
            type="text"
            value={brandName}
            onChange={(e) => setBrandName(e.target.value)}
            placeholder={t('brandPlaceholder')}
            className="mb-4 w-full rounded-lg border border-border px-4 py-3 text-sm focus:border-accent focus:outline-none"
          />
          <Button className="w-full" size="lg" onClick={() => startGame(brandName)}>
            {t('start')}
          </Button>
        </Card>
      </motion.div>
    </div>
  )
}
