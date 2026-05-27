import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import DashboardSidebar from '../components/dashboard/DashboardSidebar'
import Icon from '../components/common/Icon'
import { useAuth } from '../context/AuthContext'
import { useListings } from '../context/ListingContext'
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

const leadStatuses = ['New', 'Contacted', 'Viewing Scheduled', 'Negotiating', 'Closed', 'Lost']

const initialListingForm = (listing) => ({
  title: listing?.title || '',
  category: listing?.category || 'Apartment',
  type: listing?.type || 'rent',
  price: listing?.price || '',
  location: listing?.location || '',
  beds: listing?.beds ?? '',
  baths: listing?.baths ?? '',
  sqft: listing?.sqft || '',
  description: listing?.description || '',
  amenities: listing?.amenities?.join(', ') || '',
  status: listing?.status || 'Active',
  image: listing?.image || '',
})

const initialProfileForm = (user) => ({
  name: user?.name || '',
  image: user?.image || '',
  phone: user?.phone || '',
  bio: user?.bio || '',
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
  contactPreferences: {
    email: user?.contactPreferences?.email ?? true,
    phone: user?.contactPreferences?.phone ?? true,
    sms: user?.contactPreferences?.sms ?? false,
  },
})

const initialNotificationForm = (user) => ({
  emailNotifications: user?.notificationSettings?.emailNotifications ?? true,
  inquiryAlerts: user?.notificationSettings?.inquiryAlerts ?? true,
  listingAlerts: user?.notificationSettings?.listingAlerts ?? true,
  marketingPreferences: user?.notificationSettings?.marketingPreferences ?? false,
})

function ListingForm({ listing, onSubmit }) {
  const [form, setForm] = useState(() => initialListingForm(listing))
  const [errors, setErrors] = useState({})

  const updateForm = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }))
    setErrors((current) => ({ ...current, [field]: '' }))
  }

  const handleImageUpload = (event) => {
    const file = event.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => updateForm('image', reader.result)
    reader.readAsDataURL(file)
  }

  const validate = () => {
    const requiredFields = ['title', 'category', 'type', 'price', 'location', 'beds', 'baths', 'sqft', 'description', 'status']
    const nextErrors = requiredFields.reduce((items, field) => {
      if (!form[field] && form[field] !== 0) return { ...items, [field]: 'Required' }
      return items
    }, {})

    if (Number(form.price) <= 0) nextErrors.price = 'Enter a valid price'
    if (Number(form.beds) < 0) nextErrors.beds = 'Enter bedrooms'
    if (Number(form.baths) < 0) nextErrors.baths = 'Enter bathrooms'
    if (Number(form.sqft) <= 0) nextErrors.sqft = 'Enter property size'
    if (!form.image) nextErrors.image = 'Upload an image'
    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    if (!validate()) return
    onSubmit({
      ...form,
      amenities: form.amenities.split(',').map((item) => item.trim()).filter(Boolean),
    })
  }

  return (
    <form className="auth-form two-col-form" onSubmit={handleSubmit}>
      <label>Property Title<input value={form.title} onChange={(event) => updateForm('title', event.target.value)} placeholder="Property title" required />{errors.title && <small className="form-error">{errors.title}</small>}</label>
      <label>Property Type<select value={form.category} onChange={(event) => updateForm('category', event.target.value)} required><option>Apartment</option><option>Duplex</option><option>Family Home</option><option>Villa</option><option>Penthouse</option><option>Studio Apartment</option><option>Mini Flat</option><option>Self-contained</option><option>Commercial</option><option>Warehouse</option><option>Land</option></select></label>
      <label>Listing Type<select value={form.type} onChange={(event) => updateForm('type', event.target.value)} required><option value="buy">Buy</option><option value="rent">Rent</option><option value="lease">Lease</option></select></label>
      <label>Price<input type="number" min="1" value={form.price} onChange={(event) => updateForm('price', event.target.value)} placeholder="Price" required />{errors.price && <small className="form-error">{errors.price}</small>}</label>
      <label>Location<input value={form.location} onChange={(event) => updateForm('location', event.target.value)} placeholder="Location" required />{errors.location && <small className="form-error">{errors.location}</small>}</label>
      <label>Bedrooms<input type="number" min="0" value={form.beds} onChange={(event) => updateForm('beds', event.target.value)} placeholder="Bedrooms" required />{errors.beds && <small className="form-error">{errors.beds}</small>}</label>
      <label>Bathrooms<input type="number" min="0" value={form.baths} onChange={(event) => updateForm('baths', event.target.value)} placeholder="Bathrooms" required />{errors.baths && <small className="form-error">{errors.baths}</small>}</label>
      <label>Property Size<input type="number" min="1" value={form.sqft} onChange={(event) => updateForm('sqft', event.target.value)} placeholder="Square feet" required />{errors.sqft && <small className="form-error">{errors.sqft}</small>}</label>
      <label className="full-field">Description<textarea rows="4" value={form.description} onChange={(event) => updateForm('description', event.target.value)} placeholder="Describe the property" required />{errors.description && <small className="form-error">{errors.description}</small>}</label>
      <label>Amenities<input value={form.amenities} onChange={(event) => updateForm('amenities', event.target.value)} placeholder="Pool, Parking, Security" /></label>
      <label>Status<select value={form.status} onChange={(event) => updateForm('status', event.target.value)} required><option>Active</option><option>Pending</option><option>Sold</option><option>Rented</option></select></label>
      <label className="full-field">Image Upload<input type="file" accept="image/*" onChange={handleImageUpload} />{errors.image && <small className="form-error">{errors.image}</small>}</label>
      {form.image && <div className="full-field compact-property"><img src={form.image} alt="Listing preview" /><div><h3>{form.title || 'Image preview'}</h3><p>{form.location || 'Uploaded property image'}</p></div><strong>{form.status}</strong></div>}
      <button className="btn btn-primary full-field" type="submit">{listing ? 'Update Listing' : 'Create Listing'}</button>
    </form>
  )
}

