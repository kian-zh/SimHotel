import { clamp, uid } from '../engine/date'
import { calcTotalRooms } from '../hotel/space'
import type {
  ActiveEvent,
  AdCampaign,
  AdTypeId,
  BrandAdCampaign,
  GameState,
  Hotel,
  LocalizedName,
  RoomTypeId,
  TargetSegment,
} from '../types'
import { ROOM_TYPES } from '../types'

export interface AdTypeConfig {
  id: AdTypeId
  name: LocalizedName
  description: LocalizedName
  dailyCostMin: number
  dailyCostMax: number
  durationDays: number
  demandBoost: number
  segmentWeights: Partial<Record<TargetSegment, number>>
}

export const AD_TYPES: Record<AdTypeId, AdTypeConfig> = {
  metro: {
    id: 'metro',
    name: { zh: '地铁/公交灯箱', en: 'Metro & Transit Ads' },
    description: {
      zh: '覆盖本地通勤客流，提升入住率与低价房型需求。',
      en: 'Reach local commuters to lift occupancy and budget-room demand.',
    },
    dailyCostMin: 800,
    dailyCostMax: 4_000,
    durationDays: 14,
    demandBoost: 0.08,
    segmentWeights: { budget: 1, leisure: 0.7 },
  },
  airport: {
    id: 'airport',
    name: { zh: '机场到达厅', en: 'Airport Arrival Ads' },
    description: {
      zh: '触达商务与中转旅客，带动商务房型与短住需求。',
      en: 'Target business and transit travelers for suites and short stays.',
    },
    dailyCostMin: 2_500,
    dailyCostMax: 12_000,
    durationDays: 21,
    demandBoost: 0.1,
    segmentWeights: { business: 1, luxury: 0.35 },
  },
  ota: {
    id: 'ota',
    name: { zh: '旅游杂志 / OTA 首页', en: 'Travel Mag & OTA Placement' },
    description: {
      zh: '吸引度假与家庭客群，平滑季节性波动。',
      en: 'Attract leisure and family guests to smooth seasonal swings.',
    },
    dailyCostMin: 1_500,
    dailyCostMax: 8_000,
    durationDays: 28,
    demandBoost: 0.09,
    segmentWeights: { family: 1, leisure: 0.85 },
  },
  finance_media: {
    id: 'finance_media',
    name: { zh: '财经媒体冠名', en: 'Finance Media Sponsorship' },
    description: {
      zh: '面向高管与会议客群，提升行政套间与会议设施需求。',
      en: 'Reach executives and conference guests for premium suites and MICE.',
    },
    dailyCostMin: 4_000,
    dailyCostMax: 18_000,
    durationDays: 30,
    demandBoost: 0.11,
    segmentWeights: { business: 1, luxury: 0.6 },
  },
  social: {
    id: 'social',
    name: { zh: '社交媒体种草', en: 'Social Media Campaign' },
    description: {
      zh: '触达年轻背包客，高传播、低单价、宿舍型需求。',
      en: 'Reach young backpackers with viral, low-ADR dorm demand.',
    },
    dailyCostMin: 500,
    dailyCostMax: 3_000,
    durationDays: 10,
    demandBoost: 0.07,
    segmentWeights: { budget: 1, leisure: 0.5 },
  },
  luxury_mag: {
    id: 'luxury_mag',
    name: { zh: '奢华生活方式杂志', en: 'Luxury Lifestyle Magazine' },
    description: {
      zh: '面向高净值度假客，提升奢侈套间与高 ADR。',
      en: 'Target high-net-worth vacationers for luxury suites and high ADR.',
    },
    dailyCostMin: 6_000,
    dailyCostMax: 25_000,
    durationDays: 21,
    demandBoost: 0.12,
    segmentWeights: { luxury: 1, business: 0.4 },
  },
}

export type StartAdBlockReason =
  | 'not_found'
  | 'not_owned'
  | 'invalid_budget'
  | 'invalid_duration'
  | 'duplicate'
  | 'brand_active'

export function getAdTypeIds(): AdTypeId[] {
  return Object.keys(AD_TYPES) as AdTypeId[]
}

export function validateAdBudget(adType: AdTypeId, dailyBudget: number): boolean {
  const config = AD_TYPES[adType]
  return dailyBudget >= config.dailyCostMin && dailyBudget <= config.dailyCostMax
}

export function validateAdDuration(durationDays: number): boolean {
  return Number.isFinite(durationDays) && durationDays >= 1 && durationDays <= 90
}

