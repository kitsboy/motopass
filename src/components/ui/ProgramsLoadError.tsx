/** Shown when countries.json fails to load */
export function ProgramsLoadError({ message }: { message: string }) {
  return (
    <div
      className="rounded-mp-lg border border-status-red/30 bg-status-red/5 px-4 py-3 text-sm text-ink-secondary"
      role="alert"
    >
      <p className="font-medium text-status-red">Could not load program data</p>
      <p className="mt-1 text-ink-muted">{message}</p>
      <button
        type="button"
        onClick={() => window.location.reload()}
        className="mt-3 text-sm font-medium text-accent hover:underline"
      >
        Retry
      </button>
    </div>
  )
}