import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { cityMap } from '../../data/cities'
import { estimateBuildCostBreakdown } from '../../game/hotel/buildCost'
import { defaultOpeningConfig, emptyRoomInventory } from '../../game/hotel/defaults'
import {
  calcSpaceUsed,
  canSelectFacility,
  canSelectRoomType,
  validateBuildConfig,
} from '../../game/hotel/space'
import type { FacilityId, HotelFacilityList, HotelRoomInventory, HotelStar, RoomTypeId } from '../../game/types'
import { FACILITIES, ROOM_TYPES, STAR_CONFIG } from '../../game/types'
import { useGameStore } from '../../stores/gameStore'
import { Button } from '../ui/Button'

const ROOM_TYPE_IDS = Object.keys(ROOM_TYPES) as RoomTypeId[]
const OPTIONAL_FACILITIES = (Object.keys(FACILITIES) as FacilityId[]).filter((id) => id !== 'lobby')

interface HotelBuildWizardProps {
  cityId: string
  stars: HotelStar
  roomInventory: HotelRoomInventory
  facilities: HotelFacilityList
  onStarsChange: (stars: HotelStar) => void
  onRoomInventoryChange: (inventory: HotelRoomInventory) => void
  onFacilitiesChange: (facilities: HotelFacilityList) => void
  onBack: () => void
  onConfirm: () => void
  error: string
  success: string
}

