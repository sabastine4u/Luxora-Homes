import { useEffect, useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { navLinks } from '../../data/marketplace'
import { useAuth } from '../../context/AuthContext'
import { useFavoriteProperties } from '../../hooks/useSocialHooks'
import Button from '../common/Button'
import Icon from '../common/Icon'

export default function Navbar() {
  const { isAuthenticated, user, logout } = useAuth()
  const { favoriteIds } = useFavoriteProperties()
  const [isScrolled, setIsScrolled] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [activeDropdown, setActiveDropdown] = useState(null)

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 18)
    onScroll()
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header className={`site-header ${isScrolled ? 'is-scrolled' : ''}`}>
      <nav className="container nav-bar" aria-label="Primary navigation">
        <Link className="brand" to="/" onClick={() => setIsOpen(false)}>
          <span className="brand-mark"><Icon name="home" /></span>
          <span>Luxora Homes</span>
        </Link>

        <div className="nav-links">
          {navLinks.map((link) => (
            <div className="nav-item" key={link.name}>
              {link.submenu ? (
                <button
                  className="nav-link nav-link-button"
                  type="button"
                  aria-expanded={activeDropdown === link.name}
                  onClick={() => setActiveDropdown((value) => (value === link.name ? null : link.name))}
                >
                  {link.name}
                  <span className="nav-caret">+</span>
                </button>
              ) : (
                <NavLink className="nav-link" to={link.href}>{link.name}</NavLink>
              )}
              {link.submenu && (
                <div className={`nav-dropdown ${activeDropdown === link.name ? 'is-open' : ''}`}>
                  {link.submenu.map((item) => (
                    <Link to={`/listings?type=${link.name.toLowerCase()}&category=${item.toLowerCase().replaceAll(' ', '-')}`} key={item} onClick={() => setActiveDropdown(null)}>
                      <span className="dropdown-icon"><Icon name={item === 'Land' ? 'pin' : 'home'} /></span>
                      <span>{item}</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="nav-actions">
          <Link className="icon-button" aria-label="Search" to="/listings"><Icon name="search" /></Link>
          <Link className={`icon-button ${favoriteIds.length ? 'has-badge' : ''}`} aria-label="Saved homes" to="/dashboard/user"><Icon name="heart" /></Link>
          <Link className="icon-button has-alert" aria-label="Notifications" to="/dashboard/user/notifications"><Icon name="bell" /></Link>
          {isAuthenticated ? (
            <>
              <Button variant="ghost" href={`/dashboard/${user.role === 'admin' ? 'admin' : user.role === 'agent' ? 'agent' : 'user'}`}>{user.name.split(' ')[0]}</Button>
              <button className="btn btn-outline" type="button" onClick={logout}>Sign Out</button>
            </>
          ) : (
            <>
              <Button variant="ghost" href="/auth/login">Sign In</Button>
              <Button href="/auth/register">Get Started</Button>
            </>
          )}
        </div>

        <button className="menu-button" aria-label="Toggle menu" onClick={() => setIsOpen((value) => !value)}>
          <Icon name={isOpen ? 'close' : 'menu'} />
        </button>
      </nav>

      {isOpen && (
        <div className="mobile-menu">
          {navLinks.map((link) => (
            <div className="mobile-menu-group" key={link.name}>
              <Link to={link.href} onClick={() => setIsOpen(false)}>
                {link.name}
              </Link>
              {link.submenu && (
                <div className="mobile-submenu">
                  {link.submenu.map((item) => (
                    <Link to={`/listings?type=${link.name.toLowerCase()}&category=${item.toLowerCase().replaceAll(' ', '-')}`} key={item} onClick={() => setIsOpen(false)}>
                      {item}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
          {isAuthenticated ? (
            <Button href={`/dashboard/${user.role}`} onClick={() => setIsOpen(false)}>Dashboard</Button>
          ) : (
            <>
              <Button variant="outline" href="/auth/login">Sign In</Button>
              <Button href="/auth/register">Get Started</Button>
            </>
          )}
        </div>
      )}
    </header>
  )
}
