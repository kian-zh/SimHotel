import type { LocalizedName } from '../../game/types'
import { cityNarratives, fallbackNarrative } from './cityNarratives'

export interface CityDossier {
  image: string
  history: LocalizedName
  hotelIndustry: LocalizedName
  archetype: LocalizedName
  opportunity: LocalizedName
  risk: LocalizedName
  recommendation: LocalizedName
}

export function getCityProfile(cityId: string): CityDossier {
  const strategic = cityDossiers[cityId] ?? fallbackCityDossier
  const narrative = cityNarratives[cityId] ?? fallbackNarrative
  return {
    image: `/assets/cities/${cityId}.svg`,
    history: narrative.history,
    hotelIndustry: narrative.hotelIndustry,
    archetype: strategic.archetype,
    opportunity: strategic.opportunity,
    risk: strategic.risk,
    recommendation: strategic.recommendation,
  }
}

interface CityStrategicBrief {
  archetype: LocalizedName
  opportunity: LocalizedName
  risk: LocalizedName
  recommendation: LocalizedName
}

const cityDossiers: Record<string, CityStrategicBrief> = {
  'hong-kong': {
    archetype: { zh: '金融与航运枢纽', en: 'Finance and aviation hub' },
    opportunity: {
      zh: '高商务需求和国际客流适合建立第一座旗舰资产。',
      en: 'Strong business demand and international flows make it ideal for the first flagship asset.',
    },
    risk: {
      zh: '监管成本高，危机时期会快速传导到高端客群。',
      en: 'High regulatory cost, with downturns quickly hitting premium travelers.',
    },
    recommendation: {
      zh: '早期用 3-4 星酒店稳住现金流，中期再升级服务品质。',
      en: 'Use 3-4 star properties for early cash flow, then upgrade service quality.',
    },
  },
  shenzhen: {
    archetype: { zh: '制造与创新增长城', en: 'Manufacturing and innovation growth city' },
    opportunity: {
      zh: '低成本扩张窗口明显，适合快速铺设商务网络。',
      en: 'Clear low-cost expansion window for building a business network quickly.',
    },
    risk: {
      zh: '价格敏感度高，过高房价会迅速压低入住。',
      en: 'High price sensitivity means excessive rates can quickly suppress occupancy.',
    },
    recommendation: {
      zh: '以跑马圈地或精益运营抢占规模。',
      en: 'Use rapid expansion or lean operations to capture scale.',
    },
  },
  guangzhou: {
    archetype: { zh: '贸易会展门户', en: 'Trade fair gateway' },
    opportunity: {
      zh: '会展和区域贸易带来稳定商务流量。',
      en: 'Trade fairs and regional commerce create stable business flow.',
    },
    risk: {
      zh: '市场均价有限，奢华定位需要谨慎。',
      en: 'Moderate pricing ceiling makes luxury positioning risky.',
    },
    recommendation: {
      zh: '优先布局 4 星商务酒店，旺季抬价。',
      en: 'Prioritize 4-star business hotels and raise rates in peak seasons.',
    },
  },
  shanghai: {
    archetype: { zh: '金融开放窗口', en: 'Financial opening gateway' },
    opportunity: {
      zh: '开放政策和会展经济能放大中高端品牌影响力。',
      en: 'Opening policies and convention economy amplify upper-midscale brand power.',
    },
    risk: {
      zh: '竞争强，低品质资产容易被市场边缘化。',
      en: 'Competition is intense; low-quality assets can be marginalized.',
    },
    recommendation: {
      zh: '适合 4-5 星组合，配合奢华旗舰策略。',
      en: 'Best with a 4-5 star mix and luxury flagship strategy.',
    },
  },
  beijing: {
    archetype: { zh: '政商会务中心', en: 'Government and meetings center' },
    opportunity: {
      zh: '大型会议、外交和体育事件会创造需求尖峰。',
      en: 'Major meetings, diplomacy, and sports events create demand spikes.',
    },
    risk: {
      zh: '政策和周期性会务对需求波动影响明显。',
      en: 'Policy and event cycles create visible demand volatility.',
    },
    recommendation: {
      zh: '保留现金等待大事件窗口，适合防守后转扩张。',
      en: 'Preserve cash for event windows; defensive then expansion works well.',
    },
  },
  singapore: {
    archetype: { zh: '东南亚高端中转枢纽', en: 'Premium Southeast Asia transit hub' },
    opportunity: {
      zh: '机场、金融和会展共同支撑高房价。',
      en: 'Airport, finance, and conventions support premium room rates.',
    },
    risk: {
      zh: '建造和运营成本高，现金压力较大。',
      en: 'High construction and operating costs create cash pressure.',
    },
    recommendation: {
      zh: '优先 5 星旗舰或高质量 4 星酒店。',
      en: 'Prioritize 5-star flagships or high-quality 4-star hotels.',
    },
  },
  'kuala-lumpur': {
    archetype: { zh: '价值型旅游门户', en: 'Value leisure gateway' },
    opportunity: {
      zh: '较低成本和旅游需求适合高性价比扩张。',
      en: 'Lower costs and leisure demand suit value-oriented expansion.',
    },
    risk: {
      zh: '房价天花板较低，需要控制投入。',
      en: 'Lower rate ceiling requires disciplined investment.',
    },
    recommendation: {
      zh: '用 3 星和精益运营提高投资回收速度。',
      en: 'Use 3-star assets and lean operations for faster payback.',
    },
  },
  tokyo: {
    archetype: { zh: '高支付能力都市旅游中心', en: 'High-spend urban tourism center' },
    opportunity: {
      zh: '基础设施强、支付能力高，适合打造亚洲旗舰。',
      en: 'Strong infrastructure and willingness to pay make it a prime Asian flagship market.',
    },
    risk: {
      zh: '灾害事件会阶段性打击旅游信心。',
      en: 'Disaster events can temporarily hurt travel confidence.',
    },
    recommendation: {
      zh: '用奢华旗舰提升吸引力，同时保持防守现金垫。',
      en: 'Use luxury flagship positioning while keeping a defensive cash buffer.',
    },
  },
  seoul: {
    archetype: { zh: '文化与科技双引擎', en: 'Culture and technology engine' },
    opportunity: {
      zh: '文化旅游和科技商务共同驱动中高端需求。',
      en: 'Cultural tourism and tech business jointly drive upper-midscale demand.',
    },
    risk: {
      zh: '区域政治风险会影响短期客流。',
      en: 'Regional political risk can affect short-term flows.',
    },
    recommendation: {
      zh: '4 星商务酒店配合灵活调价最稳。',
      en: '4-star business hotels with flexible pricing are the steady path.',
    },
  },
  'new-york': {
    archetype: { zh: '全球金融与旅游核心', en: 'Global finance and tourism core' },
    opportunity: {
      zh: '高支付能力和全球曝光度适合建立全球品牌锚点。',
      en: 'High willingness to pay and global visibility make it a brand anchor.',
    },
    risk: {
      zh: '金融危机和安全事件会重创商务需求。',
      en: 'Financial crises and security shocks can sharply cut business demand.',
    },
    recommendation: {
      zh: '进入前准备充足现金，危机中寻找低价扩张窗口。',
      en: 'Enter with ample cash and buy expansion windows during crises.',
    },
  },
  'los-angeles': {
    archetype: { zh: '娱乐与休闲门户', en: 'Entertainment and leisure gateway' },
    opportunity: {
      zh: '旅游、影视和大型赛事能带来多样需求。',
      en: 'Tourism, entertainment, and mega-events diversify demand.',
    },
    risk: {
      zh: '需求分散，选址质量对表现影响更大。',
      en: 'Demand is spread out, making location quality more important.',
    },
    recommendation: {
      zh: '优先靠近旅游热区，采用 4 星度假商务混合定位。',
      en: 'Favor tourism hot spots with a 4-star leisure-business hybrid.',
    },
  },
  'san-francisco': {
    archetype: { zh: '科技商务高溢价市场', en: 'Premium technology business market' },
    opportunity: {
      zh: '科技周期上行时商务需求和房价弹性极强。',
      en: 'Tech upcycles create strong business demand and rate upside.',
    },
    risk: {
      zh: '科技泡沫破裂会迅速拖累入住。',
      en: 'Tech downturns can quickly drag occupancy down.',
    },
    recommendation: {
      zh: '顺周期用奢华或稳健策略，泡沫期及时防守。',
      en: 'Use luxury or balanced strategy in upcycles, then shift defensive during bubbles.',
    },
  },
  london: {
    archetype: { zh: '全球金融与会展门户', en: 'Global finance and convention gateway' },
    opportunity: {
      zh: '金融、会展和奥运遗产带来高支付能力客群。',
      en: 'Finance, conventions, and Olympic legacy create high-spend demand.',
    },
    risk: {
      zh: '监管和人工成本高，脱欧冲击会影响商务流动。',
      en: 'High regulation and labor costs; Brexit shocks can disrupt business flows.',
    },
    recommendation: {
      zh: '用 5 星旗舰建立欧洲锚点，保持较低杠杆。',
      en: 'Use a 5-star flagship as a European anchor while keeping leverage low.',
    },
  },
  paris: {
    archetype: { zh: '奢华旅游与文化中心', en: 'Luxury tourism and culture center' },
    opportunity: {
      zh: '全球观光和奢侈品消费支撑高端酒店溢价。',
      en: 'Global sightseeing and luxury consumption support premium hotel pricing.',
    },
    risk: {
      zh: '安全事件和社会罢工会打断短期入住。',
      en: 'Security incidents and strikes can interrupt short-term occupancy.',
    },
    recommendation: {
      zh: '适合奢华旗舰，但要预留危机现金。',
      en: 'Suited to luxury flagship strategy with a crisis cash buffer.',
    },
  },
  dubai: {
    archetype: { zh: '航空中转与奢华会展节点', en: 'Aviation transit and luxury meetings node' },
    opportunity: {
      zh: '机场、会展和高端度假共同拉动国际客源。',
      en: 'Airport transit, exhibitions, and luxury leisure combine to draw global travelers.',
    },
    risk: {
      zh: '供给扩张快，价格战风险高。',
      en: 'Fast supply growth creates price-war risk.',
    },
    recommendation: {
      zh: '用高质量 4-5 星组合，避免过度借债扩张。',
      en: 'Use a high-quality 4-5 star mix and avoid debt-fueled overexpansion.',
    },
  },
  bangkok: {
    archetype: { zh: '大众旅游与区域休闲门户', en: 'Mass tourism and regional leisure gateway' },
    opportunity: {
      zh: '旅游客流巨大，低成本资产回收速度快。',
      en: 'Huge leisure flows support quick payback for lower-cost assets.',
    },
    risk: {
      zh: '政治波动和价格敏感会压缩高端溢价。',
      en: 'Political volatility and price sensitivity compress luxury premiums.',
    },
    recommendation: {
      zh: '用 3-4 星规模化布局，配合精益运营。',
      en: 'Scale with 3-4 star assets and lean operations.',
    },
  },
  sydney: {
    archetype: { zh: '南半球商务休闲混合市场', en: 'Southern hemisphere business-leisure market' },
    opportunity: {
      zh: '稳定制度和观光资源带来中高端需求。',
      en: 'Stable institutions and tourism assets create upper-midscale demand.',
    },
    risk: {
      zh: '季节与航线距离使需求更周期化。',
      en: 'Seasonality and long-haul distance make demand more cyclical.',
    },
    recommendation: {
      zh: '适合稳健经营，旺季提高房价。',
      en: 'Best with balanced operations and seasonal rate increases.',
    },
  },
  mumbai: {
    archetype: { zh: '金融、影视与人口红利市场', en: 'Finance, film, and demographic growth market' },
    opportunity: {
      zh: '商务增长和庞大人口提供长期扩张空间。',
      en: 'Business growth and a large population create long-term expansion space.',
    },
    risk: {
      zh: '基础设施和监管摩擦会拖慢资产回收。',
      en: 'Infrastructure and regulatory friction can slow payback.',
    },
    recommendation: {
      zh: '先用 3-4 星测试需求，再逐步升级。',
      en: 'Test demand with 3-4 star assets, then upgrade gradually.',
    },
  },
  jakarta: {
    archetype: { zh: '东盟人口与商务增长市场', en: 'ASEAN population and business growth market' },
    opportunity: {
      zh: '人口规模大、成本低，适合提前卡位。',
      en: 'Large population and low costs make early positioning attractive.',
    },
    risk: {
      zh: '基础设施短板和货币波动会影响利润稳定性。',
      en: 'Infrastructure gaps and currency swings can reduce profit stability.',
    },
    recommendation: {
      zh: '采用精益运营和较低房价，提高入住率。',
      en: 'Use lean operations and moderate rates to protect occupancy.',
    },
  },
  taipei: {
    archetype: { zh: '科技商务与短途旅游市场', en: 'Technology business and short-haul tourism market' },
    opportunity: {
      zh: '科技产业和区域短途游客支撑稳定中端需求。',
      en: 'Technology industry and short-haul visitors support stable mid-market demand.',
    },
    risk: {
      zh: '区域政治和台风季会制造短期扰动。',
      en: 'Regional politics and typhoon season create short-term disruptions.',
    },
    recommendation: {
      zh: '4 星商务酒店最稳，避免单一高端押注。',
      en: '4-star business hotels are steady; avoid a single luxury bet.',
    },
  },
}

export const fallbackCityDossier: CityStrategicBrief = {
  archetype: { zh: '区域增长市场', en: 'Regional growth market' },
  opportunity: {
    zh: '城市基本面仍在形成，适合通过低成本资产试探需求。',
    en: 'Market fundamentals are still forming, suitable for low-cost demand testing.',
  },
  risk: {
    zh: '历史事件和宏观周期可能改变增长路径。',
    en: 'Historical events and macro cycles may change the growth path.',
  },
  recommendation: {
    zh: '先控制资本开支，再根据入住率升级。',
    en: 'Control capex first, then upgrade according to occupancy.',
  },
}
