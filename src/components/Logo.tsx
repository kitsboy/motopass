import { Link } from 'react-router-dom'

export function Logo({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const dim = size === 'sm' ? 'h-8 w-8' : size === 'lg' ? 'h-14 w-14' : 'h-10 w-10'
  return (
    <Link to="/" className="shrink-0">
      <img
        src="/logo.png"
        alt="MotoPass"
        className={`${dim} object-contain`}
      />
    </Link>
  )
}