/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useMemo, useState } from 'react'

const SocialContext = createContext(null)
const storageKey = 'luxora-social-state'

const readStoredState = () => {
  try {
    return JSON.parse(localStorage.getItem(storageKey)) || {}
  } catch {
    return {}
  }
}

export function SocialProvider({ children }) {
  const stored = readStoredState()
  const [favoriteIds, setFavoriteIds] = useState(stored.favoriteIds || ['1', '3'])
  const [recentIds, setRecentIds] = useState(stored.recentIds || [])
  const [viewings, setViewings] = useState(stored.viewings || [])
  const [messages, setMessages] = useState(stored.messages || [])

  const persist = useCallback((nextState) => {
    localStorage.setItem(storageKey, JSON.stringify({
      favoriteIds,
      recentIds,
      viewings,
      messages,
      ...nextState,
    }))
  }, [favoriteIds, messages, recentIds, viewings])

  const toggleFavorite = useCallback((id) => {
    setFavoriteIds((items) => {
      const next = items.includes(id) ? items.filter((item) => item !== id) : [...items, id]
      persist({ favoriteIds: next })
      return next
    })
  }, [persist])

  const trackRecent = useCallback((id) => {
    setRecentIds((items) => {
      if (items[0] === id) return items
      const next = [id, ...items.filter((item) => item !== id)].slice(0, 8)
      persist({ recentIds: next })
      return next
    })
  }, [persist])

  const addViewing = useCallback((viewing) => {
    setViewings((items) => {
      const next = [viewing, ...items]
      persist({ viewings: next })
      return next
    })
  }, [persist])

  const addMessage = useCallback((message) => {
    setMessages((items) => {
      const next = [message, ...items]
      persist({ messages: next })
      return next
    })
  }, [persist])

  const isFavorite = useCallback((id) => favoriteIds.includes(id), [favoriteIds])

  const value = useMemo(() => ({
    favoriteIds,
    recentIds,
    viewings,
    messages,
    toggleFavorite,
    trackRecent,
    addViewing,
    addMessage,
    isFavorite,
  }), [addMessage, addViewing, favoriteIds, isFavorite, messages, recentIds, toggleFavorite, trackRecent, viewings])

  return <SocialContext.Provider value={value}>{children}</SocialContext.Provider>
}

export function useSocial() {
  const context = useContext(SocialContext)
  if (!context) throw new Error('useSocial must be used inside SocialProvider')
  return context
}
