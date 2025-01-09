import { Component, type ErrorInfo, type ReactNode } from 'react'

interface Props {
  children?: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
  errorInfo?: ErrorInfo
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ error, errorInfo })
    console.error('Uncaught error:', error, errorInfo)
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-base-100 text-base-content">
          <div className="container mx-auto p-8">
            <h1 className="text-error text-4xl font-bold mb-4">
              Sorry.. there was an error
            </h1>
            <div className="bg-base-200 p-4 rounded-lg mb-4">
              <pre className="whitespace-pre-wrap">
                {this.state.error?.toString()}
              </pre>
            </div>
            <button
              className="btn btn-primary text-primary-content"
              onClick={() => window.location.reload()}
            >
              Reload Page
            </button>
            <button
              className="btn btn-primary-focus text-primary-content ml-4"
              onClick={() => window.history.back()}
            >
              Go Back
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
