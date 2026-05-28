import { agents } from '../../data/marketplace'
import Button from '../common/Button'
import Icon from '../common/Icon'

const agentIdFromName = (name = '') => name.toString().trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

export default function VerifiedAgents() {
  return (
    <section className="section section-alt" id="agents">
      <div className="container">
        <div className="section-heading split-heading">
          <div>
            <span className="eyebrow">Our Experts</span>
            <h2>Meet Our <span>Verified Agents</span></h2>
            <p>Work with trusted professionals who are vetted and committed to helping you find the right property.</p>
          </div>
          <Button variant="outline" href="/agents">View All Agents <Icon name="arrow" /></Button>
        </div>
        <div className="agent-grid">
          {agents.map(([name, title, location, rating, reviews, listings, sold, image, specialties]) => (
            <article className="agent-card" key={name}>
              <div className="agent-avatar">
                <img src={image} alt={name} loading="lazy" />
                <span><Icon name="check" /></span>
              </div>
              <h3>{name}</h3>
              <p>{title}</p>
              <small>{location}</small>
              <div className="agent-rating"><Icon name="star" /> {rating} <span>({reviews} reviews)</span></div>
              <div className="agent-stats">
                <div><strong>{listings}</strong><span>Listings</span></div>
                <div><strong>{sold}</strong><span>Sold</span></div>
              </div>
              <div className="specialties">
                {specialties.map((specialty) => <span key={specialty}>{specialty}</span>)}
              </div>
              <Button variant="outline" href={`/listings?agentId=${agentIdFromName(name)}`}>View Listings</Button>
            </article>
          ))}
        </div>
        <div className="section-cta">
          <p>Are you a real estate professional? Join our network of verified agents.</p>
          <Button href="/auth/register?type=agent">Become a Verified Agent <Icon name="arrow" /></Button>
        </div>
      </div>
    </section>
  )
}
