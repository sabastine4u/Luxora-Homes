import { cities } from '../../data/marketplace'

export default function PopularCities() {
  return (
    <section className="section" id="cities">
      <div className="container">
        <div className="section-heading split-heading">
          <div>
            <span className="eyebrow">Explore Locations</span>
            <h2>Popular <span>Cities</span></h2>
            <p>Discover properties in Nigeria's most sought-after cities, from bustling Lagos to serene Enugu.</p>
          </div>
          <a className="text-link" href="/listings">View All Cities</a>
        </div>
        <div className="city-grid">
          {cities.map(([name, state, count, image, trending], index) => (
            <a className={`image-tile city-tile ${index === 0 ? 'featured-city' : ''}`} href="/listings" key={name}>
              <img src={image} alt={`${name} skyline`} loading="lazy" />
              {trending && <span className="trend-badge">Trending</span>}
              <div>
                <h3>{name}</h3>
                <p>{state}</p>
                <strong>{count} properties</strong>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  )
}
