import { useEffect, useState } from 'react'
import Icon from '../common/Icon'

const propertyTypes = ['Apartment', 'Duplex', 'Studio Apartment', 'Mini Flat', 'Self-contained', 'Short-let', 'Student Housing', 'Affordable Rental', 'Family Home', 'Villa', 'Penthouse', 'Commercial', 'Warehouse', 'Land']
const amenities = ['Parking', 'Pool', 'Gym', 'Security', 'Furnished', 'AC', 'Garden', 'Elevator', 'Balcony', 'WiFi', 'Water', 'Backup Power']

export default function PropertyFilters({ totalResults, initialFilters = {}, onFiltersChange, viewMode, onViewModeChange }) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [openGroups, setOpenGroups] = useState(['type', 'price', 'rooms'])
  const [query, setQuery] = useState(initialFilters.query || '')
  const [sort, setSort] = useState('recent')
  const [selectedTypes, setSelectedTypes] = useState(initialFilters.propertyTypes || [])
  const [selectedAmenities, setSelectedAmenities] = useState([])
  const [beds, setBeds] = useState('Any')
  const [baths, setBaths] = useState('Any')
  const [price, setPrice] = useState(65)

  useEffect(() => {
    onFiltersChange({
      query,
      sort,
      propertyTypes: selectedTypes,
      amenities: selectedAmenities,
      beds,
      baths,
      price,
    })
  }, [baths, beds, onFiltersChange, price, query, selectedAmenities, selectedTypes, sort])

  const toggleGroup = (group) => {
    setOpenGroups((items) => (items.includes(group) ? items.filter((item) => item !== group) : [...items, group]))
  }

  const toggleValue = (value, values, setValues) => {
    setValues(values.includes(value) ? values.filter((item) => item !== value) : [...values, value])
  }

  const activeFilters = [
    ...selectedTypes,
    ...selectedAmenities,
    beds !== 'Any' ? `${beds} Beds` : null,
    baths !== 'Any' ? `${baths} Baths` : null,
  ].filter(Boolean)

  const clearFilter = (filter) => {
    setSelectedTypes((items) => items.filter((item) => item !== filter))
    setSelectedAmenities((items) => items.filter((item) => item !== filter))
    if (filter.includes('Beds')) setBeds('Any')
    if (filter.includes('Baths')) setBaths('Any')
  }

  return (
    <section className="filters-bar">
      <div className="container filters-shell">
        <label className="filter-search">
          <Icon name="search" />
          <input type="search" value={query} placeholder="Search by location, property name, or keyword..." onChange={(event) => setQuery(event.target.value)} />
        </label>

        <select value={sort} onChange={(event) => setSort(event.target.value)}>
          <option value="recent">Newest First</option>
          <option value="price-low">Price: Low to High</option>
          <option value="price-high">Price: High to Low</option>
          <option value="popular">Most Popular</option>
        </select>

        <div className="view-toggle" aria-label="View mode">
          <button className={viewMode === 'grid' ? 'is-active' : ''} type="button" onClick={() => onViewModeChange('grid')}>Grid</button>
          <button className={viewMode === 'list' ? 'is-active' : ''} type="button" onClick={() => onViewModeChange('list')}>List</button>
        </div>

        <button className="btn btn-outline filter-more" type="button" onClick={() => setIsExpanded((value) => !value)}>
          Filters
        </button>

        <span className="filter-count">{totalResults} results</span>

        {isExpanded && (
          <div className="filter-drawer">
            <div>
              <button className="filter-accordion-trigger" type="button" onClick={() => toggleGroup('type')}>
                Property Type <Icon name="chevron" />
              </button>
              {openGroups.includes('type') && (
                <div className="chip-grid">
                  {propertyTypes.map((type) => <label key={type} className={selectedTypes.includes(type) ? 'is-checked' : ''}><input checked={selectedTypes.includes(type)} onChange={() => toggleValue(type, selectedTypes, setSelectedTypes)} type="checkbox" /> {type}</label>)}
                </div>
              )}
            </div>
            <div>
              <button className="filter-accordion-trigger" type="button" onClick={() => toggleGroup('price')}>
                Price Range <Icon name="chevron" />
              </button>
              {openGroups.includes('price') && (
                <>
                  <div className="range-row">
                    <input type="range" min="5" max="100" value={price} onChange={(event) => setPrice(event.target.value)} />
                  </div>
                  <p>NGN 500K - NGN {price}M+</p>
                </>
              )}
            </div>
            <div>
              <button className="filter-accordion-trigger" type="button" onClick={() => toggleGroup('rooms')}>
                Beds & Baths <Icon name="chevron" />
              </button>
              {openGroups.includes('rooms') && (
                <div className="room-filter-grid">
                  <div>
                    <span>Bedrooms</span>
                    {['Any', '1', '2', '3', '4', '5+'].map((value) => <button className={beds === value ? 'is-active' : ''} key={value} onClick={() => setBeds(value)} type="button">{value}</button>)}
                  </div>
                  <div>
                    <span>Bathrooms</span>
                    {['Any', '1', '2', '3', '4+'].map((value) => <button className={baths === value ? 'is-active' : ''} key={value} onClick={() => setBaths(value)} type="button">{value}</button>)}
                  </div>
                </div>
              )}
            </div>
            <div>
              <button className="filter-accordion-trigger" type="button" onClick={() => toggleGroup('amenities')}>
                Amenities <Icon name="chevron" />
              </button>
              {openGroups.includes('amenities') && (
                <div className="chip-grid">
                  {amenities.map((amenity) => <label key={amenity} className={selectedAmenities.includes(amenity) ? 'is-checked' : ''}><input checked={selectedAmenities.includes(amenity)} onChange={() => toggleValue(amenity, selectedAmenities, setSelectedAmenities)} type="checkbox" /> {amenity}</label>)}
                </div>
              )}
            </div>
          </div>
        )}
        {activeFilters.length > 0 && (
          <div className="active-filter-row">
            <span>Active filters:</span>
            {activeFilters.map((filter) => <button key={filter} onClick={() => clearFilter(filter)} type="button">{filter} x</button>)}
            <button type="button" onClick={() => { setSelectedTypes([]); setSelectedAmenities([]); setBeds('Any'); setBaths('Any') }}>Clear all</button>
          </div>
        )}
      </div>
    </section>
  )
}
