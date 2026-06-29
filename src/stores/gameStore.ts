import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import { cityMap } from '../data/cities'
import { competitors } from '../data/competitors'
import { randomSeed } from '../data/grid/noise'
import {
  defaultOpeningConfig,
  migrateHotelToSpaceModel,
} from '../game/hotel/defaults'
import { estimateBuildCostBreakdown } from '../game/hotel/buildCost'
import { calcExpansionCost, calcExpansionDays, canRemoveFacility, clampStaff } from '../game/hotel/operations'
import { calcSpaceFree, canSelectFacility, validateBuildConfig, validateRoomInventoryUpdate } from '../game/hotel/space'
import {
  buildAcquisitionQuote,
  evaluateAcquisitionOffer,
  type AcquireHotelResult,
} from '../game/hotel/acquisition'
import { estimateHotelValue, getListPriceBounds, isOwnerInDistress } from '../game/hotel/valuation'
import { createInitialHotels, createHotelFromConfig, simulateDay } from '../game/engine/simulate'
import { canPurchaseCity } from '../game/market/cityUnlock'
import { getCityById, getUpgradeCost } from '../game/market/market'
import { initWorldMetrics } from '../game/world/worldSim'
import { loadGame, deleteSave } from '../game/save/db'
import { calculateCreditRating, getBorrowingLimit } from '../game/finance/finance'
import type {
  BuildHotelParams,
  FacilityId,
  GameState,
  HotelRoomInventory,
  HotelStaff,
  MapLayerId,
  MapViewMode,
  StrategyPolicyId,
  TechId,
  AdTypeId,
} from '../game/types'
import { FACILITIES, INITIAL_CASH, INITIAL_DATE, STAR_CONFIG } from '../game/types'
import { getDaysUntilNextMonth } from '../game/engine/date'
import { isCellOccupied, pickAvailableHexCell, snapToHexCell } from '../data/grid/hexGrid'
import { getCityBounds, isWithinBounds } from '../data/cities/bounds'
import { rebuildGrid } from '../game/market/gridIndex'
import { applyStartResearch } from '../game/tech/tech'
import {
  applyStartBrandAd,
  applyStartHotelAd,
} from '../game/marketing/ads'

function createInitialState(): GameState {
  const seed = randomSeed()
  return {
    date: { ...INITIAL_DATE },
    cash: INITIAL_CASH,
    dailyCashDelta: 0,
    reputation: 60,
    paused: false,
    hotels: createInitialHotels(),
    competitors: competitors.map((c) => ({ ...c })),
    unlockedCities: ['hong-kong'],
    activeEvents: [],
    triggeredEventIds: [],
    cityMarkets: {},
    financeHistory: [],
    selectedCityId: 'hong-kong',
    selectedHotelId: null,
    showHotelDetail: false,
    showCityPanel: true,
    showStats: false,
    mapViewMode: 'city',
    showBuildPanel: false,
    pendingBuildCityId: null,
    tutorialStep: 0,
    tutorialDismissed: false,
    lastAutoSaveAt: null,
    gameStarted: false,
    brandName: '星程酒店',
    worldSeed: seed,
    worldMetrics: initWorldMetrics(seed),
    newsFeed: [],
    activeMapLayer: 'none',
    buildPlacementMode: false,
    previewCoordinates: null,
    showNews: false,
    gridVersion: 0,
    strategyPolicy: 'balanced',
    debt: 0,
    creditRating: 'AAA',
    baseInterestRate: 0.055,
    unlockedTechs: ['basic_ops'],
    researchingTech: null,
    hotelAds: [],
    brandAd: null,
    cityWeathers: {},
  }
}

