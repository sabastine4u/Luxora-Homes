import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { createViewing, getProperty, submitLead } from '../api/marketplaceApi'
import Icon from '../components/common/Icon'
import Footer from '../components/layout/Footer'
import Navbar from '../components/layout/Navbar'
import { listingProperties } from '../data/marketplace'
import { useAuth } from '../context/AuthContext'
import { useUI } from '../context/UIContext'
import { useFavoriteProperties } from '../hooks/useSocialHooks'

const formatPrice = (price) => new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(price)

export default function PropertyDetailsPage() {
  const { id } = useParams()
  const { isAuthenticated, user } = useAuth()
  const { notify } = useUI()
  const { addMessage, addViewing, isFavorite, toggleFavorite, trackRecent } = useFavoriteProperties()
  const [property, setProperty] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [galleryIndex, setGalleryIndex] = useState(0)
  const [isGalleryOpen, setIsGalleryOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')
  const [isContactOpen, setIsContactOpen] = useState(false)
  const [contactForm, setContactForm] = useState({ name: user?.name || '', email: user?.email || '', phone: user?.phone || '', message: '' })

  useEffect(() => {
    let isActive = true
    queueMicrotask(() => {
      if (isActive) setIsLoading(true)
    })
    getProperty(id)
      .then((result) => {
        if (!isActive) return
        setProperty(result)
        setContactForm((form) => ({ ...form, message: `I am interested in ${result.title}.` }))
        trackRecent(result.id)
      })
      .catch(() => {
        if (isActive) setProperty(listingProperties[0])
      })
      .finally(() => {
        if (isActive) setIsLoading(false)
      })
    return () => {
      isActive = false
    }
  }, [id, trackRecent])

  if (isLoading || !property) {
    return (
      <main className="app-shell">
        <Navbar />
        <section className="section"><div className="container loading-page">Loading property...</div></section>
        <Footer />
      </main>
    )
  }

  const related = listingProperties.filter((item) => item.id !== property.id && item.category === property.category).slice(0, 3)
    .concat(listingProperties.filter((item) => item.id !== property.id && item.category !== property.category).slice(0, 3))
    .slice(0, 3)
  const saved = isFavorite(property.id)
  const gallery = property.images?.length ? property.images : [property.image]

  const handleContactSubmit = async (event) => {
    event.preventDefault()
    if (!isAuthenticated) {
      notify('Sign in before messaging an agent.', 'warning')
      return
    }
    const lead = await submitLead({ ...contactForm, propertyId: property.id, agent: property.agent.name })
    addMessage(lead)
    setIsContactOpen(false)
    notify('Message sent to the agent.')
  }

  const handleViewing = async () => {
    if (!isAuthenticated) {
      notify('Sign in to schedule a viewing.', 'warning')
      return
    }
    const viewing = await createViewing({ propertyId: property.id, propertyTitle: property.title, agent: property.agent.name })
    addViewing(viewing)
    notify('Viewing scheduled in your dashboard.')
  }

  return (
    <main className="app-shell">
      <Navbar />
      <section className="property-detail-hero">
        <div className="container detail-top">
          <Link className="text-link" to="/listings">Back to listings</Link>
          <div>
            <span className="badge badge-gold"><Icon name="check" /> Verified</span>
            <h1>{property.title}</h1>
            <p><Icon name="pin" /> {property.location}</p>
          </div>
          <strong>{formatPrice(property.price)}<span>/{property.priceType}</span></strong>
        </div>
        <div className="container gallery-grid">
          {gallery.map((image, index) => <button className={index === 0 ? 'main-gallery-image gallery-button' : 'gallery-button'} onClick={() => { setGalleryIndex(index); setIsGalleryOpen(true) }} type="button" key={image}><img src={image} alt={`${property.title} view ${index + 1}`} /></button>)}
        </div>
      </section>
      {isGalleryOpen && (
        <div className="gallery-modal" role="dialog" aria-modal="true">
          <button className="modal-close" onClick={() => setIsGalleryOpen(false)} type="button">Close</button>
          <button className="gallery-nav previous" onClick={() => setGalleryIndex((value) => (value - 1 + gallery.length) % gallery.length)} type="button">Prev</button>
          <img src={gallery[galleryIndex]} alt={`${property.title} large view`} />
          <button className="gallery-nav next" onClick={() => setGalleryIndex((value) => (value + 1) % gallery.length)} type="button">Next</button>
          <div className="gallery-thumbnails">
            {gallery.map((image, index) => <button className={galleryIndex === index ? 'is-active' : ''} onClick={() => setGalleryIndex(index)} type="button" key={image}><img src={image} alt="" /></button>)}
          </div>
        </div>
      )}
      <section className="section">
        <div className="container detail-layout">
          <article className="detail-content">
            <div className="detail-specs">
              <span><Icon name="bed" /> {property.beds} Bedrooms</span>
              <span><Icon name="bath" /> {property.baths} Bathrooms</span>
              <span><Icon name="area" /> {property.sqft.toLocaleString()} sqft</span>
              <span><Icon name="car" /> 3 Parking</span>
              <span><Icon name="calendar" /> {property.moveInDate}</span>
              <span><Icon name="eye" /> {property.availabilityStatus}</span>
            </div>
            <div className="detail-tabs">
              {['overview', 'amenities', 'location', 'floor plan'].map((tab) => <button className={activeTab === tab ? 'is-active' : ''} onClick={() => setActiveTab(tab)} type="button" key={tab}>{tab}</button>)}
            </div>
            {activeTab === 'overview' && (
              <>
                <h2>Property Overview</h2>
                <p>
                  This premium {property.category.toLowerCase()} combines refined finishes, practical spaces, and a sought-after address.
                  The listing is {property.furnished.toLowerCase()}, currently marked {property.availabilityStatus.toLowerCase()}, and represented by a verified Luxora agent.
                </p>
                <h2>Key Features</h2>
                <div className="amenity-list">{['Floor-to-ceiling windows', 'Private terrace', 'Smart home system', 'Chef kitchen', 'Wine cellar', 'Home theater'].map((feature) => <span key={feature}><Icon name="check" /> {feature}</span>)}</div>
              </>
            )}
            {activeTab === 'amenities' && (
              <>
                <h2>Amenities</h2>
                <div className="amenity-list">{property.amenities.concat(['Backup Power', 'Secure Access', 'Professional Management', 'Pool', 'Gym']).map((amenity) => <span key={amenity}><Icon name="check" /> {amenity}</span>)}</div>
              </>
            )}
            {activeTab === 'location' && (
              <>
                <h2>Location Highlights</h2>
                <div className="map-placeholder"><Icon name="pin" /> Interactive map preview</div>
                <div className="nearby-list">{['Victoria Island Mall - 0.5 km', 'Lagos Beach - 0.3 km', 'International School - 1.2 km', 'General Hospital - 2.0 km'].map((place) => <span key={place}>{place}</span>)}</div>
              </>
            )}
            {activeTab === 'floor plan' && (
              <>
                <h2>Floor Plan</h2>
                <div className="floor-plan"><Icon name="ruler" /> Duplex floor plan preview</div>
              </>
            )}
            <h2>Payment Snapshot</h2>
            <div className="payment-grid">
              <div><span>Estimated Deposit</span><strong>{formatPrice(Math.round(property.price * 0.1))}</strong></div>
              <div><span>Service Fee</span><strong>{formatPrice(Math.round(property.price * 0.015))}</strong></div>
              <div><span>Inspection Window</span><strong>24-48 hrs</strong></div>
            </div>
            <h2>Similar Properties</h2>
            <div className="similar-strip">
              {related.map((item) => (
                <Link to={`/property/${item.id}`} key={item.id}>
                  <img src={item.image} alt={item.title} />
                  <div><strong>{item.title}</strong><span>{item.location}</span></div>
                </Link>
              ))}
            </div>
          </article>
          <aside className="contact-card">
            <img src={property.agent.image} alt={property.agent.name} />
            <h3>{property.agent.name}</h3>
            <p>Verified Property Consultant</p>
            <button className="btn btn-primary" onClick={handleViewing} type="button">Schedule Viewing</button>
            <button className="btn btn-outline" onClick={() => setIsContactOpen(true)} type="button">Message Agent</button>
            <button className={`btn btn-ghost ${saved ? 'is-active' : ''}`} onClick={() => {
              if (!isAuthenticated) {
                notify('Sign in to save properties.', 'warning')
                return
              }
              toggleFavorite(property.id)
              notify(saved ? 'Removed from saved homes.' : 'Saved to your dashboard.')
            }} type="button">{saved ? 'Saved Property' : 'Save Property'}</button>
            <div className="agent-contact-meta">
              <a href="tel:+2348001234567"><Icon name="phone" /> +234 800 123 4567</a>
              <a href="mailto:agent@luxora.demo"><Icon name="mail" /> agent@luxora.demo</a>
            </div>
          </aside>
        </div>
      </section>
      {isContactOpen && (
        <div className="contact-modal" role="dialog" aria-modal="true">
          <form className="contact-form" onSubmit={handleContactSubmit}>
            <button className="modal-close" onClick={() => setIsContactOpen(false)} type="button">Close</button>
            <h2>Contact {property.agent.name}</h2>
            <label>Name<input value={contactForm.name} onChange={(event) => setContactForm({ ...contactForm, name: event.target.value })} placeholder="Your name" required /></label>
            <label>Email<input type="email" value={contactForm.email} onChange={(event) => setContactForm({ ...contactForm, email: event.target.value })} placeholder="you@example.com" required /></label>
            <label>Phone<input value={contactForm.phone} onChange={(event) => setContactForm({ ...contactForm, phone: event.target.value })} placeholder="+234 ..." /></label>
            <label>Message<textarea rows="4" value={contactForm.message} onChange={(event) => setContactForm({ ...contactForm, message: event.target.value })} /></label>
            <button className="btn btn-primary" type="submit">Send Message</button>
          </form>
        </div>
      )}
      <Footer />
    </main>
  )
}
