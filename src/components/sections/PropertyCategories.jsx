import { categories } from '../../data/marketplace'

export default function PropertyCategories() {
  return (
    <section className="section section-alt" id="categories">
      <div className="container">
        <div className="section-heading centered">
          <span className="eyebrow">Browse by Category</span>
          <h2>Find Properties by <span>Category</span></h2>
          <p>Whether you are looking for a cozy apartment, family home, or commercial space, Luxora keeps the path clear.</p>
        </div>
        <div className="category-grid">
          {categories.map(([name, count, image]) => (
            <a className="image-tile category-tile" href="/listings" key={name}>
              <img src={image} alt={`${name} properties`} loading="lazy" />
              <div>
                <span className="tile-icon">{name.slice(0, 1)}</span>
                <h3>{name}</h3>
                <p>{count} listings</p>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  )
}