export function budgetEffectiveness(adType: AdTypeId, dailyBudget: number): number {
  const config = AD_TYPES[adType]
  const normalized = clamp(dailyBudget, config.dailyCostMin, config.dailyCostMax)
  const span = config.dailyCostMax - config.dailyCostMin
  if (span <= 0) return 1
  return 0.55 + 0.45 * ((normalized - config.dailyCostMin) / span)
}

/** Marginal diminishing: nth same-type ad contributes base / n. */
export function stackedBoostContribution(baseBoost: number, stackPosition: number): number {
  if (stackPosition <= 0) return 0
  return baseBoost / stackPosition
}

export function getHotelSegmentMatch(
  hotel: Hotel,
  segmentWeights: Partial<Record<TargetSegment, number>>,
): number {
  const totalRooms = calcTotalRooms(hotel.roomInventory)
  if (totalRooms <= 0) return 0.5

  let peakWeight = 0
  for (const weight of Object.values(segmentWeights)) {
    if (weight != null && weight > peakWeight) peakWeight = weight
  }
  if (peakWeight <= 0) return 0.5

  let matched = 0
  for (const [roomType, count] of Object.entries(hotel.roomInventory) as [RoomTypeId, number][]) {
    if (count <= 0) continue
    const segment = ROOM_TYPES[roomType].targetSegment
    matched += (count / totalRooms) * (segmentWeights[segment] ?? 0)
  }

  return clamp(matched / peakWeight, 0.35, 1.25)
}

interface ActiveAdSlot {
  adType: AdTypeId
  dailyBudget: number
  hotelId?: string
}

function collectActiveAdSlots(
  hotelAds: AdCampaign[],
  brandAd: BrandAdCampaign | null,
): ActiveAdSlot[] {
  const slots: ActiveAdSlot[] = []
  if (brandAd && brandAd.daysRemaining > 0) {
    slots.push({ adType: brandAd.adType, dailyBudget: brandAd.dailyBudget })
  }
  for (const campaign of hotelAds) {
    if (campaign.daysRemaining > 0) {
      slots.push({
        adType: campaign.adType,
        dailyBudget: campaign.dailyBudget,
        hotelId: campaign.hotelId,
      })
    }
  }
  return slots
}

function stackPositionForType(slots: ActiveAdSlot[], adType: AdTypeId, index: number): number {
  let position = 0
  for (let i = 0; i <= index; i++) {
    if (slots[i].adType === adType) position += 1
  }
  return position
}

function eventAdMultiplier(adType: AdTypeId, activeEvents: ActiveEvent[]): number {
  let multiplier = 1
  for (const event of activeEvents) {
    if (event.category === 'tourism' && (adType === 'ota' || adType === 'luxury_mag')) {
      multiplier += 0.08
    }
    if (event.category === 'economy' && adType === 'finance_media') {
      multiplier += 0.06
    }
    if (event.category === 'health' && adType === 'social') {
      multiplier -= 0.05
    }
  }
  return clamp(multiplier, 0.75, 1.35)
}

export function getBrandDemandMultiplier(
  brandAd: BrandAdCampaign | null,
  hotelAds: AdCampaign[],
  activeEvents: ActiveEvent[] = [],
): number {
  if (!brandAd || brandAd.daysRemaining <= 0) return 1

  const slots = collectActiveAdSlots(hotelAds, brandAd)
  const brandIndex = slots.findIndex((slot) => !slot.hotelId && slot.adType === brandAd.adType)
  if (brandIndex < 0) return 1

  const config = AD_TYPES[brandAd.adType]
  const base =
    config.demandBoost *
    budgetEffectiveness(brandAd.adType, brandAd.dailyBudget) *
    eventAdMultiplier(brandAd.adType, activeEvents)
  const position = stackPositionForType(slots, brandAd.adType, brandIndex)
  const boost = stackedBoostContribution(base, position)

  return 1 + boost
}

export function getHotelAdAttractivenessMultiplier(
  hotel: Hotel,
  hotelAds: AdCampaign[],
  brandAd: BrandAdCampaign | null,
  activeEvents: ActiveEvent[] = [],
): number {
  const slots = collectActiveAdSlots(hotelAds, brandAd)
  const hotelCampaigns = hotelAds.filter(
    (campaign) => campaign.hotelId === hotel.id && campaign.daysRemaining > 0,
  )
  if (hotelCampaigns.length === 0) return 1

  let boost = 0
  for (const campaign of hotelCampaigns) {
    const slotIndex = slots.findIndex(
      (slot) => slot.hotelId === campaign.hotelId && slot.adType === campaign.adType,
    )
    if (slotIndex < 0) continue

    const config = AD_TYPES[campaign.adType]
    const base =
      config.demandBoost *
      budgetEffectiveness(campaign.adType, campaign.dailyBudget) *
      eventAdMultiplier(campaign.adType, activeEvents)
    const position = stackPositionForType(slots, campaign.adType, slotIndex)
    const segmentMatch = getHotelSegmentMatch(hotel, config.segmentWeights)
    boost += stackedBoostContribution(base, position) * segmentMatch
  }

  return 1 + boost
}

