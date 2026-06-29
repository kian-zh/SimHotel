import { getCityProfile } from '../../data/cities/dossiers'
import { getCityName } from '../../data/cities'

interface CityPortraitProps {
  cityId: string
  lang: 'zh' | 'en'
  className?: string
}

export function CityPortrait({ cityId, lang, className = 'h-32 w-full' }: CityPortraitProps) {
  const profile = getCityProfile(cityId)
  const name = getCityName(cityId, lang)

  return (
    <div className={`relative overflow-hidden rounded-lg bg-map-bg ${className}`}>
      <img
        src={profile.image}
        alt={name}
        className="h-full w-full object-cover"
        loading="lazy"
      />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-map-bg/90 to-transparent px-2 pb-2 pt-6">
        <span className="text-xs font-semibold text-white">{name}</span>
      </div>
    </div>
  )
}
