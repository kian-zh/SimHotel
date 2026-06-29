import type { AttractionPOI } from '../../game/types'

export const attractions: AttractionPOI[] = [
  { id: 'hk-victoria', cityId: 'hong-kong', name: { zh: '维多利亚港', en: 'Victoria Harbour' }, coordinates: [114.165, 22.286], tourismWeight: 95, economyWeight: 70 },
  { id: 'hk-peak', cityId: 'hong-kong', name: { zh: '太平山顶', en: 'Victoria Peak' }, coordinates: [114.149, 22.271], tourismWeight: 88 },
  { id: 'hk-disney', cityId: 'hong-kong', name: { zh: '迪士尼乐园', en: 'Disneyland' }, coordinates: [114.041, 22.313], tourismWeight: 82 },
  { id: 'sz-window', cityId: 'shenzhen', name: { zh: '世界之窗', en: 'Window of the World' }, coordinates: [113.972, 22.536], tourismWeight: 65 },
  { id: 'gz-canton', cityId: 'guangzhou', name: { zh: '珠江新城', en: 'Zhujiang New Town' }, coordinates: [113.321, 23.119], tourismWeight: 60, economyWeight: 75 },
  { id: 'sh-bund', cityId: 'shanghai', name: { zh: '外滩', en: 'The Bund' }, coordinates: [121.490, 31.240], tourismWeight: 92, economyWeight: 80 },
  { id: 'sh-disney', cityId: 'shanghai', name: { zh: '上海迪士尼', en: 'Shanghai Disney' }, coordinates: [121.667, 31.144], tourismWeight: 85 },
  { id: 'bj-forbidden', cityId: 'beijing', name: { zh: '故宫', en: 'Forbidden City' }, coordinates: [116.397, 39.918], tourismWeight: 98 },
  { id: 'bj-olympic', cityId: 'beijing', name: { zh: '奥林匹克公园', en: 'Olympic Park' }, coordinates: [116.391, 40.002], tourismWeight: 75, economyWeight: 65 },
  { id: 'sg-marina', cityId: 'singapore', name: { zh: '滨海湾', en: 'Marina Bay' }, coordinates: [103.860, 1.283], tourismWeight: 90, economyWeight: 88 },
  { id: 'kl-petronas', cityId: 'kuala-lumpur', name: { zh: '双子塔', en: 'Petronas Towers' }, coordinates: [101.711, 3.157], tourismWeight: 78, economyWeight: 70 },
  { id: 'tk-shinjuku', cityId: 'tokyo', name: { zh: '新宿', en: 'Shinjuku' }, coordinates: [139.700, 35.689], tourismWeight: 85, economyWeight: 90 },
  { id: 'tk-asakusa', cityId: 'tokyo', name: { zh: '浅草寺', en: 'Asakusa' }, coordinates: [139.796, 35.714], tourismWeight: 88 },
  { id: 'sl-myeong', cityId: 'seoul', name: { zh: '明洞', en: 'Myeongdong' }, coordinates: [126.985, 37.563], tourismWeight: 82, economyWeight: 75 },
  { id: 'ny-times', cityId: 'new-york', name: { zh: '时代广场', en: 'Times Square' }, coordinates: [-73.985, 40.758], tourismWeight: 95, economyWeight: 92 },
  { id: 'la-hollywood', cityId: 'los-angeles', name: { zh: '好莱坞', en: 'Hollywood' }, coordinates: [-118.326, 34.101], tourismWeight: 90 },
  { id: 'sf-golden', cityId: 'san-francisco', name: { zh: '金门大桥', en: 'Golden Gate' }, coordinates: [-122.478, 37.819], tourismWeight: 92, economyWeight: 60 },
]
