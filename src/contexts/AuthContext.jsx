import { createContext, useContext, useState, useEffect } from 'react'

const TOKEN_KEY = 'auth_token'
const USER_KEY = 'auth_user'

const AuthContext = createContext({ token: null, user: null, login: async () => {}, register: async () => {}, logout: () => {} })

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY))
  const [user, setUser] = useState(() => {
    try {
      const u = localStorage.getItem(USER_KEY)
      return u ? JSON.parse(u) : null
    } catch (e) {
      return null
    }
  })

  useEffect(() => {
    if (token) {
      localStorage.setItem(TOKEN_KEY, token)
    } else {
      localStorage.removeItem(TOKEN_KEY)
      localStorage.removeItem(USER_KEY)
      setUser(null)
    }
  }, [token])

  const login = async (email, password) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || data.message || 'Login failed')
    setToken(data.token)
    setUser(data.user)
    localStorage.setItem(USER_KEY, JSON.stringify(data.user))
    return data
  }

  const register = async (email, password) => {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || data.message || 'Registration failed')
    setToken(data.token)
    setUser(data.user)
    localStorage.setItem(USER_KEY, JSON.stringify(data.user))
    return data
  }

  const logout = () => {
    setToken(null)
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ token, user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
