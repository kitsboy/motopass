/** Horizontal giveaBit.io logo — small, subtle, links to giveabit.io */
export function GiveABitLogoLink() {
  return (
    <a
      href="https://giveabit.io"
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center group opacity-75 hover:opacity-100 transition-opacity"
      title="giveabit.io"
    >
      <img
        src="/images/giveabit-logo.png"
        alt="giveaBit.io"
        className="h-5 sm:h-[22px] w-auto max-w-[108px] object-contain object-left group-hover:scale-[1.02] transition-transform"
      />
    </a>
  )
}