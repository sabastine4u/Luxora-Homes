import { listingProperties } from '../data/marketplace'

const wait = (ms = 450) => new Promise((resolve) => setTimeout(resolve, ms))

const users = [
  {
    id: 'user-1',
    name: 'John Doe',
    email: 'john@luxora.demo',
    password: 'password',
    role: 'user',
    phone: '+234 800 123 4567',
  },
  {
    id: 'agent-1',
    name: 'Sarah Agent',
    email: 'agent@luxora.demo',
    password: 'password',
    role: 'agent',
    phone: '+234 802 345 6789',
  },
  {
    id: 'admin-1',
    name: 'Admin',
    email: 'admin@luxora.demo',
    password: 'password',
    role: 'admin',
    phone: '+234 803 456 7890',
  },
]

const normalize = (value = '') => value.toString().trim().toLowerCase()

const parseMinimum = (value) => {
  if (!value || value === 'Any') return 0
  return Number.parseInt(value, 10) || 0
}

export async function loginUser({ email, password }) {
  await wait()
  const user = users.find((item) => item.email === normalize(email) && item.password === password)

  if (!user) {
    throw new Error('Use john@luxora.demo, agent@luxora.demo, or admin@luxora.demo with password "password".')
  }

  const safeUser = { ...user }
  delete safeUser.password
  return safeUser
}

export async function registerUser(payload) {
  await wait(650)
  const role = payload.type === 'agent' ? 'agent' : 'user'

  return {
    id: `${role}-${Date.now()}`,
    name: payload.name || 'Luxora Member',
    email: payload.email,
    phone: payload.phone,
    role,
  }
}

export async function searchProperties(filters = {}) {
  await wait(350)
  const query = normalize(filters.query)
  const type = filters.listingType || 'all'
  const selectedTypes = filters.propertyTypes || []
  const selectedAmenities = filters.amenities || []
  const minBeds = parseMinimum(filters.beds)
  const minBaths = parseMinimum(filters.baths)
  const maxPrice = Number(filters.price || 100) * 1000000

  let results = listingProperties.filter((property) => {
    const searchable = normalize(`${property.title} ${property.location} ${property.category} ${property.amenities.join(' ')}`)
    const matchesQuery = !query || searchable.includes(query)
    const matchesType = type === 'all' || property.type === type
    const matchesCategory = selectedTypes.length === 0 || selectedTypes.includes(property.category)
    const matchesAmenities = selectedAmenities.every((amenity) => property.amenities.includes(amenity))
    const matchesBeds = minBeds === 0 || property.beds >= minBeds
    const matchesBaths = minBaths === 0 || property.baths >= minBaths
    const matchesPrice = property.price <= maxPrice || property.priceType === 'total'

    return matchesQuery && matchesType && matchesCategory && matchesAmenities && matchesBeds && matchesBaths && matchesPrice
  })

  if (filters.sort === 'price-low') results = [...results].sort((a, b) => a.price - b.price)
  if (filters.sort === 'price-high') results = [...results].sort((a, b) => b.price - a.price)
  if (filters.sort === 'popular') results = [...results].sort((a, b) => Number(Boolean(b.isFeatured)) - Number(Boolean(a.isFeatured)))
  if (!filters.sort || filters.sort === 'recent') results = [...results].sort((a, b) => new Date(b.listedDate) - new Date(a.listedDate))

  return results
}

export async function getProperty(id) {
  await wait(300)
  const property = listingProperties.find((item) => item.id === id)
  if (!property) throw new Error('Property not found.')
  return property
}

export async function submitLead(payload) {
  await wait(550)
  return {
    id: `lead-${Date.now()}`,
    createdAt: new Date().toISOString(),
    status: 'sent',
    ...payload,
  }
}

export async function createViewing(payload) {
  await wait(500)
  return {
    id: `viewing-${Date.now()}`,
    status: 'Scheduled',
    date: payload.date || 'Tomorrow',
    time: payload.time || '10:30 AM',
    ...payload,
  }
}
