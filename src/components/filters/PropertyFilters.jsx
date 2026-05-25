import { useState } from 'react'
import Icon from '../common/Icon'

const propertyTypes = ['Apartment', 'House', 'Villa', 'Penthouse', 'Studio', 'Duplex', 'Commercial', 'Land']
const amenities = ['Parking', 'Pool', 'Gym', 'Security', 'Furnished', 'AC', 'Garden', 'Elevator', 'Balcony', 'WiFi']

export default function PropertyFilters({ totalResults, onQueryChange, viewMode, onViewModeChange }) {
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <section className="filters-bar">
      <div className="container filters-shell">
        <label className="filter-search">
          <Icon name="search" />
          <input type="search" placeholder="Search by location, property name, or keyword..." onChange={(event) => onQueryChange(event.target.value)} />
        </label>

        <select defaultValue="recent">
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
              <h3>Property Type</h3>
              <div className="chip-grid">
                {propertyTypes.map((type) => <label key={type}><input type="checkbox" /> {type}</label>)}
              </div>
            </div>
            <div>
              <h3>Price Range</h3>
              <div className="range-row">
                <input type="range" min="0" max="100" defaultValue="15" />
                <input type="range" min="0" max="100" defaultValue="85" />
              </div>
              <p>NGN 500K - NGN 100M+</p>
            </div>
            <div>
              <h3>Amenities</h3>
              <div className="chip-grid">
                {amenities.map((amenity) => <label key={amenity}><input type="checkbox" /> {amenity}</label>)}
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
