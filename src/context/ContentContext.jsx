/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useMemo, useState } from 'react'

const ContentContext = createContext(null)
const storageKey = 'luxora-content-state'

const defaultContent = {
  categories: ['Apartment', 'Duplex', 'Studio Apartment', 'Mini Flat', 'Self-contained', 'Short-let', 'Student Housing', 'Affordable Rental', 'Family Home', 'Villa', 'Penthouse', 'Commercial', 'Warehouse', 'Land'],
  amenities: ['Parking', 'Pool', 'Gym', 'Security', 'Furnished', 'AC', 'Garden', 'Elevator', 'Balcony', 'WiFi', 'Water', 'Backup Power'],
  locations: ['Victoria Island', 'Ikoyi', 'Lekki', 'Yaba', 'Ikeja', 'Ajah', 'Surulere', 'Gwarinpa', 'Wuse 2', 'Maitama'],
  plans: [
    { id: 'starter', name: 'Starter', listingLimit: 5, featuredLimit: 1, duration: '30 days', price: 0, badge: 'Basic' },
    { id: 'pro', name: 'Pro Agent', listingLimit: 25, featuredLimit: 5, duration: '30 days', price: 75000, badge: 'Popular' },
  ],
}

const readContentState = () => {
  try {
    return { ...defaultContent, ...(JSON.parse(localStorage.getItem(storageKey)) || {}) }
  } catch {
    return defaultContent
  }
}

const normalizeList = (items) => [...new Set(items.map((item) => item.trim()).filter(Boolean))]

export function ContentProvider({ children }) {
  const [content, setContent] = useState(readContentState)

  const persist = useCallback((next) => {
    setContent(next)
    localStorage.setItem(storageKey, JSON.stringify(next))
  }, [])

  const saveListItem = useCallback((type, value, oldValue = '') => {
    const item = value.trim()
    if (!item) return
    setContent((current) => {
      const currentList = current[type] || []
      const nextList = oldValue
        ? currentList.map((entry) => (entry === oldValue ? item : entry))
        : [...currentList, item]
      const next = { ...current, [type]: normalizeList(nextList) }
      localStorage.setItem(storageKey, JSON.stringify(next))
      return next
    })
  }, [])

  const deleteListItem = useCallback((type, value) => {
    setContent((current) => {
      const next = { ...current, [type]: (current[type] || []).filter((item) => item !== value) }
      localStorage.setItem(storageKey, JSON.stringify(next))
      return next
    })
  }, [])

  const savePlan = useCallback((plan) => {
    const normalized = {
      ...plan,
      id: plan.id || `plan-${Date.now()}`,
      listingLimit: Number(plan.listingLimit) || 0,
      featuredLimit: Number(plan.featuredLimit) || 0,
      price: Number(plan.price) || 0,
    }
    setContent((current) => {
      const plans = current.plans.some((item) => item.id === normalized.id)
        ? current.plans.map((item) => (item.id === normalized.id ? normalized : item))
        : [normalized, ...current.plans]
      const next = { ...current, plans }
      localStorage.setItem(storageKey, JSON.stringify(next))
      return next
    })
    return normalized
  }, [])

  const deletePlan = useCallback((id) => {
    setContent((current) => {
      const next = { ...current, plans: current.plans.filter((plan) => plan.id !== id) }
      localStorage.setItem(storageKey, JSON.stringify(next))
      return next
    })
  }, [])

  const value = useMemo(() => ({
    ...content,
    persist,
    saveListItem,
    deleteListItem,
    savePlan,
    deletePlan,
  }), [content, deleteListItem, deletePlan, persist, saveListItem, savePlan])

  return <ContentContext.Provider value={value}>{children}</ContentContext.Provider>
}

export function useContent() {
  const context = useContext(ContentContext)
  if (!context) throw new Error('useContent must be used inside ContentProvider')
  return context
}
