/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react'
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

const defaultNotificationSettings = {
  emailNotifications: true,
  inquiryAlerts: true,
  listingAlerts: true,
  marketingPreferences: false,
}

const defaultContactPreferences = {
  email: true,
  phone: true,
  sms: false,
}

const withUserDefaults = (nextUser) => nextUser ? {
  ...nextUser,
  bio: nextUser.bio || '',
  image: nextUser.image || '',
  contactPreferences: {
    ...defaultContactPreferences,
    ...(nextUser.contactPreferences || {}),
  },
  notificationSettings: {
    ...defaultNotificationSettings,
    ...(nextUser.notificationSettings || {}),
  },
} : null

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => withUserDefaults(readStoredUser()))
  const userRef = useRef(user)
  const [isAuthLoading, setIsAuthLoading] = useState(false)
  const [authError, setAuthError] = useState('')

  const saveUser = (nextUser) => {
    const normalizedUser = withUserDefaults(nextUser)
    userRef.current = normalizedUser
    setUser(normalizedUser)
    localStorage.setItem(storageKey, JSON.stringify(normalizedUser))
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
    userRef.current = null
    setUser(null)
    localStorage.removeItem(storageKey)
  }

  const updateUser = useCallback(async (updates) => {
    setIsAuthLoading(true)
    setAuthError('')
    try {
      const savedUser = withUserDefaults({ ...userRef.current, ...updates })
      userRef.current = savedUser
      setUser(savedUser)
      localStorage.setItem(storageKey, JSON.stringify(savedUser))
      return savedUser
    } finally {
      setIsAuthLoading(false)
    }
  }, [])

  const updatePassword = useCallback(async ({ currentPassword, newPassword }) => {
    setIsAuthLoading(true)
    setAuthError('')
    try {
      const storedPassword = userRef.current?.password || 'password'
      if (currentPassword !== storedPassword) {
        throw new Error('Current password is incorrect.')
      }
      const savedUser = withUserDefaults({ ...userRef.current, password: newPassword })
      userRef.current = savedUser
      setUser(savedUser)
      localStorage.setItem(storageKey, JSON.stringify(savedUser))
      return savedUser
    } catch (error) {
      setAuthError(error.message)
      throw error
    } finally {
      setIsAuthLoading(false)
    }
  }, [])

  const value = useMemo(() => ({
    user,
    role: user?.role || 'guest',
    isAuthenticated: Boolean(user),
    isAuthLoading,
    authError,
    login,
    register,
    logout,
    updateUser,
    updatePassword,
  }), [authError, isAuthLoading, login, register, updatePassword, updateUser, user])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used inside AuthProvider')
  return context
}
