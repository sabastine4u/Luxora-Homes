import { featuredProperties } from '../../data/marketplace'
import Button from '../common/Button'
import Icon from '../common/Icon'
import PropertyCard from '../property/PropertyCard'

export default function FeaturedProperties() {
  return (
    <section className="section" id="properties">
      <div className="container">
        <div className="section-heading split-heading">
          <div>
            <span className="eyebrow">Featured Listings</span>
            <h2>Discover Our <span>Premium Properties</span></h2>
            <p>Handpicked properties from verified agents across Nigeria, vetted for quality and authenticity.</p>
          </div>
          <Button variant="outline" href="/listings">View All Properties <Icon name="arrow" /></Button>
        </div>
        <div className="properties-grid">
          {featuredProperties.map((property) => (
            <PropertyCard property={property} key={property.id} />
          ))}
        </div>
      </div>
    </section>
  )
}
