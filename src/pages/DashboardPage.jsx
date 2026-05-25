import DashboardSidebar from '../components/dashboard/DashboardSidebar'
import Icon from '../components/common/Icon'
import { listingProperties } from '../data/marketplace'

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

const notifications = ['Price drop alert on Ikoyi apartment', 'New listing matched Lekki apartments', 'Viewing scheduled for tomorrow']

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
  const data = content[variant]
  const extras = dashboardExtras[variant]

  return (
    <main className="dashboard-shell">
      <DashboardSidebar variant={variant} />
      <section className="dashboard-main">
        <div className="dashboard-header">
          <div>
            <h1>{data.title}</h1>
            <p>{data.subtitle}</p>
          </div>
          <a className="btn btn-primary" href="/listings">{variant === 'agent' ? 'Add New Listing' : 'Explore Properties'}</a>
        </div>
        <div className="dashboard-stats">
          {data.stats.map(([label, value, change]) => (
            <article className="dashboard-card" key={label}>
              <span className="dashboard-icon"><Icon name="star" /></span>
              <strong>{value}</strong>
              <p>{label}</p>
              <small>{change}</small>
            </article>
          ))}
        </div>
        <div className="dashboard-grid">
          <article className="dashboard-panel wide-panel">
            <div className="panel-heading"><h2>{variant === 'agent' ? 'My Listings' : variant === 'admin' ? 'Recent Users' : 'Saved Properties'}</h2><a href="/listings">View All</a></div>
            <div className="compact-list">
              {listingProperties.slice(0, 4).map((property) => (
                <a href={`/property/${property.id}`} className="compact-property" key={property.id}>
                  <img src={property.image} alt={property.title} />
                  <div><h3>{property.title}</h3><p>{property.location}</p></div>
                  <strong>{property.type === 'buy' ? 'Sale' : property.type === 'lease' ? 'Lease' : 'Rent'}</strong>
                </a>
              ))}
            </div>
          </article>
          <article className="dashboard-panel">
            <div className="panel-heading"><h2>{variant === 'admin' ? 'System Alerts' : 'Notifications'}</h2></div>
            <div className="notification-list">
              {notifications.map((item) => <div key={item}><span><Icon name="bell" /></span><p>{item}</p><small>2h ago</small></div>)}
            </div>
          </article>
        </div>
        <div className="dashboard-grid lower-grid">
          <article className="dashboard-panel">
            <div className="panel-heading"><h2>{extras.secondaryTitle}</h2><a href={`/dashboard/${variant}`}>Manage</a></div>
            <div className="task-list">
              {extras.secondary.map(([primary, secondary, meta]) => (
                <div key={`${primary}-${meta}`}>
                  <span><Icon name={variant === 'admin' ? 'check' : 'calendar'} /></span>
                  <div><h3>{primary}</h3><p>{secondary}</p></div>
                  <strong>{meta}</strong>
                </div>
              ))}
            </div>
          </article>
          <article className="dashboard-panel wide-panel">
            <div className="panel-heading"><h2>{extras.tableTitle}</h2><a href={`/dashboard/${variant}`}>Open</a></div>
            <div className="dashboard-table">
              {extras.tableRows.map(([name, detail, status]) => (
                <div key={name}>
                  <strong>{name}</strong>
                  <span>{detail}</span>
                  <em>{status}</em>
                </div>
              ))}
            </div>
          </article>
        </div>
      </section>
    </main>
  )
}