export function HotelBuildWizard({
  cityId,
  stars,
  roomInventory,
  facilities,
  onStarsChange,
  onRoomInventoryChange,
  onFacilitiesChange,
  onBack,
  onConfirm,
  error,
  success,
}: HotelBuildWizardProps) {
  const { t } = useTranslation()
  const cash = useGameStore((s) => s.cash)
  const strategyPolicy = useGameStore((s) => s.strategyPolicy)
  const unlockedTechs = useGameStore((s) => s.unlockedTechs)

  const selectedCity = cityMap[cityId]
  const spaceTotal = STAR_CONFIG[stars].spaceTotal
  const spaceUsed = calcSpaceUsed(roomInventory, facilities)
  const validation = useMemo(
    () => validateBuildConfig(roomInventory, facilities, spaceTotal, unlockedTechs),
    [roomInventory, facilities, spaceTotal, unlockedTechs],
  )

  const costBreakdown = useMemo(() => {
    if (!selectedCity) return null
    return estimateBuildCostBreakdown({
      stars,
      city: selectedCity,
      roomInventory,
      facilities,
      strategyPolicy,
    })
  }, [selectedCity, stars, roomInventory, facilities, strategyPolicy])

  const config = STAR_CONFIG[stars]
  const spacePct = Math.min(100, Math.round((spaceUsed / spaceTotal) * 100))
  const spaceOverflow = spaceUsed > spaceTotal

  const handleStarsChange = (next: HotelStar) => {
    onStarsChange(next)
    const opening = defaultOpeningConfig(next)
    onRoomInventoryChange({ ...opening.roomInventory })
    onFacilitiesChange([...opening.facilities])
  }

  const adjustRoom = (roomType: RoomTypeId, delta: number) => {
    const next = { ...roomInventory, [roomType]: Math.max(0, roomInventory[roomType] + delta) }
    if (delta > 0 && !canSelectRoomType(roomType, facilities, unlockedTechs)) return
    const nextUsed = calcSpaceUsed(next, facilities)
    if (delta > 0 && nextUsed > spaceTotal) return
    onRoomInventoryChange(next)
  }

  const toggleFacility = (facilityId: FacilityId) => {
    if (!canSelectFacility(facilityId, unlockedTechs)) return
    const enabled = facilities.includes(facilityId)
    const next = enabled ? facilities.filter((id) => id !== facilityId) : [...facilities, facilityId]
    if (!enabled) {
      const nextUsed = calcSpaceUsed(roomInventory, next)
      if (nextUsed > spaceTotal) return
    }
    onFacilitiesChange(next)
  }

  const validationMessages = validation.errors.map((code) => t(`buildError_${code.split(':')[0]}`, {
    facility: code.split(':')[1] ?? '',
    room: code.split(':')[1] ?? '',
    count: code.split(':')[1] ?? '',
    used: code.split(':')[1] ?? '',
    total: code.split(':')[2] ?? '',
    defaultValue: code,
  }))

  const canConfirm =
    validation.ok &&
    costBreakdown != null &&
    cash >= costBreakdown.total

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1 text-[10px] text-muted">
        <span className="rounded-full bg-card-dark px-2 py-0.5">{t('buildStepSite')}</span>
        <span>→</span>
        <span className="rounded-full bg-teal/20 px-2 py-0.5 font-medium text-teal-dark">{t('buildStepSpace')}</span>
      </div>

      <div>
        <div className="mb-1 flex items-center justify-between text-[11px]">
          <span className="text-muted">{t('hotelSpace')}</span>
          <span className={spaceOverflow ? 'font-medium text-red-500' : ''}>
            {spaceUsed} / {spaceTotal}
          </span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-card-dark">
          <div
            className={`h-full transition-all ${spaceOverflow ? 'bg-red-500' : spacePct > 85 ? 'bg-amber-500' : 'bg-teal'}`}
            style={{ width: `${Math.min(100, spacePct)}%` }}
          />
        </div>
        {spacePct > 85 && !spaceOverflow && (
          <p className="mt-1 text-[10px] text-amber-600">{t('buildSpaceExpansionHint')}</p>
        )}
      </div>

      <div>
        <label className="mb-0.5 block text-[11px] text-muted">{t('brandPositioning')}</label>
        <div className="flex gap-1">
          {([3, 4, 5] as HotelStar[]).map((s) => (
            <Button
              key={s}
              variant={stars === s ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => handleStarsChange(s)}
              className="flex-1"
            >
              {s}★
            </Button>
          ))}
        </div>
      </div>

      <div className="rounded-md border border-border p-2">
        <div className="mb-1 text-[11px] font-medium">{t('requiredFacilities')}</div>
        <label className="flex items-center gap-2 text-xs opacity-70">
          <input type="checkbox" checked disabled className="accent-teal" />
          <span>{t('facility_lobby')}</span>
          <span className="ml-auto text-[10px] text-muted">
            {FACILITIES.lobby.spaceCost} {t('spaceUnits')}
          </span>
        </label>
      </div>

      <div className="rounded-md border border-border p-2">
        <div className="mb-1 text-[11px] font-medium">{t('roomConfiguration')}</div>
        <div className="space-y-1">
          {ROOM_TYPE_IDS.map((roomType) => {
            const count = roomInventory[roomType]
            const config = ROOM_TYPES[roomType]
            const locked = !canSelectRoomType(roomType, facilities, unlockedTechs)
            const atSpaceLimit =
              calcSpaceUsed(roomInventory, facilities) + config.spaceCost > spaceTotal

            return (
              <div key={roomType} className="flex items-center gap-1 text-xs">
                <span className={`min-w-0 flex-1 truncate ${locked ? 'text-muted' : ''}`}>
                  {t(`room_${roomType}`)}
                  {locked && <span className="ml-1 text-[10px]">🔒</span>}
                </span>
                <span className="shrink-0 text-[10px] text-muted">
                  {config.spaceCost} {t('spaceUnits')}
                </span>
                <Button
                  variant="secondary"
                  size="sm"
                  className="h-6 w-6 min-w-6 px-0"
                  disabled={count <= 0}
                  onClick={() => adjustRoom(roomType, -1)}
                >
                  −
                </Button>
                <span className="w-4 text-center font-medium">{count}</span>
                <Button
                  variant="secondary"
                  size="sm"
                  className="h-6 w-6 min-w-6 px-0"
                  disabled={locked || atSpaceLimit}
                  onClick={() => adjustRoom(roomType, 1)}
                >
                  +
                </Button>
              </div>
            )
          })}
        </div>
      </div>

      <div className="rounded-md border border-border p-2">
        <div className="mb-1 text-[11px] font-medium">{t('optionalFacilities')}</div>
        <div className="space-y-1">
          {OPTIONAL_FACILITIES.map((facilityId) => {
            const config = FACILITIES[facilityId]
            const locked = !canSelectFacility(facilityId, unlockedTechs)
            const checked = facilities.includes(facilityId)
            const wouldOverflow =
              !checked &&
              calcSpaceUsed(roomInventory, [...facilities, facilityId]) > spaceTotal

            return (
              <label
                key={facilityId}
                className={`flex items-center gap-2 text-xs ${locked || wouldOverflow ? 'opacity-50' : 'cursor-pointer'}`}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  disabled={locked || wouldOverflow}
                  onChange={() => toggleFacility(facilityId)}
                  className="accent-teal"
                />
                <span className="min-w-0 flex-1 truncate">
                  {t(`facility_${facilityId}`)}
                  {locked && <span className="ml-1 text-[10px]">🔒</span>}
                </span>
                <span className="shrink-0 text-[10px] text-muted">
                  {config.spaceCost} {t('spaceUnits')}
                </span>
              </label>
            )
          })}
        </div>
      </div>

      {validationMessages.length > 0 && (
        <div className="rounded-md bg-red-50 px-2 py-1.5 text-[11px] text-red-600">
          {validationMessages.map((msg) => (
            <div key={msg}>{msg}</div>
          ))}
        </div>
      )}

      {costBreakdown && (
        <div className="space-y-1 rounded-md bg-card-dark p-2 text-xs">
          <div className="flex justify-between">
            <span className="text-muted">{t('landFee')}</span>
            <span>${costBreakdown.landFee.toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted">{t('facilityBuildCost')}</span>
            <span>${costBreakdown.facilityCost.toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted">{t('roomFitoutCost')}</span>
            <span>${costBreakdown.roomCost.toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted">{t('price')}</span>
            <span>${config.basePrice}</span>
          </div>
          <div className="flex justify-between border-t border-border pt-1 font-semibold">
            <span>{t('totalBuildCost')}</span>
            <span className={cash < costBreakdown.total ? 'text-red-500' : 'text-accent'}>
              ${costBreakdown.total.toLocaleString()}
            </span>
          </div>
        </div>
      )}

      {error && <p className="text-xs text-red-500">{error}</p>}
      {success && <p className="rounded-md bg-teal/10 px-2 py-1.5 text-xs text-teal-dark">{success}</p>}

      <div className="flex gap-1">
        <Button variant="secondary" size="sm" className="flex-1" onClick={onBack}>
          {t('back')}
        </Button>
        <Button className="flex-1" size="sm" onClick={onConfirm} disabled={!canConfirm}>
          {t('confirmBuild')}
        </Button>
      </div>
    </div>
  )
}

export function createDefaultBuildConfig(stars: HotelStar) {
  const opening = defaultOpeningConfig(stars)
  return {
    roomInventory: { ...opening.roomInventory },
    facilities: [...opening.facilities] as HotelFacilityList,
  }
}

export { emptyRoomInventory }
