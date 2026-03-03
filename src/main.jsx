import React from 'react'
import ReactDOM from 'react-dom/client'
import { I18nProvider } from './contexts/I18nContext'
import { AuthProvider } from './contexts/AuthContext'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <I18nProvider>
      <AuthProvider>
        <App />
      </AuthProvider>
    </I18nProvider>
  </React.StrictMode>,
)