function ProfileSettingsForm({ user, onSaveProfile, onSavePassword }) {
  const [form, setForm] = useState(() => initialProfileForm(user))
  const [errors, setErrors] = useState({})
  const [isSaving, setIsSaving] = useState(false)

  const updateForm = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }))
    setErrors((current) => ({ ...current, [field]: '' }))
  }

  const updateContactPreference = (field, checked) => {
    setForm((current) => ({
      ...current,
      contactPreferences: { ...current.contactPreferences, [field]: checked },
    }))
    setErrors((current) => ({ ...current, contactPreferences: '' }))
  }

  const handleImageUpload = (event) => {
    const file = event.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => updateForm('image', reader.result)
    reader.readAsDataURL(file)
  }

  const validate = () => {
    const nextErrors = {}
    if (form.name.trim().length < 2) nextErrors.name = 'Enter your full name'
    if (form.phone.trim().length < 7) nextErrors.phone = 'Enter a valid phone number'
    if (form.bio.length > 500) nextErrors.bio = 'Bio must be 500 characters or less'
    if (!Object.values(form.contactPreferences).some(Boolean)) nextErrors.contactPreferences = 'Choose at least one contact preference'
    if (form.newPassword || form.confirmPassword || form.currentPassword) {
      if (!form.currentPassword) nextErrors.currentPassword = 'Enter current password'
      if (form.newPassword.length < 8) nextErrors.newPassword = 'Use at least 8 characters'
      if (form.newPassword !== form.confirmPassword) nextErrors.confirmPassword = 'Passwords do not match'
    }
    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!validate()) return
    setIsSaving(true)
    try {
      await onSaveProfile({
        name: form.name.trim(),
        image: form.image,
        phone: form.phone.trim(),
        bio: form.bio.trim(),
        contactPreferences: form.contactPreferences,
      })
      if (form.newPassword) {
        await onSavePassword({
          currentPassword: form.currentPassword,
          newPassword: form.newPassword,
        })
        setForm((current) => ({ ...current, currentPassword: '', newPassword: '', confirmPassword: '' }))
      }
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <form className="auth-form two-col-form" onSubmit={handleSubmit}>
      <label>Name<input value={form.name} onChange={(event) => updateForm('name', event.target.value)} placeholder="Your name" required />{errors.name && <small className="form-error">{errors.name}</small>}</label>
      <label>Phone Number<input value={form.phone} onChange={(event) => updateForm('phone', event.target.value)} placeholder="+234 ..." required />{errors.phone && <small className="form-error">{errors.phone}</small>}</label>
      <label className="full-field">Profile Image<input type="file" accept="image/*" onChange={handleImageUpload} /></label>
      {form.image && <div className="full-field compact-property"><img src={form.image} alt="Profile preview" /><div><h3>{form.name || 'Profile image'}</h3><p>{form.phone || 'Uploaded profile image'}</p></div><strong>Preview</strong></div>}
      <label className="full-field">Bio<textarea rows="4" value={form.bio} onChange={(event) => updateForm('bio', event.target.value)} placeholder="Tell clients or agents a little about you" />{errors.bio && <small className="form-error">{errors.bio}</small>}</label>
      <label>Current Password<input type="password" value={form.currentPassword} onChange={(event) => updateForm('currentPassword', event.target.value)} placeholder="Current password" />{errors.currentPassword && <small className="form-error">{errors.currentPassword}</small>}</label>
      <label>New Password<input type="password" value={form.newPassword} onChange={(event) => updateForm('newPassword', event.target.value)} placeholder="New password" />{errors.newPassword && <small className="form-error">{errors.newPassword}</small>}</label>
      <label>Confirm Password<input type="password" value={form.confirmPassword} onChange={(event) => updateForm('confirmPassword', event.target.value)} placeholder="Confirm password" />{errors.confirmPassword && <small className="form-error">{errors.confirmPassword}</small>}</label>
      <label className="check-label"><input type="checkbox" checked={form.contactPreferences.email} onChange={(event) => updateContactPreference('email', event.target.checked)} /> Email contact</label>
      <label className="check-label"><input type="checkbox" checked={form.contactPreferences.phone} onChange={(event) => updateContactPreference('phone', event.target.checked)} /> Phone calls</label>
      <label className="check-label"><input type="checkbox" checked={form.contactPreferences.sms} onChange={(event) => updateContactPreference('sms', event.target.checked)} /> SMS updates</label>
      {errors.contactPreferences && <small className="form-error full-field">{errors.contactPreferences}</small>}
      <button className="btn btn-primary full-field" type="submit" disabled={isSaving}>{isSaving ? 'Saving...' : 'Save Profile Settings'}</button>
    </form>
  )
}

