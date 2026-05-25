import { features } from '../../data/marketplace'
import Button from '../common/Button'
import Icon from '../common/Icon'

export default function WhyChooseUs() {
  return (
    <section className="section section-alt">
      <div className="container trust-layout">
        <div>
          <span className="eyebrow">Why Choose Us</span>
          <h2>The <span>Trusted</span> Way to Find Your Property</h2>
          <p>
            Luxora is a complete real estate experience built on trust, transparency, and thoughtful technology.
          </p>
          <div className="trust-stats">
            <div><strong>99%</strong><span>Verification Rate</span></div>
            <div><strong>0</strong><span>Fraud Cases</span></div>
            <div><strong>4.9</strong><span>Average Rating</span></div>
          </div>
          <Button href="/agents">Learn More <Icon name="arrow" /></Button>
        </div>

        <div className="feature-grid">
          {features.map(([title, description], index) => (
            <article className="feature-card" key={title}>
              <span className="feature-icon">{String(index + 1).padStart(2, '0')}</span>
              <h3>{title}</h3>
              <p>{description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
