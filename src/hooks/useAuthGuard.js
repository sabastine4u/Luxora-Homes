import { createElement } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export const dashboardPathForRole = (role = 'user') => `/dashboard/${role === 'admin' ? 'admin' : role === 'agent' ? 'agent' : 'user'}`

export function useAuthGuard(allowedRoles = []) {
  const { isAuthenticated, role, user } = useAuth()
  const location = useLocation()
  const isAllowed = allowedRoles.length === 0 || allowedRoles.includes(role)
  const isBlocked = ['Suspended', 'Banned'].includes(user?.accountStatus)
  const roleDashboardPath = dashboardPathForRole(role)
  const isDashboardRoute = location.pathname.startsWith('/dashboard/')
  const isCorrectDashboardRoute = location.pathname === roleDashboardPath || location.pathname.startsWith(`${roleDashboardPath}/`)

  return {
    isAuthenticated,
    isAllowed,
    isBlocked,
    isDashboardRoute,
    isCorrectDashboardRoute,
    roleDashboardPath,
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

  if (guard.isDashboardRoute && !guard.isCorrectDashboardRoute) {
    return createElement(Navigate, { to: guard.roleDashboardPath, replace: true })
  }

  if (!guard.isAllowed) {
    return createElement(Navigate, { to: guard.roleDashboardPath, replace: true })
  }

  return children
}
