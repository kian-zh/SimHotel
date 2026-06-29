export type MapLayerId = 'none' | 'population' | 'economy' | 'tourism'
export type MapViewMode = 'city' | 'overview'

export interface CityBounds {
  west: number
  south: number
  east: number
  north: number
}
export type EventTier = 'major' | 'minor'
export type EventCategory = 'politics' | 'economy' | 'disaster' | 'tourism' | 'technology' | 'health' | 'infrastructure'

export interface CityMetrics {
  population: number
  economy: number
  tourism: number
}

export interface GridPoint {
  lng: number
  lat: number
  population: number
  economy: number
  tourism: number
  cityId: string
  cellId: string
}

export interface AttractionPOI {
  id: string
  cityId: string
  name: LocalizedName
  coordinates: [number, number]
  tourismWeight: number
  economyWeight?: number
}

export interface LocalizedName {
  zh: string
  en: string
}

export interface GameDate {
  year: number
  month: number
  day: number
}

export type HotelStar = 3 | 4 | 5
export type RoomTypeId =
  | 'king'
  | 'twin'
  | 'dorm6'
  | 'suite'
  | 'deluxe_suite'
  | 'executive_suite'
  | 'luxury_resort_suite'
export type FacilityId =
  | 'lobby'
  | 'laundry'
  | 'pool'
  | 'restaurant'
  | 'fine_dining'
  | 'gym'
  | 'executive_lounge'
  | 'conference'
  | 'spa'
export type TargetSegment = 'budget' | 'leisure' | 'business' | 'family' | 'luxury'
export type TechId =
  | 'basic_ops'
  | 'leisure_1'
  | 'dining_excellence'
  | 'resort_luxury'
  | 'business_premium'
  | 'mice_economy'
  | 'luxury_resort_rooms'
export type AdTypeId = 'metro' | 'airport' | 'ota' | 'finance_media' | 'social' | 'luxury_mag'
export type CompetitorPersonality = 'aggressive' | 'price_warrior' | 'premium' | 'regional'
export type StrategyPolicyId = 'balanced' | 'expansion' | 'luxury' | 'efficiency' | 'defensive'
export type CreditRating = 'AAA' | 'A' | 'BBB' | 'B' | 'Distressed'

export interface Seasonality {
  peak: number[]
  multiplier: number
}

export interface MarketParams {
  basePopulation: number
  businessTravel: number
  tourism: number
  priceElasticity: number
  regulatoryCost: number
  infrastructure: number
  seasonality: Seasonality
  willingnessToPay: number
}

export interface CityConfig {
  id: string
  name: LocalizedName
  coordinates: [number, number]
  bounds?: CityBounds
  /** Earliest game year when the city can be purchased */
  unlockYear: number
  /** One-time fee to open the market (Hong Kong starts unlocked at 0) */
  unlockFee: number
  region: string
  market: MarketParams
}

export interface RoomTypeConfig {
  id: RoomTypeId
  spaceCost: number
  basePrice: number
  targetSegment: TargetSegment
  requiredTech?: TechId
  requiredFacility?: FacilityId
}

export interface FacilityConfig {
  id: FacilityId
  spaceCost: number
  requiredTech?: TechId
  demandBonus: number
  revenueBonus: number
  costReduction: number
}

export type HotelRoomInventory = Record<RoomTypeId, number>
export type HotelFacilityList = FacilityId[]

export interface HotelStaff {
  frontDesk: number
  housekeeping: number
  foodService: number
  engineering: number
}

export interface HotelHistoryEntry {
  date: string
  occupancy: number
  revenue: number
  expense: number
  profit: number
}

export interface HotelSaleListing {
  listPrice: number
}

export interface Hotel {
  id: string
  name: string
  cityId: string
  ownerId: string
  coordinates: [number, number]
  gridCellId: string
  stars: HotelStar
  spaceTotal: number
  roomInventory: HotelRoomInventory
  facilities: HotelFacilityList
  staff: HotelStaff
  history: HotelHistoryEntry[]
  price: number
  quality: number
  occupancy: number
  dailyRevenue: number
  builtAt: GameDate
  renovationCooldownDays?: number
  expansionDaysRemaining?: number
  /** Space added to spaceTotal when expansionDaysRemaining reaches 0 */
  pendingExpansionSpace?: number
  saleListing?: HotelSaleListing
}

export interface ResearchingTech {
  techId: TechId
  daysRemaining: number
}

