import { useState } from 'react'
import { useI18n } from '../contexts/I18nContext'

const TEXTS = {
  zh: {
    login: '登录',
    register: '注册',
    email: '邮箱',
    password: '密码',
    loginTab: '登录',
    registerTab: '注册',
    noAccount: '没有账号？去注册',
    hasAccount: '已有账号？去登录',
    success: '成功',
  },
  en: {
    login: 'Log in',
    register: 'Sign up',
    email: 'Email',
    password: 'Password',
    loginTab: 'Log in',
    registerTab: 'Sign up',
    noAccount: "No account? Sign up",
    hasAccount: 'Have an account? Log in',
    success: 'Success',
  },
}

function Auth({ onLogin, onRegister }) {
  const { locale, setLocale, t: tApp } = useI18n()
  const t = (key) => TEXTS[locale]?.[key] ?? TEXTS.zh[key]
  const [tab, setTab] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!email.trim() || !password) {
      setError(tApp('authFillEmailPassword'))
      return
    }
    setLoading(true)
    try {
      if (tab === 'login') {
        await onLogin(email.trim(), password)
      } else {
        await onRegister(email.trim(), password)
      }
    } catch (err) {
      setError(err.message || tApp('authRequestFailed'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-indigo-100 py-12 px-4">
      <div className="absolute top-4 right-4">
        <button
          type="button"
          onClick={() => setLocale(locale === 'zh' ? 'en' : 'zh')}
          className="px-3 py-1.5 rounded-lg bg-white/80 hover:bg-white shadow text-sm text-gray-700"
        >
          {locale === 'zh' ? 'EN' : '中文'}
        </button>
      </div>
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-8">
        <h1 className="text-2xl font-bold text-center text-gray-800 mb-6">
          {tab === 'login' ? t('loginTab') : t('registerTab')}
        </h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('email')}</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              placeholder="you@example.com"
              autoComplete="email"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('password')}</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              placeholder="••••••••"
              autoComplete={tab === 'login' ? 'current-password' : 'new-password'}
            />
            {tab === 'register' && (
              <p className="mt-1 text-xs text-gray-500">
                {tApp('authMinChars')}
              </p>
            )}
          </div>
          {error && (
            <div className="p-2 rounded bg-red-50 text-red-700 text-sm">{error}</div>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 disabled:opacity-50"
          >
            {loading ? tApp('authLoading') : (tab === 'login' ? t('login') : t('register'))}
          </button>
        </form>
        <p className="mt-4 text-center text-sm text-gray-600">
          {tab === 'login' ? (
            <button type="button" onClick={() => setTab('register')} className="text-purple-600 hover:underline">
              {t('noAccount')}
            </button>
          ) : (
            <button type="button" onClick={() => setTab('login')} className="text-purple-600 hover:underline">
              {t('hasAccount')}
            </button>
          )}
        </p>
      </div>
    </div>
  )
}

export default Auth
