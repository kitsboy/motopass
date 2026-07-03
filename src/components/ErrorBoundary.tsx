import React from 'react'

interface State { hasError: boolean; message?: string }

export class ErrorBoundary extends React.Component<{ children: React.ReactNode }, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-canvas flex items-center justify-center px-4">
          <div className="card-elevated max-w-md w-full text-center py-12">
            <h2 className="text-xl font-display font-semibold text-status-red mb-2">Something went wrong</h2>
            <p className="text-sm text-ink-secondary mb-6">{this.state.message}</p>
            <button type="button" onClick={() => window.location.reload()} className="btn-primary">
              Reload
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}