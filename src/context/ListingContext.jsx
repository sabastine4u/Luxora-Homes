/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import { listingProperties, resolveCategoryValues } from '../data/marketplace'

const ListingContext = createContext(null)
const storageKey = 'luxora-listing-state'

export const reportReasons = ['fake listing', 'incorrect price', 'scam/fraud', 'already sold/rented', 'inappropriate content', 'duplicate listing']

const defaultAgent = {
  name: 'Sarah Agent',
  image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=70',
}

const readStoredListings = () => {
  try {
    const stored = JSON.parse(localStorage.getItem(storageKey))
    if (Array.isArray(stored)) return { managedListings: stored, listingUpdates: {}, reports: [] }
    return {
      managedListings: stored?.managedListings || [],
      listingUpdates: stored?.listingUpdates || {},
      reports: stored?.reports || [],
    }
  } catch {
    return { managedListings: [], listingUpdates: {}, reports: [] }
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

const statusToAvailability = (status) => {
  if (status === 'Sold') return 'Sold'
  if (status === 'Rented') return 'Rented'
  if (status === 'Pending') return 'Pending'
  if (status === 'Rejected') return 'Rejected'
  if (status === 'Suspended') return 'Suspended'
  if (status === 'Removed') return 'Removed'
  return 'Available'
}

const buildListing = (payload, existing = {}) => {
  const image = payload.image || existing.image || 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=900&auto=format&fit=crop&q=70'
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
    priceType: priceTypeFromListingType(payload.type),
    type: payload.type,
    category: payload.category,
    beds: Number(payload.beds),
    baths: Number(payload.baths),
    sqft: Number(payload.sqft),
    description: payload.description,
    amenities: payload.amenities,
    status,
    availabilityStatus: statusToAvailability(status),
    image,
    images: [image],
    agent: payload.agent || existing.agent || defaultAgent,
  }
}

export function ListingProvider({ children }) {
  const stored = readStoredListings()
  const [managedListings, setManagedListings] = useState(stored.managedListings)
  const [listingUpdates, setListingUpdates] = useState(stored.listingUpdates)
  const [reports, setReports] = useState(stored.reports)
  const allListings = useMemo(() => [
    ...managedListings,
    ...listingProperties.map((property) => ({ ...property, ...(listingUpdates[property.id] || {}) })),
  ].filter((property) => !property.isRemoved), [listingUpdates, managedListings])

  const persist = useCallback((nextState = {}) => {
    localStorage.setItem(storageKey, JSON.stringify({
      managedListings,
      listingUpdates,
      reports,
      ...nextState,
    }))
  }, [listingUpdates, managedListings, reports])

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
        updatedListing = buildListing(payload, item)
        return updatedListing
      })
      persist({ managedListings: next })
      return next
      })
      return updatedListing
    }

    const existing = allListings.find((item) => item.id === id)
    if (!existing) return null
    updatedListing = buildListing({ ...existing, ...payload }, existing)
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
  }, [allListings, managedListings, persist])

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
  }, [allListings, managedListings, persist])

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
    setReports((items) => {
      const next = items.map((item) => (item.id === id ? { ...item, status, reviewedAt: new Date().toISOString() } : item))
      persist({ reports: next })
      return next
    })
  }, [persist])

  const getListing = useCallback((id) => allListings.find((item) => item.id === id), [allListings])

  const searchListings = useCallback((filters = {}) => {
    const query = normalize(filters.query)
    const type = filters.listingType || 'all'
    const selectedTypes = (filters.propertyTypes || []).flatMap(resolveCategoryValues)
    const selectedAmenities = filters.amenities || []
    const minBeds = parseMinimum(filters.beds)
    const minBaths = parseMinimum(filters.baths)
    const maxPrice = Number(filters.price || 100) * 1000000

    let results = allListings.filter((property) => {
      const searchable = normalize(`${property.title} ${property.location} ${property.category} ${property.amenities.join(' ')} ${property.furnished} ${property.availabilityStatus}`)
      const matchesQuery = !query || searchable.includes(query)
      const matchesType = type === 'all' || property.type === type
      const matchesCategory = selectedTypes.length === 0 || selectedTypes.includes(property.category)
      const matchesAmenities = selectedAmenities.every((amenity) => property.amenities.includes(amenity))
      const matchesBeds = minBeds === 0 || property.beds >= minBeds
      const matchesBaths = minBaths === 0 || property.baths >= minBaths
      const matchesPrice = property.price <= maxPrice || property.priceType === 'total'

      return matchesQuery && matchesType && matchesCategory && matchesAmenities && matchesBeds && matchesBaths && matchesPrice
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
    createListing,
    updateListing,
    updateListingModeration,
    removeListing,
    reportListing,
    updateReportStatus,
    getListing,
    searchListings,
  }), [allListings, createListing, getListing, managedListings, removeListing, reportListing, reports, searchListings, updateListing, updateListingModeration, updateReportStatus])

  return <ListingContext.Provider value={value}>{children}</ListingContext.Provider>
}

export function useListings() {
  const context = useContext(ListingContext)
  if (!context) throw new Error('useListings must be used inside ListingProvider')
  return context
}
