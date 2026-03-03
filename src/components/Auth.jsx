import { useState } from 'react'
import { useI18n } from '../contexts/I18nContext'
import AnimatedBackground from './AnimatedBackground'
import GlassCard from './GlassCard'
import AppleButton from './AppleButton'

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
    <div className="min-h-screen relative flex items-center justify-center py-12 px-4">
      <AnimatedBackground />
      <div className="absolute top-4 right-4 z-20">
        <AppleButton variant="secondary" onClick={() => setLocale(locale === 'zh' ? 'en' : 'zh')}>
          {locale === 'zh' ? 'EN' : '中文'}
        </AppleButton>
      </div>
      <GlassCard className="relative z-10 max-w-md w-full p-8">
        <h1 className="text-2xl font-bold text-center text-white mb-6">
          {tab === 'login' ? t('loginTab') : t('registerTab')}
        </h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-200 mb-1">{t('email')}</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-slate-400 focus:ring-2 focus:ring-white/20"
              placeholder="you@example.com"
              autoComplete="email"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-200 mb-1">{t('password')}</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-slate-400 focus:ring-2 focus:ring-white/20"
              placeholder="••••••••"
              autoComplete={tab === 'login' ? 'current-password' : 'new-password'}
            />
            {tab === 'register' && (
              <p className="mt-1 text-xs text-slate-400">{tApp('authMinChars')}</p>
            )}
          </div>
          {error && (
            <div className="p-2 rounded-lg bg-red-500/20 text-red-200 text-sm border border-red-400/30">{error}</div>
          )}
          <AppleButton type="submit" disabled={loading} className="w-full">
            {loading ? tApp('authLoading') : (tab === 'login' ? t('login') : t('register'))}
          </AppleButton>
        </form>
        <p className="mt-4 text-center text-sm text-slate-300">
          {tab === 'login' ? (
            <button type="button" onClick={() => setTab('register')} className="text-white hover:underline">
              {t('noAccount')}
            </button>
          ) : (
            <button type="button" onClick={() => setTab('login')} className="text-white hover:underline">
              {t('hasAccount')}
            </button>
          )}
        </p>
      </GlassCard>
    </div>
  )
}

export default Auth
