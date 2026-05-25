import Icon from '../common/Icon'

const footerGroups = [
  ['Marketplace', ['Buy property', 'Rent property', 'New developments', 'Verified agents']],
  ['Company', ['About Luxora', 'Careers', 'Press', 'Contact']],
  ['Support', ['Help center', 'Safety guide', 'Fraud protection', 'Terms of service']],
]

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="container footer-grid">
        <div className="footer-brand">
          <a className="brand" href="/">
            <span className="brand-mark"><Icon name="home" /></span>
            <span>Luxora Homes</span>
          </a>
          <p>
            A polished marketplace for premium homes, trusted agents, and safer property decisions across Nigeria.
          </p>
          <div className="footer-socials">
            <a href="/agents">In</a>
            <a href="/listings">Fb</a>
            <a href="/dashboard/user">X</a>
          </div>
        </div>

        {footerGroups.map(([title, links]) => (
          <div className="footer-group" key={title}>
            <h3>{title}</h3>
            {links.map((link) => (
              <a href={link.includes('Agent') || link.includes('agent') ? '/agents' : link.includes('Buy') || link.includes('Rent') || link.includes('development') ? '/listings' : '/auth/register'} key={link}>{link}</a>
            ))}
          </div>
        ))}
      </div>
      <div className="container footer-bottom">
        <span>2026 Luxora Homes. All rights reserved.</span>
        <span>Designed for verified property discovery.</span>
      </div>
    </footer>
  )
}
