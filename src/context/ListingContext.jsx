/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { listingProperties, resolveCategoryValues } from '../data/marketplace'
import { withPropertyCoordinates } from '../utils/propertyCoordinates'

const ListingContext = createContext(null)
const storageKey = 'luxora-listing-state'
const socialStorageKey = 'luxora-social-state'
const alertedPriceChangesKey = 'alertedPriceChanges'

export const reportReasons = ['fake listing', 'incorrect price', 'scam/fraud', 'already sold/rented', 'inappropriate content', 'duplicate listing']
export const listingStatuses = ['Active', 'Pending', 'Sold', 'Rented', 'Off-Market', 'Expired']

const defaultAgent = {
  id: 'sarah',
  name: 'Sarah Agent',
  image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=70',
}

const readStoredListings = () => {
  try {
    const stored = JSON.parse(localStorage.getItem(storageKey))
    if (Array.isArray(stored)) return { managedListings: stored, listingUpdates: {}, reports: [], listingAnalytics: {}, moderationHistory: [] }
    return {
      managedListings: stored?.managedListings || [],
      listingUpdates: stored?.listingUpdates || {},
      reports: stored?.reports || [],
      listingAnalytics: stored?.listingAnalytics || {},
      moderationHistory: stored?.moderationHistory || [],
    }
  } catch {
    return { managedListings: [], listingUpdates: {}, reports: [], listingAnalytics: {}, moderationHistory: [] }
  }
}

const normalize = (value = '') => value.toString().trim().toLowerCase()

const parseMinimum = (value) => {
  if (!value || value === 'Any') return 0
  return Number.parseInt(value, 10) || 0
}

const priceTypeFromListingType = (type) => {
  if (type === 'buy') return 'total'
  if (type === 'lease') return 'month'
  return 'month'
}

const parseCoordinate = (value) => {
  if (value === null || value === undefined || value === '') return undefined
  const coordinate = Number(value)
  return Number.isFinite(coordinate) ? coordinate : undefined
}

const agentIdFromAgent = (agent = {}) => (agent.id || agent.email || agent.name || '').toString().trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
const withAgentId = (property) => ({
  ...property,
  agent: {
    ...(property.agent || defaultAgent),
    id: agentIdFromAgent(property.agent || defaultAgent),
  },
})

const statusToAvailability = (status) => {
  if (status === 'Sold') return 'Sold'
  if (status === 'Rented') return 'Rented'
  if (status === 'Pending') return 'Pending'
  if (status === 'Off-Market') return 'Off-Market'
  if (status === 'Expired') return 'Expired'
  if (status === 'Rejected') return 'Rejected'
  if (status === 'Suspended') return 'Suspended'
  if (status === 'Removed') return 'Removed'
  return 'Available'
}

const daysFromDuration = (duration = '14 days') => Number.parseInt(duration, 10) || 14

const readAlertedPriceChanges = () => {
  try {
    return JSON.parse(localStorage.getItem(alertedPriceChangesKey)) || []
  } catch {
    return []
  }
}

const appendPriceDropNotifications = (listing, previousPrice, nextPrice) => {
  const alertId = `${listing.id}:${previousPrice}:${nextPrice}`
  const alerted = readAlertedPriceChanges()
  if (alerted.includes(alertId)) return

  const createdAt = new Date().toISOString()
  const notification = {
    id: `price-drop-${alertId}`,
    type: 'price-drop',
    listingId: listing.id,
    listingTitle: listing.title,
    text: `Price dropped on ${listing.title}`,
    time: new Date(createdAt).toLocaleDateString(),
    createdAt,
    previousPrice,
    price: nextPrice,
    isRead: false,
  }

  Object.keys(localStorage).forEach((key) => {
    if (!key.startsWith(`${socialStorageKey}:`) || !key.endsWith(':favorites')) return
    try {
      const favoriteIds = JSON.parse(localStorage.getItem(key)) || []
      if (!favoriteIds.includes(listing.id)) return
      const notificationKey = key.replace(/:favorites$/, ':notifications')
      const notifications = JSON.parse(localStorage.getItem(notificationKey) || '[]')
      if (!notifications.some((item) => item.id === notification.id)) {
        localStorage.setItem(notificationKey, JSON.stringify([notification, ...notifications]))
      }
      const stateKey = key.replace(/:favorites$/, ':state')
      const state = JSON.parse(localStorage.getItem(stateKey) || '{}')
      const stateNotifications = state.notifications || []
      if (!stateNotifications.some((item) => item.id === notification.id)) {
        localStorage.setItem(stateKey, JSON.stringify({ ...state, notifications: [notification, ...stateNotifications] }))
      }
    } catch {
      // Ignore malformed per-user social state and keep listing updates flowing.
    }
  })

  localStorage.setItem(alertedPriceChangesKey, JSON.stringify([alertId, ...alerted]))
}

