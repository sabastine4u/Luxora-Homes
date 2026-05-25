import Button from '../common/Button'
import Icon from '../common/Icon'

export default function CTASection() {
  return (
    <section className="section final-cta">
      <div className="container">
        <div className="cta-panel">
          <span className="app-badge"><Icon name="phone" /> Mobile App Coming Soon</span>
          <h2>Ready to Find Your <span>Dream Property?</span></h2>
          <p>
            Start your property journey with verified listings, trusted experts, and a marketplace designed to keep decisions calm and clear.
          </p>
          <div className="cta-actions">
            <Button href="/listings">Explore Properties <Icon name="arrow" /></Button>
            <Button variant="outline" href="/auth/register?type=agent">List Your Property</Button>
          </div>
          <div className="store-row">
            <button type="button"><span>Download on the</span><strong>App Store</strong></button>
            <button type="button"><span>Get it on</span><strong>Google Play</strong></button>
          </div>
        </div>
      </div>
    </section>
  )
}
