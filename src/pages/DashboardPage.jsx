import { Link, useLocation } from 'react-router-dom'
import { useState } from 'react'
import DashboardSidebar from '../components/dashboard/DashboardSidebar'
import Icon from '../components/common/Icon'
import { listingProperties } from '../data/marketplace'
import { useAuth } from '../context/AuthContext'
import { useFavoriteProperties } from '../hooks/useSocialHooks'
import { useUI } from '../context/UIContext'

const content = {
  user: {
    title: 'Welcome back, John',
    subtitle: 'Here is what is happening with your property search.',
    stats: [['Saved Properties', '12', '+2'], ['Recently Viewed', '28', '+5'], ['Saved Searches', '4', '0'], ['Upcoming Viewings', '2', '+1']],
  },
  agent: {
    title: 'Agent Dashboard',
    subtitle: 'Manage your listings and client interactions.',
    stats: [['Active Listings', '24', '+3'], ['Total Views', '12.4K', '+18%'], ['Inquiries', '156', '+24%'], ['Revenue', 'NGN 284M', '+12%']],
  },
  admin: {
    title: 'Admin Dashboard',
    subtitle: 'Monitor platform health, users, listings, and approvals.',
    stats: [['Total Users', '24.8K', '+12%'], ['Properties', '50.2K', '+8%'], ['Pending Agents', '36', '-4%'], ['Revenue', 'NGN 1.2B', '+18%']],
  },
}

const notifications = [
  { id: 'note-1', text: 'Price drop alert on Ikoyi apartment', time: '2h ago' },
  { id: 'note-2', text: 'New listing matched Lekki apartments', time: '4h ago' },
  { id: 'note-3', text: 'Viewing scheduled for tomorrow', time: '1d ago' },
]

const dashboardExtras = {
  user: {
    secondaryTitle: 'Upcoming Viewings',
    secondary: [['Luxury Penthouse with Ocean View', 'Tomorrow', '10:30 AM'], ['Modern 3BR Apartment in Ikoyi', 'Friday', '2:00 PM'], ['Beachfront Villa', 'Next Monday', '11:00 AM']],
    tableTitle: 'Saved Searches',
    tableRows: [['Lekki apartments', '12 new matches', 'Active'], ['Ikoyi under NGN 1M', '4 new matches', 'Active'], ['Victoria Island penthouse', '1 new match', 'Paused']],
  },
  agent: {
    secondaryTitle: 'Recent Inquiries',
    secondary: [['John Smith', 'Modern Downtown Penthouse', '2 hours ago'], ['Sarah Johnson', 'Beachfront Villa', '5 hours ago'], ['Michael Chen', 'Mountain Retreat', '1 day ago']],
    tableTitle: 'Upcoming Appointments',
    tableRows: [['Emily Davis', 'Property Tour', 'Today, 2:00 PM'], ['Robert Wilson', 'Video Call', 'Tomorrow, 10:30 AM'], ['Lisa Anderson', 'Property Tour', 'Mar 28, 3:00 PM']],
  },
  admin: {
    secondaryTitle: 'Agent Verification Queue',
    secondary: [['Amara Realty Group', 'License review', 'High priority'], ['Urban Nest Brokers', 'Identity check', 'Pending'], ['Prime Acre Ltd', 'Document mismatch', 'Needs review']],
    tableTitle: 'Platform Reports',
    tableRows: [['Suspicious listing', 'Victoria Island office space', 'Open'], ['Payment dispute', 'Banana Island villa', 'Investigating'], ['User support', 'Password reset issue', 'Resolved']],
  },
}

