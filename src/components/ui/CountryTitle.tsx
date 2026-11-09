import { LazyFlagSprite } from '../pitch/LazyFlagSprite'

type FlagSize = 'sm' | 'md'

/** Real flag tile. The country name is the hover title on the flag. */
export function CountryFlag({
  name,
  emoji,
  size = 'sm',
  className = '',
}: {
  name: string
  emoji?: string | null
  size?: FlagSize
  className?: string
}) {
  return (
    <LazyFlagSprite
      countryName={name}
      emojiFallback={emoji || '🏳️'}
      size={size}
      className={className}
      decorative
      eager
    />
  )
}

/** Flag beside the country name. The flag's title is that same name. */
export function CountryTitle({
  name,
  emoji,
  size = 'md',
  className = '',
  nameClassName = '',
}: {
  name: string
  emoji?: string | null
  size?: FlagSize
  className?: string
  nameClassName?: string
}) {
  return (
    <span className={`inline-flex min-w-0 items-center gap-2 ${className}`}>
      <CountryFlag name={name} emoji={emoji} size={size} />
      <span className={`min-w-0 break-words ${nameClassName}`}>{name}</span>
    </span>
  )
}
