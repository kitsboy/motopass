import { useEffect, useRef, useState } from 'react'
import { programCountryCode } from '../../lib/countryCode'
import { FLAG_SPRITE_OFFSETS, FLAG_SPRITE_TILE } from '../../lib/flagSprite'

type LazyFlagSpriteProps = {
  countryName: string
  emojiFallback: string
  className?: string
}

const IO_SUPPORTED = typeof IntersectionObserver !== 'undefined'

/**
 * Lazy-load flags from ONE self-hosted sprite (all program flags in a single
 * image — /images/flags-sprite.webp). Zero third-party flagcdn round-trips:
 * the whole trusted strip is one request, fetched only when scrolled into view.
 * Emoji fallback when the country isn't in the sprite or IntersectionObserver
 * is unavailable.
 */
export function LazyFlagSprite({ countryName, emojiFallback, className = '' }: LazyFlagSpriteProps) {
  const ref = useRef<HTMLSpanElement>(null)
  const [visible, setVisible] = useState(!IO_SUPPORTED)

  const iso = programCountryCode(countryName).toLowerCase()
  const tile = FLAG_SPRITE_OFFSETS[iso]
  const showSprite = !!tile

  useEffect(() => {
    if (!IO_SUPPORTED || !tile) return
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
  }, [tile])

  // Country not in sprite → emoji fallback, always visible.
  if (!showSprite) {
    return (
      <span className={`text-xl leading-none ${className}`} aria-hidden>
        {emojiFallback}
      </span>
    )
  }

  // Sprite tile is FLAG_SPRITE_TILE.w x FLAG_SPRITE_TILE.h px, displayed at 20x15.
  const scale = 20 / FLAG_SPRITE_TILE.w
  const bgW = Math.round(FLAG_SPRITE_TILE.cols * FLAG_SPRITE_TILE.w * scale)
  const bgH = Math.round(FLAG_SPRITE_TILE.rows * FLAG_SPRITE_TILE.h * scale)
  const posX = Math.round(tile.x * scale)
  const posY = Math.round(tile.y * scale)

  return (
    <span ref={ref} className={`inline-flex h-[15px] w-5 shrink-0 items-center justify-center ${className}`} aria-hidden>
      {visible ? (
        <span
          className="h-[15px] w-5 rounded-[2px] shadow-sm"
          style={{
            backgroundImage: 'url(/images/flags-sprite.webp)',
            backgroundSize: `${bgW}px ${bgH}px`,
            backgroundPosition: `-${posX}px -${posY}px`,
          }}
        />
      ) : (
        <span className="h-[15px] w-5 rounded-[2px] bg-mp-section/80 animate-pulse" />
      )}
    </span>
  )
}
