import { createContext, useContext, useState, useEffect } from 'react'
import { getLocale, setLocale as persistLocale, t as tRaw } from '../utils/i18n'

const I18nContext = createContext({ locale: 'zh', setLocale: () => {}, t: (k) => k })

export function I18nProvider({ children }) {
  const [locale, setLocaleState] = useState(getLocale)

  useEffect(() => {
    persistLocale(locale)
  }, [locale])

  const setLocale = (lang) => {
    if (lang === 'zh' || lang === 'en') setLocaleState(lang)
  }

  const t = (key, vars) => {
    let s = tRaw(locale, key)
    if (vars && typeof vars === 'object') {
      Object.keys(vars).forEach((k) => {
        s = s.replace(new RegExp('\\{' + k + '\\}', 'g'), String(vars[k]))
      })
    }
    return s
  }

  return (
    <I18nContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </I18nContext.Provider>
  )
}

export function useI18n() {
  return useContext(I18nContext)
}
