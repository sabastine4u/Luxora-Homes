import { useState } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import Icon from '../common/Icon'

const nav = {
  user: ['Overview', 'Saved Properties', 'Recently Viewed', 'Notifications', 'Saved Searches', 'Viewings', 'Profile Settings'],
  agent: ['Overview', 'Add Listing', 'My Listings', 'Messages', 'Appointments', 'Leads', 'Analytics'],
  admin: ['Overview', 'Users', 'Properties', 'Agents', 'Reports', 'Transactions', 'Settings'],
}

export default function DashboardSidebar({ variant }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [isOpen, setIsOpen] = useState(false)
  const route = location.pathname

  const handleLogout = () => {
    logout()
    navigate('/auth/login')
  }

  return (
    <>
      <button className="dashboard-mobile-toggle" onClick={() => setIsOpen(true)} type="button"><Icon name="menu" /> Menu</button>
      <aside className={`dashboard-sidebar ${isOpen ? 'is-open' : ''}`}>
        <button className="dashboard-close" onClick={() => setIsOpen(false)} type="button">Close</button>
        <Link className="brand" to="/"><span className="brand-mark"><Icon name="home" /></span><span>Luxora Homes</span></Link>
        <nav>
          {nav[variant].map((item, index) => {
            const slug = item === 'Overview' ? '' : `/${item.toLowerCase().replaceAll(' ', '-')}`
            const href = `/dashboard/${variant}${slug}`
            const isActive = index === 0 ? route === `/dashboard/${variant}` : route.includes(slug)
            return <NavLink className={isActive ? 'is-active' : ''} to={href} key={item}>{item}{['Messages', 'Notifications', 'Reports'].includes(item) && <span>3</span>}</NavLink>
          })}
        </nav>
        <div className="dashboard-user">
          <span>{user?.name || (variant === 'admin' ? 'Admin' : variant === 'agent' ? 'Sarah Agent' : 'John Doe')}</span>
          <small>{user?.email || `${variant}@luxora.demo`}</small>
          <button type="button" onClick={handleLogout}>Sign Out</button>
        </div>
      </aside>
      {isOpen && <button className="dashboard-overlay" onClick={() => setIsOpen(false)} type="button" aria-label="Close dashboard menu" />}
    </>
  )
}
