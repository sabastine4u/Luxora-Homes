/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react'
import { loginUser, registerUser } from '../api/marketplaceApi'

const AuthContext = createContext(null)
const storageKey = 'luxora-auth-user'
const usersStorageKey = 'luxora-auth-users'
const normalizeEmail = (email = '') => email.trim().toLowerCase()

const demoUsers = [
  { id: 'user-1', name: 'John Doe', email: 'john@luxora.demo', password: 'password', role: 'user', phone: '+234 800 123 4567', accountType: 'buyer', accountStatus: 'Active', emailVerified: true, phoneVerified: true },
  { id: 'agent-1', name: 'Sarah Agent', email: 'agent@luxora.demo', password: 'password', role: 'agent', phone: '+234 802 345 6789', accountType: 'agent', accountStatus: 'Active', emailVerified: true, phoneVerified: true, agentVerification: { status: 'Approved', company: 'Luxora Demo Realty', license: 'REBN/2026/00001', documents: [] } },
  { id: 'admin-1', name: 'Admin', email: 'admin@luxora.demo', password: 'password', role: 'admin', phone: '+234 803 456 7890', accountType: 'admin', accountStatus: 'Active', emailVerified: true, phoneVerified: true },
]

const readStoredUser = () => {
  try {
    return JSON.parse(localStorage.getItem(storageKey))
  } catch {
    return null
  }
}

