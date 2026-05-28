import { useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { createViewing, getProperty, submitLead } from '../api/marketplaceApi'
import Icon from '../components/common/Icon'
import Footer from '../components/layout/Footer'
import Navbar from '../components/layout/Navbar'
import PropertyMap from '../components/property/PropertyMap'
import { useAuth } from '../context/AuthContext'
import { reportReasons, useListings } from '../context/ListingContext'
import { useUI } from '../context/UIContext'
import { useFavoriteProperties } from '../hooks/useSocialHooks'

const formatPrice = (price) => new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(price)

const videoEmbedFromUrl = (url = '', provider = '') => {
  try {
    if (!url.trim()) return null
    const parsed = new URL(url.trim())
    if (provider === 'youtube' || parsed.hostname.includes('youtube.com') || parsed.hostname.includes('youtu.be')) {
      const id = parsed.hostname.includes('youtu.be') ? parsed.pathname.slice(1) : parsed.searchParams.get('v') || parsed.pathname.split('/').filter(Boolean).pop()
      return id ? { type: 'embed', src: `https://www.youtube.com/embed/${id}` } : null
    }
    if (provider === 'vimeo' || parsed.hostname.includes('vimeo.com')) {
      const id = parsed.pathname.split('/').filter(Boolean).pop()
      return id ? { type: 'embed', src: `https://player.vimeo.com/video/${id}` } : null
    }
    return { type: 'video', src: parsed.href }
  } catch {
    return null
  }
}

export default function PropertyDetailsPage() {
  const { id } = useParams()
  const { isAuthenticated, user } = useAuth()
  const { allListings, getListing, reportListing, trackListingView, trackListingFavorite, trackListingInquiry } = useListings()
  const { notify } = useUI()
  const { addCompare, addMessage, addViewing, isCompared, isFavorite, toggleFavorite, trackRecent } = useFavoriteProperties()
  const [property, setProperty] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [galleryIndex, setGalleryIndex] = useState(0)
  const [isGalleryOpen, setIsGalleryOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')
  const [isContactOpen, setIsContactOpen] = useState(false)
  const [isReportOpen, setIsReportOpen] = useState(false)
  const [isShareOpen, setIsShareOpen] = useState(false)
  const [reportReason, setReportReason] = useState(reportReasons[0])
  const [contactForm, setContactForm] = useState({ name: user?.name || '', email: user?.email || '', phone: user?.phone || '', message: '' })
  const [mortgage, setMortgage] = useState({ downPayment: '', interestRate: '12', loanTerm: '20' })
  const trackedViewIdsRef = useRef(new Set())

  useEffect(() => {
    let isActive = true
    queueMicrotask(() => {
      if (isActive) setIsLoading(true)
    })
    const storedProperty = getListing(id)
    const loadProperty = storedProperty ? Promise.resolve(storedProperty) : getProperty(id)
    loadProperty.then((result) => {
        if (!isActive) return
        setProperty(result)
        setContactForm((form) => ({ ...form, message: `I am interested in ${result.title}.` }))
        trackRecent(result.id)
        if (!trackedViewIdsRef.current.has(result.id)) {
          trackedViewIdsRef.current.add(result.id)
          trackListingView(result.id)
        }
      })
      .catch(() => {
        if (isActive) setProperty(allListings[0])
      })
      .finally(() => {
        if (isActive) setIsLoading(false)
      })
    return () => {
      isActive = false
    }
  }, [allListings, getListing, id, trackListingView, trackRecent])

  if (isLoading || !property) {
    return (
      <main className="app-shell">
        <Navbar />
        <section className="section"><div className="container loading-page">Loading property...</div></section>
        <Footer />
      </main>
    )
  }

  const related = allListings.filter((item) => item.id !== property.id && item.category === property.category).slice(0, 3)
    .concat(allListings.filter((item) => item.id !== property.id && item.category !== property.category).slice(0, 3))
    .slice(0, 3)
  const saved = isFavorite(property.id)
  const compared = isCompared(property.id)
  const gallery = property.images?.length ? property.images : [property.image]
  const shareUrl = window.location.href
  const shareText = `View ${property.title} on Luxora Homes`
  const loanAmount = Math.max(0, property.price - Number(mortgage.downPayment || Math.round(property.price * 0.1)))
  const pricePerSqft = property.sqft ? Math.round(property.price / property.sqft) : 0
  const pricePerSqm = property.sqft ? Math.round(property.price / (property.sqft * 0.092903)) : 0
  const priceHistory = property.priceHistory || []
  const priceHistoryRows = priceHistory.length && Number(priceHistory[priceHistory.length - 1].price) === Number(property.price)
    ? priceHistory
    : [...priceHistory, { price: property.price, date: new Date().toISOString(), note: 'Current price' }]
  const videos = property.videos || {}
  const virtualTour = videoEmbedFromUrl(videos.youtubeUrl, 'youtube') || videoEmbedFromUrl(videos.vimeoUrl, 'vimeo') || videoEmbedFromUrl(videos.directVideoUrl)
  const monthlyRate = Number(mortgage.interestRate || 0) / 100 / 12
  const payments = Number(mortgage.loanTerm || 0) * 12
  const monthlyPayment = payments > 0
    ? monthlyRate > 0
      ? (loanAmount * monthlyRate * ((1 + monthlyRate) ** payments)) / (((1 + monthlyRate) ** payments) - 1)
      : loanAmount / payments
    : 0

  const handleContactSubmit = async (event) => {
    event.preventDefault()
    if (!isAuthenticated) {
      notify('Sign in before messaging an agent.', 'warning')
      return
    }
    const lead = await submitLead({
      seekerName: contactForm.name,
      name: contactForm.name,
      email: contactForm.email,
      phone: contactForm.phone,
      message: contactForm.message,
      propertyId: property.id,
      propertyTitle: property.title,
      propertyReference: `${property.title} (${property.id})`,
      agent: property.agent.name,
      owner: property.agent.name,
    })
    addMessage(lead)
    trackListingInquiry(property.id)
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

  const handleReportListing = () => {
    if (!isAuthenticated) {
      notify('Sign in to report a listing.', 'warning')
      return
    }
    setIsReportOpen(true)
  }

  const handleCompare = () => {
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

  const copyListingLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
      notify('Listing link copied.')
    } catch {
      notify('Could not copy the listing link.', 'error')
    }
  }

  const shareNative = async () => {
    if (!navigator.share) {
      notify('Native sharing is not available in this browser.', 'warning')
      return
    }
    try {
      await navigator.share({ title: property.title, text: shareText, url: shareUrl })
      notify('Listing shared.')
    } catch {
      notify('Sharing was cancelled.', 'warning')
    }
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
              {['overview', 'amenities', 'location', 'floor plan'].concat(virtualTour ? ['virtual tour'] : []).map((tab) => <button className={activeTab === tab ? 'is-active' : ''} onClick={() => setActiveTab(tab)} type="button" key={tab}>{tab}</button>)}
            </div>
            {activeTab === 'overview' && (
              <>
                <h2>Property Overview</h2>
                {property.description ? (
                  <p className="property-description">{property.description}</p>
                ) : (
                  <p>
                    This premium {property.category.toLowerCase()} combines refined finishes, practical spaces, and a sought-after address.
                    The listing is {property.furnished.toLowerCase()}, currently marked {property.availabilityStatus.toLowerCase()}, and represented by a verified Luxora agent.
                  </p>
                )}
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
                <PropertyMap property={property} height={260} />
                <div className="nearby-list">
                  {[
                    'Schools: International School - 1.2 km',
                    'Hospitals: General Hospital - 2.0 km',
                    'Transit: BRT stop - 0.6 km',
                    'Shops: Victoria Island Mall - 0.5 km',
                    'Shops: Neighborhood market - 0.8 km',
                  ].map((place) => <span key={place}>{place}</span>)}
                </div>
              </>
            )}
            {activeTab === 'floor plan' && (
              <>
                <h2>Floor Plan</h2>
                <div className="floor-plan"><Icon name="ruler" /> Duplex floor plan preview</div>
              </>
            )}
            {activeTab === 'virtual tour' && virtualTour && (
              <>
                <h2>Virtual Tour</h2>
                <div className="floor-plan">
                  {virtualTour.type === 'embed' ? (
                    <iframe src={virtualTour.src} title={`${property.title} virtual tour`} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen />
                  ) : (
                    <video src={virtualTour.src} controls />
                  )}
                </div>
              </>
            )}
            <h2>Payment Snapshot</h2>
            <div className="payment-grid">
              <div><span>Estimated Deposit</span><strong>{formatPrice(Math.round(property.price * 0.1))}</strong></div>
              <div><span>Service Fee</span><strong>{formatPrice(Math.round(property.price * 0.015))}</strong></div>
              <div><span>Inspection Window</span><strong>24-48 hrs</strong></div>
              <div><span>Price / sqft</span><strong>{pricePerSqft ? formatPrice(pricePerSqft) : 'N/A'}</strong></div>
              <div><span>Price / sqm</span><strong>{pricePerSqm ? formatPrice(pricePerSqm) : 'N/A'}</strong></div>
            </div>
            {priceHistory.length > 0 && (
              <>
                <h2>Price History</h2>
                <div className="dashboard-table price-history-table">
                  {priceHistoryRows.map((item, index) => (
                    <div key={`${item.date}-${index}`}>
                      <strong>{formatPrice(item.price)}</strong>
                      <span>{new Date(item.date).toLocaleDateString()}</span>
                      <em>{item.note}</em>
                    </div>
                  ))}
                </div>
              </>
            )}
            <div className="payment-grid">
              <div><span>Down Payment</span><input type="number" min="0" value={mortgage.downPayment} onChange={(event) => setMortgage({ ...mortgage, downPayment: event.target.value })} placeholder={Math.round(property.price * 0.1).toString()} /></div>
              <div><span>Interest Rate (%)</span><input type="number" min="0" step="0.1" value={mortgage.interestRate} onChange={(event) => setMortgage({ ...mortgage, interestRate: event.target.value })} /></div>
              <div><span>Loan Term (years)</span><input type="number" min="1" value={mortgage.loanTerm} onChange={(event) => setMortgage({ ...mortgage, loanTerm: event.target.value })} /></div>
              <div><span>Estimated Monthly Payment</span><strong>{formatPrice(Math.round(monthlyPayment || 0))}</strong></div>
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
            <p>{property.agent.verificationStatus === 'Pending' ? 'Verification pending' : property.agent.verificationStatus === 'Revoked' ? 'Verification revoked' : 'Verified Property Consultant'}</p>
            <button className="btn btn-primary" onClick={handleViewing} type="button">Schedule Viewing</button>
            <button className="btn btn-outline" onClick={() => setIsContactOpen(true)} type="button">Message Agent</button>
            <button className={`btn btn-ghost ${saved ? 'is-active' : ''}`} onClick={() => {
              if (!isAuthenticated) {
                notify('Sign in to save properties.', 'warning')
                return
              }
              toggleFavorite(property.id)
              trackListingFavorite(property.id, saved ? -1 : 1)
              notify(saved ? 'Removed from saved homes.' : 'Saved to your dashboard.')
            }} type="button">{saved ? 'Saved Property' : 'Save Property'}</button>
            <button className={`btn btn-ghost ${compared ? 'is-active' : ''}`} onClick={handleCompare} type="button">{compared ? 'In Compare' : 'Compare Property'}</button>
            <button className="btn btn-ghost" onClick={() => setIsShareOpen(true)} type="button">Share Listing</button>
            <button className="btn btn-ghost" onClick={handleReportListing} type="button">Report Listing</button>
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
            <label>Phone<input value={contactForm.phone} onChange={(event) => setContactForm({ ...contactForm, phone: event.target.value })} placeholder="+234 ..." required /></label>
            <label>Message<textarea rows="4" value={contactForm.message} onChange={(event) => setContactForm({ ...contactForm, message: event.target.value })} required /></label>
            <button className="btn btn-primary" type="submit">Send Message</button>
          </form>
        </div>
      )}
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
      {isShareOpen && (
        <div className="contact-modal" role="dialog" aria-modal="true">
          <div className="contact-form">
            <button className="modal-close" onClick={() => setIsShareOpen(false)} type="button">Close</button>
            <h2>Share Listing</h2>
            <label>Listing Link<input value={shareUrl} readOnly /></label>
            <button className="btn btn-primary" onClick={copyListingLink} type="button">Copy Link</button>
            <a className="btn btn-outline" href={`https://wa.me/?text=${encodeURIComponent(`${shareText} ${shareUrl}`)}`} target="_blank" rel="noreferrer">Share on WhatsApp</a>
            <a className="btn btn-outline" href={`mailto:?subject=${encodeURIComponent(property.title)}&body=${encodeURIComponent(`${shareText}\n${shareUrl}`)}`}>Share by Email</a>
            <button className="btn btn-ghost" onClick={shareNative} type="button">Share from Device</button>
          </div>
        </div>
      )}
      <Footer />
    </main>
  )
}
