/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react'

const UIContext = createContext(null)

export function UIProvider({ children }) {
  const [toast, setToast] = useState(null)
  const toastTimerRef = useRef(null)

  const notify = useCallback((message, type = 'success') => {
    if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current)
    setToast({ message, type })
    toastTimerRef.current = window.setTimeout(() => setToast(null), 3200)
  }, [])

  const value = useMemo(() => ({ notify }), [notify])

  return (
    <UIContext.Provider value={value}>
      {children}
      {toast && <div className={`toast toast-${toast.type}`} role="status">{toast.message}</div>}
    </UIContext.Provider>
  )
}

export function useUI() {
  const context = useContext(UIContext)
  if (!context) throw new Error('useUI must be used inside UIProvider')
  return context
}
