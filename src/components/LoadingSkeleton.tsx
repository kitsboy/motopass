export function CardSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="card animate-pulse space-y-3">
          <div className="h-5 bg-section rounded-mp-sm w-2/3" />
          <div className="h-3 bg-section rounded-mp-sm w-1/2" />
          <div className="h-14 bg-section rounded-mp-md" />
        </div>
      ))}
    </div>
  )
}