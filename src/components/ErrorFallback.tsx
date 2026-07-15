/** Static copy — must not use useI18n (ErrorBoundary may render outside providers). */
export function ErrorFallback({ message }: { message?: string }) {
  return (
    <div className="min-h-screen bg-canvas flex items-center justify-center px-4">
      <div className="card-elevated max-w-md w-full text-center py-12">
        <h2 className="text-xl font-display font-semibold text-status-red mb-2">Something went wrong</h2>
        <p className="text-sm text-ink-secondary mb-2">
          The app hit an unexpected error. If you just deployed or refreshed during an update, a hard refresh usually fixes it.
        </p>
        {message && (
          <p className="text-[11px] font-mono text-ink-muted mb-4 break-all opacity-70">{message}</p>
        )}
        <button type="button" onClick={() => window.location.reload()} className="btn-primary">
          Reload page
        </button>
      </div>
    </div>
  )
}