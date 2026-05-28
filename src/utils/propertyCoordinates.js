const coordinateStorageKey = 'luxora-property-coordinates'

const presets = [
  ['banana island', [6.4478, 3.4246]],
  ['victoria island', [6.4281, 3.4219]],
  ['ibeju-lekki', [6.4698, 3.7031]],
  ['lekki', [6.4698, 3.5852]],
  ['ikoyi', [6.4541, 3.4306]],
  ['ikeja', [6.6018, 3.3515]],
  ['yaba', [6.5095, 3.3711]],
  ['ajah', [6.4654, 3.5658]],
  ['surulere', [6.4969, 3.3608]],
  ['chevron', [6.4423, 3.5355]],
  ['ogba', [6.6254, 3.3354]],
  ['gbagada', [6.5583, 3.3842]],
  ['akoka', [6.5158, 3.3898]],
  ['alimosho', [6.6106, 3.2958]],
  ['gwarinpa', [9.1099, 7.4042]],
  ['wuse 2', [9.082, 7.4738]],
  ['maitama', [9.0999, 7.4951]],
  ['ojo', [6.4627, 3.1722]],
  ['oregun', [6.6167, 3.3602]],
  ['sangotedo', [6.4709, 3.6372]],
  ['abeokuta', [7.1475, 3.3619]],
  ['asokoro', [9.0437, 7.5247]],
]

const readStoredCoordinates = () => {
  try {
    return JSON.parse(localStorage.getItem(coordinateStorageKey)) || {}
  } catch {
    return {}
  }
}

const writeStoredCoordinates = (coordinates) => {
  localStorage.setItem(coordinateStorageKey, JSON.stringify(coordinates))
}

const offsetFromId = (id = '') => {
  const seed = id.toString().split('').reduce((total, char) => total + char.charCodeAt(0), 0)
  return [
    ((seed % 17) - 8) * 0.0012,
    (((seed * 7) % 17) - 8) * 0.0012,
  ]
}

const baseCoordinatesForLocation = (location = '') => {
  const normalized = location.toLowerCase()
  const match = presets.find(([label]) => normalized.includes(label))
  if (match) return match[1]
  if (normalized.includes('abuja')) return [9.0765, 7.3986]
  return [6.5244, 3.3792]
}

export const resolvePropertyCoordinates = (property) => {
  if (Number.isFinite(property.latitude) && Number.isFinite(property.longitude)) {
    return { latitude: property.latitude, longitude: property.longitude }
  }

  const stored = readStoredCoordinates()
  if (stored[property.id]) return stored[property.id]

  const [baseLat, baseLng] = baseCoordinatesForLocation(property.location)
  const [latOffset, lngOffset] = offsetFromId(property.id)
  const coordinates = {
    latitude: Number((baseLat + latOffset).toFixed(6)),
    longitude: Number((baseLng + lngOffset).toFixed(6)),
  }
  writeStoredCoordinates({ ...stored, [property.id]: coordinates })
  return coordinates
}

export const withPropertyCoordinates = (property) => ({
  ...property,
  ...resolvePropertyCoordinates(property),
})
