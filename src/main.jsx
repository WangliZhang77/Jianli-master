import React from 'react'
import ReactDOM from 'react-dom/client'
import { Toaster } from 'react-hot-toast'
import { I18nProvider, useI18n } from './contexts/I18nContext'
import { AuthProvider } from './contexts/AuthContext'
import App from './App'
import ErrorBoundary from './components/ErrorBoundary'
import './index.css'

function ErrorBoundaryWithLocale({ children }) {
  const { locale } = useI18n()
  return <ErrorBoundary locale={locale}>{children}</ErrorBoundary>
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <I18nProvider>
      <ErrorBoundaryWithLocale>
        <AuthProvider>
          <App />
          <Toaster position="top-center" toastOptions={{ duration: 3000 }} />
        </AuthProvider>
      </ErrorBoundaryWithLocale>
    </I18nProvider>
  </React.StrictMode>,
)
