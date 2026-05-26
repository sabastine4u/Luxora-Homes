import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useFavoriteProperties } from '../../hooks/useSocialHooks'
import { useUI } from '../../context/UIContext'
import Button from '../common/Button'
import Icon from '../common/Icon'

const formatPrice = (price) =>
  new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price)

export default function PropertyCard({ property, variant = 'default' }) {
  const { isAuthenticated } = useAuth()
  const { isFavorite, toggleFavorite } = useFavoriteProperties()
  const { notify } = useUI()
  const saved = isFavorite(property.id)

  const handleFavorite = () => {
    if (!isAuthenticated) {
      notify('Sign in to save properties.', 'warning')
      return
    }
    toggleFavorite(property.id)
    notify(saved ? 'Removed from saved homes.' : 'Saved to your dashboard.')
  }

  return (
    <article className={`property-card reveal-card ${variant === 'horizontal' ? 'property-card-horizontal' : ''}`}>
      <div className="property-media">
        <img src={property.image} alt={property.title} loading="lazy" />
        <div className="badge-stack">
          {property.isVerified && <span className="badge badge-gold"><Icon name="check" /> Verified</span>}
          {property.isNew && <span className="badge badge-green">New</span>}
          {property.isFeatured && <span className="badge badge-blue">Featured</span>}
        </div>
        <button
          className={`favorite-button ${saved ? 'is-active' : ''}`}
          aria-label="Save property"
          onClick={handleFavorite}
        >
          <Icon name="heart" />
        </button>
        <div className="quick-actions">
          <Link to={`/property/${property.id}`}><Icon name="eye" /> Quick View</Link>
          <Link to="/dashboard/user/viewings"><Icon name="calendar" /> Schedule</Link>
        </div>
        <span className="property-category">{property.category}</span>
      </div>

      <div className="property-body">
        <div className="property-meta-row">
          <span className="badge badge-outline">{property.type === 'rent' ? 'For Rent' : property.type === 'lease' ? 'For Lease' : 'For Sale'}</span>
          <span className="listed-date">{new Date(property.listedDate).toLocaleDateString()}</span>
        </div>
        <Link to={`/property/${property.id}`} className="property-title-link">
          <h3>{property.title}</h3>
        </Link>
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
