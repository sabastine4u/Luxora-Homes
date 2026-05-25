import { useMemo, useState } from 'react'
import Footer from '../components/layout/Footer'
import Navbar from '../components/layout/Navbar'
import PropertyFilters from '../components/filters/PropertyFilters'
import PropertyCard from '../components/property/PropertyCard'
import { listingProperties } from '../data/marketplace'

export default function ListingsPage() {
  const [listingType, setListingType] = useState('all')
  const [query, setQuery] = useState('')
  const [viewMode, setViewMode] = useState('grid')
  const [page, setPage] = useState(1)

  const properties = useMemo(() => {
    return listingProperties.filter((property) => {
      const matchesType = listingType === 'all' || property.type === listingType
      const searchable = `${property.title} ${property.location} ${property.category}`.toLowerCase()
      return matchesType && searchable.includes(query.toLowerCase())
    })
  }, [listingType, query])

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
              <button className={listingType === value ? 'is-active' : ''} key={value} onClick={() => { setListingType(value); setPage(1) }} type="button">
                {label}
              </button>
            ))}
          </div>
        </div>
      </section>
      <PropertyFilters totalResults={properties.length} onQueryChange={(value) => { setQuery(value); setPage(1) }} viewMode={viewMode} onViewModeChange={setViewMode} />
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
            {visibleProperties.map((property) => <PropertyCard key={property.id} property={property} />)}
            {properties.length === 0 && (
              <div className="empty-state">
                <h2>No properties found</h2>
                <p>Try a different location, category, or listing type.</p>
              </div>
            )}
            {properties.length > 0 && (
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
