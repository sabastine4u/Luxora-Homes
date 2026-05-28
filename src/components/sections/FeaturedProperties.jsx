import Button from '../common/Button'
import Icon from '../common/Icon'
import PropertyCard from '../property/PropertyCard'
import { useFavoriteProperties } from '../../hooks/useSocialHooks'
import { useListings } from '../../context/ListingContext'

export default function FeaturedProperties() {
  const { recentProperties } = useFavoriteProperties()
  const { allListings } = useListings()
  const featuredProperties = allListings.filter((property) => property.isFeatured || property.isPromoted).slice(0, 4)

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
        {recentProperties.length > 0 && (
          <>
            <div className="section-heading split-heading">
              <div>
                <span className="eyebrow">Recently Viewed</span>
                <h2>Pick Up Where <span>You Left Off</span></h2>
                <p>Your latest viewed properties stay ready for quick comparison and review.</p>
              </div>
              <Button variant="outline" href="/dashboard/user/recently-viewed">View Recently Viewed <Icon name="arrow" /></Button>
            </div>
            <div className="properties-grid">
              {recentProperties.slice(0, 3).map((property) => (
                <PropertyCard property={property} key={property.id} />
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  )
}
