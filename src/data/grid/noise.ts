export function mulberry32(seed: number): () => number {
  return () => {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function cellNoise(seed: number, cellId: string, amplitude = 0.1): number {
  let hash = seed
  for (let i = 0; i < cellId.length; i++) hash = (hash * 31 + cellId.charCodeAt(i)) | 0
  const rng = mulberry32(hash)
  return 1 + (rng() * 2 - 1) * amplitude
}

export function yearlyDrift(seed: number, cityId: string, year: number, amplitude = 0.05): number {
  let hash = seed
  const key = `${cityId}-${year}`
  for (let i = 0; i < key.length; i++) hash = (hash * 31 + key.charCodeAt(i)) | 0
  const rng = mulberry32(hash)
  return 1 + (rng() * 2 - 1) * amplitude
}

export function poiNoise(seed: number, poiId: string, amplitude = 0.15): number {
  return cellNoise(seed, `poi-${poiId}`, amplitude)
}

export function clampFactor(value: number, min = 0.7, max = 1.3): number {
  return Math.min(max, Math.max(min, value))
}

export function randomSeed(): number {
  return Math.floor(Math.random() * 2147483647)
}
