import type { LocalizedName } from '../../game/types'

export interface CityNarrative {
  history: LocalizedName
  hotelIndustry: LocalizedName
}

export const cityNarratives: Record<string, CityNarrative> = {
  'hong-kong': {
    history: {
      zh: '1990 年的香港是亚洲最重要的资金与航运门户之一。回归前的预期、股市繁荣与内地改革开放共同塑造了高度外向型的服务业经济，酒店业长期服务金融、会展与国际旅客。',
      en: 'In 1990 Hong Kong was one of Asia’s premier gateways for capital and aviation. Pre-handover expectations, equity booms, and mainland reform shaped a highly outward service economy where hotels served finance, conventions, and global travelers.',
    },
    hotelIndustry: {
      zh: '高端商务酒店与九龙、港岛核心地段紧密绑定；半岛、文华等标杆物业定义了奢华标准。90 年代后期供给快速增加，中档商务与机场酒店成为连锁扩张主战场。',
      en: 'Premium business hotels clustered in core Kowloon and Hong Kong Island locations; flagships like The Peninsula set luxury benchmarks. Supply surged in the late 1990s, with midscale business and airport hotels becoming the main expansion battleground for chains.',
    },
  },
  shenzhen: {
    history: {
      zh: '深圳从 1980 年代的经济特区起步，1990 年代成为制造业与出口枢纽。毗邻香港的地缘优势使其承接了大量商务考察与供应链往来，城市人口与写字楼供给迅速膨胀。',
      en: 'Shenzhen rose from a 1980s special economic zone into a 1990s manufacturing and export hub. Proximity to Hong Kong brought business visits and supply-chain traffic as population and office stock expanded rapidly.',
    },
    hotelIndustry: {
      zh: '酒店供给以商务型和经济型为主，福田、罗湖早期聚集大量 3-4 星物业。房价天花板低于香港，但会展与科技产业上行期带来稳定入住。',
      en: 'Supply skewed toward business and economy hotels, with many 3–4 star properties in early Futian and Luohu clusters. Rate ceilings stayed below Hong Kong, but exhibitions and tech cycles supported steady occupancy.',
    },
  },
  guangzhou: {
    history: {
      zh: '广州是华南贸易与广交会之都，历史上长期连接内地与东南亚商流。90 年代加工贸易与民营经济活跃，商务客流与会展需求构成城市服务业骨架。',
      en: 'Guangzhou has long been South China’s trade and Canton Fair capital, linking the mainland with Southeast Asia. In the 1990s processing trade and private enterprise drove business travel and exhibition demand.',
    },
    hotelIndustry: {
      zh: '会展酒店与火车站、老城区商圈形成经典布局；外资连锁在 90 年代末加速进入。商务均价适中，季节性与广交会周期高度相关。',
      en: 'Convention hotels aligned with rail hubs and old-town districts; international chains accelerated entry in the late 1990s. Average business rates stayed moderate, tightly linked to Canton Fair seasons.',
    },
  },
  shanghai: {
    history: {
      zh: '90 年代浦东开发开放重塑了上海的增长叙事。外资银行、制造业总部与港口贸易让城市重新成为东亚关键节点，城市天际线与基础设施快速现代化。',
      en: 'Pudong’s opening in the 1990s reshaped Shanghai’s growth story. Foreign banks, manufacturing HQs, and port trade restored the city as a key East Asian node with rapid skyline and infrastructure modernization.',
    },
    hotelIndustry: {
      zh: '外滩历史物业与浦东新酒店并存，90 年代后期国际品牌密集落子。高支付能力商务客支撑中高端房价，供给竞争在 2000 年前后显著加剧。',
      en: 'Heritage Bund properties coexisted with new Pudong hotels as global brands landed heavily in the late 1990s. High-spend business travelers supported upper-midscale rates; competition intensified around 2000.',
    },
  },
  beijing: {
    history: {
      zh: '北京作为国家政治与文化中心，90 年代在市场化改革中逐步扩大国际交往。大型外交活动、国企总部经济与旅游文化资源共同塑造需求结构。',
      en: 'As China’s political and cultural center, Beijing expanded international engagement through 1990s market reforms. Diplomacy, state-enterprise HQs, and cultural tourism shaped demand.',
    },
    hotelIndustry: {
      zh: '政务与会展需求突出，长安街、国贸等商圈形成高端商务带。历史酒店翻新与外资五星项目并行，重大活动常带来需求尖峰。',
      en: 'Government and convention demand dominated, with premium corridors along Chang’an Avenue and Guomao. Heritage hotel renovations ran parallel to foreign five-star entries; mega-events created demand spikes.',
    },
  },
  singapore: {
    history: {
      zh: '新加坡以港口、金融与严格治理著称，90 年代已是东南亚最成熟的发达经济体之一。樟宜机场与会展经济使其成为区域中转枢纽。',
      en: 'Known for ports, finance, and strong governance, Singapore was among Southeast Asia’s most mature economies by the 1990s. Changi and the convention economy made it a regional transit hub.',
    },
    hotelIndustry: {
      zh: '酒店业国际化程度极高，滨海湾、乌节路聚集奢华与商务旗舰。高运营成本与严监管推高进入门槛，但房价与 RevPAR 长期居区域前列。',
      en: 'Hotels were highly internationalized, with Marina Bay and Orchard Road hosting luxury and business flagships. High costs and strict regulation raised entry barriers, but rates and RevPAR ranked among the region’s best.',
    },
  },
  'kuala-lumpur': {
    history: {
      zh: '吉隆坡是马来西亚首都与东盟商务门户，90 年代双子塔等地标项目象征现代化雄心。多元文化与伊斯兰金融元素并存于城市商业生态。',
      en: 'Kuala Lumpur served as Malaysia’s capital and an ASEAN business gateway; landmarks like the Petronas Towers symbolized modernization ambitions in the 1990s. A diverse, Islamic-finance-aware commercial culture evolved.',
    },
    hotelIndustry: {
      zh: '价值型商务与旅游酒店为主，KLCC 与武吉免登形成双核心。房价较新加坡温和，旅游与区域会议带来旺季波动。',
      en: 'Value-oriented business and leisure hotels dominated, with twin cores at KLCC and Bukit Bintang. Rates stayed softer than Singapore, with tourism and regional meetings driving seasonal swings.',
    },
  },
  tokyo: {
    history: {
      zh: '东京在 90 年代初仍处泡沫经济余波之中，随后进入长期调整。尽管如此，其作为全球第三大都市圈，集聚了科技、金融与精密服务业。',
      en: 'Tokyo in the early 1990s still felt the aftershocks of the bubble, then entered a long adjustment. Yet as one of the world’s largest metro economies, it concentrated tech, finance, and precision services.',
    },
    hotelIndustry: {
      zh: '城市酒店密度极高，商务连锁与温泉度假品牌并存。90 年代后期商务房价承压，但基础设施与服务标准仍是亚洲标杆。',
      en: 'Urban hotel density was extreme, mixing business chains and onsen resort brands. Business rates softened in the late 1990s, but infrastructure and service standards remained Asian benchmarks.',
    },
  },
  seoul: {
    history: {
      zh: '首尔在 90 年代经历民主化、财阀重组与亚洲金融危机冲击。电子、汽车与文化出口抬升城市全球能见度，汉江两岸快速城市化。',
      en: 'Seoul navigated democratization, chaebol restructuring, and the Asian financial crisis in the 1990s. Electronics, autos, and cultural exports raised global visibility as the Han River corridors urbanized.',
    },
    hotelIndustry: {
      zh: '江南、明洞等商圈承载商务与观光双重需求。本土集团与国际连锁竞争激烈，中端商务酒店是扩张主力。',
      en: 'Gangnam and Myeongdong mixed business and leisure demand. Local groups competed fiercely with global chains; midscale business hotels led expansion.',
    },
  },
  'new-york': {
    history: {
      zh: '纽约是全球金融与媒体首都，90 年代华尔街繁荣与城市化复兴并行。曼哈顿地价高企，酒店资产兼具经营与地标价值。',
      en: 'New York remained the global capital of finance and media; 1990s Wall Street booms ran alongside urban revival. Manhattan land costs made hotel assets both operating businesses and landmarks.',
    },
    hotelIndustry: {
      zh: '时代广场、中城与金融区形成经典酒店三角。奢华与精品酒店品牌密集，劳动力与物业成本极高，危机期波动同样剧烈。',
      en: 'Times Square, Midtown, and the Financial District formed the classic hotel triangle. Luxury and boutique brands clustered tightly; labor and property costs were extreme, with violent crisis swings.',
    },
  },
  'los-angeles': {
    history: {
      zh: '洛杉矶是娱乐、贸易与移民文化交汇的巨型都会。90 年代影视工业与亚太贸易联系加深，城市呈多中心 sprawl 格局。',
      en: 'Los Angeles merged entertainment, trade, and immigrant cultures into a mega-region. In the 1990s Hollywood and transpacific commerce deepened ties amid a polycentric sprawl pattern.',
    },
    hotelIndustry: {
      zh: '比佛利山、好莱坞与机场走廊各成酒店子市场。度假、会展与影视剧组需求交织，选址对表现影响显著。',
      en: 'Beverly Hills, Hollywood, and airport corridors formed distinct submarkets. Leisure, conventions, and film crews intertwined; location quality mattered greatly.',
    },
  },
  'san-francisco': {
    history: {
      zh: '旧金山湾区是科技创业与风险投资圣地，90 年代互联网浪潮前夕资本已高度活跃。城市地形与住房约束推高了商业运营成本。',
      en: 'The Bay Area was a venture and tech entrepreneurship mecca; capital was already highly active before the dot-com wave. Terrain and housing constraints pushed operating costs up.',
    },
    hotelIndustry: {
      zh: '金融区与联合广场承载高端商务，科技上行周期房价弹性极强。精品酒店与历史物业翻新是特色供给。',
      en: 'The Financial District and Union Square hosted premium business demand with extreme rate elasticity in tech upcycles. Boutique hotels and heritage renovations characterized supply.',
    },
  },
  london: {
    history: {
      zh: '伦敦是欧洲金融与创意产业中心，90 年代金融城全球化与泰晤士河两岸复兴并进。欧盟一体化深化了商务与旅游流动。',
      en: 'London anchored European finance and creative industries; the 1990s globalized the City while the Thames corridors revived. EU integration deepened business and tourism flows.',
    },
    hotelIndustry: {
      zh: '西区旅游、金融城商务与希斯罗中转需求并存。历史建筑改造酒店是传统优势，房价与人工成本居欧洲前列。',
      en: 'West End tourism, City finance, and Heathrow transit demand coexisted. Heritage adaptive-reuse hotels were a traditional strength; rates and labor costs ranked among Europe’s highest.',
    },
  },
  paris: {
    history: {
      zh: '巴黎以文化、奢侈品与会展经济闻名，长期是全球观光目的地。90 年代欧盟一体化与大型活动巩固了其欧洲门户地位。',
      en: 'Paris was famed for culture, luxury, and exhibitions, remaining a global sightseeing destination. 1990s EU integration and mega-events reinforced its European gateway role.',
    },
    hotelIndustry: {
      zh: '左岸精品、香榭丽舍奢华与会展酒店构成多层次供给。旅游季节性极强，奢华品牌旗舰店物业稀缺且昂贵。',
      en: 'Left Bank boutiques, Champs-Élysées luxury, and convention hotels formed a layered supply. Tourism seasonality was extreme; flagship luxury properties were scarce and costly.',
    },
  },
  dubai: {
    history: {
      zh: '迪拜 90 年代起以贸易、航空与雄心勃勃的建设项目塑造品牌。酋长国战略将物流与旅游绑定，人口与外籍劳工快速增长。',
      en: 'From the 1990s Dubai built its brand on trade, aviation, and ambitious construction. Emirate strategy tied logistics to tourism as expatriate populations surged.',
    },
    hotelIndustry: {
      zh: '奢华度假与会展酒店是核心叙事，机场中转客支撑高房价。供给扩张激进，品牌旗舰与超大型综合体不断刷新标杆。',
      en: 'Luxury resort and convention hotels defined the narrative, with transit passengers supporting high rates. Aggressive supply growth and mega-complexes constantly reset benchmarks.',
    },
  },
  bangkok: {
    history: {
      zh: '曼谷是东南亚交通与旅游枢纽，90 年代制造业与旅游业共同推动城市化。政治周期与货币波动时常影响短期信心。',
      en: 'Bangkok served as Southeast Asia’s transport and tourism hub; manufacturing and leisure jointly urbanized the city in the 1990s. Political and currency cycles often shook short-term confidence.',
    },
    hotelIndustry: {
      zh: '大众旅游与性价比酒店供给充足，暹罗、素坤逸走廊竞争激烈。房价天花板较低，入住率与周转率是盈利关键。',
      en: 'Mass tourism supported abundant value hotels; Siam and Sukhumvit corridors were fiercely competitive. Lower rate ceilings made occupancy and turnover the profit keys.',
    },
  },
  sydney: {
    history: {
      zh: '悉尼是澳大利亚经济与金融核心，海港地标与移民社会塑造开放型服务业。90 年代亚太经济联系加深，商务与休闲需求并重。',
      en: 'Sydney anchored Australia’s economy and finance, with harbor icons and immigration shaping an open service sector. 1990s Asia-Pacific links deepened mixed business and leisure demand.',
    },
    hotelIndustry: {
      zh: '岩石区、CBD 与机场酒店形成经典布局。房价中高端，季节性与长途航线依赖明显，会展与邮轮带来旺季。',
      en: 'The Rocks, CBD, and airport hotels formed classic clusters. Mid-to-upper rates reflected seasonality and long-haul dependence; conventions and cruises boosted peaks.',
    },
  },
  mumbai: {
    history: {
      zh: '孟买是印度金融与影视之都，90 年代经济自由化启动后外资与本土财团加速集聚。基础设施压力与贫富并存是城市鲜明特征。',
      en: 'Mumbai was India’s finance and film capital; post-1991 liberalization drew foreign and domestic capital. Infrastructure strain and inequality were defining traits.',
    },
    hotelIndustry: {
      zh: '南亚门迪尔湾、班德拉等商圈聚集商务酒店。供给增长快于基础设施，高端与有限服务酒店并存，房价分化显著。',
      en: 'Business hotels clustered in Bandra Kurla and South Mumbai. Supply outpaced infrastructure; full-service and limited-service tiers coexisted with sharp rate dispersion.',
    },
  },
  jakarta: {
    history: {
      zh: '雅加达是印尼首都与东盟最大城市经济体之一，90 年代制造业与消费市场扩张。货币危机与政治转型给增长路径带来剧烈波动。',
      en: 'Jakarta was Indonesia’s capital and one of ASEAN’s largest urban economies; manufacturing and consumption expanded in the 1990s. Currency crises and political transitions caused violent swings.',
    },
    hotelIndustry: {
      zh: '商务酒店集中在南部新区，成本相对较低。国际品牌逐步进入，房价温和，规模扩张是主旋律。',
      en: 'Business hotels concentrated in the southern new town with relatively low costs. Global brands entered gradually; moderate rates favored scale expansion.',
    },
  },
  taipei: {
    history: {
      zh: '台北是台湾科技、贸易与民主社会的窗口，90 年代电子产业链崛起带动商务繁荣。与大陆及东南亚的短途联系塑造区域客流。',
      en: 'Taipei windowed Taiwan’s tech, trade, and democratic society; 1990s electronics supply chains drove business prosperity. Short-haul links to the mainland and Southeast Asia shaped flows.',
    },
    hotelIndustry: {
      zh: '信义区、中山区形成商务与观光双核心。中端商务酒店竞争激烈，房价稳定，台风季与政治新闻会带来短期扰动。',
      en: 'Xinyi and Zhongshan formed business and leisure cores. Midscale business competition was intense with stable rates; typhoon season and political headlines caused short disruptions.',
    },
  },
}

export const fallbackNarrative: CityNarrative = {
  history: {
    zh: '这座城市正处于全球化与本地增长交织的转型期，历史事件将深刻影响其服务业与客流结构。',
    en: 'This city is transforming amid globalization and local growth; historical events will deeply shape its service economy and visitor flows.',
  },
  hotelIndustry: {
    zh: '酒店供给仍在形成阶段，连锁品牌与本土业者争夺核心地段，房价与入住率对宏观冲击较为敏感。',
    en: 'Hotel supply is still forming as chains and local operators compete for core locations; rates and occupancy remain sensitive to macro shocks.',
  },
}
