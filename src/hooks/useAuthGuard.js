import { createElement } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export function useAuthGuard(allowedRoles = []) {
  const { isAuthenticated, role } = useAuth()
  const location = useLocation()
  const isAllowed = allowedRoles.length === 0 || allowedRoles.includes(role)

  return {
    isAuthenticated,
    isAllowed,
    redirectState: { from: location.pathname },
  }
}

export function ProtectedRoute({ children, roles = [] }) {
  const guard = useAuthGuard(roles)

  if (!guard.isAuthenticated) {
    return createElement(Navigate, { to: '/auth/login', replace: true, state: guard.redirectState })
  }

  if (!guard.isAllowed) {
    return createElement(Navigate, { to: '/dashboard/user', replace: true })
  }

  return children
}
