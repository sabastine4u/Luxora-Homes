import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import DashboardSidebar from '../components/dashboard/DashboardSidebar'
import BulkListingControls from '../components/dashboard/BulkListingControls'
import CsvImportPanel from '../components/dashboard/CsvImportPanel'
import MessagesPanel from '../components/dashboard/MessagesPanel'
import Icon from '../components/common/Icon'
import PropertyCard from '../components/property/PropertyCard'
import { useAuth } from '../context/AuthContext'
import { useContent } from '../context/ContentContext'
import { listingStatuses, useListings } from '../context/ListingContext'
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
const promotionPackages = ['Featured', 'Spotlight', 'Premium']
const promotionDurations = ['7 days', '14 days', '30 days']
const listingStatusFilters = ['Active', 'Pending', 'Sold']
const moderationStatusOptions = [...new Set([...listingStatuses, 'Rejected', 'Suspended', 'Removed'])]
const promotionPrices = {
  Featured: 15000,
  Spotlight: 25000,
  Premium: 45000,
}

const formatPrice = (price) => new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(price)
const slugFromLabel = (value = '') => value.toLowerCase().replaceAll(' ', '-')
const listParamFromValues = (values = []) => values.map((value) => encodeURIComponent(value)).join(',')
const moderationEditableFields = (listing = {}) => ({
  title: listing.title || '',
  price: listing.price ?? '',
  category: listing.category || 'Apartment',
  status: listing.status || listing.moderationStatus || listing.availabilityStatus || 'Pending',
  description: listing.description || '',
})
const weeksFromDuration = (duration = '7 days') => Math.max(1, Math.ceil((Number.parseInt(duration, 10) || 7) / 7))
const promotionSummaryFor = (promotion = {}) => {
  const selectedPackage = promotion.package || 'Featured'
  const duration = promotion.duration || '7 days'
  const durationWeeks = weeksFromDuration(duration)
  const weeklyPrice = promotionPrices[selectedPackage] || promotionPrices.Featured
  return {
    selectedPackage,
    duration,
    durationWeeks,
    weeklyPrice,
    estimatedTotal: weeklyPrice * durationWeeks,
  }
}
const verificationExpiryStatus = (verification = {}) => {
  if (!verification.reviewedAt) return { label: 'Pending', expiryDate: null }
  const expiryDate = new Date(verification.reviewedAt)
  expiryDate.setMonth(expiryDate.getMonth() + 12)
  const daysUntilExpiry = Math.ceil((expiryDate.getTime() - Date.now()) / (24 * 60 * 60 * 1000))
  if (daysUntilExpiry < 0) return { label: 'Expired', expiryDate }
  if (daysUntilExpiry <= 30) return { label: 'Expiring Soon', expiryDate }
  return { label: 'Active', expiryDate }
}
const mockListingMetrics = (listing = {}) => {
  const seed = listing.id?.toString().split('').reduce((total, char) => total + char.charCodeAt(0), 0) || 12
  const views = 80 + (seed * 17) % 1600
  return {
    views,
    favorites: Math.round(views * (0.05 + (seed % 7) / 100)),
    inquiries: Math.max(1, Math.round(views * (0.015 + (seed % 5) / 160))),
    promotions: listing.isPromoted || listing.isFeatured ? 1 : 0,
  }
}

const agentIdentityIdsForUser = (user = {}) => [
  user.id,
  user.agentId,
  user.agentProfileId,
  ...(user.agentProfileIds || []),
].filter(Boolean)

const messageAgentIds = (message = {}) => [
  message.agentUserId,
  message.ownerId,
  message.agentId,
  message.ownerAgentId,
].filter(Boolean)

const isVisibleUserMessage = (message, user) => {
  if (!user) return false
  if (message.seekerId || message.userId) return message.seekerId === user.id || message.userId === user.id
  if (message.seekerEmail || message.email) return message.seekerEmail === user.email || message.email === user.email
  return false
}

const isVisibleAgentMessage = (message, user) => {
  if (!user) return false
  const assignedAgentIds = messageAgentIds(message)
  if (assignedAgentIds.length) return agentIdentityIdsForUser(user).some((id) => assignedAgentIds.includes(id))
  return message.copiedToAgentId === user.id
}

const countStoredSocialItems = (slice) => {
  try {
    return Object.keys(localStorage).reduce((total, key) => {
      if (!key.includes(`luxora-social-state:`) || !key.endsWith(`:${slice}`)) return total
      const items = JSON.parse(localStorage.getItem(key)) || []
      return total + (Array.isArray(items) ? items.length : 0)
    }, 0)
  } catch {
    return 0
  }
}

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
  images: listing?.images?.length ? listing.images : listing?.image ? [listing.image] : [],
  floorPlan: listing?.floorPlan || '',
  youtubeUrl: listing?.videos?.youtubeUrl || '',
  vimeoUrl: listing?.videos?.vimeoUrl || '',
  directVideoUrl: listing?.videos?.directVideoUrl || '',
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

