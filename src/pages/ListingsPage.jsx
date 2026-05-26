import { useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import Footer from '../components/layout/Footer'
import Navbar from '../components/layout/Navbar'
import PropertyFilters from '../components/filters/PropertyFilters'
import PropertyCard from '../components/property/PropertyCard'
import { searchProperties } from '../api/marketplaceApi'

export default function ListingsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const defaultType = searchParams.get('type') === 'buy' || searchParams.get('type') === 'rent' ? searchParams.get('type') : 'all'
  const defaultCategory = searchParams.get('category')?.replaceAll('-', ' ')
  const [listingType, setListingType] = useState(defaultType)
  const [filters, setFilters] = useState({
    query: searchParams.get('q') || '',
    propertyTypes: defaultCategory ? [defaultCategory.replace(/\b\w/g, (letter) => letter.toUpperCase())] : [],
  })
  const [properties, setProperties] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [viewMode, setViewMode] = useState('grid')
  const [page, setPage] = useState(1)

  useEffect(() => {
    let isActive = true
    queueMicrotask(() => {
      if (isActive) setIsLoading(true)
    })
    searchProperties({ ...filters, listingType })
      .then((results) => {
        if (isActive) setProperties(results)
      })
      .finally(() => {
        if (isActive) setIsLoading(false)
      })
    return () => {
      isActive = false
    }
  }, [filters, listingType])

  const handleFiltersChange = useCallback((nextFilters) => {
    setFilters(nextFilters)
    setPage(1)
    const nextParams = new URLSearchParams()
    if (listingType !== 'all') nextParams.set('type', listingType)
    if (nextFilters.query) nextParams.set('q', nextFilters.query)
    setSearchParams(nextParams, { replace: true })
  }, [listingType, setSearchParams])

  const handleListingTypeChange = (value) => {
    setListingType(value)
    setPage(1)
    const nextParams = new URLSearchParams(searchParams)
    if (value === 'all') nextParams.delete('type')
    else nextParams.set('type', value)
    setSearchParams(nextParams, { replace: true })
  }

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
      <PropertyFilters totalResults={properties.length} initialFilters={filters} onFiltersChange={handleFiltersChange} viewMode={viewMode} onViewModeChange={setViewMode} />
      <section className="section">
        <div className="container listings-layout">
          <aside className="side-panel">
            <h3>Smart Filters</h3>
            <p>Use the search controls above to narrow this demo marketplace by type and keyword.</p>
            <div className="mini-stat"><strong>{properties.length}</strong><span>Matching properties</span></div>
            <div className="mini-stat"><strong>100%</strong><span>Verified listing data</span></div>
          </aside>
          <div className={`listings-results ${viewMode === 'list' ? 'is-list' : ''}`}>
            <div className="results-toolbar">
              <div>
                <h2>{properties.length} verified properties</h2>
                <p>Showing page {page} of {totalPages}</p>
              </div>
              <a className="btn btn-outline" href="/property/1">Map Preview</a>
            </div>
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
