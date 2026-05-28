import { createElement } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export function useAuthGuard(allowedRoles = []) {
  const { isAuthenticated, role, user } = useAuth()
  const location = useLocation()
  const isAllowed = allowedRoles.length === 0 || allowedRoles.includes(role)
  const isBlocked = ['Suspended', 'Banned'].includes(user?.accountStatus)

  return {
    isAuthenticated,
    isAllowed,
    isBlocked,
    redirectState: { from: location.pathname },
  }
}

export function ProtectedRoute({ children, roles = [] }) {
  const guard = useAuthGuard(roles)

  if (!guard.isAuthenticated) {
    return createElement(Navigate, { to: '/auth/login', replace: true, state: guard.redirectState })
  }

  if (guard.isBlocked) {
    return createElement(Navigate, { to: '/auth/login', replace: true })
  }

  if (!guard.isAllowed) {
    return createElement(Navigate, { to: '/dashboard/user', replace: true })
  }

  return children
}
