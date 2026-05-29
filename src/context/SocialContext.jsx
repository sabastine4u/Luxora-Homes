/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { useAuth } from './AuthContext'

const SocialContext = createContext(null)
const storageKey = 'luxora-social-state'

const userStorageKey = (user, slice = 'state') => `${storageKey}:${user?.id || user?.email || 'guest'}:${slice}`
const legacyUserStorageKey = (user) => `${storageKey}:${user?.id || user?.email || 'guest'}`

const defaultState = {
  favoriteIds: [],
  recentIds: [],
  viewings: [],
  messages: [],
  notifications: [],
  savedSearches: [],
  recentSearches: [],
  compareIds: [],
  replyTemplates: [],
}

const readStoredStateByKey = (key, user) => {
  try {
    const namespacedState = {
      favoriteIds: JSON.parse(localStorage.getItem(userStorageKey(user, 'favorites')) || 'null'),
      recentIds: JSON.parse(localStorage.getItem(userStorageKey(user, 'recentProperties')) || 'null'),
      viewings: JSON.parse(localStorage.getItem(userStorageKey(user, 'viewings')) || 'null'),
      messages: JSON.parse(localStorage.getItem(userStorageKey(user, 'messages')) || 'null'),
      notifications: JSON.parse(localStorage.getItem(userStorageKey(user, 'notifications')) || 'null'),
      savedSearches: JSON.parse(localStorage.getItem(userStorageKey(user, 'savedSearches')) || 'null'),
      recentSearches: JSON.parse(localStorage.getItem(userStorageKey(user, 'recentSearches')) || 'null'),
      compareIds: JSON.parse(localStorage.getItem(userStorageKey(user, 'compareList')) || 'null'),
      replyTemplates: JSON.parse(localStorage.getItem(userStorageKey(user, 'replyTemplates')) || 'null'),
    }
    if (Object.values(namespacedState).some((value) => Array.isArray(value))) return namespacedState
    return JSON.parse(localStorage.getItem(key)) || JSON.parse(localStorage.getItem(legacyUserStorageKey(user))) || {}
  } catch {
    return {}
  }
}

const hydrateSocialStateFromStored = (stored) => {
  return {
    favoriteIds: stored.favoriteIds || defaultState.favoriteIds,
    recentIds: stored.recentIds || defaultState.recentIds,
    viewings: stored.viewings || defaultState.viewings,
    messages: stored.messages || defaultState.messages,
    notifications: stored.notifications || defaultState.notifications,
    savedSearches: stored.savedSearches || defaultState.savedSearches,
    recentSearches: stored.recentSearches || defaultState.recentSearches,
    compareIds: stored.compareIds || defaultState.compareIds,
    replyTemplates: stored.replyTemplates || defaultState.replyTemplates,
  }
}

const hydrateSocialStateByKey = (key, user) => hydrateSocialStateFromStored(readStoredStateByKey(key, user))

const normalizeCriteria = (criteria = {}) => ({
  listingType: criteria.listingType || 'all',
  query: criteria.query || '',
  sort: criteria.sort || 'recent',
  propertyTypes: criteria.propertyTypes || [],
  amenities: criteria.amenities || [],
  nearbyAmenities: criteria.nearbyAmenities || [],
  beds: criteria.beds || 'Any',
  baths: criteria.baths || 'Any',
  minPrice: criteria.minPrice || 0,
  price: criteria.price ?? 65,
  agentId: criteria.agentId || '',
})

const searchLabel = (criteria = {}) => {
  const normalized = normalizeCriteria(criteria)
  const parts = [
    normalized.query,
    normalized.listingType !== 'all' ? normalized.listingType : '',
    ...(normalized.propertyTypes || []),
    normalized.beds !== 'Any' ? `${normalized.beds} beds` : '',
    normalized.baths !== 'Any' ? `${normalized.baths} baths` : '',
  ].filter(Boolean)
  return parts.length ? parts.join(' / ') : 'All properties'
}

const searchKey = (criteria = {}) => JSON.stringify(normalizeCriteria(criteria))

const agentIdentityIds = (agent = {}) => [
  agent.id,
  agent.agentId,
  agent.agentProfileId,
  ...(agent.agentProfileIds || []),
].filter(Boolean)

const messageAgentIds = (message = {}) => [
  message.agentUserId,
  message.ownerId,
  message.agentId,
  message.ownerAgentId,
].filter(Boolean)

export function SocialProvider({ children }) {
  const { registeredUsers, user } = useAuth()
  const userKey = useMemo(() => userStorageKey(user), [user])

  return <SocialStateProvider key={userKey} registeredUsers={registeredUsers} user={user} userKey={userKey}>{children}</SocialStateProvider>
}

