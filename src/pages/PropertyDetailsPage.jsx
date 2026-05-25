import Button from '../components/common/Button'
import Icon from '../components/common/Icon'
import Footer from '../components/layout/Footer'
import Navbar from '../components/layout/Navbar'
import { listingProperties } from '../data/marketplace'

const formatPrice = (price) => new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(price)

export default function PropertyDetailsPage() {
  const id = window.location.pathname.split('/').pop()
  const property = listingProperties.find((item) => item.id === id) || listingProperties[0]
  const related = listingProperties.filter((item) => item.id !== property.id).slice(0, 3)
  const gallery = [
    property.image,
    'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=900&auto=format&fit=crop&q=70',
    'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=900&auto=format&fit=crop&q=70',
    'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?w=900&auto=format&fit=crop&q=70',
  ]

  return (
    <main className="app-shell">
      <Navbar />
      <section className="property-detail-hero">
        <div className="container detail-top">
          <a className="text-link" href="/listings">Back to listings</a>
          <div>
            <span className="badge badge-gold"><Icon name="check" /> Verified</span>
            <h1>{property.title}</h1>
            <p><Icon name="pin" /> {property.location}</p>
          </div>
          <strong>{formatPrice(property.price)}<span>/{property.priceType}</span></strong>
        </div>
        <div className="container gallery-grid">
          {gallery.map((image, index) => <img className={index === 0 ? 'main-gallery-image' : ''} src={image} alt={`${property.title} view ${index + 1}`} key={image} />)}
        </div>
      </section>
      <section className="section">
        <div className="container detail-layout">
          <article className="detail-content">
            <div className="detail-specs">
              <span><Icon name="bed" /> {property.beds} Bedrooms</span>
              <span><Icon name="bath" /> {property.baths} Bathrooms</span>
              <span><Icon name="area" /> {property.sqft.toLocaleString()} sqft</span>
            </div>
            <h2>Property Overview</h2>
            <p>
              This premium {property.category.toLowerCase()} combines refined finishes, practical spaces, and a sought-after address.
              The listing has been reviewed for accuracy and is represented by a verified Luxora agent.
            </p>
            <h2>Amenities</h2>
            <div className="amenity-list">{property.amenities.concat(['Backup Power', 'Secure Access', 'Professional Management']).map((amenity) => <span key={amenity}><Icon name="check" /> {amenity}</span>)}</div>
            <h2>Location Highlights</h2>
            <div className="map-placeholder"><Icon name="pin" /> Interactive map preview</div>
            <h2>Payment Snapshot</h2>
            <div className="payment-grid">
              <div><span>Estimated Deposit</span><strong>{formatPrice(Math.round(property.price * 0.1))}</strong></div>
              <div><span>Service Fee</span><strong>{formatPrice(Math.round(property.price * 0.015))}</strong></div>
              <div><span>Inspection Window</span><strong>24-48 hrs</strong></div>
            </div>
            <h2>Similar Properties</h2>
            <div className="similar-strip">
              {related.map((item) => (
                <a href={`/property/${item.id}`} key={item.id}>
                  <img src={item.image} alt={item.title} />
                  <div><strong>{item.title}</strong><span>{item.location}</span></div>
                </a>
              ))}
            </div>
          </article>
          <aside className="contact-card">
            <img src={property.agent.image} alt={property.agent.name} />
            <h3>{property.agent.name}</h3>
            <p>Verified Property Consultant</p>
            <Button href="/dashboard/user">Schedule Viewing</Button>
            <Button href="/agents" variant="outline">Message Agent</Button>
            <Button href="/listings" variant="ghost">Share Property</Button>
          </aside>
        </div>
      </section>
      <Footer />
    </main>
  )
}
