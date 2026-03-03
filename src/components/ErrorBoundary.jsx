import { Component } from 'react'

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
        <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
          <div className="bg-white rounded-xl shadow-lg p-8 max-w-md text-center">
            <h1 className="text-xl font-bold text-gray-800 mb-2">
              {this.props.locale === 'en' ? 'Something went wrong' : '出错了'}
            </h1>
            <p className="text-gray-600 mb-4">
              {this.props.locale === 'en'
                ? 'The page encountered an error. Try refreshing.'
                : '页面遇到错误，请尝试刷新。'}
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
            >
              {this.props.locale === 'en' ? 'Refresh' : '刷新'}
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