interface GameActions {
  startGame: (brandName: string) => void
  tick: () => void
  setPaused: (paused: boolean) => void
  togglePause: () => void
  fastForwardToNextMonth: () => void
  selectCity: (cityId: string | null) => void
  selectHotel: (hotelId: string | null) => void
  setShowHotelDetail: (show: boolean) => void
  setShowCityPanel: (show: boolean) => void
  setShowStats: (show: boolean) => void
  setMapViewMode: (mode: MapViewMode) => void
  setShowNews: (show: boolean) => void
  setShowBuildPanel: (show: boolean, cityId?: string | null) => void
  setMapLayer: (layer: MapLayerId) => void
  setBuildPlacementMode: (mode: boolean) => void
  setPreviewCoordinates: (coords: [number, number] | null) => void
  buildHotel: (params: BuildHotelParams) => boolean
  expandHotelSpace: (hotelId: string, additionalSpace: number) => boolean
  setRoomInventory: (hotelId: string, inventory: HotelRoomInventory) => boolean
  addFacility: (hotelId: string, facilityId: FacilityId) => boolean
  removeFacility: (hotelId: string, facilityId: FacilityId) => boolean
  renovateHotel: (hotelId: string) => boolean
  hireStaff: (hotelId: string, staff: Partial<HotelStaff>) => boolean
  listHotelForSale: (hotelId: string, listPrice: number) => boolean
  cancelHotelSale: (hotelId: string) => boolean
  acquireHotel: (hotelId: string, offerPrice: number) => AcquireHotelResult
  setHotelPrice: (hotelId: string, price: number) => void
  upgradeHotel: (hotelId: string) => boolean
  load: () => Promise<boolean>
  resetGame: () => void
  nextTutorialStep: () => void
  dismissTutorial: () => void
  markAllNewsRead: () => void
  setStrategyPolicy: (policy: StrategyPolicyId) => void
  borrowFunds: (amount: number) => boolean
  repayDebt: (amount: number) => boolean
  purchaseCity: (cityId: string) => boolean
  startResearch: (techId: TechId) => boolean
  startHotelAd: (hotelId: string, adType: AdTypeId, dailyBudget: number, durationDays: number) => boolean
  stopHotelAd: (campaignId: string) => boolean
  startBrandAd: (adType: AdTypeId, dailyBudget: number, durationDays: number) => boolean
  stopBrandAd: () => boolean
  flyToCity: string | null
  setFlyToCity: (cityId: string | null) => void
  pendingEvent: GameState['activeEvents'][0] | null
  clearPendingEvent: () => void
}

type GameStore = GameState & GameActions & {
  flyToCity: string | null
  pendingEvent: GameState['activeEvents'][0] | null
}