const buildListing = (payload, existing = {}) => {
  const images = (payload.images?.length ? payload.images : existing.images?.length ? existing.images : [payload.image || existing.image]).filter(Boolean)
  const image = payload.image || images[0] || existing.image || 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=900&auto=format&fit=crop&q=70'
  const status = payload.status || existing.status || 'Active'

  return {
    isVerified: true,
    furnished: existing.furnished || 'Unfurnished',
    moveInDate: existing.moveInDate || 'Immediate',
    listedDate: existing.listedDate || new Date().toISOString().slice(0, 10),
    ...existing,
    id: existing.id || `listing-${Date.now()}`,
    title: payload.title,
    location: payload.location,
    price: Number(payload.price),
    priceHistory: payload.priceHistory || existing.priceHistory || [],
    latitude: parseCoordinate(payload.latitude ?? existing.latitude),
    longitude: parseCoordinate(payload.longitude ?? existing.longitude),
    priceType: priceTypeFromListingType(payload.type),
    type: payload.type,
    category: payload.category,
    beds: Number(payload.beds),
    baths: Number(payload.baths),
    sqft: Number(payload.sqft),
    description: payload.description,
    amenities: payload.amenities,
    videos: {
      ...(existing.videos || {}),
      ...(payload.videos || {}),
    },
    status,
    availabilityStatus: statusToAvailability(status),
    image,
    images: images.length ? images : [image],
    agent: {
      ...(payload.agent || existing.agent || defaultAgent),
      id: agentIdFromAgent(payload.agent || existing.agent || defaultAgent),
    },
  }
}

