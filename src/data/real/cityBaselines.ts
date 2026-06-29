export interface CityBaseline {
  cityId: string
  population1990: number
  populationGrowthRate: number
  gdpIndex1990: number
  visitorArrivals1990: number
  businessHubScore: number
}

export const cityBaselines: CityBaseline[] = [
  { cityId: 'hong-kong', population1990: 5_700_000, populationGrowthRate: 0.012, gdpIndex1990: 88, visitorArrivals1990: 650, businessHubScore: 92 },
  { cityId: 'shenzhen', population1990: 1_750_000, populationGrowthRate: 0.08, gdpIndex1990: 42, visitorArrivals1990: 80, businessHubScore: 55 },
  { cityId: 'guangzhou', population1990: 6_280_000, populationGrowthRate: 0.025, gdpIndex1990: 55, visitorArrivals1990: 180, businessHubScore: 68 },
  { cityId: 'shanghai', population1990: 13_500_000, populationGrowthRate: 0.018, gdpIndex1990: 62, visitorArrivals1990: 220, businessHubScore: 78 },
  { cityId: 'beijing', population1990: 10_860_000, populationGrowthRate: 0.02, gdpIndex1990: 58, visitorArrivals1990: 200, businessHubScore: 80 },
  { cityId: 'singapore', population1990: 3_050_000, populationGrowthRate: 0.022, gdpIndex1990: 90, visitorArrivals1990: 530, businessHubScore: 95 },
  { cityId: 'kuala-lumpur', population1990: 1_450_000, populationGrowthRate: 0.035, gdpIndex1990: 48, visitorArrivals1990: 120, businessHubScore: 60 },
  { cityId: 'tokyo', population1990: 11_920_000, populationGrowthRate: 0.005, gdpIndex1990: 95, visitorArrivals1990: 320, businessHubScore: 96 },
  { cityId: 'seoul', population1990: 10_610_000, populationGrowthRate: 0.012, gdpIndex1990: 72, visitorArrivals1990: 180, businessHubScore: 82 },
  { cityId: 'new-york', population1990: 7_320_000, populationGrowthRate: 0.008, gdpIndex1990: 98, visitorArrivals1990: 380, businessHubScore: 98 },
  { cityId: 'los-angeles', population1990: 3_490_000, populationGrowthRate: 0.01, gdpIndex1990: 85, visitorArrivals1990: 290, businessHubScore: 75 },
  { cityId: 'san-francisco', population1990: 724_000, populationGrowthRate: 0.009, gdpIndex1990: 92, visitorArrivals1990: 150, businessHubScore: 90 },
]

export const baselineMap = Object.fromEntries(cityBaselines.map((b) => [b.cityId, b]))
