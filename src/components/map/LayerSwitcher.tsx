import { useState } from 'react'
import { createPortal } from 'react-dom'
import { useControl } from 'react-map-gl/mapbox'
import { useTranslation } from 'react-i18next'
import type { MapLayerId } from '../../game/types'
import { useGameStore } from '../../stores/gameStore'

const LAYERS: { id: MapLayerId; labelKey: string }[] = [
  { id: 'none', labelKey: 'layerNone' },
  { id: 'population', labelKey: 'layerPopulation' },
  { id: 'economy', labelKey: 'layerEconomy' },
  { id: 'tourism', labelKey: 'layerTourism' },
]

/** Mapbox IControl：将图层切换面板挂到地图控件槽位 */
export function LayerControl() {
  const [container, setContainer] = useState<HTMLDivElement | null>(null)

  useControl(
    () => ({
      onAdd() {
        const el = document.createElement('div')
        el.className = 'mapboxgl-ctrl layer-control'
        setContainer(el)
        return el
      },
      onRemove() {
        setContainer(null)
      },
    }),
    { position: 'bottom-left' },
  )

  if (!container) return null
  return createPortal(<LayerSwitcherPanel />, container)
}

function LayerSwitcherPanel() {
  const { t } = useTranslation()
  const activeMapLayer = useGameStore((s) => s.activeMapLayer)
  const setMapLayer = useGameStore((s) => s.setMapLayer)

  return (
    <div className="layer-control-panel">
      <div className="layer-control-title">{t('layers')}</div>
      <div className="layer-control-buttons">
        {LAYERS.map((l) => (
          <button
            key={l.id}
            type="button"
            onClick={() => setMapLayer(l.id)}
            className={`layer-control-btn ${activeMapLayer === l.id ? 'layer-control-btn--active' : ''}`}
          >
            {t(l.labelKey)}
          </button>
        ))}
      </div>
      {activeMapLayer !== 'none' && <LayerLegend layer={activeMapLayer} />}
    </div>
  )
}

function LayerLegend({ layer }: { layer: Exclude<MapLayerId, 'none'> }) {
  const { t } = useTranslation()
  const colors: Record<typeof layer, string> = {
    population: 'layer-legend--population',
    economy: 'layer-legend--economy',
    tourism: 'layer-legend--tourism',
  }
  return (
    <div className="layer-legend">
      <div className="layer-legend-desc">{t(`layerDesc_${layer}`)}</div>
      <div className={`layer-legend-bar ${colors[layer]}`} />
      <div className="layer-legend-scale">
        <span>{t('low')}</span>
        <span>{t('high')}</span>
      </div>
    </div>
  )
}