export function canStartHotelAd(
  state: Pick<GameState, 'hotels' | 'hotelAds'>,
  hotelId: string,
  adType: AdTypeId,
  dailyBudget: number,
  durationDays: number,
): { ok: true } | { ok: false; reason: StartAdBlockReason } {
  const hotel = state.hotels.find((h) => h.id === hotelId)
  if (!hotel) return { ok: false, reason: 'not_found' }
  if (hotel.ownerId !== 'player') return { ok: false, reason: 'not_owned' }
  if (!validateAdBudget(adType, dailyBudget)) return { ok: false, reason: 'invalid_budget' }
  if (!validateAdDuration(durationDays)) return { ok: false, reason: 'invalid_duration' }

  const duplicate = state.hotelAds.some(
    (campaign) =>
      campaign.hotelId === hotelId && campaign.adType === adType && campaign.daysRemaining > 0,
  )
  if (duplicate) return { ok: false, reason: 'duplicate' }

  return { ok: true }
}

export function canStartBrandAd(
  state: Pick<GameState, 'brandAd'>,
  adType: AdTypeId,
  dailyBudget: number,
  durationDays: number,
): { ok: true } | { ok: false; reason: StartAdBlockReason } {
  if (state.brandAd && state.brandAd.daysRemaining > 0) {
    return { ok: false, reason: 'brand_active' }
  }
  if (!validateAdBudget(adType, dailyBudget)) return { ok: false, reason: 'invalid_budget' }
  if (!validateAdDuration(durationDays)) return { ok: false, reason: 'invalid_duration' }
  return { ok: true }
}

export function applyStartHotelAd(
  state: Pick<GameState, 'hotels' | 'hotelAds' | 'date'>,
  hotelId: string,
  adType: AdTypeId,
  dailyBudget: number,
  durationDays: number,
): AdCampaign | null {
  const check = canStartHotelAd(state, hotelId, adType, dailyBudget, durationDays)
  if (!check.ok) return null

  return {
    id: uid('ad'),
    hotelId,
    adType,
    dailyBudget: Math.round(dailyBudget),
    daysRemaining: Math.round(durationDays),
    startedAt: { ...state.date },
  }
}

export function applyStartBrandAd(
  state: Pick<GameState, 'brandAd'>,
  adType: AdTypeId,
  dailyBudget: number,
  durationDays: number,
): BrandAdCampaign | null {
  const check = canStartBrandAd(state, adType, dailyBudget, durationDays)
  if (!check.ok) return null

  return {
    adType,
    dailyBudget: Math.round(dailyBudget),
    daysRemaining: Math.round(durationDays),
  }
}

export function processDailyAdBilling(
  hotelAds: AdCampaign[],
  brandAd: BrandAdCampaign | null,
): {
  expense: number
  hotelAds: AdCampaign[]
  brandAd: BrandAdCampaign | null
} {
  let expense = 0

  const nextHotelAds: AdCampaign[] = []
  for (const campaign of hotelAds) {
    if (campaign.daysRemaining <= 0) continue
    expense += campaign.dailyBudget
    const daysRemaining = campaign.daysRemaining - 1
    if (daysRemaining > 0) {
      nextHotelAds.push({ ...campaign, daysRemaining })
    }
  }

  let nextBrandAd: BrandAdCampaign | null = null
  if (brandAd && brandAd.daysRemaining > 0) {
    expense += brandAd.dailyBudget
    const daysRemaining = brandAd.daysRemaining - 1
    if (daysRemaining > 0) {
      nextBrandAd = { ...brandAd, daysRemaining }
    }
  }

  return { expense, hotelAds: nextHotelAds, brandAd: nextBrandAd }
}

export function getActiveHotelAdsForHotel(hotelAds: AdCampaign[], hotelId: string): AdCampaign[] {
  return hotelAds.filter((campaign) => campaign.hotelId === hotelId && campaign.daysRemaining > 0)
}