function NotificationSettingsForm({ user, onSave }) {
  const [form, setForm] = useState(() => initialNotificationForm(user))
  const [error, setError] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  const updateForm = (field, checked) => {
    setForm((current) => ({ ...current, [field]: checked }))
    setError('')
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!form.emailNotifications && !form.inquiryAlerts && !form.listingAlerts) {
      setError('Keep at least one core notification enabled')
      return
    }
    setIsSaving(true)
    try {
      await onSave({ notificationSettings: form })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <form className="auth-form" onSubmit={handleSubmit}>
      <label className="check-label"><input type="checkbox" checked={form.emailNotifications} onChange={(event) => updateForm('emailNotifications', event.target.checked)} /> Email notifications</label>
      <label className="check-label"><input type="checkbox" checked={form.inquiryAlerts} onChange={(event) => updateForm('inquiryAlerts', event.target.checked)} /> Inquiry alerts</label>
      <label className="check-label"><input type="checkbox" checked={form.listingAlerts} onChange={(event) => updateForm('listingAlerts', event.target.checked)} /> Listing alerts</label>
      <label className="check-label"><input type="checkbox" checked={form.marketingPreferences} onChange={(event) => updateForm('marketingPreferences', event.target.checked)} /> Marketing preferences</label>
      {error && <small className="form-error">{error}</small>}
      <button className="btn btn-primary" type="submit" disabled={isSaving}>{isSaving ? 'Saving...' : 'Save Notification Settings'}</button>
    </form>
  )
}

