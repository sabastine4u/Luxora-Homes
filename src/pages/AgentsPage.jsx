import { useMemo, useState } from 'react'
import Button from '../components/common/Button'
import Icon from '../components/common/Icon'
import Footer from '../components/layout/Footer'
import Navbar from '../components/layout/Navbar'
import { directoryAgents } from '../data/marketplace'

export default function AgentsPage() {
  const [query, setQuery] = useState('')
  const [location, setLocation] = useState('all')
  const [specialty, setSpecialty] = useState('all')

  const agents = useMemo(() => directoryAgents.filter((agent) => {
    const haystack = `${agent.name} ${agent.location} ${agent.specialties.join(' ')}`.toLowerCase()
    const matchesQuery = haystack.includes(query.toLowerCase())
    const matchesLocation = location === 'all' || agent.location.includes(location)
    const matchesSpecialty = specialty === 'all' || agent.specialties.some((item) => item.toLowerCase().includes(specialty))
    return matchesQuery && matchesLocation && matchesSpecialty
  }), [query, location, specialty])

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
              <option value="Victoria Island">Victoria Island</option>
              <option value="Ikoyi">Ikoyi</option>
              <option value="Lekki">Lekki</option>
              <option value="Yaba">Yaba</option>
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
                  <span><Icon name="star" /> {agent.rating} ({agent.reviews})</span>
                  <span>{agent.listings} listings</span>
                  <span>{agent.sold} sold</span>
                </div>
                <div className="specialties">
                  {agent.specialties.map((item) => <span key={item}>{item}</span>)}
                </div>
                <div className="agent-contact-row">
                  <a href={`tel:${agent.phone}`}>{agent.phone}</a>
                  <a href={`mailto:${agent.email}`}>{agent.email}</a>
                  <Button href={`mailto:${agent.email}`}>Contact Agent <Icon name="arrow" /></Button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
      <Footer />
    </main>
  )
}
