import { BUILD_ID } from '../../lib/buildInfo'

const LOGO_SRC = `/images/giveabit-wordmark.png?v=${BUILD_ID}`

/**
 * giveaBit.io horizontal mark in copyright row.
 * Black logo tile — wrapped so it stays visible on light and dark footers.
 */
export function GiveABitLogoLink() {
  return (
    <a
      href="https://giveabit.io"
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center align-middle group"
      title="giveabit.io"
      aria-label="giveaBit.io — visit giveabit.io"
    >
      <span className="inline-flex items-center justify-center rounded-mp-sm bg-[#0a0a0a] px-2 py-1 ring-1 ring-mp/60 shadow-sm group-hover:ring-btc-orange/40 group-hover:shadow-card transition-all">
        <img
          src={LOGO_SRC}
          alt="giveaBit.io"
          width={96}
          height={20}
          className="h-[18px] sm:h-5 w-auto min-w-[72px] max-w-[110px] object-contain object-center"
          loading="lazy"
          decoding="async"
        />
      </span>
    </a>
  )
}