const readStoredUsers = () => {
  try {
    const storedUsers = JSON.parse(localStorage.getItem(usersStorageKey))
    if (Array.isArray(storedUsers) && storedUsers.length) {
      const storedIds = storedUsers.map((item) => item.id)
      return [...storedUsers, ...demoUsers.filter((item) => !storedIds.includes(item.id))]
    }
    return demoUsers
  } catch {
    return demoUsers
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
  accountStatus: nextUser.accountStatus || 'Active',
  accountType: nextUser.accountType || (nextUser.role === 'agent' ? 'agent' : 'buyer'),
  emailVerified: Boolean(nextUser.emailVerified),
  phoneVerified: Boolean(nextUser.phoneVerified),
  verificationCode: nextUser.verificationCode || '123456',
  agentVerification: nextUser.agentVerification || (nextUser.role === 'agent' ? { status: 'Pending', documents: [] } : null),
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
  const [registeredUsers, setRegisteredUsers] = useState(() => readStoredUsers().map(withUserDefaults))
  const userRef = useRef(user)
  const [isAuthLoading, setIsAuthLoading] = useState(false)
  const [authError, setAuthError] = useState('')

  const saveUser = (nextUser) => {
    const normalizedUser = withUserDefaults(nextUser)
    userRef.current = normalizedUser
    setUser(normalizedUser)
    localStorage.setItem(storageKey, JSON.stringify(normalizedUser))
  }

  const saveRegisteredUsers = useCallback((nextUsers) => {
    setRegisteredUsers(nextUsers)
    localStorage.setItem(usersStorageKey, JSON.stringify(nextUsers))
  }, [])

  const upsertRegisteredUser = useCallback((nextUser) => {
    const normalizedUser = withUserDefaults(nextUser)
    setRegisteredUsers((items) => {
      const next = items.some((item) => item.id === normalizedUser.id)
        ? items.map((item) => (item.id === normalizedUser.id ? { ...item, ...normalizedUser } : item))
        : [normalizedUser, ...items]
      localStorage.setItem(usersStorageKey, JSON.stringify(next))
      return next
    })
    return normalizedUser
  }, [])

  const login = useCallback(async (credentials) => {
    setIsAuthLoading(true)
    setAuthError('')
    try {
      const storedUser = registeredUsers.find((item) => normalizeEmail(item.email) === normalizeEmail(credentials.email) && (item.password || 'password') === credentials.password)
      const nextUser = storedUser || await loginUser(credentials)
      const normalizedUser = upsertRegisteredUser(nextUser)
      if (['Suspended', 'Banned'].includes(normalizedUser.accountStatus)) {
        throw new Error(`This account is ${normalizedUser.accountStatus.toLowerCase()}. Contact support for review.`)
      }
      saveUser(normalizedUser)
      return nextUser
    } catch (error) {
      setAuthError(error.message)
      throw error
    } finally {
      setIsAuthLoading(false)
    }
  }, [registeredUsers, upsertRegisteredUser])

  const register = useCallback(async (payload) => {
    setIsAuthLoading(true)
    setAuthError('')
    try {
      const email = payload.email.trim()
      const emailExists = registeredUsers.some((item) => normalizeEmail(item.email) === normalizeEmail(email))
      if (emailExists) {
        throw new Error('An account with this email already exists.')
      }

      const nextUser = await registerUser({ ...payload, email })
      const documents = [
        payload.idDocument ? { type: 'ID Document', name: payload.idDocument.name, size: payload.idDocument.size, uploadedAt: new Date().toISOString() } : null,
        payload.licenseDocument ? { type: 'License Document', name: payload.licenseDocument.name, size: payload.licenseDocument.size, uploadedAt: new Date().toISOString() } : null,
      ].filter(Boolean)
      const registeredUser = upsertRegisteredUser({
        ...nextUser,
        ...payload,
        email,
        accountType: payload.type,
        accountStatus: 'Active',
        emailVerified: false,
        phoneVerified: false,
        verificationCode: '123456',
        agentVerification: payload.type === 'agent' ? {
          status: 'Pending',
          company: payload.company || '',
          license: payload.license || '',
          documents,
          submittedAt: new Date().toISOString(),
        } : null,
      })
      saveUser(registeredUser)
      return registeredUser
    } catch (error) {
      setAuthError(error.message)
      throw error
    } finally {
      setIsAuthLoading(false)
    }
  }, [registeredUsers, upsertRegisteredUser])

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
      upsertRegisteredUser(savedUser)
      return savedUser
    } finally {
      setIsAuthLoading(false)
    }
  }, [upsertRegisteredUser])

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
      upsertRegisteredUser(savedUser)
      return savedUser
    } catch (error) {
      setAuthError(error.message)
      throw error
    } finally {
      setIsAuthLoading(false)
    }
  }, [upsertRegisteredUser])

  const updateUserStatus = useCallback((id, accountStatus) => {
    const nextUsers = registeredUsers.map((item) => (item.id === id ? { ...item, accountStatus } : item))
    saveRegisteredUsers(nextUsers)
    if (userRef.current?.id === id) {
      const nextUser = withUserDefaults({ ...userRef.current, accountStatus })
      userRef.current = nextUser
      setUser(nextUser)
      localStorage.setItem(storageKey, JSON.stringify(nextUser))
    }
    return nextUsers.find((item) => item.id === id)
  }, [registeredUsers, saveRegisteredUsers])

  const updateAgentVerification = useCallback((id, status, reason = '') => {
    const reviewedAt = new Date().toISOString()
    const nextUsers = registeredUsers.map((item) => {
      if (item.id !== id) return item
      return {
        ...item,
        agentVerification: {
          ...(item.agentVerification || {}),
          status,
          reason,
          reviewedAt,
        },
      }
    })
    saveRegisteredUsers(nextUsers)
    if (userRef.current?.id === id) {
      const nextUser = withUserDefaults(nextUsers.find((item) => item.id === id))
      userRef.current = nextUser
      setUser(nextUser)
      localStorage.setItem(storageKey, JSON.stringify(nextUser))
    }
    return nextUsers.find((item) => item.id === id)
  }, [registeredUsers, saveRegisteredUsers])

  const verifyContact = useCallback((field) => {
    const updates = field === 'phone' ? { phoneVerified: true } : { emailVerified: true }
    const savedUser = withUserDefaults({ ...userRef.current, ...updates })
    userRef.current = savedUser
    setUser(savedUser)
    localStorage.setItem(storageKey, JSON.stringify(savedUser))
    upsertRegisteredUser(savedUser)
    return savedUser
  }, [upsertRegisteredUser])

  const value = useMemo(() => ({
    user,
    role: user?.role || 'guest',
    isAuthenticated: Boolean(user),
    isAuthLoading,
    authError,
    registeredUsers,
    login,
    register,
    logout,
    updateUser,
    updatePassword,
    updateUserStatus,
    updateAgentVerification,
    verifyContact,
  }), [authError, isAuthLoading, login, register, registeredUsers, updateAgentVerification, updatePassword, updateUser, updateUserStatus, user, verifyContact])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used inside AuthProvider')
  return context
}