export default function DashboardPage({ variant = 'user' }) {
  const { user, updateUser, updatePassword } = useAuth()
  const navigate = useNavigate()
  const { allListings, managedListings, reports, createListing, updateListing, updateListingModeration, removeListing, updateReportStatus, getListing } = useListings()
  const { notify } = useUI()
  const location = useLocation()
  const { favoriteProperties, recentProperties, viewings, messages, markMessageRead, updateMessageStatus, addMessageReply } = useFavoriteProperties()
  const [dismissedNotifications, setDismissedNotifications] = useState([])
  const [rowStatuses, setRowStatuses] = useState({})
  const [selectedInquiry, setSelectedInquiry] = useState(null)
  const [moderationTarget, setModerationTarget] = useState(null)
  const [replyForm, setReplyForm] = useState({ status: 'Contacted', message: '' })
  const data = content[variant]
  const extras = dashboardExtras[variant]
  const pathParts = location.pathname.split('/').filter(Boolean)
  const activeSection = pathParts[2] || 'overview'
  const isProfileSettings = activeSection === 'profile-settings'
  const isNotificationSettings = activeSection === 'notification-settings' || activeSection === 'settings'
  const isSettingsSection = isProfileSettings || isNotificationSettings
  const editingListingId = activeSection === 'edit-listing' ? pathParts[3] : ''
  const editingListing = editingListingId ? getListing(editingListingId) : null
  const relevantMessages = variant === 'agent'
    ? messages.filter((message) => user?.role === 'agent' || message.agent === user?.name || message.owner === user?.name)
    : messages
  const unreadInquiryCount = relevantMessages.filter((message) => !message.isRead).length
  const inquiryNotifications = relevantMessages.filter((message) => !message.isRead).map((message) => ({
    id: message.id,
    text: `New inquiry for ${message.propertyTitle || message.propertyId}`,
    time: new Date(message.timestamp || message.createdAt).toLocaleDateString(),
  }))
  const visibleNotifications = [...inquiryNotifications, ...notifications].filter((item) => !dismissedNotifications.includes(item.id))
  const agentListings = managedListings.filter((property) => property.agent.name === (user?.name || 'Sarah Agent'))
  const dashboardProperties = variant === 'user'
    ? (favoriteProperties.length ? favoriteProperties : allListings.slice(0, 4))
    : variant === 'agent'
      ? (agentListings.length ? agentListings : allListings.slice(0, 4))
      : allListings.slice(0, 4)
  const dynamicStats = variant === 'user'
    ? [['Saved Properties', favoriteProperties.length.toString(), '+live'], ['Recently Viewed', recentProperties.length.toString(), '+live'], ['Messages', messages.length.toString(), '+live'], ['Upcoming Viewings', viewings.length.toString(), '+live']]
    : variant === 'agent'
      ? [['Active Listings', agentListings.filter((property) => property.status === 'Active').length.toString(), '+live'], ['Total Listings', agentListings.length.toString(), '+live'], ['Inquiries', relevantMessages.length.toString(), unreadInquiryCount ? `${unreadInquiryCount} new` : '+live'], ['Revenue', 'NGN 284M', '+12%']]
      : data.stats
  const sectionTitle = activeSection.replaceAll('-', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())
  const sectionRows = (() => {
    if (variant === 'user') {
      if (activeSection === 'saved-properties') return favoriteProperties.map((property) => [property.title, property.location, property.availabilityStatus])
      if (activeSection === 'recently-viewed') return recentProperties.map((property) => [property.title, property.location, property.category])
      if (activeSection === 'viewings') return viewings.map((viewing) => [viewing.propertyTitle, viewing.date, viewing.status])
      if (activeSection === 'notifications') return visibleNotifications.map((item) => [item.text, item.time, 'Unread', item.id])
    }
    if (variant === 'agent') {
      if (activeSection === 'my-listings') return agentListings.map((property) => [property.title, property.location, property.status, property.id])
      if (activeSection === 'messages' || activeSection === 'leads') return relevantMessages.length ? relevantMessages.map((message) => [message.seekerName || message.name, message.propertyReference || message.propertyTitle || message.propertyId, message.status, message.id]) : extras.secondary
      if (activeSection === 'analytics') return [['Listing views', '12.4K this month', '+18%'], ['Saved properties', '842 total saves', '+9%'], ['Qualified leads', '156 inquiries', '+24%']]
    }
    if (variant === 'admin') {
      if (activeSection === 'users') return [['John Doe', 'Buyer account', 'Active'], ['Sarah Agent', 'Agent account', 'Verified'], ['Admin', 'Platform admin', 'Active']]
      if (activeSection === 'properties') return allListings.slice(0, 8).map((property) => [property.title, property.category, property.moderationStatus || property.status || property.availabilityStatus, property.id])
      if (activeSection === 'agents') return extras.secondary
      if (activeSection === 'reports') return reports.length
        ? reports.map((report) => [report.listingTitle, report.reason, report.status, report.listingId, report.id])
        : extras.tableRows
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
    if (messages.some((message) => message.id === id)) markMessageRead(id)
    notify('Notification dismissed.')
  }

  const openInquiry = (id) => {
    const inquiry = messages.find((message) => message.id === id)
    if (!inquiry) return
    markMessageRead(id)
    setSelectedInquiry(inquiry)
    setReplyForm({ status: leadStatuses.includes(inquiry.status) ? inquiry.status : 'New', message: '' })
  }

  const openModeration = (row) => {
    const report = reports.find((item) => item.id === row[4])
    const listing = allListings.find((item) => item.id === row[3]) || (report ? {
      id: row[3],
      title: report.listingTitle,
      status: 'Removed',
      moderationStatus: 'Removed',
      availabilityStatus: 'Removed',
    } : null)
    if (!listing) return
    setModerationTarget({
      listing,
      report,
      reportId: row[4],
      reportStatus: row[2],
      source: activeSection,
    })
  }

  const applyModerationAction = (status) => {
    if (!moderationTarget) return
    if (status === 'Removed') {
      removeListing(moderationTarget.listing.id)
    } else if (!['Report Reviewed', 'Report Dismissed'].includes(status)) {
      updateListingModeration(moderationTarget.listing.id, status)
    }
    if (moderationTarget.reportId) {
      const reportStatus = status === 'Report Dismissed' ? 'Dismissed' : status === 'Report Reviewed' ? 'Reviewed' : 'Resolved'
      updateReportStatus(moderationTarget.reportId, reportStatus)
    }
    setModerationTarget(null)
    notify(status.startsWith('Report') ? `${status}.` : `Listing ${status.toLowerCase()}.`)
  }

  const handleQuickReply = (event) => {
    event.preventDefault()
    if (!selectedInquiry) return
    updateMessageStatus(selectedInquiry.id, replyForm.status)
    if (replyForm.message.trim()) {
      addMessageReply(selectedInquiry.id, {
        message: replyForm.message.trim(),
        status: replyForm.status,
        sender: user?.name || 'Luxora Agent',
      })
    }
    setSelectedInquiry(null)
    notify('Inquiry updated.')
  }

  const handleListingSubmit = (payload) => {
    const agent = {
      name: user?.name || 'Sarah Agent',
      image: user?.image || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=70',
    }

    if (editingListing) {
      const updated = updateListing(editingListing.id, { ...payload, agent })
      notify('Listing updated.')
      navigate(`/property/${updated.id}`)
      return
    }

    const created = createListing({ ...payload, agent })
    notify('Listing created.')
    navigate(`/property/${created.id}`)
  }

  const handleProfileSettingsSave = async (payload) => {
    await updateUser(payload)
    notify('Profile settings saved.')
  }

  const handlePasswordSave = async (payload) => {
    try {
      await updatePassword(payload)
      notify('Password updated.')
    } catch (error) {
      notify(error.message, 'error')
      throw error
    }
  }

  const handleNotificationSettingsSave = async (payload) => {
    await updateUser(payload)
    notify('Notification settings saved.')
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
          <Link className="btn btn-primary" to={variant === 'agent' ? '/dashboard/agent/add-listing' : '/listings'}>{variant === 'agent' ? 'Add New Listing' : 'Explore Properties'}</Link>
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
        {variant === 'agent' && (activeSection === 'add-listing' || activeSection === 'edit-listing') && (
          <div className="dashboard-grid">
            <article className="dashboard-panel wide-panel">
              <div className="panel-heading"><h2>{editingListing ? 'Edit Listing' : 'Add Listing'}</h2><Link to="/dashboard/agent/my-listings">My Listings</Link></div>
              {activeSection === 'edit-listing' && !editingListing ? (
                <div className="empty-state">
                  <h2>Listing not found</h2>
                  <p>Choose a listing from your dashboard to edit it.</p>
                </div>
              ) : (
                <ListingForm listing={editingListing} onSubmit={handleListingSubmit} />
              )}
            </article>
            <article className="dashboard-panel">
              <div className="panel-heading"><h2>Quick Actions</h2></div>
              <div className="task-list">
                <div><span><Icon name="home" /></span><div><h3>My Listings</h3><p>{agentListings.length} managed</p></div><Link to="/dashboard/agent/my-listings">Open</Link></div>
                <div><span><Icon name="eye" /></span><div><h3>Marketplace</h3><p>Review live listings</p></div><Link to="/listings">View</Link></div>
              </div>
            </article>
          </div>
        )}
        {isSettingsSection && (
          <div className="dashboard-grid">
            <article className="dashboard-panel wide-panel">
              <div className="panel-heading"><h2>{isProfileSettings ? 'Profile Settings' : 'Notification Settings'}</h2><Link to={`/dashboard/${variant}`}>Overview</Link></div>
              {isProfileSettings ? (
                <ProfileSettingsForm user={user} onSaveProfile={handleProfileSettingsSave} onSavePassword={handlePasswordSave} />
              ) : (
                <NotificationSettingsForm user={user} onSave={handleNotificationSettingsSave} />
              )}
            </article>
            <article className="dashboard-panel">
              <div className="panel-heading"><h2>Quick Actions</h2></div>
              <div className="task-list">
                <div><span><Icon name="bell" /></span><div><h3>Notifications</h3><p>{visibleNotifications.length} unread</p></div><Link to={`/dashboard/${variant}/notifications`}>View</Link></div>
                <div><span><Icon name="check" /></span><div><h3>{isProfileSettings ? 'Notification Settings' : 'Profile Settings'}</h3><p>Manage account preferences</p></div><Link to={`/dashboard/${variant}/${isProfileSettings ? 'notification-settings' : 'profile-settings'}`}>Open</Link></div>
              </div>
            </article>
          </div>
        )}
        {!(isSettingsSection || (variant === 'agent' && (activeSection === 'add-listing' || activeSection === 'edit-listing'))) && (
          <>
        {activeSection !== 'overview' && (
          <div className="dashboard-grid">
            <article className="dashboard-panel wide-panel">
              <div className="panel-heading"><h2>{sectionTitle}</h2><Link to={`/dashboard/${variant}`}>Overview</Link></div>
              {sectionRows.length ? (
                <div className="dashboard-table">
                  {sectionRows.map((row) => {
                    const key = row.join('-')
                    const isListingRow = variant === 'agent' && activeSection === 'my-listings' && row[3]
                    const isInquiryRow = variant === 'agent' && ['messages', 'leads'].includes(activeSection) && row[3]
                    const isModerationRow = variant === 'admin' && ['properties', 'reports'].includes(activeSection) && row[3]
                    return (
                      <button className="dashboard-table-row" onClick={() => isListingRow ? navigate(`/dashboard/agent/edit-listing/${row[3]}`) : isInquiryRow ? openInquiry(row[3]) : isModerationRow ? openModeration(row) : handleRowAction(row)} type="button" key={key}>
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
              {(variant === 'user' && viewings.length
                ? viewings.map((viewing) => [viewing.propertyTitle, viewing.date, viewing.time])
                : variant === 'agent' && relevantMessages.length
                  ? relevantMessages.slice(0, 3).map((message) => [message.seekerName || message.name, message.propertyTitle || message.propertyId, message.status])
                  : extras.secondary).map(([primary, secondary, meta]) => (
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
          </>
        )}
      </section>
      {selectedInquiry && (
        <div className="contact-modal" role="dialog" aria-modal="true">
          <form className="contact-form" onSubmit={handleQuickReply}>
            <button className="modal-close" onClick={() => setSelectedInquiry(null)} type="button">Close</button>
            <h2>Inquiry from {selectedInquiry.seekerName || selectedInquiry.name}</h2>
            <label>Property<input value={selectedInquiry.propertyReference || selectedInquiry.propertyTitle || selectedInquiry.propertyId} readOnly /></label>
            <label>Email<input value={selectedInquiry.email || ''} readOnly /></label>
            <label>Phone<input value={selectedInquiry.phone || ''} readOnly /></label>
            <label>Message<textarea rows="4" value={selectedInquiry.message || ''} readOnly /></label>
            <label>Status<select value={replyForm.status} onChange={(event) => setReplyForm({ ...replyForm, status: event.target.value })}>{leadStatuses.map((status) => <option key={status}>{status}</option>)}</select></label>
            <label>Quick Reply<textarea rows="4" value={replyForm.message} onChange={(event) => setReplyForm({ ...replyForm, message: event.target.value })} placeholder="Write a quick reply" /></label>
            <button className="btn btn-primary" type="submit">Save Reply</button>
          </form>
        </div>
      )}
      {moderationTarget && (
        <div className="contact-modal" role="dialog" aria-modal="true">
          <div className="contact-form">
            <button className="modal-close" onClick={() => setModerationTarget(null)} type="button">Close</button>
            <h2>Moderate Listing</h2>
            <label>Listing<input value={moderationTarget.listing.title} readOnly /></label>
            {moderationTarget.report && <label>Listing ID<input value={moderationTarget.report.listingId} readOnly /></label>}
            {moderationTarget.report && <label>Reporting User<input value={moderationTarget.report.reporterName || moderationTarget.report.reporterEmail || moderationTarget.report.reporterId} readOnly /></label>}
            {moderationTarget.report && <label>Timestamp<input value={new Date(moderationTarget.report.timestamp || moderationTarget.report.createdAt).toLocaleString()} readOnly /></label>}
            {moderationTarget.report && <label>Report Reason<input value={moderationTarget.report.reason} readOnly /></label>}
            <label>Current Status<input value={moderationTarget.listing.moderationStatus || moderationTarget.listing.status || moderationTarget.listing.availabilityStatus} readOnly /></label>
            {moderationTarget.reportId && <label>Report Status<input value={moderationTarget.reportStatus} readOnly /></label>}
            {moderationTarget.report ? (
              <>
                <button className="btn btn-primary" onClick={() => applyModerationAction('Report Reviewed')} type="button">Review Report</button>
                <button className="btn btn-outline" onClick={() => applyModerationAction('Report Dismissed')} type="button">Dismiss Report</button>
                <button className="btn btn-outline" onClick={() => applyModerationAction('Suspended')} type="button">Suspend Listing</button>
                <button className="btn btn-ghost" onClick={() => applyModerationAction('Removed')} type="button">Remove Listing</button>
              </>
            ) : (
              <>
                <button className="btn btn-primary" onClick={() => applyModerationAction('Active')} type="button">Approve Listing</button>
                <button className="btn btn-outline" onClick={() => applyModerationAction('Reviewed')} type="button">Mark as Reviewed</button>
                <button className="btn btn-outline" onClick={() => applyModerationAction('Rejected')} type="button">Reject Listing</button>
                <button className="btn btn-ghost" onClick={() => applyModerationAction('Suspended')} type="button">Suspend Listing</button>
              </>
            )}
          </div>
        </div>
      )}
    </main>
  )
}