export const useGameStore = create<GameStore>()(
  immer((set, get) => ({
    ...createInitialState(),
    flyToCity: null,
    pendingEvent: null,

    startGame: (brandName) =>
      set((state) => {
        const seed = randomSeed()
        Object.assign(state, createInitialState())
        state.brandName = brandName || '星程酒店'
        state.worldSeed = seed
        state.worldMetrics = initWorldMetrics(seed)
        state.gameStarted = true
        state.paused = false
      }),

    tick: () =>
      set((state) => {
        if (!state.gameStarted || state.paused) return
        applyDaySimulation(state)
      }),

    fastForwardToNextMonth: () => {
      const state = get()
      if (!state.gameStarted) return
      const days = getDaysUntilNextMonth(state.date)
      for (let i = 0; i < days; i++) {
        if (get().paused) break
        set((s) => {
          if (!s.gameStarted) return
          applyDaySimulation(s)
        })
        if (get().pendingEvent) break
      }
    },

    setPaused: (paused) => set({ paused }),
    togglePause: () => set((s) => ({ paused: !s.paused })),

    selectCity: (cityId) =>
      set((s) => {
        s.selectedCityId = cityId
        s.selectedHotelId = null
        if (cityId) {
          s.flyToCity = cityId
          s.mapViewMode = 'city'
          s.showStats = false
          s.showCityPanel = true
        }
      }),

    setShowCityPanel: (show) => set({ showCityPanel: show }),

    selectHotel: (hotelId) =>
      set((s) => {
        s.selectedHotelId = hotelId
        s.showHotelDetail = !!hotelId
        if (hotelId) {
          const hotel = s.hotels.find((h) => h.id === hotelId)
          if (hotel) {
            s.selectedCityId = hotel.cityId
            s.flyToCity = hotel.cityId
            s.showCityPanel = true
          }
        }
      }),

    setShowHotelDetail: (show) =>
      set((s) => {
        s.showHotelDetail = show
        if (!show) s.selectedHotelId = null
      }),

    setShowStats: (show) =>
      set((s) => {
        s.showStats = show
        s.mapViewMode = show ? 'overview' : 'city'
        if (show) {
          s.showBuildPanel = false
          s.buildPlacementMode = false
          s.previewCoordinates = null
        } else if (s.selectedCityId) {
          s.flyToCity = s.selectedCityId
        }
      }),

    setMapViewMode: (mode) => set({ mapViewMode: mode }),
    setShowNews: (show) => set({ showNews: show }),

    setShowBuildPanel: (show, cityId = null) =>
      set((s) => {
        s.showBuildPanel = show
        s.pendingBuildCityId = cityId
        s.buildPlacementMode = show
        s.previewCoordinates = null
        if (show && cityId) {
          s.selectedCityId = cityId
          s.flyToCity = cityId
        }
        if (!show) s.buildPlacementMode = false
      }),

    setMapLayer: (layer) => set({ activeMapLayer: layer }),
    setBuildPlacementMode: (mode) => set({ buildPlacementMode: mode }),
    setPreviewCoordinates: (coords) => set({ previewCoordinates: coords }),

    buildHotel: (params) => {
      const state = get()
      const city = getCityById(params.cityId)
      const config = STAR_CONFIG[params.stars]

      const opening = defaultOpeningConfig(params.stars)
      const roomInventory = params.roomInventory ?? opening.roomInventory
      const facilities = params.facilities ?? opening.facilities
      const spaceTotal = params.spaceTotal ?? STAR_CONFIG[params.stars].spaceTotal

      const buildCheck = validateBuildConfig(roomInventory, facilities, spaceTotal, state.unlockedTechs)
      if (!buildCheck.ok) return false

      const { total: cost } = estimateBuildCostBreakdown({
        stars: params.stars,
        city,
        roomInventory,
        facilities,
        strategyPolicy: state.strategyPolicy,
      })

      if (state.cash < cost) return false
      if (!state.unlockedCities.includes(params.cityId)) return false
      if (!params.gridCellId) return false
      if (!isWithinBounds(params.coordinates[0], params.coordinates[1], getCityBounds(city))) return false
      if (isCellOccupied(state.hotels, params.cityId, params.gridCellId)) return false

      set((s) => {
        s.cash -= cost
        s.hotels.push(
          createHotelFromConfig({
            name: `${s.brandName}·${city.name.zh}`,
            cityId: params.cityId,
            ownerId: 'player',
            coordinates: params.coordinates,
            gridCellId: params.gridCellId,
            stars: params.stars,
            price: params.price,
            quality: config.baseQuality,
            builtAt: { ...s.date },
            roomInventory,
            facilities,
            spaceTotal,
          }),
        )
        s.showBuildPanel = false
        s.pendingBuildCityId = null
        s.buildPlacementMode = false
        s.previewCoordinates = null
        s.flyToCity = params.cityId
      })
      return true
    },

    expandHotelSpace: (hotelId, additionalSpace) => {
      const state = get()
      const hotel = state.hotels.find((h) => h.id === hotelId && h.ownerId === 'player')
      if (!hotel || additionalSpace <= 0) return false
      if ((hotel.expansionDaysRemaining ?? 0) > 0) return false

      const cost = calcExpansionCost(hotel, additionalSpace)
      if (state.cash < cost) return false

      set((s) => {
        const h = s.hotels.find((x) => x.id === hotelId)
        if (!h) return
        s.cash -= cost
        h.pendingExpansionSpace = additionalSpace
        h.expansionDaysRemaining = calcExpansionDays(additionalSpace)
      })
      return true
    },

    setRoomInventory: (hotelId, inventory) => {
      const state = get()
      const hotel = state.hotels.find((h) => h.id === hotelId && h.ownerId === 'player')
      if (!hotel) return false

      const check = validateRoomInventoryUpdate(
        inventory,
        hotel.facilities,
        hotel.spaceTotal,
        state.unlockedTechs,
      )
      if (!check.ok) return false

      set((s) => {
        const h = s.hotels.find((x) => x.id === hotelId)
        if (!h) return
        h.roomInventory = { ...inventory }
        h.staff = clampStaff(h.staff, h)
      })
      return true
    },

    addFacility: (hotelId, facilityId) => {
      const state = get()
      const hotel = state.hotels.find((h) => h.id === hotelId && h.ownerId === 'player')
      if (!hotel || hotel.facilities.includes(facilityId)) return false
      if (!canSelectFacility(facilityId, state.unlockedTechs)) return false

      const facilityCost = FACILITIES[facilityId]?.spaceCost ?? 0
      if (calcSpaceFree(hotel) < facilityCost) return false

      set((s) => {
        const h = s.hotels.find((x) => x.id === hotelId)
        if (!h || h.facilities.includes(facilityId)) return
        h.facilities.push(facilityId)
        h.staff = clampStaff(h.staff, h)
      })
      return true
    },

    removeFacility: (hotelId, facilityId) => {
      if (facilityId === 'lobby') return false
      const state = get()
      const hotel = state.hotels.find((h) => h.id === hotelId && h.ownerId === 'player')
      if (!hotel || !hotel.facilities.includes(facilityId)) return false
      if (!canRemoveFacility(hotel, facilityId, state.unlockedTechs)) return false

      set((s) => {
        const h = s.hotels.find((x) => x.id === hotelId)
        if (!h) return
        h.facilities = h.facilities.filter((f) => f !== facilityId)
        h.staff = clampStaff(h.staff, h)
      })
      return true
    },

    renovateHotel: (hotelId) => {
      const state = get()
      const hotel = state.hotels.find((h) => h.id === hotelId && h.ownerId === 'player')
      if (!hotel || hotel.quality >= 95) return false
      if ((hotel.renovationCooldownDays ?? 0) > 0) return false

      const cost = getUpgradeCost(hotel)
      if (state.cash < cost) return false

      set((s) => {
        const h = s.hotels.find((x) => x.id === hotelId)
        if (!h) return
        s.cash -= cost
        h.quality = Math.min(95, h.quality + 8)
        h.renovationCooldownDays = 14
      })
      return true
    },

    hireStaff: (hotelId, staff) => {
      const state = get()
      const hotel = state.hotels.find((h) => h.id === hotelId && h.ownerId === 'player')
      if (!hotel) return false

      const requested = {
        frontDesk: staff.frontDesk ?? hotel.staff.frontDesk,
        housekeeping: staff.housekeeping ?? hotel.staff.housekeeping,
        foodService: staff.foodService ?? hotel.staff.foodService,
        engineering: staff.engineering ?? hotel.staff.engineering,
      }
      const nextStaff = clampStaff(requested, hotel)
      if (
        requested.frontDesk !== nextStaff.frontDesk ||
        requested.housekeeping !== nextStaff.housekeeping ||
        requested.foodService !== nextStaff.foodService ||
        requested.engineering !== nextStaff.engineering
      ) {
        return false
      }

      set((s) => {
        const h = s.hotels.find((x) => x.id === hotelId)
        if (!h) return
        h.staff = nextStaff
      })
      return true
    },

    listHotelForSale: (hotelId, listPrice) => {
      const state = get()
      const hotel = state.hotels.find((h) => h.id === hotelId && h.ownerId === 'player')
      if (!hotel || listPrice <= 0) return false

      const city = getCityById(hotel.cityId)
      const gridPoints = rebuildGrid(state.worldMetrics, state.worldSeed, state.date.year, state.activeEvents)
      const value = estimateHotelValue(hotel, city, gridPoints)
      const { min: minPrice, max: maxPrice } = getListPriceBounds(value)
      if (listPrice < minPrice || listPrice > maxPrice) return false

      set((s) => {
        const h = s.hotels.find((x) => x.id === hotelId)
        if (!h) return
        h.saleListing = { listPrice }
      })
      return true
    },

    cancelHotelSale: (hotelId) => {
      const state = get()
      const hotel = state.hotels.find((h) => h.id === hotelId && h.ownerId === 'player')
      if (!hotel?.saleListing) return false

      set((s) => {
        const h = s.hotels.find((x) => x.id === hotelId)
        if (!h) return
        h.saleListing = undefined
      })
      return true
    },

    acquireHotel: (hotelId, offerPrice) => {
      const state = get()
      const hotel = state.hotels.find((h) => h.id === hotelId)
      if (!hotel) return { ok: false, status: 'error', error: 'not_found' }
      if (hotel.ownerId === 'player') return { ok: false, status: 'error', error: 'already_owned' }
      if (offerPrice <= 0) return { ok: false, status: 'error', error: 'invalid_offer' }
      if (state.cash < offerPrice) return { ok: false, status: 'error', error: 'insufficient_funds' }

      const ownerCash = state.competitors.find((c) => c.id === hotel.ownerId)?.cash
      const quote = buildAcquisitionQuote(hotel, state)
      if (offerPrice < quote.minOffer || offerPrice > quote.maxOffer) {
        return { ok: false, status: 'error', error: 'invalid_offer' }
      }

      const distressed = isOwnerInDistress(hotel, ownerCash)
      const response = evaluateAcquisitionOffer(offerPrice, quote, distressed)

      if (response.outcome === 'rejected') {
        return { ok: false, status: 'rejected' }
      }
      if (response.outcome === 'counter') {
        return { ok: false, status: 'counter', counterOffer: response.counterOffer }
      }

      const city = getCityById(hotel.cityId)
      const sellerId = hotel.ownerId
      set((s) => {
        const h = s.hotels.find((x) => x.id === hotelId)
        if (!h) return
        s.cash -= offerPrice
        h.ownerId = 'player'
        h.name = `${s.brandName}·${city.name.zh}`
        h.saleListing = undefined
        const seller = s.competitors.find((c) => c.id === sellerId)
        if (seller) seller.cash += offerPrice
        s.creditRating = calculateCreditRating(s)
      })
      return { ok: true, status: 'accepted' }
    },

    setHotelPrice: (hotelId, price) =>
      set((s) => {
        const hotel = s.hotels.find((h) => h.id === hotelId && h.ownerId === 'player')
        if (hotel) hotel.price = Math.max(50, Math.round(price))
      }),

    upgradeHotel: (hotelId) => {
      const state = get()
      const hotel = state.hotels.find((h) => h.id === hotelId && h.ownerId === 'player')
      if (!hotel || hotel.quality >= 95) return false
      const cost = getUpgradeCost(hotel)
      if (state.cash < cost) return false

      set((s) => {
        const h = s.hotels.find((x) => x.id === hotelId)
        if (!h) return
        s.cash -= cost
        h.quality = Math.min(95, h.quality + 8)
      })
      return true
    },

    load: async () => {
      const saved = await loadGame()
      if (!saved) return false
      set((s) => {
        Object.assign(s, saved)
        s.gameStarted = true
        s.flyToCity = null
        s.pendingEvent = null
        if (!s.worldSeed) s.worldSeed = randomSeed()
        if (!s.worldMetrics) s.worldMetrics = initWorldMetrics(s.worldSeed)
        if (!s.newsFeed) s.newsFeed = []
        if (!s.activeMapLayer) s.activeMapLayer = 'none'
        if (!s.strategyPolicy) s.strategyPolicy = 'balanced'
        if (s.debt == null) s.debt = 0
        if (!s.baseInterestRate) s.baseInterestRate = 0.055
        if (!s.unlockedTechs?.length) s.unlockedTechs = ['basic_ops']
        if (s.researchingTech === undefined) s.researchingTech = null
        if (!s.hotelAds) s.hotelAds = []
        if (s.brandAd === undefined) s.brandAd = null
        if (!s.cityWeathers) s.cityWeathers = {}
        migrateAdCampaignFields(s)
        if (s.dailyCashDelta == null) s.dailyCashDelta = 0
        if (!s.mapViewMode) s.mapViewMode = s.showStats ? 'overview' : 'city'
        if (s.showCityPanel == null) s.showCityPanel = !!s.selectedCityId
        if (s.showHotelDetail == null) s.showHotelDetail = false
        if (!s.selectedCityId && s.mapViewMode === 'city' && !s.showStats) {
          s.selectedCityId = s.unlockedCities[0] ?? 'hong-kong'
        }
        s.creditRating = calculateCreditRating(s)
        migrateHotelGridCells(s)
        migrateHotelsToSpaceModel(s)
      })
      return true
    },

    resetGame: () => {
      void deleteSave()
      set((s) => {
        Object.assign(s, createInitialState())
        s.flyToCity = null
        s.pendingEvent = null
      })
    },

    nextTutorialStep: () => set((s) => ({ tutorialStep: s.tutorialStep + 1 })),
    dismissTutorial: () => set({ tutorialDismissed: true }),
    markAllNewsRead: () =>
      set((s) => {
        for (const item of s.newsFeed) item.read = true
      }),
    setStrategyPolicy: (policy) =>
      set((s) => {
        s.strategyPolicy = policy
      }),
    borrowFunds: (amount) => {
      const state = get()
      const normalized = Math.max(0, Math.round(amount))
      const limit = getBorrowingLimit(state)
      if (normalized <= 0 || state.debt + normalized > limit) return false
      set((s) => {
        s.cash += normalized
        s.debt += normalized
        s.creditRating = calculateCreditRating(s)
      })
      return true
    },
    repayDebt: (amount) => {
      const state = get()
      const normalized = Math.min(state.debt, Math.max(0, Math.round(amount)))
      if (normalized <= 0 || state.cash < normalized) return false
      set((s) => {
        s.cash -= normalized
        s.debt -= normalized
        s.creditRating = calculateCreditRating(s)
      })
      return true
    },

    purchaseCity: (cityId) => {
      const state = get()
      const check = canPurchaseCity(state, cityId)
      if (!check.ok) return false
      const fee = cityMap[cityId]?.unlockFee ?? 0
      set((s) => {
        s.cash -= fee
        if (!s.unlockedCities.includes(cityId)) {
          s.unlockedCities.push(cityId)
        }
        s.selectedCityId = cityId
        s.flyToCity = cityId
        s.mapViewMode = 'city'
        s.showStats = false
        s.creditRating = calculateCreditRating(s)
      })
      return true
    },

    startResearch: (techId) => {
      const state = get()
      const result = applyStartResearch(state, techId)
      if (!result) return false
      set((s) => {
        s.cash = result.cash
        s.researchingTech = result.researchingTech
      })
      return true
    },

    startHotelAd: (hotelId, adType, dailyBudget, durationDays) => {
      const state = get()
      const campaign = applyStartHotelAd(state, hotelId, adType, dailyBudget, durationDays)
      if (!campaign) return false
      set((s) => {
        s.hotelAds.push(campaign)
      })
      return true
    },

    stopHotelAd: (campaignId) => {
      const state = get()
      const campaign = state.hotelAds.find((ad) => ad.id === campaignId)
      if (!campaign) return false
      const hotel = state.hotels.find((h) => h.id === campaign.hotelId)
      if (!hotel || hotel.ownerId !== 'player') return false

      set((s) => {
        s.hotelAds = s.hotelAds.filter((ad) => ad.id !== campaignId)
      })
      return true
    },

    startBrandAd: (adType, dailyBudget, durationDays) => {
      const state = get()
      const campaign = applyStartBrandAd(state, adType, dailyBudget, durationDays)
      if (!campaign) return false
      set((s) => {
        s.brandAd = campaign
      })
      return true
    },

    stopBrandAd: () => {
      const state = get()
      if (!state.brandAd) return false
      set((s) => {
        s.brandAd = null
      })
      return true
    },

    setFlyToCity: (cityId) => set({ flyToCity: cityId }),
    clearPendingEvent: () => set({ pendingEvent: null, paused: false }),
  })),
)