export interface TechConfig {
  id: TechId
  name: LocalizedName
  description: LocalizedName
  cost: number
  durationDays: number
  prerequisites: TechId[]
  unlocksFacilities?: FacilityId[]
  unlocksRoomTypes?: RoomTypeId[]
}

export interface AdCampaign {
  id: string
  hotelId: string
  adType: AdTypeId
  dailyBudget: number
  daysRemaining: number
  startedAt: GameDate
}

export interface BrandAdCampaign {
  adType: AdTypeId
  dailyBudget: number
  daysRemaining: number
}

export interface Competitor {
  id: string
  name: LocalizedName
  personality: CompetitorPersonality
  cash: number
  reputation: number
  color: string
}

export interface MarketModifiers {
  tourism?: number
  businessTravel?: number
  demand?: number
  population?: number
  economy?: number
}

export interface GameEventConfig {
  id: string
  date: string
  tier: EventTier
  category: EventCategory
  title: LocalizedName
  description: LocalizedName
  affectedMarkets: string[]
  modifiers: MarketModifiers
  durationDays: number
}

export interface NewsItem {
  id: string
  date: string
  tier: EventTier
  category: EventCategory
  title: LocalizedName
  summary: LocalizedName
  read: boolean
}

export interface ActiveEvent {
  eventId: string
  tier: EventTier
  category: EventCategory
  title: LocalizedName
  description: LocalizedName
  affectedMarkets: string[]
  modifiers: MarketModifiers
  remainingDays: number
}

export interface FinanceSnapshot {
  date: string
  cash: number
  dailyRevenue: number
  dailyExpense: number
  debt: number
  interestExpense: number
}

export interface CityMarketState {
  cityId: string
  dailyDemand: number
  avgPrice: number
  playerShare: number
}

export interface GameState {
  date: GameDate
  cash: number
  dailyCashDelta: number
  reputation: number
  paused: boolean
  hotels: Hotel[]
  competitors: Competitor[]
  unlockedCities: string[]
  activeEvents: ActiveEvent[]
  triggeredEventIds: string[]
  cityMarkets: Record<string, CityMarketState>
  financeHistory: FinanceSnapshot[]
  selectedCityId: string | null
  selectedHotelId: string | null
  showHotelDetail: boolean
  showCityPanel: boolean
  showStats: boolean
  mapViewMode: MapViewMode
  showBuildPanel: boolean
  pendingBuildCityId: string | null
  tutorialStep: number
  tutorialDismissed: boolean
  lastAutoSaveAt: string | null
  gameStarted: boolean
  brandName: string
  worldSeed: number
  worldMetrics: Record<string, CityMetrics>
  newsFeed: NewsItem[]
  activeMapLayer: MapLayerId
  buildPlacementMode: boolean
  previewCoordinates: [number, number] | null
  showNews: boolean
  gridVersion: number
  strategyPolicy: StrategyPolicyId
  debt: number
  creditRating: CreditRating
  baseInterestRate: number
  unlockedTechs: TechId[]
  researchingTech: ResearchingTech | null
  hotelAds: AdCampaign[]
  brandAd: BrandAdCampaign | null
}

export interface BuildHotelParams {
  cityId: string
  stars: HotelStar
  price: number
  coordinates: [number, number]
  gridCellId: string
  roomInventory?: HotelRoomInventory
  facilities?: HotelFacilityList
  spaceTotal?: number
}

export const STAR_CONFIG: Record<HotelStar, { rooms: number; buildCost: number; baseQuality: number; basePrice: number }> = {
  3: { rooms: 80, buildCost: 2_500_000, baseQuality: 55, basePrice: 120 },
  4: { rooms: 120, buildCost: 5_000_000, baseQuality: 72, basePrice: 220 },
  5: { rooms: 180, buildCost: 12_000_000, baseQuality: 88, basePrice: 450 },
}

export const INITIAL_SPACE_TOTAL = 20

export const MIN_OPENING_REQUIREMENTS = {
  requiredFacilities: ['lobby'] as FacilityId[],
  minRooms: 3,
}

