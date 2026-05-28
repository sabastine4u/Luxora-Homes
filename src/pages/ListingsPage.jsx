import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import Footer from '../components/layout/Footer'
import Navbar from '../components/layout/Navbar'
import PropertyFilters from '../components/filters/PropertyFilters'
import PropertyCard from '../components/property/PropertyCard'
import PropertyMap from '../components/property/PropertyMap'
import { useAuth } from '../context/AuthContext'
import { useListings } from '../context/ListingContext'
import { useUI } from '../context/UIContext'
import { resolveCategoryValues } from '../data/marketplace'
import { useFavoriteProperties } from '../hooks/useSocialHooks'

const labelFromParam = (value = '') => value.replaceAll('-', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())
const slugFromLabel = (value = '') => value.toLowerCase().replaceAll(' ', '-')
const listFromParam = (value = '') => value ? value.split(',').filter(Boolean).map((item) => decodeURIComponent(item)) : []
const listParamFromValues = (values = []) => values.map((value) => encodeURIComponent(value)).join(',')
const criteriaKey = (criteria = {}) => JSON.stringify({
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

export default function ListingsPage() {
  const { searchListings } = useListings()
  const { isAuthenticated } = useAuth()
  const { notify } = useUI()
  const { recentSearches, saveSearch, savedSearches, trackSearch } = useFavoriteProperties()
  const [searchParams, setSearchParams] = useSearchParams()
  const routeType = ['buy', 'rent', 'lease'].includes(searchParams.get('type')) ? searchParams.get('type') : 'all'
  const routeCategory = searchParams.get('category')
  const routeQuery = searchParams.get('q') || ''
  const routeAgentId = searchParams.get('agentId') || ''
  const defaultCategory = routeCategory ? labelFromParam(routeCategory) : ''
  const routeFilters = useMemo(() => ({
    query: routeQuery,
    sort: searchParams.get('sort') || 'recent',
    propertyTypes: searchParams.get('propertyTypes') ? listFromParam(searchParams.get('propertyTypes')) : defaultCategory ? [defaultCategory] : [],
    amenities: listFromParam(searchParams.get('amenities')),
    nearbyAmenities: listFromParam(searchParams.get('nearbyAmenities')),
    beds: searchParams.get('beds') || 'Any',
    baths: searchParams.get('baths') || 'Any',
    minPrice: Number(searchParams.get('minPrice') || 0),
    price: Number(searchParams.get('price') || 65),
    agentId: routeAgentId,
  }), [defaultCategory, routeAgentId, routeQuery, searchParams])
  const [listingType, setListingType] = useState(routeType)
  const [filters, setFilters] = useState(routeFilters)
  const [properties, setProperties] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [viewMode, setViewMode] = useState('grid')
  const [page, setPage] = useState(1)
  const [searchName, setSearchName] = useState('')
  const [filterResetKey, setFilterResetKey] = useState(0)
  const lastTrackedSearchKeyRef = useRef('')

  const currentCriteria = useMemo(() => ({ ...filters, listingType }), [filters, listingType])
  const currentCriteriaKey = useMemo(() => criteriaKey(currentCriteria), [currentCriteria])

  const syncSearchParams = useCallback((criteria) => {
    const nextParams = new URLSearchParams()
    if (criteria.listingType && criteria.listingType !== 'all') nextParams.set('type', criteria.listingType)
    if (criteria.query) nextParams.set('q', criteria.query)
    if (criteria.sort && criteria.sort !== 'recent') nextParams.set('sort', criteria.sort)
    if (criteria.propertyTypes?.length === 1) nextParams.set('category', slugFromLabel(criteria.propertyTypes[0]))
    if (criteria.propertyTypes?.length > 1) nextParams.set('propertyTypes', listParamFromValues(criteria.propertyTypes))
    if (criteria.amenities?.length) nextParams.set('amenities', listParamFromValues(criteria.amenities))
    if (criteria.nearbyAmenities?.length) nextParams.set('nearbyAmenities', listParamFromValues(criteria.nearbyAmenities))
    if (criteria.beds && criteria.beds !== 'Any') nextParams.set('beds', criteria.beds)
    if (criteria.baths && criteria.baths !== 'Any') nextParams.set('baths', criteria.baths)
    if (Number(criteria.minPrice || 0) > 0) nextParams.set('minPrice', criteria.minPrice)
    if (Number(criteria.price ?? 65) !== 65) nextParams.set('price', criteria.price)
    if (criteria.agentId) nextParams.set('agentId', criteria.agentId)
    setSearchParams(nextParams, { replace: true })
  }, [setSearchParams])

  useEffect(() => {
    queueMicrotask(() => {
      setListingType(routeType)
      setFilters((current) => (criteriaKey(current) === criteriaKey(routeFilters) ? current : routeFilters))
      setPage(1)
    })
  }, [routeFilters, routeType])

  useEffect(() => {
    let isActive = true
    queueMicrotask(() => {
      if (isActive) setIsLoading(true)
    })
    const results = searchListings({ ...filters, listingType })
    queueMicrotask(() => {
      if (!isActive) return
      setProperties(results)
      setIsLoading(false)
    })
    return () => {
      isActive = false
    }
  }, [filters, listingType, searchListings])

  useEffect(() => {
    if (lastTrackedSearchKeyRef.current === currentCriteriaKey) return
    lastTrackedSearchKeyRef.current = currentCriteriaKey
    trackSearch(currentCriteria)
  }, [currentCriteria, currentCriteriaKey, trackSearch])

  const handleFiltersChange = useCallback((nextFilters) => {
    const mergedFilters = { ...nextFilters, agentId: filters.agentId || '' }
    setFilters((current) => (criteriaKey(current) === criteriaKey(mergedFilters) ? current : mergedFilters))
    setPage(1)
    syncSearchParams({ ...mergedFilters, listingType })
  }, [filters.agentId, listingType, syncSearchParams])

  const handleListingTypeChange = (value) => {
    setListingType(value)
    setPage(1)
    const nextParams = new URLSearchParams(searchParams)
    if (value === 'all') nextParams.delete('type')
    else nextParams.set('type', value)
    setSearchParams(nextParams, { replace: true })
  }

  const applySearch = (criteria) => {
    setListingType(criteria.listingType || 'all')
    setFilters({
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
    setPage(1)
    setFilterResetKey((value) => value + 1)
    syncSearchParams(criteria)
  }

  const handleSaveSearch = () => {
    if (!isAuthenticated) {
      notify('Sign in to save this search.', 'warning')
      return
    }
    const savedSearch = saveSearch(searchName, currentCriteria)
    setSearchName('')
    notify(`Search alert created for ${savedSearch.name}.`)
  }

  const listingSummary = filters.propertyTypes?.length
    ? `${properties.length} ${resolveCategoryValues(filters.propertyTypes[0]).join(', ')} listings`
    : `${properties.length} verified properties`

  const pageSize = 6
  const totalPages = Math.max(1, Math.ceil(properties.length / pageSize))
  const visibleProperties = properties.slice((page - 1) * pageSize, page * pageSize)

  return (
    <main className="app-shell">
      <Navbar />
      <section className="page-hero">
        <div className="container">
          <span className="eyebrow">Verified marketplace</span>
          <h1>Browse <span>Properties</span></h1>
          <p>Explore curated listings and refine your search by intent, location, price, and lifestyle fit.</p>
          <div className="route-tabs">
            {[
              ['all', 'All Properties'],
              ['buy', 'For Sale'],
              ['rent', 'For Rent'],
              ['lease', 'For Lease'],
            ].map(([value, label]) => (
              <button className={listingType === value ? 'is-active' : ''} key={value} onClick={() => handleListingTypeChange(value)} type="button">
                {label}
              </button>
            ))}
          </div>
        </div>
      </section>
      <PropertyFilters key={filterResetKey} totalResults={properties.length} initialFilters={filters} onFiltersChange={handleFiltersChange} viewMode={viewMode} onViewModeChange={setViewMode} />
      <section className="section">
        <div className="container listings-layout">
          <aside className="side-panel">
            <h3>Smart Filters</h3>
            <p>Use the search controls above to narrow this demo marketplace by type and keyword.</p>
            <div className="mini-stat"><strong>{properties.length}</strong><span>Matching properties</span></div>
            <div className="mini-stat"><strong>100%</strong><span>Verified listing data</span></div>
            <div className="mini-stat">
              <strong>{savedSearches.filter((search) => search.status === 'Active').length}</strong>
              <span>Active search alerts</span>
            </div>
            <label className="filter-search">
              <input value={searchName} onChange={(event) => setSearchName(event.target.value)} placeholder="Custom search name" />
            </label>
            <button className="btn btn-primary" onClick={handleSaveSearch} type="button">Save Search</button>
            {recentSearches.length > 0 && (
              <div className="dashboard-table">
                {recentSearches.slice(0, 4).map((search) => (
                  <button type="button" onClick={() => applySearch(search.criteria)} key={search.id}>
                    <strong>{search.name}</strong>
                    <span>{search.criteria.listingType === 'all' ? 'All listings' : search.criteria.listingType}</span>
                    <em>Apply</em>
                  </button>
                ))}
              </div>
            )}
          </aside>
          <div className={`listings-results ${viewMode === 'list' ? 'is-list' : ''}`}>
            <div className="results-toolbar">
              <div>
                <h2>{listingSummary}</h2>
                <p>Showing page {page} of {totalPages}</p>
              </div>
              <button className="btn btn-outline" onClick={() => setViewMode(viewMode === 'map' ? 'grid' : 'map')} type="button">{viewMode === 'map' ? 'Grid View' : 'Map View'}</button>
            </div>
            {!isLoading && viewMode === 'map' && <PropertyMap properties={properties} />}
            {isLoading && (
              <div className="loading-grid">
                {Array.from({ length: 4 }, (_, index) => <div className="loading-card" key={index} />)}
              </div>
            )}
            {!isLoading && visibleProperties.map((property) => <PropertyCard key={property.id} property={property} variant={viewMode === 'list' ? 'horizontal' : 'default'} />)}
            {!isLoading && properties.length === 0 && (
              <div className="empty-state">
                <h2>No properties found</h2>
                <p>Try a different location, category, or listing type.</p>
              </div>
            )}
            {!isLoading && properties.length > 0 && (
              <div className="pagination-row">
                <button className="btn btn-outline" disabled={page === 1} onClick={() => setPage((value) => Math.max(1, value - 1))} type="button">Previous</button>
                {Array.from({ length: totalPages }, (_, index) => (
                  <button className={`page-button ${page === index + 1 ? 'is-active' : ''}`} key={index + 1} onClick={() => setPage(index + 1)} type="button">{index + 1}</button>
                ))}
                <button className="btn btn-outline" disabled={page === totalPages} onClick={() => setPage((value) => Math.min(totalPages, value + 1))} type="button">Next</button>
              </div>
            )}
          </div>
        </div>
      </section>
      <Footer />
    </main>
  )
}