function applyDaySimulation(state: GameState & { pendingEvent?: GameState['activeEvents'][0] | null }): void {
  const updates = simulateDay(state)
  Object.assign(state, updates)
  if (updates.pendingMajorEvent) {
    state.pendingEvent = updates.pendingMajorEvent
    state.paused = true
  }
}

function migrateAdCampaignFields(state: GameState): void {
  state.hotelAds = (state.hotelAds ?? []).map((campaign) => {
    const legacy = campaign as typeof campaign & { remainingDays?: number }
    const rawType = legacy.adType as string
    const adType = (rawType === 'transit' ? 'metro' : legacy.adType) as AdTypeId
    return {
      ...campaign,
      adType,
      daysRemaining: campaign.daysRemaining ?? legacy.remainingDays ?? 0,
      startedAt: campaign.startedAt ?? { ...state.date },
    }
  })

  if (state.brandAd) {
    const legacy = state.brandAd as typeof state.brandAd & { remainingDays?: number }
    const rawType = legacy.adType as string
    state.brandAd = {
      adType: (rawType === 'transit' ? 'metro' : legacy.adType) as AdTypeId,
      dailyBudget: legacy.dailyBudget,
      daysRemaining: legacy.daysRemaining ?? legacy.remainingDays ?? 0,
    }
  }
}

function migrateHotelsToSpaceModel(state: GameState): void {
  state.hotels = state.hotels.map((hotel) => migrateHotelToSpaceModel(hotel as Parameters<typeof migrateHotelToSpaceModel>[0]))
}

function migrateHotelGridCells(state: GameState): void {
  for (const hotel of state.hotels) {
    if (hotel.gridCellId) continue
    const cell = snapToHexCell(hotel.coordinates[0], hotel.coordinates[1], hotel.cityId)
    if (cell) {
      hotel.gridCellId = cell.cellId
      hotel.coordinates = [cell.lng, cell.lat]
    } else {
      const fallback = pickAvailableHexCell(hotel.cityId, state.hotels, hotel.id.length)
      if (fallback) {
        hotel.gridCellId = fallback.cellId
        hotel.coordinates = [fallback.lng, fallback.lat]
      }
    }
  }
}