export const ROOM_TYPES: Record<RoomTypeId, RoomTypeConfig> = {
  king: { id: 'king', spaceCost: 1, basePrice: 120, targetSegment: 'leisure' },
  twin: { id: 'twin', spaceCost: 1, basePrice: 130, targetSegment: 'family' },
  dorm6: { id: 'dorm6', spaceCost: 1.5, basePrice: 45, targetSegment: 'budget' },
  suite: { id: 'suite', spaceCost: 2, basePrice: 280, targetSegment: 'business' },
  deluxe_suite: {
    id: 'deluxe_suite',
    spaceCost: 3,
    basePrice: 420,
    targetSegment: 'luxury',
    requiredFacility: 'restaurant',
  },
  executive_suite: {
    id: 'executive_suite',
    spaceCost: 4,
    basePrice: 580,
    targetSegment: 'business',
    requiredTech: 'business_premium',
  },
  luxury_resort_suite: {
    id: 'luxury_resort_suite',
    spaceCost: 5,
    basePrice: 850,
    targetSegment: 'luxury',
    requiredTech: 'luxury_resort_rooms',
  },
}

export const FACILITIES: Record<FacilityId, FacilityConfig> = {
  lobby: { id: 'lobby', spaceCost: 3, demandBonus: 0, revenueBonus: 0, costReduction: 0 },
  laundry: { id: 'laundry', spaceCost: 2, demandBonus: 0.02, revenueBonus: 0, costReduction: 0.04 },
  pool: { id: 'pool', spaceCost: 4, requiredTech: 'leisure_1', demandBonus: 0.08, revenueBonus: 0.03, costReduction: 0 },
  restaurant: { id: 'restaurant', spaceCost: 3, demandBonus: 0.04, revenueBonus: 0.06, costReduction: 0 },
  fine_dining: {
    id: 'fine_dining',
    spaceCost: 5,
    requiredTech: 'dining_excellence',
    demandBonus: 0.06,
    revenueBonus: 0.12,
    costReduction: 0,
  },
  gym: { id: 'gym', spaceCost: 2, requiredTech: 'leisure_1', demandBonus: 0.05, revenueBonus: 0.02, costReduction: 0 },
  executive_lounge: {
    id: 'executive_lounge',
    spaceCost: 3,
    requiredTech: 'business_premium',
    demandBonus: 0.07,
    revenueBonus: 0.08,
    costReduction: 0,
  },
  conference: {
    id: 'conference',
    spaceCost: 6,
    requiredTech: 'mice_economy',
    demandBonus: 0.1,
    revenueBonus: 0.15,
    costReduction: 0,
  },
  spa: {
    id: 'spa',
    spaceCost: 4,
    requiredTech: 'resort_luxury',
    demandBonus: 0.09,
    revenueBonus: 0.1,
    costReduction: 0,
  },
}

export const TECH_TREE: Record<TechId, TechConfig> = {
  basic_ops: {
    id: 'basic_ops',
    name: { zh: '基础运营', en: 'Basic Operations' },
    description: {
      zh: '集团开业默认能力：大堂、基础客房与洗衣餐饮设施。',
      en: 'Default opening capabilities: lobby, basic rooms, laundry, and dining.',
    },
    cost: 0,
    durationDays: 0,
    prerequisites: [],
  },
  leisure_1: {
    id: 'leisure_1',
    name: { zh: '休闲设施 I', en: 'Leisure Facilities I' },
    description: {
      zh: '引进泳池与健身房，提升度假与商务客群留存。',
      en: 'Introduce pool and gym to improve leisure and business guest retention.',
    },
    cost: 350_000,
    durationDays: 30,
    prerequisites: ['basic_ops'],
    unlocksFacilities: ['pool', 'gym'],
  },
  dining_excellence: {
    id: 'dining_excellence',
    name: { zh: '餐饮卓越', en: 'Dining Excellence' },
    description: {
      zh: '升级餐饮标准，解锁高级餐厅与更高客单价。',
      en: 'Elevate F&B standards to unlock fine dining and higher ADR.',
    },
    cost: 420_000,
    durationDays: 35,
    prerequisites: ['basic_ops'],
    unlocksFacilities: ['fine_dining'],
  },
  resort_luxury: {
    id: 'resort_luxury',
    name: { zh: '度假奢华', en: 'Resort Luxury' },
    description: {
      zh: '打造 SPA 与水疗体验，吸引高端度假客群。',
      en: 'Build spa experiences to attract premium resort travelers.',
    },
    cost: 680_000,
    durationDays: 45,
    prerequisites: ['leisure_1'],
    unlocksFacilities: ['spa'],
  },
  business_premium: {
    id: 'business_premium',
    name: { zh: '商务尊享', en: 'Business Premium' },
    description: {
      zh: '行政酒廊与尊享套间，服务高管与贵宾客群。',
      en: 'Executive lounge and premium suites for C-suite and VIP guests.',
    },
    cost: 550_000,
    durationDays: 40,
    prerequisites: ['dining_excellence'],
    unlocksFacilities: ['executive_lounge'],
    unlocksRoomTypes: ['executive_suite'],
  },
  mice_economy: {
    id: 'mice_economy',
    name: { zh: '会展经济', en: 'MICE Economy' },
    description: {
      zh: '会议中心与会展接待能力，承接商务会展需求。',
      en: 'Conference facilities and MICE hosting for business events.',
    },
    cost: 720_000,
    durationDays: 50,
    prerequisites: ['business_premium'],
    unlocksFacilities: ['conference'],
  },
  luxury_resort_rooms: {
    id: 'luxury_resort_rooms',
    name: { zh: '奢侈度假套间', en: 'Luxury Resort Suites' },
    description: {
      zh: '旗舰级度假套间房型，面向高净值度假客群。',
      en: 'Flagship resort suite room type for high-net-worth vacationers.',
    },
    cost: 900_000,
    durationDays: 55,
    prerequisites: ['resort_luxury'],
    unlocksRoomTypes: ['luxury_resort_suite'],
  },
}

