import Icon from '../common/Icon'

const nav = {
  user: ['Overview', 'Saved Properties', 'Recently Viewed', 'Notifications', 'Saved Searches', 'Viewings', 'Profile Settings'],
  agent: ['Overview', 'Add Listing', 'My Listings', 'Messages', 'Appointments', 'Leads', 'Analytics'],
  admin: ['Overview', 'Users', 'Properties', 'Agents', 'Reports', 'Transactions', 'Settings'],
}

export default function DashboardSidebar({ variant }) {
  return (
    <aside className="dashboard-sidebar">
      <a className="brand" href="/"><span className="brand-mark"><Icon name="home" /></span><span>Luxora Homes</span></a>
      <nav>
        {nav[variant].map((item, index) => <a className={index === 0 ? 'is-active' : ''} href={`/dashboard/${variant}`} key={item}>{item}</a>)}
      </nav>
      <div className="dashboard-user">
        <span>{variant === 'admin' ? 'Admin' : variant === 'agent' ? 'Sarah Agent' : 'John Doe'}</span>
        <small>{variant}@luxora.demo</small>
        <a href="/auth/login">Sign Out</a>
      </div>
    </aside>
  )
}
