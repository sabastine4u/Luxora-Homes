import { Link, Navigate, useParams } from 'react-router-dom'
import Button from '../components/common/Button'
import Icon from '../components/common/Icon'
import Footer from '../components/layout/Footer'
import Navbar from '../components/layout/Navbar'
import { agencies, directoryAgents } from '../data/marketplace'

const agentIdFromAgent = (agent = {}) => (agent.id || agent.email || agent.name || '').toString().trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

export default function AgencyPage() {
  const { id } = useParams()
  const agency = agencies.find((item) => item.id === id)
  if (!agency) return <Navigate to="/agents" replace />
  const agents = directoryAgents.filter((agent) => agent.agencyId === agency.id)

  return (
    <main className="app-shell">
      <Navbar />
      <section className="page-hero">
        <div className="container">
          <span className="eyebrow">Verified brokerage</span>
          <h1>{agency.name}</h1>
          <p>{agency.description}</p>
          <div className="agent-contact-row">
            <a href={`tel:${agency.phone}`}>{agency.phone}</a>
            <a href={`mailto:${agency.email}`}>{agency.email}</a>
            <Link className="btn btn-outline" to="/agents">All Agents</Link>
          </div>
        </div>
      </section>
      <section className="section">
        <div className="container agent-directory">
          <article className="agent-profile-card">
            <div>
              <div className="profile-title-row">
                <div>
                  <h2>{agency.name}</h2>
                  <p>{agency.location}</p>
                </div>
                <span className="badge badge-gold"><Icon name="check" /> Verified</span>
              </div>
              <p className="profile-bio">{agency.description}</p>
              <div className="agent-profile-stats">
                <span>{agents.length} agents</span>
                <span>{agents.reduce((total, agent) => total + agent.listings, 0)} listings</span>
                <span>{agents.reduce((total, agent) => total + agent.sold, 0)} sold</span>
              </div>
            </div>
          </article>
          {agents.map((agent) => {
            const agentId = agentIdFromAgent(agent)
            return (
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
                    <Button variant="outline" href={`/listings?agentId=${agentId}`}>View Listings</Button>
                    <Button href={`mailto:${agent.email}`}>Contact Agent <Icon name="arrow" /></Button>
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      </section>
      <Footer />
    </main>
  )
}
