import type { Competitor } from '../../game/types'

export const competitors: Competitor[] = [
  {
    id: 'comp-peninsula',
    name: { zh: '半岛集团', en: 'Peninsula Group' },
    personality: 'premium',
    cash: 15_000_000,
    reputation: 85,
    color: '#8b5cf6',
  },
  {
    id: 'comp-marriott',
    name: { zh: '万豪国际', en: 'Marriott Intl' },
    personality: 'aggressive',
    cash: 20_000_000,
    reputation: 78,
    color: '#3b82f6',
  },
  {
    id: 'comp-shangri-la',
    name: { zh: '香格里拉', en: 'Shangri-La' },
    personality: 'regional',
    cash: 12_000_000,
    reputation: 80,
    color: '#f59e0b',
  },
  {
    id: 'comp-budget',
    name: { zh: '悦途快捷', en: 'QuickStay' },
    personality: 'price_warrior',
    cash: 8_000_000,
    reputation: 55,
    color: '#ef4444',
  },
]
