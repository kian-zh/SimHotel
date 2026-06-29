import { useTranslation } from 'react-i18next'
import { cities, getCityName } from '../../data/cities'
import { useGameStore } from '../../stores/gameStore'

export function CitySwitcher() {
  const { i18n, t } = useTranslation()
  const lang = i18n.language === 'zh' ? 'zh' : 'en'
  const unlockedCities = useGameStore((s) => s.unlockedCities)
  const selectedCityId = useGameStore((s) => s.selectedCityId)
  const selectCity = useGameStore((s) => s.selectCity)
  const setShowCityPanel = useGameStore((s) => s.setShowCityPanel)
  const mapViewMode = useGameStore((s) => s.mapViewMode)

  if (mapViewMode === 'overview') return null

  return (
    <div className="safe-x pointer-events-auto absolute bottom-20 left-0 right-0 z-20 flex justify-center px-2 sm:bottom-6">
      <div className="scrollbar-hide flex max-w-full gap-1 overflow-x-auto rounded-xl bg-card/95 p-1.5 shadow-lg backdrop-blur-sm">
        {unlockedCities.map((id) => {
          const city = cities.find((c) => c.id === id)
          if (!city) return null
          const active = selectedCityId === id
          return (
            <button
              key={id}
              type="button"
              onClick={() => {
                if (active) setShowCityPanel(true)
                else selectCity(id)
              }}
              className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                active
                  ? 'bg-accent text-white shadow-sm'
                  : 'bg-white text-slate-700 hover:bg-teal/10 hover:text-teal-dark'
              }`}
            >
              {getCityName(id, lang)}
            </button>
          )
        })}
        <button
          type="button"
          onClick={() => useGameStore.getState().setShowStats(true)}
          className="shrink-0 rounded-lg border border-dashed border-slate-300 px-3 py-1.5 text-xs font-medium text-muted hover:border-teal hover:text-teal-dark"
        >
          {t('globalOverview')}
        </button>
      </div>
    </div>
  )
}
