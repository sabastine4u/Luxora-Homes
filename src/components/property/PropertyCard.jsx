import { useState } from 'react'
import Button from '../common/Button'
import Icon from '../common/Icon'

const formatPrice = (price) =>
  new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price)

export default function PropertyCard({ property }) {
  const [isFavorite, setIsFavorite] = useState(false)

  return (
    <article className="property-card reveal-card">
      <div className="property-media">
        <img src={property.image} alt={property.title} loading="lazy" />
        <div className="badge-stack">
          {property.isVerified && <span className="badge badge-gold"><Icon name="check" /> Verified</span>}
          {property.isNew && <span className="badge badge-green">New</span>}
          {property.isFeatured && <span className="badge badge-blue">Featured</span>}
        </div>
        <button
          className={`favorite-button ${isFavorite ? 'is-active' : ''}`}
          aria-label="Save property"
          onClick={() => setIsFavorite((value) => !value)}
        >
          <Icon name="heart" />
        </button>
        <span className="property-category">{property.category}</span>
      </div>

      <div className="property-body">
        <div className="property-meta-row">
          <span className="badge badge-outline">{property.type === 'rent' ? 'For Rent' : 'For Sale'}</span>
          <span className="listed-date">{new Date(property.listedDate).toLocaleDateString()}</span>
        </div>
        <a href={`/property/${property.id}`} className="property-title-link">
          <h3>{property.title}</h3>
        </a>
        <p className="property-location"><Icon name="pin" /> {property.location}</p>

        <div className="property-specs">
          <span><Icon name="bed" /> {property.beds}</span>
          <span><Icon name="bath" /> {property.baths}</span>
          <span><Icon name="area" /> {property.sqft.toLocaleString()}</span>
        </div>

        <div className="amenities">
          {property.amenities.map((amenity) => (
            <span key={amenity}>{amenity}</span>
          ))}
        </div>

        <div className="property-footer">
          <div>
            <strong>{formatPrice(property.price)}</strong>
            <span>/{property.priceType}</span>
          </div>
          <img src={property.agent.image} alt={property.agent.name} loading="lazy" />
        </div>
        <Button variant="outline" href={`/property/${property.id}`} className="property-cta">View Details</Button>
      </div>
    </article>
  )
}
