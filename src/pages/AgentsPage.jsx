import { useMemo, useState } from 'react'
import Button from '../components/common/Button'
import Icon from '../components/common/Icon'
import Footer from '../components/layout/Footer'
import Navbar from '../components/layout/Navbar'
import { useAuth } from '../context/AuthContext'
import { useContent } from '../context/ContentContext'
import { useUI } from '../context/UIContext'
import { directoryAgents } from '../data/marketplace'

const reviewsStorageKey = 'luxora-agent-reviews'
const agentIdFromAgent = (agent = {}) => (agent.id || agent.email || agent.name || '').toString().trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

const readReviews = () => {
  try {
    return JSON.parse(localStorage.getItem(reviewsStorageKey)) || {}
  } catch {
    return {}
  }
}

export default function AgentsPage() {
  const { isAuthenticated, user } = useAuth()
  const { locations } = useContent()
  const { notify } = useUI()
  const [query, setQuery] = useState('')
  const [location, setLocation] = useState('all')
  const [specialty, setSpecialty] = useState('all')
  const [reviews, setReviews] = useState(readReviews)
  const [reviewForms, setReviewForms] = useState({})

  const agents = useMemo(() => directoryAgents.filter((agent) => {
    const haystack = `${agent.name} ${agent.location} ${agent.specialties.join(' ')}`.toLowerCase()
    const matchesQuery = haystack.includes(query.toLowerCase())
    const matchesLocation = location === 'all' || agent.location.includes(location)
    const matchesSpecialty = specialty === 'all' || agent.specialties.some((item) => item.toLowerCase().includes(specialty))
    return matchesQuery && matchesLocation && matchesSpecialty
  }), [query, location, specialty])

  const updateReviewForm = (agentId, field, value) => {
    setReviewForms((items) => ({ ...items, [agentId]: { rating: '5', comment: '', ...(items[agentId] || {}), [field]: value } }))
  }

  const submitReview = (event, agent) => {
    event.preventDefault()
    if (!isAuthenticated) {
      notify('Sign in to review an agent.', 'warning')
      return
    }
    const agentId = agentIdFromAgent(agent)
    const reviewerId = user?.id || user?.email || 'guest'
    const agentReviews = reviews[agentId] || []
    if (agentReviews.some((review) => review.reviewerId === reviewerId)) {
      notify('You have already reviewed this agent.', 'warning')
      return
    }
    const form = reviewForms[agentId] || { rating: '5', comment: '' }
    const createdAt = new Date().toISOString()
    const nextReview = {
      id: `review-${agentId}-${reviewerId}`,
      reviewerId,
      reviewerName: user?.name || 'Luxora member',
      rating: Number(form.rating) || 5,
      comment: form.comment.trim(),
      createdAt,
    }
    const nextReviews = { ...reviews, [agentId]: [nextReview, ...agentReviews] }
    setReviews(nextReviews)
    localStorage.setItem(reviewsStorageKey, JSON.stringify(nextReviews))
    setReviewForms((items) => ({ ...items, [agentId]: { rating: '5', comment: '' } }))
    notify('Agent review submitted.')
  }

  return (
    <main className="app-shell">
      <Navbar />
      <section className="page-hero">
        <div className="container">
          <span className="eyebrow">Verified professionals</span>
          <h1>Meet Our <span>Verified Agents</span></h1>
          <p>Connect with trusted real estate experts who specialize in premium property discovery and safe transactions.</p>
          <div className="agent-search-panel">
            <label className="filter-search"><Icon name="search" /><input placeholder="Search by name or location..." value={query} onChange={(event) => setQuery(event.target.value)} /></label>
            <select value={location} onChange={(event) => setLocation(event.target.value)}>
              <option value="all">All Locations</option>
              {locations.map((item) => <option value={item} key={item}>{item}</option>)}
            </select>
            <select value={specialty} onChange={(event) => setSpecialty(event.target.value)}>
              <option value="all">All Specializations</option>
              <option value="luxury">Luxury</option>
              <option value="commercial">Commercial</option>
              <option value="investment">Investment</option>
              <option value="apartments">Apartments</option>
            </select>
          </div>
        </div>
      </section>
      <section className="section">
        <div className="container agent-directory">
          {agents.map((agent) => (
            <article className="agent-profile-card" key={agent.name}>
              {(() => {
                const agentId = agentIdFromAgent(agent)
                const agentReviews = reviews[agentId] || []
                const totalRating = agentReviews.reduce((sum, review) => sum + review.rating, agent.rating * agent.reviews)
                const totalReviews = agent.reviews + agentReviews.length
                const averageRating = totalReviews ? (totalRating / totalReviews).toFixed(1) : agent.rating
                const form = reviewForms[agentId] || { rating: '5', comment: '' }
                return (
                  <>
              <img src={agent.image} alt={agent.name} />
              <div>
                <div className="profile-title-row">
                  <div>
                    <h2>{agent.name}</h2>
                    <p>{agent.title}</p>
                  </div>
                  <span className="badge badge-gold"><Icon name="check" /> Verified</span>
                </div>
                <p className="profile-location"><Icon name="pin" /> {agent.location}</p>
                <p className="profile-bio">{agent.bio}</p>
                <div className="agent-profile-stats">
                  <span><Icon name="star" /> {averageRating} ({totalReviews})</span>
                  <span>{agent.listings} listings</span>
                  <span>{agent.sold} sold</span>
                </div>
                <div className="specialties">
                  {agent.specialties.map((item) => <span key={item}>{item}</span>)}
                </div>
                <div className="agent-contact-row">
                  <a href={`tel:${agent.phone}`}>{agent.phone}</a>
                  <a href={`mailto:${agent.email}`}>{agent.email}</a>
                  <Button variant="outline" href={`/listings?agentId=${agentId}`}>View Listings</Button>
                  <Button href={`mailto:${agent.email}`}>Contact Agent <Icon name="arrow" /></Button>
                </div>
                <form className="auth-form two-col-form" onSubmit={(event) => submitReview(event, agent)}>
                  <label>Rating<select value={form.rating} onChange={(event) => updateReviewForm(agentId, 'rating', event.target.value)}><option value="5">5 stars</option><option value="4">4 stars</option><option value="3">3 stars</option><option value="2">2 stars</option><option value="1">1 star</option></select></label>
                  <label>Review<input value={form.comment} onChange={(event) => updateReviewForm(agentId, 'comment', event.target.value)} placeholder="Share your experience" /></label>
                  <button className="btn btn-outline full-field" type="submit">Submit Review</button>
                </form>
                {agentReviews.length > 0 && (
                  <div className="dashboard-table">
                    {agentReviews.slice(0, 3).map((review) => (
                      <div key={review.id}>
                        <strong>{review.reviewerName}</strong>
                        <span>{review.comment || 'No comment provided'}</span>
                        <em>{review.rating} stars</em>
                      </div>
                    ))}
                  </div>
                )}
              </div>
                  </>
                )
              })()}
            </article>
          ))}
        </div>
      </section>
      <Footer />
    </main>
  )
}
