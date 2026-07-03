/** Small, subtle Give A Bit mark in copyright row */
export function GiveABitLogoLink() {
  return (
    <a
      href="https://giveabit.io"
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 group opacity-70 hover:opacity-100 transition-opacity"
      title="Give A Bit"
    >
      <span className="relative">
        <img
          src="/images/giveabit-logo.png"
          alt=""
          width={18}
          height={18}
          className="w-[18px] h-[18px] object-contain rounded-sm group-hover:scale-105 transition-transform"
        />
        <span className="absolute inset-0 rounded-sm ring-1 ring-mp/0 group-hover:ring-btc-orange/25 transition-all" />
      </span>
      <span className="sr-only">Give A Bit</span>
    </a>
  )
}