import React from 'react'
import { ErrorFallback } from './ErrorFallback'

interface State { hasError: boolean; message?: string }

export class ErrorBoundary extends React.Component<{ children: React.ReactNode }, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(error: Error): State {
    console.error('[MotoPass ErrorBoundary]', error)
    return { hasError: true, message: error.message }
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallback message={this.state.message} />
    }
    return this.props.children
  }
}