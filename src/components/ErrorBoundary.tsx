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
        <div className="px-4 py-16 text-center max-w-md mx-auto">
          <h2 className="text-xl font-semibold text-status-red mb-2">Something went wrong</h2>
          <p className="text-sm text-sovereign-silver mb-4">{this.state.message}</p>
          <button type="button" onClick={() => window.location.reload()} className="btn-primary">
            Reload
          </button>
        </div>
      )
    }
    return this.props.children
  }
}