export const INITIAL_DATE: GameDate = { year: 1990, month: 1, day: 1 }
export const INITIAL_CASH = 8_000_000

export interface StrategyPolicyConfig {
  id: StrategyPolicyId
  name: LocalizedName
  description: LocalizedName
  buildCostMultiplier: number
  operatingCostMultiplier: number
  demandScoreMultiplier: number
  reputationDelta: number
  riskNote: LocalizedName
}

export const STRATEGY_POLICIES: Record<StrategyPolicyId, StrategyPolicyConfig> = {
  balanced: {
    id: 'balanced',
    name: { zh: '稳健经营', en: 'Balanced Operations' },
    description: {
      zh: '维持稳健现金流和适度扩张，适合不确定时期。',
      en: 'Keeps cash flow steady while expanding at a controlled pace.',
    },
    buildCostMultiplier: 1,
    operatingCostMultiplier: 1,
    demandScoreMultiplier: 1,
    reputationDelta: 0,
    riskNote: { zh: '无明显短板，但也缺少爆发力。', en: 'No sharp weakness, but limited upside.' },
  },
  expansion: {
    id: 'expansion',
    name: { zh: '跑马圈地', en: 'Rapid Expansion' },
    description: {
      zh: '压低建造标准以更快进入新城市，短期声誉承压。',
      en: 'Cuts development friction to enter new cities faster, at a reputation cost.',
    },
    buildCostMultiplier: 0.88,
    operatingCostMultiplier: 1.04,
    demandScoreMultiplier: 0.97,
    reputationDelta: -0.02,
    riskNote: { zh: '更便宜的开店成本，但服务稳定性下降。', en: 'Cheaper openings, weaker service consistency.' },
  },
  luxury: {
    id: 'luxury',
    name: { zh: '奢华旗舰', en: 'Luxury Flagship' },
    description: {
      zh: '强化品牌溢价和服务体验，吸引高价值客群。',
      en: 'Builds brand premium and service experience for high-value travelers.',
    },
    buildCostMultiplier: 1.12,
    operatingCostMultiplier: 1.1,
    demandScoreMultiplier: 1.12,
    reputationDelta: 0.035,
    riskNote: { zh: '吸引力更强，但资本开支和运营费用更重。', en: 'Stronger pull, but heavier capex and operating costs.' },
  },
  efficiency: {
    id: 'efficiency',
    name: { zh: '精益运营', en: 'Lean Operations' },
    description: {
      zh: '压缩后台和采购成本，提高危机中的生存能力。',
      en: 'Compresses back-office and procurement costs for crisis resilience.',
    },
    buildCostMultiplier: 0.97,
    operatingCostMultiplier: 0.86,
    demandScoreMultiplier: 0.94,
    reputationDelta: -0.005,
    riskNote: { zh: '利润率更稳，但客户体验略受影响。', en: 'Margins improve while guest experience softens slightly.' },
  },
  defensive: {
    id: 'defensive',
    name: { zh: '防守收缩', en: 'Defensive Posture' },
    description: {
      zh: '暂停激进增长，保留现金并提高逆风环境下的韧性。',
      en: 'Slows growth, preserves cash, and improves resilience during downturns.',
    },
    buildCostMultiplier: 1.03,
    operatingCostMultiplier: 0.92,
    demandScoreMultiplier: 1.02,
    reputationDelta: 0.01,
    riskNote: { zh: '适合危机期，长期扩张速度较慢。', en: 'Useful in crises, slower for long-term expansion.' },
  },
}