function ListingForm({ amenities, categories, listing, onSubmit }) {
  const [form, setForm] = useState(() => initialListingForm(listing))
  const [errors, setErrors] = useState({})
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)

  const updateForm = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }))
    setErrors((current) => ({ ...current, [field]: '' }))
  }

  const updateImages = (images) => {
    setForm((current) => ({ ...current, images, image: images[0] || '' }))
    setErrors((current) => ({ ...current, image: '' }))
  }

  const handleImageUpload = async (event) => {
    const files = Array.from(event.target.files || [])
    if (!files.length) return
    const nextImages = await Promise.all(files.map((file) => new Promise((resolve) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result)
      reader.readAsDataURL(file)
    })))
    updateImages([...form.images, ...nextImages])
  }

  const removeImage = (index) => {
    updateImages(form.images.filter((_, imageIndex) => imageIndex !== index))
  }

  const moveImage = (index, direction) => {
    const nextIndex = index + direction
    if (nextIndex < 0 || nextIndex >= form.images.length) return
    const nextImages = [...form.images]
    const [image] = nextImages.splice(index, 1)
    nextImages.splice(nextIndex, 0, image)
    updateImages(nextImages)
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
    if (!form.images.length) nextErrors.image = 'Upload at least one image'
    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const listingPayload = () => ({
      ...form,
      amenities: form.amenities.split(',').map((item) => item.trim()).filter(Boolean),
      image: form.images[0],
      images: form.images,
      floorPlan: form.floorPlan.trim(),
      videos: {
        youtubeUrl: form.youtubeUrl.trim(),
        vimeoUrl: form.vimeoUrl.trim(),
        directVideoUrl: form.directVideoUrl.trim(),
      },
    })

  const previewProperty = () => ({
    id: listing?.id || 'listing-preview',
    isVerified: true,
    isNew: !listing,
    title: form.title || 'Listing preview',
    location: form.location || 'Property location',
    price: Number(form.price) || 1,
    priceType: form.type === 'buy' ? 'total' : 'month',
    type: form.type,
    category: form.category,
    beds: Number(form.beds) || 0,
    baths: Number(form.baths) || 0,
    sqft: Number(form.sqft) || 1,
    listedDate: new Date().toISOString(),
    image: form.images[0] || 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=900&auto=format&fit=crop&q=70',
    images: form.images,
    floorPlan: form.floorPlan.trim(),
    videos: {
      youtubeUrl: form.youtubeUrl.trim(),
      vimeoUrl: form.vimeoUrl.trim(),
      directVideoUrl: form.directVideoUrl.trim(),
    },
    amenities: form.amenities.split(',').map((item) => item.trim()).filter(Boolean),
    availabilityStatus: form.status,
    agent: { name: 'Sarah Agent', image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=70' },
  })

  const handleSubmit = (event) => {
    event.preventDefault()
    if (!validate()) return
    setIsPreviewOpen(true)
  }

  const handlePublish = () => {
    onSubmit(listingPayload())
  }

  return (
    <form className="auth-form two-col-form" onSubmit={handleSubmit}>
      <label>Property Title<input value={form.title} onChange={(event) => updateForm('title', event.target.value)} placeholder="Property title" required />{errors.title && <small className="form-error">{errors.title}</small>}</label>
      <label>Property Type<select value={form.category} onChange={(event) => updateForm('category', event.target.value)} required>{categories.map((category) => <option key={category}>{category}</option>)}</select></label>
      <label>Listing Type<select value={form.type} onChange={(event) => updateForm('type', event.target.value)} required><option value="buy">Buy</option><option value="rent">Rent</option><option value="lease">Lease</option></select></label>
      <label>Price<input type="number" min="1" value={form.price} onChange={(event) => updateForm('price', event.target.value)} placeholder="Price" required />{errors.price && <small className="form-error">{errors.price}</small>}</label>
      <label>Location<input value={form.location} onChange={(event) => updateForm('location', event.target.value)} placeholder="Location" required />{errors.location && <small className="form-error">{errors.location}</small>}</label>
      <label>Bedrooms<input type="number" min="0" value={form.beds} onChange={(event) => updateForm('beds', event.target.value)} placeholder="Bedrooms" required />{errors.beds && <small className="form-error">{errors.beds}</small>}</label>
      <label>Bathrooms<input type="number" min="0" value={form.baths} onChange={(event) => updateForm('baths', event.target.value)} placeholder="Bathrooms" required />{errors.baths && <small className="form-error">{errors.baths}</small>}</label>
      <label>Property Size<input type="number" min="1" value={form.sqft} onChange={(event) => updateForm('sqft', event.target.value)} placeholder="Square feet" required />{errors.sqft && <small className="form-error">{errors.sqft}</small>}</label>
      <label className="full-field">Description<textarea rows="4" value={form.description} onChange={(event) => updateForm('description', event.target.value)} placeholder="Describe the property" required />{errors.description && <small className="form-error">{errors.description}</small>}</label>
      <label>Amenities<input value={form.amenities} onChange={(event) => updateForm('amenities', event.target.value)} placeholder={amenities.slice(0, 3).join(', ') || 'Pool, Parking, Security'} /></label>
      <label>Status<select value={form.status} onChange={(event) => updateForm('status', event.target.value)} required>{listingStatuses.map((status) => <option key={status}>{status}</option>)}</select></label>
      <label>YouTube URL<input value={form.youtubeUrl} onChange={(event) => updateForm('youtubeUrl', event.target.value)} placeholder="https://youtube.com/watch?v=..." /></label>
      <label>Vimeo URL<input value={form.vimeoUrl} onChange={(event) => updateForm('vimeoUrl', event.target.value)} placeholder="https://vimeo.com/..." /></label>
      <label className="full-field">Floor Plan URL<input value={form.floorPlan} onChange={(event) => updateForm('floorPlan', event.target.value)} placeholder="https://example.com/floor-plan.jpg" /></label>
      <label className="full-field">Direct Video URL<input value={form.directVideoUrl} onChange={(event) => updateForm('directVideoUrl', event.target.value)} placeholder="https://example.com/tour.mp4" /></label>
      <label className="full-field">Image Upload<input type="file" accept="image/*" multiple onChange={handleImageUpload} />{errors.image && <small className="form-error">{errors.image}</small>}</label>
      {form.images.map((image, index) => (
        <div className="full-field compact-property" key={image}>
          <img src={image} alt={`Listing preview ${index + 1}`} />
          <div><h3>{index === 0 ? 'Primary photo' : `Photo ${index + 1}`}</h3><p>{form.location || 'Uploaded property image'}</p></div>
          <button type="button" onClick={() => moveImage(index, -1)} disabled={index === 0}>Up</button>
          <button type="button" onClick={() => moveImage(index, 1)} disabled={index === form.images.length - 1}>Down</button>
          <button type="button" onClick={() => removeImage(index)}>Remove</button>
        </div>
      ))}
      <button className="btn btn-primary full-field" type="submit">{listing ? 'Preview Changes' : 'Preview Listing'}</button>
      {isPreviewOpen && (
        <div className="contact-modal" role="dialog" aria-modal="true">
          <div className="contact-form">
            <button className="modal-close" onClick={() => setIsPreviewOpen(false)} type="button">Close</button>
            <h2>Listing Preview</h2>
            <PropertyCard property={previewProperty()} />
            <button className="btn btn-primary" onClick={handlePublish} type="button">{listing ? 'Update Listing' : 'Create Listing'}</button>
          </div>
        </div>
      )}
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

function PromotionRequestModal({ listing, onClose, onSubmit }) {
  const [form, setForm] = useState({ package: 'Featured', duration: '14 days', paymentConfirmed: false })
  const promotionSummary = promotionSummaryFor(form)

  const submitPromotion = (event) => {
    event.preventDefault()
    if (!form.paymentConfirmed) return
    onSubmit({
      package: form.package,
      duration: form.duration,
      paymentStatus: 'Simulated Paid',
      paidAt: new Date().toISOString(),
    })
  }

  return (
    <div className="contact-modal" role="dialog" aria-modal="true">
      <form className="contact-form" onSubmit={submitPromotion}>
        <button className="modal-close" onClick={onClose} type="button">Close</button>
        <h2>Promote Listing</h2>
        <label>Listing<input value={listing?.title || ''} readOnly /></label>
        <label>Package<select value={form.package} onChange={(event) => setForm({ ...form, package: event.target.value })}>{promotionPackages.map((item) => <option key={item}>{item}</option>)}</select></label>
        <label>Duration<select value={form.duration} onChange={(event) => setForm({ ...form, duration: event.target.value })}>{promotionDurations.map((item) => <option key={item}>{item}</option>)}</select></label>
        <label>Selected Package<input value={promotionSummary.selectedPackage} readOnly /></label>
        <label>Selected Duration<input value={promotionSummary.duration} readOnly /></label>
        <label>Estimated Total<input value={`${formatPrice(promotionSummary.estimatedTotal)} (${formatPrice(promotionSummary.weeklyPrice)} x ${promotionSummary.durationWeeks} week${promotionSummary.durationWeeks > 1 ? 's' : ''})`} readOnly /></label>
        <label className="check-label"><input type="checkbox" checked={form.paymentConfirmed} onChange={(event) => setForm({ ...form, paymentConfirmed: event.target.checked })} /> Confirm simulated payment</label>
        <button className="btn btn-primary" type="submit" disabled={!form.paymentConfirmed}>Request Promotion</button>
      </form>
    </div>
  )
}

function ContentManagementPanel({ amenities, categories, deleteListItem, locations, saveListItem }) {
  const [forms, setForms] = useState({ categories: '', amenities: '', locations: '' })
  const [editing, setEditing] = useState(null)
  const groups = [
    ['categories', 'Categories', categories],
    ['amenities', 'Amenities', amenities],
    ['locations', 'Locations', locations],
  ]

  const updateForm = (type, value) => setForms((items) => ({ ...items, [type]: value }))
  const submitItem = (event, type) => {
    event.preventDefault()
    saveListItem(type, forms[type], editing?.type === type ? editing.value : '')
    updateForm(type, '')
    setEditing(null)
  }

  return (
    <div className="dashboard-grid">
      {groups.map(([type, title, items]) => (
        <article className="dashboard-panel" key={type}>
          <div className="panel-heading"><h2>{title}</h2></div>
          <form className="auth-form" onSubmit={(event) => submitItem(event, type)}>
            <label>{editing?.type === type ? `Edit ${title}` : `Add ${title}`}<input value={forms[type]} onChange={(event) => updateForm(type, event.target.value)} placeholder={title.slice(0, -1)} /></label>
            <button className="btn btn-primary" type="submit">{editing?.type === type ? 'Save' : 'Add'}</button>
          </form>
          <div className="dashboard-table">
            {items.map((item) => (
              <div key={item}>
                <strong>{item}</strong>
                <span>{type}</span>
                <button type="button" onClick={() => { setEditing({ type, value: item }); updateForm(type, item) }}>Edit</button>
                <button type="button" onClick={() => deleteListItem(type, item)}>Delete</button>
              </div>
            ))}
          </div>
        </article>
      ))}
    </div>
  )
}

function PlanManagementPanel({ deletePlan, plans, savePlan }) {
  const [form, setForm] = useState({ name: '', listingLimit: '', featuredLimit: '', duration: '30 days', price: '', badge: '' })
  const updateForm = (field, value) => setForm((current) => ({ ...current, [field]: value }))
  const editPlan = (plan) => setForm(plan)
  const submitPlan = (event) => {
    event.preventDefault()
    savePlan(form)
    setForm({ name: '', listingLimit: '', featuredLimit: '', duration: '30 days', price: '', badge: '' })
  }

  return (
    <div className="dashboard-grid">
      <article className="dashboard-panel wide-panel">
        <div className="panel-heading"><h2>Subscription Plans</h2></div>
        <div className="dashboard-table">
          {plans.map((plan) => (
            <div key={plan.id}>
              <strong>{plan.name}</strong>
              <span>{plan.listingLimit} listings / {plan.featuredLimit} featured / {plan.duration}</span>
              <em>NGN {Number(plan.price).toLocaleString()} {plan.badge}</em>
              <button type="button" onClick={() => editPlan(plan)}>Edit</button>
              <button type="button" onClick={() => deletePlan(plan.id)}>Delete</button>
            </div>
          ))}
        </div>
      </article>
      <article className="dashboard-panel">
        <div className="panel-heading"><h2>{form.id ? 'Edit Plan' : 'Create Plan'}</h2></div>
        <form className="auth-form" onSubmit={submitPlan}>
          <label>Plan Name<input value={form.name} onChange={(event) => updateForm('name', event.target.value)} required /></label>
          <label>Listing Limit<input type="number" min="0" value={form.listingLimit} onChange={(event) => updateForm('listingLimit', event.target.value)} required /></label>
          <label>Featured Limit<input type="number" min="0" value={form.featuredLimit} onChange={(event) => updateForm('featuredLimit', event.target.value)} required /></label>
          <label>Duration<input value={form.duration} onChange={(event) => updateForm('duration', event.target.value)} required /></label>
          <label>Price<input type="number" min="0" value={form.price} onChange={(event) => updateForm('price', event.target.value)} required /></label>
          <label>Badge<input value={form.badge} onChange={(event) => updateForm('badge', event.target.value)} placeholder="Popular" /></label>
          <button className="btn btn-primary" type="submit">{form.id ? 'Save Plan' : 'Create Plan'}</button>
        </form>
      </article>
    </div>
  )
}

export default function DashboardPage({ variant = 'user' }) {
  const { user, registeredUsers, updateUser, updatePassword, updateUserStatus, updateAgentVerification, verifyContact } = useAuth()
  const navigate = useNavigate()
  const { allListings, managedListings, reports, listingAnalytics, moderationHistory, cloneListing, createListing, updateListing, updateListingModeration, requestPromotion, updatePromotionStatus, removeListing, updateReportStatus, addModerationHistory, getListing } = useListings()
  const { notify } = useUI()
  const location = useLocation()
  const { clearCompare, compareProperties, deleteSavedSearch, dismissNotification: dismissSavedNotification, favoriteProperties, recentProperties, recentSearches, removeCompare, savedSearches, toggleSavedSearchStatus, viewings, messages, notifications: savedNotifications, replyTemplates, markMessageRead, updateMessageStatus, addMessageReply, addLeadNote, addViewing, saveReplyTemplate, deleteReplyTemplate } = useFavoriteProperties()
  const { amenities, categories, deleteListItem, deletePlan, locations, plans, saveListItem, savePlan } = useContent()
  const [dismissedNotifications, setDismissedNotifications] = useState([])
  const [rowStatuses, setRowStatuses] = useState({})
  const [selectedInquiry, setSelectedInquiry] = useState(null)
  const [promotionTarget, setPromotionTarget] = useState(null)
  const [moderationTarget, setModerationTarget] = useState(null)
  const [moderationEdits, setModerationEdits] = useState({})
  const [adminTarget, setAdminTarget] = useState(null)
  const [adminReason, setAdminReason] = useState('')
  const [replyForm, setReplyForm] = useState({ status: 'Contacted', message: '' })
  const [leadNote, setLeadNote] = useState('')
  const [templateForm, setTemplateForm] = useState({ title: '', message: '' })
  const [viewingForm, setViewingForm] = useState({ date: '', time: '' })
  const [listingStatusFilter, setListingStatusFilter] = useState('Active')
  const [selectedListingIds, setSelectedListingIds] = useState([])
  const [analyticsToday] = useState(() => Date.now())
  const data = content[variant]
  const extras = dashboardExtras[variant]
  const pathParts = location.pathname.split('/').filter(Boolean)
  const activeSection = pathParts[2] || 'overview'
  const isProfileSettings = activeSection === 'profile-settings'
  const isNotificationSettings = activeSection === 'notification-settings' || activeSection === 'settings'
  const isSettingsSection = isProfileSettings || isNotificationSettings
  const isAdminManagementSection = variant === 'admin' && ['content', 'plans'].includes(activeSection)
  const editingListingId = activeSection === 'edit-listing' ? pathParts[3] : ''
  const editingListing = editingListingId ? getListing(editingListingId) : null
  const relevantMessages = variant === 'agent'
    ? messages.filter((message) => isVisibleAgentMessage(message, user))
    : variant === 'user'
      ? messages.filter((message) => isVisibleUserMessage(message, user))
      : messages
  const agentRespondedMessages = relevantMessages.filter((message) => (message.replies || []).length > 0)
  const unreadInquiryCount = relevantMessages.filter((message) => !message.isRead).length
  const inquiryNotifications = relevantMessages.filter((message) => !message.isRead).map((message) => ({
    id: message.id,
    text: `New inquiry for ${message.propertyTitle || message.propertyId}`,
    time: new Date(message.timestamp || message.createdAt).toLocaleDateString(),
  }))
  const searchAlertNotifications = savedSearches.filter((search) => search.status === 'Active' && search.alertsEnabled).map((search) => ({
    id: `search-alert-${search.id}`,
    text: `Search alert: new matches for ${search.name}`,
    time: search.lastAlertAt ? new Date(search.lastAlertAt).toLocaleDateString() : 'Today',
  }))
  const visibleNotifications = [...inquiryNotifications, ...searchAlertNotifications, ...(savedNotifications || []), ...notifications].filter((item) => !dismissedNotifications.includes(item.id))
  const agentListings = managedListings.filter((property) => {
    const ids = agentIdentityIdsForUser(user)
    if (property.agent?.id && ids.length) return ids.includes(property.agent.id)
    return property.agent.name === (user?.name || 'Sarah Agent')
  })
  const currentAgentProfile = {
    id: user?.id || 'sarah-agent',
    name: user?.name || 'Sarah Agent',
    image: user?.image || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=70',
    verificationStatus: user?.agentVerification?.status || (user?.role === 'agent' ? 'Pending' : 'Verified'),
  }
  const agentMetrics = agentListings.reduce((totals, property) => {
    const metrics = { ...mockListingMetrics(property), ...(listingAnalytics[property.id] || {}) }
    return {
      views: totals.views + (metrics.views || 0),
      favorites: totals.favorites + (metrics.favorites || 0),
      inquiries: totals.inquiries + (metrics.inquiries || 0),
      promotions: totals.promotions + (metrics.promotions || 0),
    }
  }, { views: 0, favorites: 0, inquiries: relevantMessages.length, promotions: 0 })
  const engagementRate = agentMetrics.views ? Math.round(((agentMetrics.favorites + agentMetrics.inquiries) / agentMetrics.views) * 100) : 0
  const responseRate = relevantMessages.length ? Math.round((agentRespondedMessages.length / relevantMessages.length) * 100) : 0
  const averageDaysOnMarket = agentListings.length ? Math.round(agentListings.reduce((total, property) => {
    const start = new Date(property.listedDate || property.createdAt || new Date()).getTime()
    const end = property.status === 'Sold' || property.status === 'Rented' || property.status === 'Expired' ? new Date(property.reviewedAt || property.expiredAt || analyticsToday).getTime() : analyticsToday
    return total + Math.max(0, Math.round((end - start) / (24 * 60 * 60 * 1000)))
  }, 0) / agentListings.length) : 0
  const conversionRate = relevantMessages.length ? Math.round((relevantMessages.filter((message) => message.status === 'Closed').length / relevantMessages.length) * 100) : 0
  const promotionRequests = allListings.filter((property) => property.promotion?.status === 'Requested' || property.promotion?.status === 'Approved')
  const openReportListingIds = new Set(reports.filter((report) => report.status === 'Open').map((report) => report.listingId))
  const verificationAgents = registeredUsers.filter((item) => item.role === 'agent' || item.accountType === 'agent')
  const listingModerationStatus = (property = {}) => property.moderationStatus || property.status || property.availabilityStatus || 'Pending'
  const platformAnalytics = {
    users: registeredUsers.length,
    activeListings: allListings.filter((property) => ['Active', 'Available'].includes(property.status || property.availabilityStatus)).length,
    pendingListings: allListings.filter((property) => property.status === 'Pending' || property.availabilityStatus === 'Pending').length,
    closedListings: allListings.filter((property) => ['Sold', 'Rented'].includes(property.status || property.availabilityStatus)).length,
    inquiries: countStoredSocialItems('messages') || messages.length,
    reports: reports.length,
    savedProperties: countStoredSocialItems('favorites') || favoriteProperties.length,
    verifiedAgents: registeredUsers.filter((item) => (item.role === 'agent' || item.accountType === 'agent') && item.agentVerification?.status === 'Approved').length,
    featuredListings: allListings.filter((property) => property.isFeatured).length,
    promotions: promotionRequests.length,
    approvedListings: allListings.filter((property) => ['Active', 'Approved'].includes(listingModerationStatus(property))).length,
    rejectedListings: allListings.filter((property) => listingModerationStatus(property) === 'Rejected').length,
    flaggedListings: allListings.filter((property) => openReportListingIds.has(property.id)).length,
    moderationPendingListings: allListings.filter((property) => listingModerationStatus(property) === 'Pending').length,
    pendingVerifications: verificationAgents.filter((item) => !item.agentVerification?.reviewedAt || item.agentVerification?.status === 'Pending').length,
  }
  const dashboardProperties = variant === 'user'
    ? (favoriteProperties.length ? favoriteProperties : allListings.slice(0, 4))
    : variant === 'agent'
      ? (agentListings.length ? agentListings : allListings.slice(0, 4))
      : allListings.slice(0, 4)
  const dynamicStats = variant === 'user'
    ? [['Saved Properties', favoriteProperties.length.toString(), '+live'], ['Recently Viewed', recentProperties.length.toString(), '+live'], ['Saved Searches', savedSearches.length.toString(), '+live'], ['Compare List', compareProperties.length.toString(), `${compareProperties.length}/4`]]
    : variant === 'agent'
      ? [['Active Listings', agentListings.filter((property) => property.status === 'Active').length.toString(), `${averageDaysOnMarket} avg days`], ['Response Rate', `${responseRate}%`, unreadInquiryCount ? `${unreadInquiryCount} new` : '+live'], ['Conversion Rate', `${conversionRate}%`, `${agentMetrics.inquiries} inquiries`], ['Engagement', `${engagementRate}%`, `${agentMetrics.views} views`]]
      : [
        ['Approved Listings', platformAnalytics.approvedListings.toString(), `${platformAnalytics.featuredListings} featured`],
        ['Rejected Listings', platformAnalytics.rejectedListings.toString(), 'moderation'],
        ['Flagged Listings', platformAnalytics.flaggedListings.toString(), `${platformAnalytics.reports} reports`],
        ['Pending Listings', platformAnalytics.moderationPendingListings.toString(), 'awaiting review'],
        ['Verified Agents', platformAnalytics.verifiedAgents.toString(), `${platformAnalytics.users} users`],
        ['Pending Verifications', platformAnalytics.pendingVerifications.toString(), 'agent queue'],
      ]
  const sectionTitle = activeSection.replaceAll('-', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())
  const sectionRows = (() => {
    if (variant === 'user') {
      if (activeSection === 'saved-properties') return favoriteProperties.map((property) => [property.title, property.location, property.availabilityStatus])
      if (activeSection === 'recently-viewed') return recentProperties.map((property) => [property.title, property.location, property.category, property.id])
      if (activeSection === 'saved-searches') return savedSearches.map((search) => [search.name, search.criteria.query || search.criteria.propertyTypes?.join(', ') || 'All properties', search.status, search.id])
      if (activeSection === 'compare-properties') return compareProperties.map((property) => [property.title, property.location, property.availabilityStatus, property.id])
      if (activeSection === 'messages') return relevantMessages.map((message) => [message.propertyReference || message.propertyTitle || message.propertyId, message.replies?.[0]?.message || message.message, message.isRead ? 'Read' : 'Unread', message.id])
      if (activeSection === 'viewings') return viewings.map((viewing) => [viewing.propertyTitle, viewing.date, viewing.status])
      if (activeSection === 'notifications') return visibleNotifications.map((item) => [item.text, item.time, 'Unread', item.id])
    }
    if (variant === 'agent') {
      if (activeSection === 'my-listings') return agentListings.map((property) => [property.title, `${property.location} / Expires ${property.expiryDate ? new Date(property.expiryDate).toLocaleDateString() : 'N/A'}`, property.status, property.id])
      if (activeSection === 'messages' || activeSection === 'leads') return relevantMessages.length ? relevantMessages.map((message) => [message.seekerName || message.name, message.propertyReference || message.propertyTitle || message.propertyId, message.status, message.id]) : extras.secondary
      if (activeSection === 'appointments') return viewings.length ? viewings.map((viewing) => [viewing.propertyTitle || viewing.property || 'Property viewing', `${viewing.date} ${viewing.time}`, viewing.status]) : extras.tableRows
      if (activeSection === 'analytics') return agentListings.length ? [
        ['Total Views', agentMetrics.views.toString(), `${Math.max(0, Math.round(agentMetrics.views * 0.18))} weekly / ${Math.max(0, Math.round(agentMetrics.views * 0.52))} monthly`],
        ['Favorites Count', agentMetrics.favorites.toString(), `${Math.max(0, Math.round(agentMetrics.favorites * 0.2))} weekly / ${Math.max(0, Math.round(agentMetrics.favorites * 0.6))} monthly`],
        ['Inquiry Count', agentMetrics.inquiries.toString(), `${Math.max(0, Math.round(agentMetrics.inquiries * 0.25))} weekly / ${Math.max(0, Math.round(agentMetrics.inquiries * 0.7))} monthly`],
        ['Response Rate', `${responseRate}%`, `${agentRespondedMessages.length}/${relevantMessages.length || 0} replied`],
        ['Average Days on Market', `${averageDaysOnMarket} days`, `${agentListings.length} listings`],
        ['Conversion Rate', `${conversionRate}%`, `${relevantMessages.filter((message) => message.status === 'Closed').length} closed`],
        ...agentListings.map((property) => {
        const metrics = { ...mockListingMetrics(property), ...(listingAnalytics[property.id] || {}) }
        const engagement = metrics.views ? `${Math.round((((metrics.favorites || 0) + (metrics.inquiries || 0)) / metrics.views) * 100)}% engagement` : '0% engagement'
        return [property.title, `${metrics.views || 0} views / ${metrics.favorites || 0} saves`, `${metrics.inquiries || 0} inquiries / ${engagement}`]
      })] : [['Response Rate', `${responseRate}%`, '+live'], ['Average Days on Market', `${averageDaysOnMarket} days`, '+live'], ['Conversion Rate', `${conversionRate}%`, '+live']]
    }
    if (variant === 'admin') {
      if (activeSection === 'users') return registeredUsers.map((item) => [item.name, item.email, item.accountStatus || 'Active', item.id, 'user'])
      if (activeSection === 'properties') return allListings.slice(0, 8).map((property) => [property.title, property.category, property.moderationStatus || property.status || property.availabilityStatus, property.id])
      if (activeSection === 'agents') return registeredUsers.filter((item) => item.role === 'agent' || item.accountType === 'agent').map((item) => [item.name, item.agentVerification?.company || item.email, item.agentVerification?.status || 'Pending', item.id, 'agent'])
      if (activeSection === 'reports') return reports.length
        ? reports.map((report) => [report.listingTitle, report.reason, report.status, report.listingId, report.id])
        : extras.tableRows
      if (activeSection === 'transactions') return [['Inspection payment', 'NGN 25,000', 'Completed'], ['Lease deposit', 'NGN 850,000', 'Escrow'], ['Agent subscription', 'NGN 75,000', 'Paid']]
    }
    return extras.tableRows
  })()
  const visibleSectionRows = variant === 'agent' && activeSection === 'my-listings'
    ? sectionRows.filter((row) => row[2] === listingStatusFilter)
    : sectionRows

  const handleRowAction = (row) => {
    if (activeSection === 'recently-viewed' && row[3]) {
      navigate(`/property/${row[3]}`)
      return
    }
    const key = row.join('-')
    const nextStatus = rowStatuses[key] === 'Reviewed' ? row[2] : 'Reviewed'
    setRowStatuses((items) => ({ ...items, [key]: nextStatus }))
    notify(nextStatus === 'Reviewed' ? 'Item marked as reviewed.' : 'Item restored.')
  }

  const applySearchCriteria = (criteria) => {
    const params = new URLSearchParams()
    if (criteria.listingType && criteria.listingType !== 'all') params.set('type', criteria.listingType)
    if (criteria.query) params.set('q', criteria.query)
    if (criteria.sort && criteria.sort !== 'recent') params.set('sort', criteria.sort)
    if (criteria.propertyTypes?.length === 1) params.set('category', slugFromLabel(criteria.propertyTypes[0]))
    if (criteria.propertyTypes?.length > 1) params.set('propertyTypes', listParamFromValues(criteria.propertyTypes))
    if (criteria.amenities?.length) params.set('amenities', listParamFromValues(criteria.amenities))
    if (criteria.nearbyAmenities?.length) params.set('nearbyAmenities', listParamFromValues(criteria.nearbyAmenities))
    if (criteria.beds && criteria.beds !== 'Any') params.set('beds', criteria.beds)
    if (criteria.baths && criteria.baths !== 'Any') params.set('baths', criteria.baths)
    if (Number(criteria.minPrice || 0) > 0) params.set('minPrice', criteria.minPrice)
    if (Number(criteria.price ?? 65) !== 65) params.set('price', criteria.price)
    navigate(`/listings${params.toString() ? `?${params.toString()}` : ''}`)
  }

  const handleSavedSearchStatus = (id) => {
    const updated = toggleSavedSearchStatus(id)
    notify(updated?.status === 'Active' ? 'Search alert activated.' : 'Search alert paused.')
  }

  const handleSavedSearchDelete = (id) => {
    deleteSavedSearch(id)
    notify('Saved search deleted.')
  }

  const handleCompareRemove = (id) => {
    removeCompare(id)
    notify('Property removed from comparison.')
  }

  const dismissNotification = (id) => {
    setDismissedNotifications((items) => [...items, id])
    if (messages.some((message) => message.id === id)) markMessageRead(id)
    if (savedNotifications?.some((item) => item.id === id)) dismissSavedNotification(id)
    notify('Notification dismissed.')
  }

  const openInquiry = (id) => {
    const inquiry = messages.find((message) => message.id === id)
    if (!inquiry) return
    markMessageRead(id)
    setSelectedInquiry(inquiry)
    setReplyForm({ status: leadStatuses.includes(inquiry.status) ? inquiry.status : 'New', message: '' })
    setLeadNote('')
    setViewingForm({ date: '', time: '' })
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
    setModerationEdits(moderationEditableFields(listing))
  }

  const openAdminTarget = (row) => {
    const targetUser = registeredUsers.find((item) => item.id === row[3])
    if (!targetUser) return
    setAdminReason('')
    setAdminTarget({ user: targetUser, mode: row[4] })
  }

  const applyUserStatus = (status) => {
    if (!adminTarget) return
    const updated = updateUserStatus(adminTarget.user.id, status)
    addModerationHistory({
      type: 'User Management',
      action: status,
      note: `${updated?.name || adminTarget.user.name} account marked ${status}`,
    })
    setAdminTarget(null)
    notify(`User ${status.toLowerCase()}.`)
  }

  const applyAgentVerification = (status) => {
    if (!adminTarget) return
    const reason = status === 'Rejected' ? adminReason || 'Application did not meet verification requirements.' : adminReason
    const updated = updateAgentVerification(adminTarget.user.id, status, reason)
    addModerationHistory({
      type: 'Verification Action',
      action: status,
      note: `${updated?.name || adminTarget.user.name} verification ${status.toLowerCase()}${reason ? `: ${reason}` : ''}`,
    })
    setAdminTarget(null)
    notify(`Agent verification ${status.toLowerCase()}.`)
  }

  const saveModerationChanges = () => {
    if (!moderationTarget) return null
    const updated = updateListing(moderationTarget.listing.id, moderationEdits)
    if (updated) {
      setModerationTarget((current) => current ? { ...current, listing: { ...current.listing, ...updated } } : current)
    }
    return updated
  }

  const updateModerationEdit = (field, value) => {
    setModerationEdits((current) => ({ ...current, [field]: value }))
  }

  const applyModerationAction = (status) => {
    if (!moderationTarget) return
    saveModerationChanges()
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

  const applyPromotionAction = (status) => {
    if (!moderationTarget) return
    saveModerationChanges()
    updatePromotionStatus(moderationTarget.listing.id, status)
    setModerationTarget(null)
    notify(status === 'Approved' ? 'Promotion approved.' : 'Promotion removed.')
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

  const handleLeadNoteSave = () => {
    if (!selectedInquiry || !leadNote.trim()) return
    addLeadNote(selectedInquiry.id, leadNote)
    setSelectedInquiry((current) => current ? { ...current, notes: [{ id: `note-${Date.now()}`, note: leadNote.trim(), createdAt: new Date().toISOString() }, ...(current.notes || [])] } : current)
    setLeadNote('')
    notify('Lead note saved.')
  }

  const handleTemplateSave = () => {
    if (!templateForm.title.trim() || !templateForm.message.trim()) return
    saveReplyTemplate(templateForm)
    setTemplateForm({ title: '', message: '' })
    notify('Reply template saved.')
  }

  const handleViewingSchedule = () => {
    if (!selectedInquiry || !viewingForm.date || !viewingForm.time) return
    addViewing({
      date: viewingForm.date,
      time: viewingForm.time,
      propertyId: selectedInquiry.propertyId,
      propertyTitle: selectedInquiry.propertyTitle || selectedInquiry.propertyReference || selectedInquiry.propertyId,
      leadId: selectedInquiry.id,
      leadName: selectedInquiry.seekerName || selectedInquiry.name,
      agent: user?.name || 'Luxora Agent',
      status: 'Scheduled',
    })
    setViewingForm({ date: '', time: '' })
    notify('Viewing scheduled.')
  }

  const handlePromotionRequest = (id, details) => {
    const promoted = requestPromotion(id, details)
    setPromotionTarget(null)
    notify(promoted ? 'Promotion request sent to admin.' : 'Could not request promotion.')
  }

  const handleCloneListing = (id) => {
    const cloned = cloneListing(id)
    if (!cloned) {
      notify('Could not clone listing.', 'error')
      return
    }
    notify('Listing cloned as pending.')
    navigate(`/dashboard/agent/edit-listing/${cloned.id}`)
  }

  const toggleListingSelection = (id) => {
    setSelectedListingIds((items) => (items.includes(id) ? items.filter((item) => item !== id) : [...items, id]))
  }

  const applyBulkListingStatus = (status) => {
    selectedListingIds.forEach((id) => {
      const listing = getListing(id)
      if (listing) updateListing(id, { ...listing, status })
    })
    notify(`${selectedListingIds.length} listing${selectedListingIds.length === 1 ? '' : 's'} updated.`)
    setSelectedListingIds([])
  }

  const updateLeadStatus = (id, status) => {
    updateMessageStatus(id, status)
    notify(`Lead moved to ${status}.`)
  }

  const handleCsvImported = (count) => {
    notify(`${count} listing${count === 1 ? '' : 's'} imported from CSV.`)
  }

  const handleListingSubmit = (payload) => {
    if (['seller', 'agent'].includes(user?.accountType) || user?.role === 'agent') {
      if (!user?.emailVerified || !user?.phoneVerified) {
        notify('Verify email and phone before posting listings.', 'warning')
        return
      }
      if (user?.role === 'agent' && user?.agentVerification?.status !== 'Approved') {
        notify('Agent verification must be approved before posting listings.', 'warning')
        return
      }
    }
    if (editingListing) {
      const updated = updateListing(editingListing.id, { ...payload, agent: currentAgentProfile })
      notify('Listing updated.')
      navigate(`/property/${updated.id}`)
      return
    }

    const created = createListing({ ...payload, agent: currentAgentProfile })
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
                <ListingForm amenities={amenities} categories={categories} listing={editingListing} onSubmit={handleListingSubmit} />
              )}
            </article>
            <article className="dashboard-panel">
              <div className="panel-heading"><h2>Quick Actions</h2></div>
              <div className="task-list">
                <div><span><Icon name="home" /></span><div><h3>My Listings</h3><p>{agentListings.length} managed</p></div><Link to="/dashboard/agent/my-listings">Open</Link></div>
                <div><span><Icon name="eye" /></span><div><h3>Marketplace</h3><p>Review live listings</p></div><Link to="/listings">View</Link></div>
                {editingListing && <div><span><Icon name="star" /></span><div><h3>Promote Listing</h3><p>{editingListing.promotion?.status || 'Request feature'}</p></div><button type="button" onClick={() => setPromotionTarget(editingListing)}>Request</button></div>}
                {editingListing && <div><span><Icon name="home" /></span><div><h3>Clone Listing</h3><p>Create pending copy</p></div><button type="button" onClick={() => handleCloneListing(editingListing.id)}>Clone</button></div>}
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
                <div><span><Icon name="check" /></span><div><h3>Verification</h3><p>Email {user?.emailVerified ? 'verified' : 'unverified'} / Phone {user?.phoneVerified ? 'verified' : 'unverified'}</p></div><strong>{user?.agentVerification?.status || user?.accountStatus || 'Active'}</strong></div>
                {!user?.emailVerified && <div><span><Icon name="mail" /></span><div><h3>Email Code</h3><p>Use simulated code 123456</p></div><button type="button" onClick={() => { verifyContact('email'); notify('Email verified.') }}>Verify</button></div>}
                {!user?.phoneVerified && <div><span><Icon name="phone" /></span><div><h3>Phone Code</h3><p>Use simulated code 123456</p></div><button type="button" onClick={() => { verifyContact('phone'); notify('Phone verified.') }}>Verify</button></div>}
                <div><span><Icon name="bell" /></span><div><h3>Notifications</h3><p>{visibleNotifications.length} unread</p></div><Link to={`/dashboard/${variant}/notifications`}>View</Link></div>
                <div><span><Icon name="check" /></span><div><h3>{isProfileSettings ? 'Notification Settings' : 'Profile Settings'}</h3><p>Manage account preferences</p></div><Link to={`/dashboard/${variant}/${isProfileSettings ? 'notification-settings' : 'profile-settings'}`}>Open</Link></div>
              </div>
            </article>
          </div>
        )}
        {variant === 'admin' && activeSection === 'content' && (
          <ContentManagementPanel amenities={amenities} categories={categories} deleteListItem={deleteListItem} locations={locations} saveListItem={saveListItem} />
        )}
        {variant === 'admin' && activeSection === 'plans' && (
          <PlanManagementPanel deletePlan={deletePlan} plans={plans} savePlan={savePlan} />
        )}
        {!(isSettingsSection || isAdminManagementSection || (variant === 'agent' && (activeSection === 'add-listing' || activeSection === 'edit-listing'))) && (
          <>
        {variant === 'user' && activeSection === 'saved-searches' && (
          <div className="dashboard-grid">
            <article className="dashboard-panel wide-panel">
              <div className="panel-heading"><h2>Saved Searches</h2><Link to="/listings">Create Search</Link></div>
              {savedSearches.length ? (
                <div className="dashboard-table">
                  {savedSearches.map((search) => (
                    <div className="dashboard-table-row" key={search.id}>
                      <strong>{search.name}</strong>
                      <span>{search.criteria.query || search.criteria.propertyTypes?.join(', ') || 'All properties'} / {search.criteria.listingType}</span>
                      <em>{search.status}</em>
                      <button type="button" onClick={() => applySearchCriteria(search.criteria)}>Open</button>
                      <button type="button" onClick={() => handleSavedSearchStatus(search.id)}>{search.status === 'Active' ? 'Pause' : 'Activate'}</button>
                      <button type="button" onClick={() => handleSavedSearchDelete(search.id)}>Delete</button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state">
                  <h2>No saved searches yet</h2>
                  <p>Save search filters from the listings page to create alerts.</p>
                </div>
              )}
            </article>
            <article className="dashboard-panel">
              <div className="panel-heading"><h2>Recent Searches</h2></div>
              <div className="task-list">
                {recentSearches.length ? recentSearches.slice(0, 4).map((search) => (
                  <div key={search.id}>
                    <span><Icon name="search" /></span>
                    <div><h3>{search.name}</h3><p>{search.criteria.listingType === 'all' ? 'All listings' : search.criteria.listingType}</p></div>
                    <button type="button" onClick={() => applySearchCriteria(search.criteria)}>Open</button>
                  </div>
                )) : (
                  <div><span><Icon name="search" /></span><div><h3>No recent searches</h3><p>Recent filters will appear here.</p></div><strong>New</strong></div>
                )}
              </div>
            </article>
          </div>
        )}
        {variant === 'user' && activeSection === 'compare-properties' && (
          <div className="dashboard-grid">
            <article className="dashboard-panel wide-panel">
              <div className="panel-heading"><h2>Compare Properties</h2><button type="button" onClick={() => { clearCompare(); notify('Comparison cleared.') }}>Clear All</button></div>
              {compareProperties.length ? (
                <>
                  <div className="compact-list">
                    {compareProperties.map((property) => (
                      <div className="compact-property" key={property.id}>
                        <img src={property.image} alt={property.title} />
                        <div><h3>{property.title}</h3><p>{property.location}</p></div>
                        <button type="button" onClick={() => handleCompareRemove(property.id)}>Remove</button>
                      </div>
                    ))}
                  </div>
                  <div className="dashboard-table">
                    {[
                      ['Price', compareProperties.map((property) => formatPrice(property.price)).join(' / '), 'Value'],
                      ['Beds', compareProperties.map((property) => property.beds).join(' / '), 'Rooms'],
                      ['Baths', compareProperties.map((property) => property.baths).join(' / '), 'Rooms'],
                      ['Size', compareProperties.map((property) => `${property.sqft.toLocaleString()} sqft`).join(' / '), 'Area'],
                      ['Amenities', compareProperties.map((property) => property.amenities.slice(0, 3).join(', ')).join(' / '), 'Features'],
                      ['Location', compareProperties.map((property) => property.location).join(' / '), 'Area'],
                      ['Status', compareProperties.map((property) => property.availabilityStatus).join(' / '), 'Live'],
                    ].map(([name, detail, status]) => (
                      <div key={name}>
                        <strong>{name}</strong>
                        <span>{detail}</span>
                        <em>{status}</em>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="empty-state">
                  <h2>No properties selected</h2>
                  <p>Add up to 4 properties from cards or detail pages.</p>
                </div>
              )}
            </article>
            <article className="dashboard-panel">
              <div className="panel-heading"><h2>Quick Actions</h2></div>
              <div className="task-list">
                <div><span><Icon name="search" /></span><div><h3>Browse Listings</h3><p>Add homes to compare</p></div><Link to="/listings">Open</Link></div>
                <div><span><Icon name="heart" /></span><div><h3>Saved Homes</h3><p>{favoriteProperties.length} saved</p></div><Link to="/dashboard/user/saved-properties">View</Link></div>
              </div>
            </article>
          </div>
        )}
        {activeSection === 'messages' && (
          <MessagesPanel messages={relevantMessages} variant={variant} user={user} addMessageReply={addMessageReply} />
        )}
        {activeSection !== 'overview' && activeSection !== 'messages' && !(variant === 'user' && ['saved-searches', 'compare-properties'].includes(activeSection)) && (
          <div className="dashboard-grid">
            <article className="dashboard-panel wide-panel">
              <div className="panel-heading">
                <h2>{sectionTitle}</h2>
                {variant === 'agent' && activeSection === 'my-listings' ? (
                  <div className="status-filter-tabs">
                    {listingStatusFilters.map((status) => (
                      <button className={listingStatusFilter === status ? 'is-active' : ''} type="button" onClick={() => setListingStatusFilter(status)} key={status}>{status}</button>
                    ))}
                  </div>
                ) : (
                  <Link to={`/dashboard/${variant}`}>Overview</Link>
                )}
              </div>
              {variant === 'agent' && activeSection === 'my-listings' && (
                <>
                  <CsvImportPanel agent={currentAgentProfile} createListing={createListing} onImported={handleCsvImported} />
                  <BulkListingControls selectedCount={selectedListingIds.length} onApplyStatus={applyBulkListingStatus} onClear={() => setSelectedListingIds([])} />
                </>
              )}
              {visibleSectionRows.length ? (
                <div className="dashboard-table">
                  {visibleSectionRows.map((row) => {
                    const key = row.join('-')
                    const isListingRow = variant === 'agent' && activeSection === 'my-listings' && row[3]
                    const isInquiryRow = ((variant === 'agent' && ['messages', 'leads'].includes(activeSection)) || (variant === 'user' && activeSection === 'messages')) && row[3]
                    const isModerationRow = variant === 'admin' && ['properties', 'reports'].includes(activeSection) && row[3]
                    const isAdminUserRow = variant === 'admin' && ['users', 'agents'].includes(activeSection) && row[3]
                    if (isListingRow) {
                      return (
                        <div className="dashboard-table-row" key={key}>
                          <label className="listing-select"><input type="checkbox" checked={selectedListingIds.includes(row[3])} onChange={() => toggleListingSelection(row[3])} /> Select</label>
                          <strong>{row[0]}</strong>
                          <span>{row[1]}</span>
                          <em>{rowStatuses[key] || row[2]}</em>
                          <button type="button" onClick={() => navigate(`/dashboard/agent/edit-listing/${row[3]}`)}>Edit</button>
                          <button type="button" onClick={() => handleCloneListing(row[3])}>Clone Listing</button>
                          <button type="button" onClick={() => setPromotionTarget(getListing(row[3]))}>Promote</button>
                        </div>
                      )
                    }
                    if (variant === 'agent' && activeSection === 'leads' && isInquiryRow) {
                      return (
                        <div className="dashboard-table-row lead-pipeline-row" key={key}>
                          <strong>{row[0]}</strong>
                          <span>{row[1]}</span>
                          <select value={rowStatuses[key] || row[2] || 'New'} onChange={(event) => updateLeadStatus(row[3], event.target.value)}>
                            {leadStatuses.map((status) => <option key={status}>{status}</option>)}
                          </select>
                          <button type="button" onClick={() => openInquiry(row[3])}>Open</button>
                        </div>
                      )
                    }
                    return (
                      <button className="dashboard-table-row" onClick={() => isInquiryRow ? openInquiry(row[3]) : isModerationRow ? openModeration(row) : isAdminUserRow ? openAdminTarget(row) : handleRowAction(row)} type="button" key={key}>
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
                  : extras.secondary).map(([primary, secondary, meta], index) => (
                <div key={`${primary || 'item'}-${secondary || 'detail'}-${meta || 'meta'}-${index}`}>
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
            <h2>{variant === 'agent' ? `Inquiry from ${selectedInquiry.seekerName || selectedInquiry.name}` : 'Message Thread'}</h2>
            <label>Property<input value={selectedInquiry.propertyReference || selectedInquiry.propertyTitle || selectedInquiry.propertyId} readOnly /></label>
            <label>Email<input value={selectedInquiry.email || ''} readOnly /></label>
            <label>Phone<input value={selectedInquiry.phone || ''} readOnly /></label>
            <label>Message<textarea rows="4" value={selectedInquiry.message || ''} readOnly /></label>
            <label>Sent<input value={new Date(selectedInquiry.timestamp || selectedInquiry.createdAt).toLocaleString()} readOnly /></label>
            {(selectedInquiry.replies || []).map((reply) => (
              <label key={reply.id}>Reply from {reply.sender || 'Agent'}<textarea rows="3" value={`${reply.message}\n${new Date(reply.createdAt).toLocaleString()}`} readOnly /></label>
            ))}
            {variant === 'agent' && (
              <>
                <label>Status<select value={replyForm.status} onChange={(event) => setReplyForm({ ...replyForm, status: event.target.value })}>{leadStatuses.map((status) => <option key={status}>{status}</option>)}</select></label>
                {replyTemplates.length > 0 && <label>Reply Template<select value="" onChange={(event) => setReplyForm({ ...replyForm, message: event.target.value })}><option value="">Insert template</option>{replyTemplates.map((template) => <option value={template.message} key={template.id}>{template.title}</option>)}</select></label>}
                <label>Quick Reply<textarea rows="4" value={replyForm.message} onChange={(event) => setReplyForm({ ...replyForm, message: event.target.value })} placeholder="Write a quick reply" /></label>
                <button className="btn btn-primary" type="submit">Save Reply</button>
                <label>Template Title<input value={templateForm.title} onChange={(event) => setTemplateForm({ ...templateForm, title: event.target.value })} placeholder="Follow-up response" /></label>
                <label>Template Message<textarea rows="3" value={templateForm.message} onChange={(event) => setTemplateForm({ ...templateForm, message: event.target.value })} placeholder="Reusable reply text" /></label>
                <button className="btn btn-outline" onClick={handleTemplateSave} type="button">Save Template</button>
                {replyTemplates.map((template) => <button className="btn btn-ghost" onClick={() => deleteReplyTemplate(template.id)} type="button" key={template.id}>Delete {template.title}</button>)}
                <label>Private Note<textarea rows="3" value={leadNote} onChange={(event) => setLeadNote(event.target.value)} placeholder="Add a private note for this lead" /></label>
                <button className="btn btn-outline" onClick={handleLeadNoteSave} type="button">Save Note</button>
                {(selectedInquiry.notes || []).map((note) => <label key={note.id}>Saved Note<textarea rows="2" value={note.note} readOnly /></label>)}
                <label>Viewing Date<input type="date" value={viewingForm.date} onChange={(event) => setViewingForm({ ...viewingForm, date: event.target.value })} /></label>
                <label>Viewing Time<input type="time" value={viewingForm.time} onChange={(event) => setViewingForm({ ...viewingForm, time: event.target.value })} /></label>
                <button className="btn btn-outline" onClick={handleViewingSchedule} type="button">Schedule Viewing</button>
              </>
            )}
          </form>
        </div>
      )}
      {promotionTarget && (
        <PromotionRequestModal
          listing={promotionTarget}
          onClose={() => setPromotionTarget(null)}
          onSubmit={(details) => handlePromotionRequest(promotionTarget.id, details)}
        />
      )}
      {moderationTarget && (
        <div className="contact-modal" role="dialog" aria-modal="true">
          <div className="contact-form">
            <button className="modal-close" onClick={() => { setModerationTarget(null); setModerationEdits({}) }} type="button">Close</button>
            <h2>Moderate Listing</h2>
            <label>Listing ID<input value={moderationTarget.listing.id} readOnly /></label>
            <label>Title<input value={moderationEdits.title || ''} onChange={(event) => updateModerationEdit('title', event.target.value)} /></label>
            <label>Price<input type="number" min="0" value={moderationEdits.price ?? ''} onChange={(event) => updateModerationEdit('price', event.target.value)} /></label>
            <label>Category<select value={moderationEdits.category || 'Apartment'} onChange={(event) => updateModerationEdit('category', event.target.value)}>{categories.map((category) => <option key={category}>{category}</option>)}</select></label>
            <label>Status<select value={moderationEdits.status || 'Pending'} onChange={(event) => updateModerationEdit('status', event.target.value)}>{moderationStatusOptions.map((status) => <option key={status}>{status}</option>)}</select></label>
            <label>Description<textarea rows="4" value={moderationEdits.description || ''} onChange={(event) => updateModerationEdit('description', event.target.value)} /></label>
            {moderationTarget.report && <label>Report Listing ID<input value={moderationTarget.report.listingId} readOnly /></label>}
            {moderationTarget.report && <label>Reporting User<input value={moderationTarget.report.reporterName || moderationTarget.report.reporterEmail || moderationTarget.report.reporterId} readOnly /></label>}
            {moderationTarget.report && <label>Timestamp<input value={new Date(moderationTarget.report.timestamp || moderationTarget.report.createdAt).toLocaleString()} readOnly /></label>}
            {moderationTarget.report && <label>Report Reason<input value={moderationTarget.report.reason} readOnly /></label>}
            <label>Current Status<input value={moderationTarget.listing.moderationStatus || moderationTarget.listing.status || moderationTarget.listing.availabilityStatus} readOnly /></label>
            <label>Promotion Status<input value={moderationTarget.listing.promotion?.status || 'Not requested'} readOnly /></label>
            {moderationTarget.listing.promotion?.status && (() => {
              const summary = promotionSummaryFor(moderationTarget.listing.promotion)
              return (
                <>
                  <label>Selected Package<input value={summary.selectedPackage} readOnly /></label>
                  <label>Selected Duration<input value={summary.duration} readOnly /></label>
                  <label>Estimated Promotion Total<input value={`${formatPrice(summary.estimatedTotal)} (${formatPrice(summary.weeklyPrice)} x ${summary.durationWeeks} week${summary.durationWeeks > 1 ? 's' : ''})`} readOnly /></label>
                </>
              )
            })()}
            {moderationTarget.reportId && <label>Report Status<input value={moderationTarget.reportStatus} readOnly /></label>}
            {moderationHistory.filter((item) => item.listingId === moderationTarget.listing.id).slice(0, 4).map((item) => (
              <label key={item.id}>History<input value={`${item.action} - ${item.note}`} readOnly /></label>
            ))}
            <button className="btn btn-primary" onClick={() => { saveModerationChanges(); notify('Moderation changes saved.') }} type="button">Save Changes</button>
            {moderationTarget.report ? (
              <>
                <button className="btn btn-primary" onClick={() => applyModerationAction('Report Reviewed')} type="button">Review Report</button>
                <button className="btn btn-outline" onClick={() => applyModerationAction('Report Dismissed')} type="button">Dismiss Report</button>
                <button className="btn btn-outline" onClick={() => applyModerationAction('Suspended')} type="button">Suspend Listing</button>
                <button className="btn btn-outline" onClick={() => applyModerationAction('Off-Market')} type="button">Mark Off-Market</button>
                <button className="btn btn-outline" onClick={() => applyModerationAction('Expired')} type="button">Mark Expired</button>
                <button className="btn btn-ghost" onClick={() => applyModerationAction('Removed')} type="button">Remove Listing</button>
              </>
            ) : (
              <>
                <button className="btn btn-primary" onClick={() => applyModerationAction('Active')} type="button">Approve Listing</button>
                <button className="btn btn-outline" onClick={() => applyModerationAction('Rejected')} type="button">Reject Listing</button>
                {moderationTarget.listing.promotion?.status === 'Requested' && <button className="btn btn-primary" onClick={() => applyPromotionAction('Approved')} type="button">Approve Promotion</button>}
                {moderationTarget.listing.promotion?.status && <button className="btn btn-outline" onClick={() => applyPromotionAction('Removed')} type="button">Remove Promotion</button>}
                {listingStatuses.filter((status) => status !== 'Active').map((status) => (
                  <button className="btn btn-outline" onClick={() => applyModerationAction(status)} type="button" key={status}>Mark {status}</button>
                ))}
                <button className="btn btn-ghost" onClick={() => applyModerationAction('Suspended')} type="button">Suspend Listing</button>
              </>
            )}
          </div>
        </div>
      )}
      {adminTarget && (
        <div className="contact-modal" role="dialog" aria-modal="true">
          <div className="contact-form">
            <button className="modal-close" onClick={() => setAdminTarget(null)} type="button">Close</button>
            <h2>{adminTarget.mode === 'agent' ? 'Agent Verification' : 'User Management'}</h2>
            <label>Name<input value={adminTarget.user.name} readOnly /></label>
            <label>Email<input value={adminTarget.user.email} readOnly /></label>
            <label>Account Status<input value={adminTarget.user.accountStatus || 'Active'} readOnly /></label>
            <label>Email Verification<input value={adminTarget.user.emailVerified ? 'Verified' : 'Unverified'} readOnly /></label>
            <label>Phone Verification<input value={adminTarget.user.phoneVerified ? 'Verified' : 'Unverified'} readOnly /></label>
            {adminTarget.mode === 'agent' && <label>Company<input value={adminTarget.user.agentVerification?.company || ''} readOnly /></label>}
            {adminTarget.mode === 'agent' && <label>License<input value={adminTarget.user.agentVerification?.license || ''} readOnly /></label>}
            {adminTarget.mode === 'agent' && (() => {
              const expiry = verificationExpiryStatus(adminTarget.user.agentVerification || {})
              return (
                <div className="verification-status-card">
                  <strong>Verification Expiry</strong>
                  <span className={`verification-badge ${expiry.label.toLowerCase().replaceAll(' ', '-')}`}>{expiry.label}</span>
                  <small>{expiry.expiryDate ? `Expires ${expiry.expiryDate.toLocaleDateString()}` : 'Awaiting review'}</small>
                </div>
              )
            })()}
            {adminTarget.mode === 'agent' && (
              <div className="verification-document-grid">
                {(adminTarget.user.agentVerification?.documents || []).length ? (
                  (adminTarget.user.agentVerification?.documents || []).map((document, index) => (
                    <div className="verification-document-card" key={`${document.type || 'Document'}-${document.name || index}`}>
                      <strong>{document.type || 'Document'}</strong>
                      <span>{document.name || 'Unnamed document'}</span>
                      <small>{Math.round((document.size || 0) / 1024)} KB / {document.type || 'unknown type'}</small>
                      <small>{document.uploadedAt ? new Date(document.uploadedAt).toLocaleString() : 'Upload date unavailable'}</small>
                    </div>
                  ))
                ) : (
                  <div className="verification-document-card"><span>No documents submitted</span></div>
                )}
              </div>
            )}
            {adminTarget.mode === 'agent' && <label>Rejection / Revocation Reason<textarea rows="3" value={adminReason} onChange={(event) => setAdminReason(event.target.value)} placeholder="Reason for rejection or revocation" /></label>}
            {moderationHistory.filter((item) => item.note?.includes(adminTarget.user.name)).slice(0, 3).map((item) => (
              <label key={item.id}>History<input value={`${item.type}: ${item.action}`} readOnly /></label>
            ))}
            {adminTarget.mode === 'agent' ? (
              <>
                <button className="btn btn-primary" onClick={() => applyAgentVerification('Approved')} type="button">Approve Verification</button>
                <button className="btn btn-outline" onClick={() => applyAgentVerification('Rejected')} type="button">Reject Verification</button>
                <button className="btn btn-ghost" onClick={() => applyAgentVerification('Revoked')} type="button">Revoke Verification</button>
              </>
            ) : (
              <>
                <button className="btn btn-primary" onClick={() => applyUserStatus('Active')} type="button">Restore User</button>
                <button className="btn btn-outline" onClick={() => applyUserStatus('Suspended')} type="button">Suspend User</button>
                <button className="btn btn-ghost" onClick={() => applyUserStatus('Banned')} type="button">Ban User</button>
              </>
            )}
          </div>
        </div>
      )}
    </main>
  )
}
