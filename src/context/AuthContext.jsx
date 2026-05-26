/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import { loginUser, registerUser } from '../api/marketplaceApi'

const AuthContext = createContext(null)
const storageKey = 'luxora-auth-user'

const readStoredUser = () => {
  try {
    return JSON.parse(localStorage.getItem(storageKey))
  } catch {
    return null
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(readStoredUser)
  const [isAuthLoading, setIsAuthLoading] = useState(false)
  const [authError, setAuthError] = useState('')

  const saveUser = (nextUser) => {
    setUser(nextUser)
    localStorage.setItem(storageKey, JSON.stringify(nextUser))
  }

  const login = useCallback(async (credentials) => {
    setIsAuthLoading(true)
    setAuthError('')
    try {
      const nextUser = await loginUser(credentials)
      saveUser(nextUser)
      return nextUser
    } catch (error) {
      setAuthError(error.message)
      throw error
    } finally {
      setIsAuthLoading(false)
    }
  }, [])

  const register = useCallback(async (payload) => {
    setIsAuthLoading(true)
    setAuthError('')
    try {
      const nextUser = await registerUser(payload)
      saveUser(nextUser)
      return nextUser
    } catch (error) {
      setAuthError(error.message)
      throw error
    } finally {
      setIsAuthLoading(false)
    }
  }, [])

  const logout = () => {
    setUser(null)
    localStorage.removeItem(storageKey)
  }

  const value = useMemo(() => ({
    user,
    role: user?.role || 'guest',
    isAuthenticated: Boolean(user),
    isAuthLoading,
    authError,
    login,
    register,
    logout,
  }), [authError, isAuthLoading, login, register, user])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used inside AuthProvider')
  return context
}
