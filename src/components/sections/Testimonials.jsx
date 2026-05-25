import { testimonials } from '../../data/marketplace'
import Icon from '../common/Icon'

export default function Testimonials() {
  return (
    <section className="section">
      <div className="container">
        <div className="section-heading centered">
          <span className="eyebrow">Testimonials</span>
          <h2>What Our <span>Clients Say</span></h2>
          <p>Join thousands of satisfied clients who found their perfect property through Luxora.</p>
        </div>
        <div className="testimonial-grid">
          {testimonials.map(([name, role, location, image, text]) => (
            <article className="testimonial-card" key={name}>
              <span className="quote-icon"><Icon name="quote" /></span>
              <div className="stars">{Array.from({ length: 5 }, (_, index) => <Icon name="star" key={index} />)}</div>
              <p>"{text}"</p>
              <div className="testimonial-author">
                <img src={image} alt={name} loading="lazy" />
                <div>
                  <h3>{name}</h3>
                  <span>{role} / {location}</span>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