export function ListingProvider({ children }) {
  const stored = readStoredListings()
  const [managedListings, setManagedListings] = useState(stored.managedListings)
  const [listingUpdates, setListingUpdates] = useState(stored.listingUpdates)
  const [reports, setReports] = useState(stored.reports)
  const [listingAnalytics, setListingAnalytics] = useState(stored.listingAnalytics)
  const [moderationHistory, setModerationHistory] = useState(stored.moderationHistory)
  const stateRef = useRef({
    managedListings,
    listingUpdates,
    reports,
    listingAnalytics,
    moderationHistory,
  })
  const allListings = useMemo(() => [
    ...managedListings,
    ...listingProperties.map((property) => ({ ...property, priceHistory: property.priceHistory || [], ...(listingUpdates[property.id] || {}) })),
  ].filter((property) => !property.isRemoved).map(withAgentId).map(withPropertyCoordinates), [listingUpdates, managedListings])

  useEffect(() => {
    stateRef.current = {
      managedListings,
      listingUpdates,
      reports,
      listingAnalytics,
      moderationHistory,
    }
  }, [listingAnalytics, listingUpdates, managedListings, moderationHistory, reports])

  const persist = useCallback((nextState = {}) => {
    localStorage.setItem(storageKey, JSON.stringify({
      ...stateRef.current,
      ...nextState,
    }))
  }, [])

  const addModerationHistory = useCallback((entry) => {
    setModerationHistory((items) => {
      const next = [{
        id: `history-${Date.now()}`,
        createdAt: new Date().toISOString(),
        actor: 'Admin',
        ...entry,
      }, ...items].slice(0, 80)
      persist({ moderationHistory: next })
      return next
    })
  }, [persist])

  const updateAnalytics = useCallback((id, updates) => {
    setListingAnalytics((items) => {
      const current = items[id] || { views: 0, favorites: 0, inquiries: 0, promotions: 0 }
      const next = {
        ...items,
        [id]: {
          ...current,
          ...updates(current),
          updatedAt: new Date().toISOString(),
        },
      }
      persist({ listingAnalytics: next })
      return next
    })
  }, [persist])

  const trackListingView = useCallback((id) => {
    updateAnalytics(id, (current) => ({ views: current.views + 1 }))
  }, [updateAnalytics])

  const trackListingFavorite = useCallback((id, delta = 1) => {
    updateAnalytics(id, (current) => ({ favorites: Math.max(0, current.favorites + delta) }))
  }, [updateAnalytics])

  const trackListingInquiry = useCallback((id) => {
    updateAnalytics(id, (current) => ({ inquiries: current.inquiries + 1 }))
  }, [updateAnalytics])

  const createListing = useCallback((payload) => {
    const listing = buildListing(payload)
    setManagedListings((items) => {
      const next = [listing, ...items]
      persist({ managedListings: next })
      return next
    })
    return listing
  }, [persist])

  const updateListing = useCallback((id, payload) => {
    let updatedListing = null
    if (managedListings.some((item) => item.id === id)) {
      setManagedListings((items) => {
      const next = items.map((item) => {
        if (item.id !== id) return item
        const priceChanged = Number(payload.price) !== Number(item.price)
        const priceHistory = item.priceHistory?.length ? item.priceHistory : [{ price: Number(item.price), date: item.listedDate || new Date().toISOString(), note: 'Initial price' }]
        const previousPrice = Number(priceHistory[priceHistory.length - 1]?.price || item.price)
        const nextPrice = Number(payload.price)
        updatedListing = buildListing({
          ...payload,
          priceHistory: priceChanged ? [...priceHistory, { price: nextPrice, date: new Date().toISOString(), note: nextPrice < previousPrice ? 'Price dropped' : 'Price updated' }] : item.priceHistory,
        }, item)
        if (priceChanged && nextPrice < previousPrice) appendPriceDropNotifications(updatedListing, previousPrice, nextPrice)
        return updatedListing
      })
      persist({ managedListings: next })
      return next
      })
      return updatedListing
    }

    const existing = allListings.find((item) => item.id === id)
    if (!existing) return null
    const priceChanged = Number(payload.price) !== Number(existing.price)
    const priceHistory = existing.priceHistory?.length ? existing.priceHistory : [{ price: Number(existing.price), date: existing.listedDate || new Date().toISOString(), note: 'Initial price' }]
    const previousPrice = Number(priceHistory[priceHistory.length - 1]?.price || existing.price)
    const nextPrice = Number(payload.price)
    updatedListing = buildListing({
      ...existing,
      ...payload,
      priceHistory: priceChanged ? [...priceHistory, { price: nextPrice, date: new Date().toISOString(), note: nextPrice < previousPrice ? 'Price dropped' : 'Price updated' }] : existing.priceHistory,
    }, existing)
    if (priceChanged && nextPrice < previousPrice) appendPriceDropNotifications(updatedListing, previousPrice, nextPrice)
    setListingUpdates((items) => {
      const next = { ...items, [id]: { ...(items[id] || {}), ...updatedListing } }
      persist({ listingUpdates: next })
      return next
    })
    return updatedListing
  }, [allListings, managedListings, persist])

  const updateListingModeration = useCallback((id, status) => {
    const existing = allListings.find((item) => item.id === id)
    if (!existing) return null
    const updatedListing = {
      ...existing,
      status,
      moderationStatus: status,
      availabilityStatus: statusToAvailability(status),
      reviewedAt: new Date().toISOString(),
    }
    addModerationHistory({
      type: 'Listing Moderation',
      listingId: id,
      listingTitle: existing.title,
      action: status,
      note: `Listing marked ${status}`,
    })

    if (managedListings.some((item) => item.id === id)) {
      setManagedListings((items) => {
        const next = items.map((item) => (item.id === id ? { ...item, ...updatedListing } : item))
        persist({ managedListings: next })
        return next
      })
      return updatedListing
    }

    setListingUpdates((items) => {
      const next = { ...items, [id]: { ...(items[id] || {}), ...updatedListing } }
      persist({ listingUpdates: next })
      return next
    })
    return updatedListing
  }, [addModerationHistory, allListings, managedListings, persist])

  const cloneListing = useCallback((id) => {
    const existing = allListings.find((item) => item.id === id)
    if (!existing) return null
    const cloneId = `listing-${Date.now()}`
    const clonedListing = {
      ...existing,
      id: cloneId,
      title: `${existing.title} Copy`,
      status: 'Pending',
      moderationStatus: 'Pending',
      availabilityStatus: statusToAvailability('Pending'),
      isFeatured: false,
      isPromoted: false,
      promotion: null,
      reviewedAt: null,
      listedDate: new Date().toISOString().slice(0, 10),
      priceHistory: existing.priceHistory?.length ? existing.priceHistory : [{ price: Number(existing.price), date: new Date().toISOString(), note: 'Initial price' }],
    }
    setManagedListings((items) => {
      const next = [clonedListing, ...items]
      persist({
        managedListings: next,
        listingAnalytics: {
          ...stateRef.current.listingAnalytics,
          [cloneId]: { views: 0, favorites: 0, inquiries: 0, promotions: 0 },
        },
      })
      return next
    })
    setListingAnalytics((items) => ({
      ...items,
      [cloneId]: { views: 0, favorites: 0, inquiries: 0, promotions: 0 },
    }))
    return clonedListing
  }, [allListings, persist])

  const requestPromotion = useCallback((id, promotionRequest = '14 days') => {
    const existing = allListings.find((item) => item.id === id)
    if (!existing) return null
    const requestDetails = typeof promotionRequest === 'string' ? { duration: promotionRequest } : promotionRequest
    const duration = requestDetails.duration || '14 days'
    const promotion = {
      status: 'Requested',
      package: requestDetails.package || 'Featured',
      duration,
      paymentStatus: requestDetails.paymentStatus || 'Simulated Paid',
      paidAt: requestDetails.paidAt || new Date().toISOString(),
      requestedAt: new Date().toISOString(),
    }
    addModerationHistory({
      type: 'Feature Request',
      listingId: id,
      listingTitle: existing.title,
      action: 'Promotion Requested',
      note: `Requested ${promotion.package} promotion for ${duration}`,
    })
    const updatedListing = { ...existing, promotion, isPromoted: false }

    if (managedListings.some((item) => item.id === id)) {
      setManagedListings((items) => {
        const next = items.map((item) => (item.id === id ? { ...item, promotion, isPromoted: false } : item))
        persist({ managedListings: next })
        return next
      })
    } else {
      setListingUpdates((items) => {
        const next = { ...items, [id]: { ...(items[id] || {}), promotion, isPromoted: false } }
        persist({ listingUpdates: next })
        return next
      })
    }
    return updatedListing
  }, [addModerationHistory, allListings, managedListings, persist])

  const updatePromotionStatus = useCallback((id, status) => {
    const existing = allListings.find((item) => item.id === id)
    if (!existing) return null
    const promotion = {
      ...(existing.promotion || {}),
      status,
      reviewedAt: new Date().toISOString(),
      expiresAt: status === 'Approved' ? new Date(Date.now() + daysFromDuration(existing.promotion?.duration) * 24 * 60 * 60 * 1000).toISOString() : existing.promotion?.expiresAt,
    }
    addModerationHistory({
      type: 'Feature Approval',
      listingId: id,
      listingTitle: existing.title,
      action: status,
      note: `Promotion ${status.toLowerCase()}`,
    })
    const promotionUpdates = {
      promotion,
      isPromoted: status === 'Approved',
      isFeatured: status === 'Approved' ? true : existing.isFeatured && status !== 'Removed',
    }

    if (managedListings.some((item) => item.id === id)) {
      setManagedListings((items) => {
        const next = items.map((item) => (item.id === id ? { ...item, ...promotionUpdates } : item))
        persist({ managedListings: next })
        return next
      })
      return { ...existing, ...promotionUpdates }
    }

    setListingUpdates((items) => {
      const next = { ...items, [id]: { ...(items[id] || {}), ...promotionUpdates } }
      persist({ listingUpdates: next })
      return next
    })
    return { ...existing, ...promotionUpdates }
  }, [addModerationHistory, allListings, managedListings, persist])

  const removeListing = useCallback((id) => {
    const existing = allListings.find((item) => item.id === id)
    if (!existing) return null
    const removedListing = {
      ...existing,
      isRemoved: true,
      status: 'Removed',
      moderationStatus: 'Removed',
      availabilityStatus: statusToAvailability('Removed'),
      reviewedAt: new Date().toISOString(),
    }
    addModerationHistory({
      type: 'Listing Moderation',
      listingId: id,
      listingTitle: existing.title,
      action: 'Removed',
      note: 'Listing removed from marketplace',
    })

    if (managedListings.some((item) => item.id === id)) {
      setManagedListings((items) => {
        const next = items.filter((item) => item.id !== id)
        persist({ managedListings: next })
        return next
      })
      return removedListing
    }

    setListingUpdates((items) => {
      const next = { ...items, [id]: { ...(items[id] || {}), ...removedListing } }
      persist({ listingUpdates: next })
      return next
    })
    return removedListing
  }, [addModerationHistory, allListings, managedListings, persist])

  const reportListing = useCallback((listingId, payload = {}) => {
    const listing = allListings.find((item) => item.id === listingId)
    if (!listing) return null
    const reporterId = payload.reporterId || payload.reporterEmail || payload.reporterName || 'guest'
    const existingReport = reports.find((report) => report.listingId === listingId && report.reporterId === reporterId)
    if (existingReport) return { duplicate: true, report: existingReport }

    const createdAt = new Date().toISOString()
    const report = {
      id: `report-${Date.now()}`,
      listingId,
      listingTitle: listing.title,
      reason: payload.reason || 'Listing reported for review',
      reporterId,
      reporterName: payload.reporterName || 'Luxora member',
      reporterEmail: payload.reporterEmail || '',
      status: 'Open',
      createdAt,
      timestamp: createdAt,
    }
    setReports((items) => {
      const next = [report, ...items]
      persist({ reports: next })
      return next
    })
    return report
  }, [allListings, persist, reports])

  const updateReportStatus = useCallback((id, status) => {
    const report = reports.find((item) => item.id === id)
    setReports((items) => {
      const next = items.map((item) => (item.id === id ? { ...item, status, reviewedAt: new Date().toISOString() } : item))
      persist({ reports: next })
      return next
    })
    if (report) {
      addModerationHistory({
        type: 'Report Handling',
        listingId: report.listingId,
        listingTitle: report.listingTitle,
        action: status,
        note: report.reason,
      })
    }
  }, [addModerationHistory, persist, reports])

  const getListing = useCallback((id) => allListings.find((item) => item.id === id), [allListings])

  const searchListings = useCallback((filters = {}) => {
    const query = normalize(filters.query)
    const type = filters.listingType || 'all'
    const selectedTypes = (filters.propertyTypes || []).flatMap(resolveCategoryValues)
    const selectedAmenities = filters.amenities || []
    const agentId = filters.agentId || ''
    const minBeds = parseMinimum(filters.beds)
    const minBaths = parseMinimum(filters.baths)
    const minPrice = Number(filters.minPrice || 0) * 1000000
    const maxPrice = Number(filters.price || 100) * 1000000

    let results = allListings.filter((property) => {
      const searchable = normalize(`${property.title} ${property.location} ${property.category} ${property.amenities.join(' ')} ${property.furnished} ${property.availabilityStatus}`)
      const matchesQuery = !query || searchable.includes(query)
      const matchesType = type === 'all' || property.type === type
      const matchesCategory = selectedTypes.length === 0 || selectedTypes.includes(property.category)
      const matchesAmenities = selectedAmenities.every((amenity) => property.amenities.includes(amenity))
      const matchesAgent = !agentId || agentIdFromAgent(property.agent) === agentId
      const matchesBeds = minBeds === 0 || property.beds >= minBeds
      const matchesBaths = minBaths === 0 || property.baths >= minBaths
      const matchesPrice = property.price >= minPrice && property.price <= maxPrice

      return matchesQuery && matchesType && matchesCategory && matchesAmenities && matchesAgent && matchesBeds && matchesBaths && matchesPrice
    })

    if (filters.sort === 'price-low') results = [...results].sort((a, b) => a.price - b.price)
    if (filters.sort === 'price-high') results = [...results].sort((a, b) => b.price - a.price)
    if (filters.sort === 'popular') results = [...results].sort((a, b) => Number(Boolean(b.isFeatured)) - Number(Boolean(a.isFeatured)))
    if (!filters.sort || filters.sort === 'recent') results = [...results].sort((a, b) => new Date(b.listedDate) - new Date(a.listedDate))

    return results
  }, [allListings])

  const value = useMemo(() => ({
    allListings,
    managedListings,
    reports,
    listingAnalytics,
    moderationHistory,
    createListing,
    updateListing,
    updateListingModeration,
    requestPromotion,
    cloneListing,
    updatePromotionStatus,
    removeListing,
    reportListing,
    updateReportStatus,
    trackListingView,
    trackListingFavorite,
    trackListingInquiry,
    getListing,
    searchListings,
    addModerationHistory,
  }), [addModerationHistory, allListings, cloneListing, createListing, getListing, listingAnalytics, managedListings, moderationHistory, removeListing, reportListing, reports, requestPromotion, searchListings, trackListingFavorite, trackListingInquiry, trackListingView, updateListing, updateListingModeration, updatePromotionStatus, updateReportStatus])

  return <ListingContext.Provider value={value}>{children}</ListingContext.Provider>
}

export function useListings() {
  const context = useContext(ListingContext)
  if (!context) throw new Error('useListings must be used inside ListingProvider')
  return context
}
