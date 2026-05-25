import { useEffect, useState } from 'react'
import { navLinks } from '../../data/marketplace'
import Button from '../common/Button'
import Icon from '../common/Icon'

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 18)
    onScroll()
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header className={`site-header ${isScrolled ? 'is-scrolled' : ''}`}>
      <nav className="container nav-bar" aria-label="Primary navigation">
        <a className="brand" href="/" onClick={() => setIsOpen(false)}>
          <span className="brand-mark"><Icon name="home" /></span>
          <span>Luxora Homes</span>
        </a>

        <div className="nav-links">
          {navLinks.map((link) => (
            <a key={link.name} className="nav-link" href={link.href}>
              {link.name}
              {link.submenu && <span className="nav-caret">+</span>}
            </a>
          ))}
        </div>

        <div className="nav-actions">
          <a className="icon-button" aria-label="Search" href="/listings"><Icon name="search" /></a>
          <a className="icon-button has-badge" aria-label="Saved homes" href="/dashboard/user"><Icon name="heart" /></a>
          <a className="icon-button has-alert" aria-label="Notifications" href="/dashboard/user"><Icon name="bell" /></a>
          <Button variant="ghost" href="/auth/login">Sign In</Button>
          <Button href="/auth/register">Get Started</Button>
        </div>

        <button className="menu-button" aria-label="Toggle menu" onClick={() => setIsOpen((value) => !value)}>
          <Icon name={isOpen ? 'close' : 'menu'} />
        </button>
      </nav>

      {isOpen && (
        <div className="mobile-menu">
          {navLinks.map((link) => (
            <a key={link.name} href={link.href} onClick={() => setIsOpen(false)}>
              {link.name}
            </a>
          ))}
          <Button variant="outline" href="/auth/login">Sign In</Button>
          <Button href="/auth/register">Get Started</Button>
        </div>
      )}
    </header>
  )
}