export default function DashboardPage({ variant = 'user' }) {
  const { user } = useAuth()
  const { notify } = useUI()
  const location = useLocation()
  const { favoriteProperties, recentProperties, viewings, messages } = useFavoriteProperties()
  const [dismissedNotifications, setDismissedNotifications] = useState([])
  const [rowStatuses, setRowStatuses] = useState({})
  const data = content[variant]
  const extras = dashboardExtras[variant]
  const activeSection = location.pathname.split('/').filter(Boolean)[2] || 'overview'
  const visibleNotifications = notifications.filter((item) => !dismissedNotifications.includes(item.id))
  const dashboardProperties = variant === 'user' ? (favoriteProperties.length ? favoriteProperties : listingProperties.slice(0, 4)) : listingProperties.slice(0, 4)
  const dynamicStats = variant === 'user'
    ? [['Saved Properties', favoriteProperties.length.toString(), '+live'], ['Recently Viewed', recentProperties.length.toString(), '+live'], ['Messages', messages.length.toString(), '+live'], ['Upcoming Viewings', viewings.length.toString(), '+live']]
    : data.stats
  const sectionTitle = activeSection.replaceAll('-', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())
  const sectionRows = (() => {
    if (variant === 'user') {
      if (activeSection === 'saved-properties') return favoriteProperties.map((property) => [property.title, property.location, property.availabilityStatus])
      if (activeSection === 'recently-viewed') return recentProperties.map((property) => [property.title, property.location, property.category])
      if (activeSection === 'viewings') return viewings.map((viewing) => [viewing.propertyTitle, viewing.date, viewing.status])
      if (activeSection === 'notifications') return visibleNotifications.map((item) => [item.text, item.time, 'Unread'])
    }
    if (variant === 'agent') {
      if (activeSection === 'my-listings') return listingProperties.filter((property) => property.agent.name === (user?.name || 'Sarah Agent')).map((property) => [property.title, property.location, property.availabilityStatus])
      if (activeSection === 'messages' || activeSection === 'leads') return messages.length ? messages.map((message) => [message.name, message.propertyId, message.status]) : extras.secondary
      if (activeSection === 'analytics') return [['Listing views', '12.4K this month', '+18%'], ['Saved properties', '842 total saves', '+9%'], ['Qualified leads', '156 inquiries', '+24%']]
    }
    if (variant === 'admin') {
      if (activeSection === 'users') return [['John Doe', 'Buyer account', 'Active'], ['Sarah Agent', 'Agent account', 'Verified'], ['Admin', 'Platform admin', 'Active']]
      if (activeSection === 'properties') return listingProperties.slice(0, 8).map((property) => [property.title, property.category, property.availabilityStatus])
      if (activeSection === 'agents') return extras.secondary
      if (activeSection === 'reports') return extras.tableRows
      if (activeSection === 'transactions') return [['Inspection payment', 'NGN 25,000', 'Completed'], ['Lease deposit', 'NGN 850,000', 'Escrow'], ['Agent subscription', 'NGN 75,000', 'Paid']]
    }
    return extras.tableRows
  })()

  const handleRowAction = (row) => {
    const key = row.join('-')
    const nextStatus = rowStatuses[key] === 'Reviewed' ? row[2] : 'Reviewed'
    setRowStatuses((items) => ({ ...items, [key]: nextStatus }))
    notify(nextStatus === 'Reviewed' ? 'Item marked as reviewed.' : 'Item restored.')
  }

  const dismissNotification = (id) => {
    setDismissedNotifications((items) => [...items, id])
    notify('Notification dismissed.')
  }

  return (
    <main className="dashboard-shell">
      <DashboardSidebar variant={variant} />
      <section className="dashboard-main">
        <div className="dashboard-header">
          <div>
            <h1>{variant === 'user' && user?.name ? `Welcome back, ${user.name.split(' ')[0]}` : data.title}</h1>
            <p>{user?.name ? `Signed in as ${user.name}. ${data.subtitle}` : data.subtitle}</p>
          </div>
          <Link className="btn btn-primary" to="/listings">{variant === 'agent' ? 'Add New Listing' : 'Explore Properties'}</Link>
        </div>
        <div className="dashboard-stats">
          {dynamicStats.map(([label, value, change]) => (
            <article className="dashboard-card" key={label}>
              <span className="dashboard-icon"><Icon name="star" /></span>
              <strong>{value}</strong>
              <p>{label}</p>
              <small>{change}</small>
            </article>
          ))}
        </div>
        {activeSection !== 'overview' && (
          <div className="dashboard-grid">
            <article className="dashboard-panel wide-panel">
              <div className="panel-heading"><h2>{sectionTitle}</h2><Link to={`/dashboard/${variant}`}>Overview</Link></div>
              {sectionRows.length ? (
                <div className="dashboard-table">
                  {sectionRows.map((row) => {
                    const key = row.join('-')
                    return (
                      <button className="dashboard-table-row" onClick={() => handleRowAction(row)} type="button" key={key}>
                        <strong>{row[0]}</strong>
                        <span>{row[1]}</span>
                        <em>{rowStatuses[key] || row[2]}</em>
                      </button>
                    )
                  })}
                </div>
              ) : (
                <div className="empty-state">
                  <h2>No {sectionTitle.toLowerCase()} yet</h2>
                  <p>New activity will appear here as you use the marketplace.</p>
                </div>
              )}
            </article>
            <article className="dashboard-panel">
              <div className="panel-heading"><h2>Quick Actions</h2></div>
              <div className="task-list">
                <div><span><Icon name="search" /></span><div><h3>Browse Listings</h3><p>Find matching properties</p></div><Link to="/listings">Open</Link></div>
                <div><span><Icon name="bell" /></span><div><h3>Notifications</h3><p>{visibleNotifications.length} unread</p></div><Link to={`/dashboard/${variant}/notifications`}>View</Link></div>
              </div>
            </article>
          </div>
        )}
        <div className="dashboard-grid">
          <article className="dashboard-panel wide-panel">
            <div className="panel-heading"><h2>{variant === 'agent' ? 'My Listings' : variant === 'admin' ? 'Recent Users' : 'Saved Properties'}</h2><Link to="/listings">View All</Link></div>
            <div className="compact-list">
              {dashboardProperties.map((property) => (
                <Link to={`/property/${property.id}`} className="compact-property" key={property.id}>
                  <img src={property.image} alt={property.title} />
                  <div><h3>{property.title}</h3><p>{property.location}</p></div>
                  <strong>{property.type === 'buy' ? 'Sale' : property.type === 'lease' ? 'Lease' : 'Rent'}</strong>
                </Link>
              ))}
            </div>
          </article>
          <article className="dashboard-panel">
            <div className="panel-heading"><h2>{variant === 'admin' ? 'System Alerts' : 'Notifications'}</h2></div>
            <div className="notification-list">
              {visibleNotifications.length ? visibleNotifications.map((item) => (
                <button type="button" onClick={() => dismissNotification(item.id)} key={item.id}>
                  <span><Icon name="bell" /></span><p>{item.text}</p><small>{item.time} · dismiss</small>
                </button>
              )) : (
                <div><span><Icon name="check" /></span><p>All caught up</p><small>No unread notifications</small></div>
              )}
            </div>
          </article>
        </div>
        <div className="dashboard-grid lower-grid">
          <article className="dashboard-panel">
            <div className="panel-heading"><h2>{extras.secondaryTitle}</h2><Link to={`/dashboard/${variant}`}>Manage</Link></div>
            <div className="task-list">
              {(variant === 'user' && viewings.length ? viewings.map((viewing) => [viewing.propertyTitle, viewing.date, viewing.time]) : extras.secondary).map(([primary, secondary, meta]) => (
                <div key={`${primary}-${meta}`}>
                  <span><Icon name={variant === 'admin' ? 'check' : 'calendar'} /></span>
                  <div><h3>{primary}</h3><p>{secondary}</p></div>
                  <strong>{meta}</strong>
                </div>
              ))}
            </div>
          </article>
          <article className="dashboard-panel wide-panel">
            <div className="panel-heading"><h2>{extras.tableTitle}</h2><Link to={`/dashboard/${variant}`}>Open</Link></div>
            <div className="dashboard-table">
              {extras.tableRows.map(([name, detail, status]) => (
                <button type="button" onClick={() => handleRowAction([name, detail, status])} key={name}>
                  <strong>{name}</strong>
                  <span>{detail}</span>
                  <em>{rowStatuses[[name, detail, status].join('-')] || status}</em>
                </button>
              ))}
            </div>
          </article>
        </div>
      </section>
    </main>
  )
}
