import { Component, type ReactNode } from 'react'

interface Props { children: ReactNode }
interface State { hasError: boolean; error?: Error }

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: { componentStack: string }) {
    console.error('[ErrorBoundary]', error, info.componentStack)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center h-64 text-center px-6">
          <div className="text-4xl mb-4">⚠️</div>
          <h3 className="font-semibold text-slate-800 mb-2">Có lỗi xảy ra</h3>
          <p className="text-sm text-slate-500 mb-5 max-w-sm">
            {this.state.error?.message ?? 'Lỗi không xác định'}
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: undefined })}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl transition-colors"
          >
            Thử lại
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
