import { Link } from 'react-router-dom'
import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { reportReasons, useListings } from '../../context/ListingContext'
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
  const { isAuthenticated, user } = useAuth()
  const { reportListing, trackListingFavorite } = useListings()
  const { addCompare, isCompared, isFavorite, toggleFavorite } = useFavoriteProperties()
  const { notify } = useUI()
  const saved = isFavorite(property.id)
  const compared = isCompared(property.id)
  const [isReportOpen, setIsReportOpen] = useState(false)
  const [reportReason, setReportReason] = useState(reportReasons[0])

  const handleFavorite = () => {
    if (!isAuthenticated) {
      notify('Sign in to save properties.', 'warning')
      return
    }
    toggleFavorite(property.id)
    trackListingFavorite(property.id, saved ? -1 : 1)
    notify(saved ? 'Removed from saved homes.' : 'Saved to your dashboard.')
  }

  const handleReport = (event) => {
    event.preventDefault()
    if (!isAuthenticated) {
      notify('Sign in to report a listing.', 'warning')
      return
    }
    setIsReportOpen(true)
  }

  const handleReportSubmit = (event) => {
    event.preventDefault()
    const result = reportListing(property.id, {
      reason: reportReason,
      reporterId: user?.id || user?.email,
      reporterName: user?.name,
      reporterEmail: user?.email,
    })
    if (result?.duplicate) {
      notify('You have already reported this listing.', 'warning')
      return
    }
    setIsReportOpen(false)
    notify('Listing report sent to admin moderation.')
  }

  const handleCompare = (event) => {
    event.preventDefault()
    if (!isAuthenticated) {
      notify('Sign in to compare properties.', 'warning')
      return
    }
    const result = addCompare(property.id)
    if (result.reason === 'duplicate') {
      notify('Property is already in your comparison.', 'warning')
      return
    }
    if (result.reason === 'limit') {
      notify('You can compare up to 4 properties.', 'warning')
      return
    }
    notify('Property added to comparison.')
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
          <a href={`/dashboard/user/compare-properties`} onClick={handleCompare}><Icon name="check" /> {compared ? 'Compared' : 'Compare'}</a>
          <a href={`/property/${property.id}`} onClick={handleReport}><Icon name="bell" /> Report</a>
        </div>
        <span className="property-category">{property.category}</span>
      </div>

      <div className="property-body">
        <div className="property-meta-row">
          <span className="badge badge-outline">{property.type === 'rent' ? 'For Rent' : property.type === 'lease' ? 'For Lease' : 'For Sale'}</span>
          <span className="listed-date">{property.availabilityStatus || property.status || new Date(property.listedDate).toLocaleDateString()}</span>
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
      {isReportOpen && (
        <div className="contact-modal" role="dialog" aria-modal="true">
          <form className="contact-form" onSubmit={handleReportSubmit}>
            <button className="modal-close" onClick={() => setIsReportOpen(false)} type="button">Close</button>
            <h2>Report Listing</h2>
            <label>Listing<input value={property.title} readOnly /></label>
            <label>Reason<select value={reportReason} onChange={(event) => setReportReason(event.target.value)}>{reportReasons.map((reason) => <option key={reason}>{reason}</option>)}</select></label>
            <button className="btn btn-primary" type="submit">Submit Report</button>
          </form>
        </div>
      )}
    </article>
  )
}