function SocialStateProvider({ children, registeredUsers, user, userKey }) {
  const [initialState] = useState(() => hydrateSocialStateByKey(userKey, user))
  const [favoriteIds, setFavoriteIds] = useState(initialState.favoriteIds)
  const [recentIds, setRecentIds] = useState(initialState.recentIds)
  const [viewings, setViewings] = useState(initialState.viewings)
  const [messages, setMessages] = useState(initialState.messages)
  const [notifications, setNotifications] = useState(initialState.notifications)
  const [savedSearches, setSavedSearches] = useState(initialState.savedSearches)
  const [recentSearches, setRecentSearches] = useState(initialState.recentSearches)
  const [compareIds, setCompareIds] = useState(initialState.compareIds)
  const [replyTemplates, setReplyTemplates] = useState(initialState.replyTemplates)
  const stateRef = useRef(initialState)

  useEffect(() => {
    stateRef.current = {
      favoriteIds,
      recentIds,
      viewings,
      messages,
      notifications,
      savedSearches,
      recentSearches,
      compareIds,
      replyTemplates,
    }
  }, [compareIds, favoriteIds, messages, notifications, recentIds, recentSearches, replyTemplates, savedSearches, viewings])

  const persist = useCallback((nextState) => {
    const next = {
      ...stateRef.current,
      ...nextState,
    }
    localStorage.setItem(userKey, JSON.stringify(next))
    localStorage.setItem(userStorageKey(user, 'favorites'), JSON.stringify(next.favoriteIds))
    localStorage.setItem(userStorageKey(user, 'recentProperties'), JSON.stringify(next.recentIds))
    localStorage.setItem(userStorageKey(user, 'viewings'), JSON.stringify(next.viewings))
    localStorage.setItem(userStorageKey(user, 'messages'), JSON.stringify(next.messages))
    localStorage.setItem(userStorageKey(user, 'notifications'), JSON.stringify(next.notifications))
    localStorage.setItem(userStorageKey(user, 'savedSearches'), JSON.stringify(next.savedSearches))
    localStorage.setItem(userStorageKey(user, 'recentSearches'), JSON.stringify(next.recentSearches))
    localStorage.setItem(userStorageKey(user, 'compareList'), JSON.stringify(next.compareIds))
    localStorage.setItem(userStorageKey(user, 'replyTemplates'), JSON.stringify(next.replyTemplates))
  }, [user, userKey])

  const persistStateForUser = useCallback((targetUser, next) => {
    const key = userStorageKey(targetUser)
    localStorage.setItem(key, JSON.stringify(next))
    localStorage.setItem(userStorageKey(targetUser, 'favorites'), JSON.stringify(next.favoriteIds))
    localStorage.setItem(userStorageKey(targetUser, 'recentProperties'), JSON.stringify(next.recentIds))
    localStorage.setItem(userStorageKey(targetUser, 'viewings'), JSON.stringify(next.viewings))
    localStorage.setItem(userStorageKey(targetUser, 'messages'), JSON.stringify(next.messages))
    localStorage.setItem(userStorageKey(targetUser, 'notifications'), JSON.stringify(next.notifications || []))
    localStorage.setItem(userStorageKey(targetUser, 'savedSearches'), JSON.stringify(next.savedSearches))
    localStorage.setItem(userStorageKey(targetUser, 'recentSearches'), JSON.stringify(next.recentSearches))
    localStorage.setItem(userStorageKey(targetUser, 'compareList'), JSON.stringify(next.compareIds))
    localStorage.setItem(userStorageKey(targetUser, 'replyTemplates'), JSON.stringify(next.replyTemplates))
  }, [])

  const findAgentForMessage = useCallback((message) => {
    const assignedAgentIds = messageAgentIds(message)
    if (assignedAgentIds.length) {
      return registeredUsers.find((item) => item.id !== user?.id && agentIdentityIds(item).some((id) => assignedAgentIds.includes(id)))
    }
    if (message.copiedToAgentId) return registeredUsers.find((item) => item.id === message.copiedToAgentId)
    const agentName = message.owner || message.agent
    return registeredUsers.find((item) => item.id !== user?.id && [item.name, item.email].includes(agentName))
  }, [registeredUsers, user])

  const copyMessageToAgent = useCallback((message) => {
    const targetUser = findAgentForMessage(message)
    if (!targetUser) return
    const targetState = hydrateSocialStateByKey(userStorageKey(targetUser), targetUser)
    if (targetState.messages.some((item) => item.id === message.id)) return
    persistStateForUser(targetUser, { ...targetState, messages: [{ ...message, copiedToAgentId: targetUser.id }, ...targetState.messages] })
  }, [findAgentForMessage, persistStateForUser])

  const syncMessageForUser = useCallback((targetUser, id, updater) => {
    if (!targetUser) return
    if (targetUser.id === user?.id) return
    const targetState = hydrateSocialStateByKey(userStorageKey(targetUser), targetUser)
    if (!targetState.messages.some((item) => item.id === id)) return
    persistStateForUser(targetUser, {
      ...targetState,
      messages: targetState.messages.map((item) => (item.id === id ? updater(item) : item)),
    })
  }, [persistStateForUser, user])

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

  const trackSearch = useCallback((criteria) => {
    const normalized = normalizeCriteria(criteria)
    const key = searchKey(normalized)
    const search = {
      id: `recent-search-${Date.now()}`,
      name: searchLabel(normalized),
      criteria: normalized,
      key,
      createdAt: new Date().toISOString(),
    }
    setRecentSearches((items) => {
      if (items[0]?.key === key) return items
      const next = [search, ...items.filter((item) => item.key !== key)].slice(0, 8)
      persist({ recentSearches: next })
      return next
    })
  }, [persist])

  const saveSearch = useCallback((name, criteria) => {
    const normalized = normalizeCriteria(criteria)
    const key = searchKey(normalized)
    const createdAt = new Date().toISOString()
    const savedSearch = {
      id: `saved-search-${Date.now()}`,
      name: name?.trim() || searchLabel(normalized),
      criteria: normalized,
      key,
      status: 'Active',
      alertsEnabled: true,
      alertCount: 1,
      createdAt,
      lastAlertAt: createdAt,
    }
    setSavedSearches((items) => {
      const existing = items.find((item) => item.key === key)
      const next = existing
        ? items.map((item) => (item.key === key ? { ...item, ...savedSearch, id: item.id, createdAt: item.createdAt } : item))
        : [savedSearch, ...items]
      persist({ savedSearches: next })
      return next
    })
    return savedSearch
  }, [persist])

  const toggleSavedSearchStatus = useCallback((id) => {
    const currentSearch = savedSearches.find((item) => item.id === id)
    const updatedSearch = currentSearch ? {
      ...currentSearch,
      status: currentSearch.status === 'Active' ? 'Paused' : 'Active',
      alertsEnabled: currentSearch.status !== 'Active',
      lastAlertAt: new Date().toISOString(),
    } : null
    setSavedSearches((items) => {
      const next = items.map((item) => {
        if (item.id !== id) return item
        return updatedSearch
      })
      persist({ savedSearches: next })
      return next
    })
    return updatedSearch
  }, [persist, savedSearches])

  const deleteSavedSearch = useCallback((id) => {
    setSavedSearches((items) => {
      const next = items.filter((item) => item.id !== id)
      persist({ savedSearches: next })
      return next
    })
  }, [persist])

  const addCompare = useCallback((id) => {
    if (compareIds.includes(id)) return { ok: false, reason: 'duplicate' }
    if (compareIds.length >= 4) return { ok: false, reason: 'limit' }
    const next = [...compareIds, id]
    setCompareIds(next)
    persist({ compareIds: next })
    return { ok: true }
  }, [compareIds, persist])

  const removeCompare = useCallback((id) => {
    setCompareIds((items) => {
      const next = items.filter((item) => item !== id)
      persist({ compareIds: next })
      return next
    })
  }, [persist])

  const clearCompare = useCallback(() => {
    setCompareIds([])
    persist({ compareIds: [] })
  }, [persist])

  const addViewing = useCallback((viewing) => {
    const savedViewing = { id: `viewing-${Date.now()}`, status: 'Scheduled', createdAt: new Date().toISOString(), ...viewing }
    setViewings((items) => {
      const next = [savedViewing, ...items]
      persist({ viewings: next })
      return next
    })
    copyMessageToAgent({
      id: `viewing-message-${savedViewing.id}`,
      propertyId: savedViewing.propertyId,
      propertyTitle: savedViewing.propertyTitle,
      propertyReference: savedViewing.propertyTitle,
      agent: savedViewing.agent,
      owner: savedViewing.agent,
      agentId: savedViewing.agentId,
      ownerAgentId: savedViewing.ownerAgentId || savedViewing.agentId,
      message: `Viewing scheduled for ${savedViewing.propertyTitle}.`,
      status: 'New',
      isRead: false,
      createdAt: savedViewing.createdAt,
      timestamp: savedViewing.createdAt,
    })
  }, [copyMessageToAgent, persist])

  const addMessage = useCallback((message) => {
    const savedMessage = {
      isRead: false,
      createdAt: new Date().toISOString(),
      timestamp: new Date().toISOString(),
      seekerId: user?.id,
      seekerEmail: user?.email,
      seekerName: user?.name || message.seekerName || message.name,
      ...message,
    }
    setMessages((items) => {
      const next = [savedMessage, ...items]
      persist({ messages: next })
      return next
    })
    copyMessageToAgent(savedMessage)
  }, [copyMessageToAgent, persist, user])

  const markMessageRead = useCallback((id) => {
    setMessages((items) => {
      const next = items.map((item) => (item.id === id ? { ...item, isRead: true } : item))
      persist({ messages: next })
      return next
    })
  }, [persist])

  const updateMessageStatus = useCallback((id, status) => {
    setMessages((items) => {
      const next = items.map((item) => (item.id === id ? { ...item, status } : item))
      persist({ messages: next })
      return next
    })
  }, [persist])

  const addMessageReply = useCallback((id, reply) => {
    const savedReply = { id: `reply-${Date.now()}`, createdAt: new Date().toISOString(), ...reply }
    const currentMessage = stateRef.current.messages.find((item) => item.id === id)
    setMessages((items) => {
      const next = items.map((item) => (
        item.id === id
          ? { ...item, replies: [savedReply, ...(item.replies || [])], isRead: true, status: savedReply.status || item.status }
          : item
      ))
      persist({ messages: next })
      return next
    })
    if (currentMessage) {
      const seeker = registeredUsers.find((item) => item.id === currentMessage.seekerId || item.email === currentMessage.seekerEmail || item.email === currentMessage.email)
      const agent = findAgentForMessage(currentMessage)
      syncMessageForUser(seeker, id, (item) => ({ ...item, replies: [savedReply, ...(item.replies || [])], isRead: false, status: reply.status || item.status }))
      syncMessageForUser(agent, id, (item) => ({ ...item, replies: [savedReply, ...(item.replies || [])], isRead: false, status: reply.status || item.status }))
    }
  }, [findAgentForMessage, persist, registeredUsers, syncMessageForUser])

  const dismissNotification = useCallback((id) => {
    setNotifications((items) => {
      const next = items.filter((item) => item.id !== id)
      persist({ notifications: next })
      return next
    })
  }, [persist])

  const addLeadNote = useCallback((id, note) => {
    const savedNote = {
      id: `note-${Date.now()}`,
      note: note.trim(),
      createdAt: new Date().toISOString(),
    }
    setMessages((items) => {
      const next = items.map((item) => (
        item.id === id ? { ...item, notes: [savedNote, ...(item.notes || [])] } : item
      ))
      persist({ messages: next })
      return next
    })
    return savedNote
  }, [persist])

  const saveReplyTemplate = useCallback((template) => {
    const savedTemplate = {
      id: `template-${Date.now()}`,
      title: template.title.trim(),
      message: template.message.trim(),
      createdAt: new Date().toISOString(),
    }
    setReplyTemplates((items) => {
      const next = [savedTemplate, ...items]
      persist({ replyTemplates: next })
      return next
    })
    return savedTemplate
  }, [persist])

  const deleteReplyTemplate = useCallback((id) => {
    setReplyTemplates((items) => {
      const next = items.filter((item) => item.id !== id)
      persist({ replyTemplates: next })
      return next
    })
  }, [persist])

  const isFavorite = useCallback((id) => favoriteIds.includes(id), [favoriteIds])
  const isCompared = useCallback((id) => compareIds.includes(id), [compareIds])

  const value = useMemo(() => ({
    favoriteIds,
    recentIds,
    viewings,
    messages,
    notifications,
    savedSearches,
    recentSearches,
    compareIds,
    replyTemplates,
    toggleFavorite,
    trackRecent,
    trackSearch,
    saveSearch,
    toggleSavedSearchStatus,
    deleteSavedSearch,
    addCompare,
    removeCompare,
    clearCompare,
    addViewing,
    addMessage,
    markMessageRead,
    updateMessageStatus,
    addMessageReply,
    dismissNotification,
    addLeadNote,
    saveReplyTemplate,
    deleteReplyTemplate,
    isFavorite,
    isCompared,
  }), [addCompare, addLeadNote, addMessage, addMessageReply, addViewing, clearCompare, compareIds, deleteReplyTemplate, deleteSavedSearch, dismissNotification, favoriteIds, isCompared, isFavorite, markMessageRead, messages, notifications, recentIds, recentSearches, removeCompare, replyTemplates, saveReplyTemplate, saveSearch, savedSearches, toggleFavorite, toggleSavedSearchStatus, trackRecent, trackSearch, updateMessageStatus, viewings])

  return <SocialContext.Provider value={value}>{children}</SocialContext.Provider>
}

export function useSocial() {
  const context = useContext(SocialContext)
  if (!context) throw new Error('useSocial must be used inside SocialProvider')
  return context
}
