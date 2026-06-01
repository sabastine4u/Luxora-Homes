import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { heroStats } from '../../data/marketplace'
import Button from '../common/Button'
import Icon from '../common/Icon'

export default function HeroSection() {
  const navigate = useNavigate()
  const [searchType, setSearchType] = useState('buy')

  const submitSearch = (event) => {
    event.preventDefault()
    const params = new URLSearchParams()
    params.set('type', searchType)
    navigate(`/listings?${params.toString()}`)
  }

  return (
    <section className="hero-section" id="top">
      <div className="hero-backdrop">
        <img
          src="https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1800&auto=format&fit=crop&q=75"
          alt="Luxury modern home interior"
        />
      </div>

      <div className="container hero-content">
        <div className="hero-copy">
          <span className="eyebrow">Nigeria's premium property marketplace</span>
          <h1>Find Your Dream Property With Verified Confidence</h1>
          <p>
            Discover premium homes, apartments, and investment properties from trusted agents across Nigeria.
          </p>
          <div className="hero-actions">
            <Button href="/listings">Explore Properties <Icon name="arrow" /></Button>
            <Button variant="outline" href="/agents">Meet Verified Agents</Button>
          </div>
        </div>

        <form className="search-panel" aria-label="Search properties" onSubmit={submitSearch}>
          <div className="search-tabs" role="tablist" aria-label="Property search type">
            <button type="button" className={searchType === 'buy' ? 'is-active' : ''} onClick={() => setSearchType('buy')}>Buy</button>
            <button type="button" className={searchType === 'rent' ? 'is-active' : ''} onClick={() => setSearchType('rent')}>Rent</button>
            <button type="button" className={searchType === 'lease' ? 'is-active' : ''} onClick={() => setSearchType('lease')}>Lease</button>
          </div>
          <div className="search-grid">
            <label>
              Location
              <select defaultValue="lagos">
                <option value="lagos">Lagos</option>
                <option value="abuja">Abuja</option>
                <option value="port-harcourt">Port Harcourt</option>
              </select>
            </label>
            <label>
              Property Type
              <select defaultValue="apartment">
                <option value="apartment">Apartment</option>
                <option value="house">House</option>
                <option value="villa">Villa</option>
                <option value="commercial">Commercial</option>
              </select>
            </label>
            <label>
              Price Range
              <select defaultValue="all">
                <option value="all">Any Price</option>
                <option value="under-500k">Under 500K</option>
                <option value="1m-5m">1M - 5M</option>
                <option value="5m-plus">5M+</option>
              </select>
            </label>
            <button type="submit" className="btn btn-primary search-submit">
              <Icon name="search" /> Search
            </button>
          </div>
          <div className="quick-links">
            <span>Popular:</span>
            {['Lagos', 'Abuja', 'Port Harcourt', 'Ibadan'].map((city) => (
              <a href="/listings" key={city}>{city}</a>
            ))}
          </div>
        </form>

        <div className="hero-stats">
          {heroStats.map((stat) => (
            <div key={stat.label}>
              <strong>{stat.value}</strong>
              <span>{stat.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
