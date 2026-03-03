import { Component } from 'react'
import AnimatedBackground from './AnimatedBackground'
import AppleButton from './AppleButton'

export default class ErrorBoundary extends Component {
  state = { hasError: false, error: null }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, info) {
    console.error('ErrorBoundary:', error, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen relative flex items-center justify-center p-4">
          <AnimatedBackground />
          <div className="relative z-10 bg-slate-950/90 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-2xl p-8 max-w-md text-center">
            <h1 className="text-xl font-bold text-white mb-2">
              {this.props.locale === 'en' ? 'Something went wrong' : '出错了'}
            </h1>
            <p className="text-slate-300 mb-6">
              {this.props.locale === 'en' ? 'The page encountered an error. Try refreshing.' : '页面遇到错误，请尝试刷新。'}
            </p>
            <AppleButton onClick={() => window.location.reload()}>
              {this.props.locale === 'en' ? 'Refresh' : '刷新'}
            </AppleButton>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
