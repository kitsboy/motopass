import { useEffect, useRef, useState } from 'react'
import { programCountryCode } from '../../lib/countryCode'
import { FLAG_SPRITE_OFFSETS, FLAG_SPRITE_TILE } from '../../lib/flagSprite'

type FlagSize = 'sm' | 'md'

type LazyFlagSpriteProps = {
  countryName: string
  emojiFallback: string
  className?: string
  /** sm is the pitch strip (20×15). md is a card title (32×24). Size is inline so utility classes cannot crop the tile. */
  size?: FlagSize
  /** Hide the flag from the accessibility tree when the country name is already visible beside it. The title still carries the name. */
  decorative?: boolean
  /** Paint the tile immediately. Cards do this. The pitch strip stays lazy. */
  eager?: boolean
}

const DISPLAY: Record<FlagSize, { w: number; h: number }> = {
  sm: { w: 20, h: 15 },
  md: { w: 32, h: 24 },
}

const IO_SUPPORTED = typeof IntersectionObserver !== 'undefined'

/**
 * Lazy-load flags from ONE self-hosted sprite (all program flags in a single
 * image — /images/flags-sprite.webp). Zero third-party flagcdn round-trips:
 * the whole trusted strip is one request, fetched only when scrolled into view.
 * Emoji fallback when the country isn't in the sprite or IntersectionObserver
 * is unavailable. The country name is the flag's title.
 */
export function LazyFlagSprite({
  countryName,
  emojiFallback,
  className = '',
  size = 'sm',
  decorative = false,
  eager = false,
}: LazyFlagSpriteProps) {
  const ref = useRef<HTMLSpanElement>(null)
  const [visible, setVisible] = useState(eager || !IO_SUPPORTED)

  const iso = programCountryCode(countryName).toLowerCase()
  const tile = FLAG_SPRITE_OFFSETS[iso]
  const showSprite = !!tile
  const display = DISPLAY[size]

  useEffect(() => {
    if (eager || !IO_SUPPORTED || !tile) return
    const el = ref.current
    if (!el) return

    const io = new IntersectionObserver(
      entries => {
        if (entries.some(e => e.isIntersecting)) {
          setVisible(true)
          io.disconnect()
        }
      },
      { rootMargin: '120px' },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [eager, tile])

  const box = {
    width: display.w,
    height: display.h,
    minWidth: display.w,
    minHeight: display.h,
  }
  const nameOnFlag = decorative
    ? { title: countryName, 'aria-hidden': true as const }
    : { title: countryName, role: 'img' as const, 'aria-label': countryName }

  if (!showSprite) {
    return (
      <span
        className={`inline-flex shrink-0 items-center justify-center text-base leading-none ${className}`}
        style={box}
        {...nameOnFlag}
      >
        {emojiFallback}
      </span>
    )
  }

  const scale = display.w / FLAG_SPRITE_TILE.w
  const bgW = Math.round(FLAG_SPRITE_TILE.cols * FLAG_SPRITE_TILE.w * scale)
  const bgH = Math.round(FLAG_SPRITE_TILE.rows * FLAG_SPRITE_TILE.h * scale)
  const posX = Math.round(tile.x * scale)
  const posY = Math.round(tile.y * scale)

  return (
    <span
      ref={ref}
      className={`inline-flex shrink-0 items-center justify-center ${className}`}
      style={box}
      {...nameOnFlag}
    >
      {visible ? (
        <span
          style={{
            display: 'block',
            width: display.w,
            height: display.h,
            borderRadius: 2,
            backgroundImage: 'url(/images/flags-sprite.webp?v=6)',
            backgroundRepeat: 'no-repeat',
            backgroundSize: `${bgW}px ${bgH}px`,
            backgroundPosition: `-${posX}px -${posY}px`,
            boxShadow: '0 1px 1px rgba(0,0,0,.35)',
          }}
        />
      ) : (
        <span
          className="animate-pulse bg-mp-section/80"
          style={{ display: 'block', width: display.w, height: display.h, borderRadius: 2 }}
        />
      )}
    </span>
  )
}
