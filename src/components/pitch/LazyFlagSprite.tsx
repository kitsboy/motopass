import { useEffect, useRef, useState } from 'react'
import { flagSpriteUrl } from '../../lib/countryCode'

type LazyFlagSpriteProps = {
  countryName: string
  emojiFallback: string
  className?: string
}

const IO_SUPPORTED = typeof IntersectionObserver !== 'undefined'

/** Lazy-load flag sprite from CDN; emoji fallback when image unavailable (item 728). */
export function LazyFlagSprite({ countryName, emojiFallback, className = '' }: LazyFlagSpriteProps) {
  const ref = useRef<HTMLSpanElement>(null)
  const [visible, setVisible] = useState(!IO_SUPPORTED)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    if (!IO_SUPPORTED) return
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
  }, [])

  if (failed) {
    return (
      <span ref={ref} className={`text-xl leading-none ${className}`} aria-hidden>
        {emojiFallback}
      </span>
    )
  }

  return (
    <span ref={ref} className={`inline-flex h-5 w-5 shrink-0 items-center justify-center ${className}`} aria-hidden>
      {visible ? (
        <img
          src={flagSpriteUrl(countryName)}
          alt=""
          width={20}
          height={15}
          loading="lazy"
          decoding="async"
          className="h-[15px] w-5 rounded-[2px] object-cover shadow-sm"
          onError={() => setFailed(true)}
        />
      ) : (
        <span className="h-[15px] w-5 rounded-[2px] bg-mp-section/80 animate-pulse" />
      )}
    </span>
  )
}