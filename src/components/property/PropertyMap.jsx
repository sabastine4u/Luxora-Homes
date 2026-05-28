import { useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet'
import L from 'leaflet'
import markerIconUrl from 'leaflet/dist/images/marker-icon.png'
import markerIconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png'
import markerShadowUrl from 'leaflet/dist/images/marker-shadow.png'
import Icon from '../common/Icon'

const markerIcon = new L.Icon({
  iconUrl: markerIconUrl,
  iconRetinaUrl: markerIconRetinaUrl,
  shadowUrl: markerShadowUrl,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
})

const formatPrice = (price) =>
  new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    maximumFractionDigits: 0,
  }).format(price)

function MapBounds({ properties }) {
  const map = useMap()

  useEffect(() => {
    const points = properties
      .filter((property) => Number.isFinite(property.latitude) && Number.isFinite(property.longitude))
      .map((property) => [property.latitude, property.longitude])

    if (points.length > 1) {
      map.fitBounds(points, { padding: [32, 32], maxZoom: 13 })
    }
  }, [map, properties])

  return null
}

export default function PropertyMap({ properties = [], property, height = 340 }) {
  const mapProperties = useMemo(() => (property ? [property] : properties), [properties, property])
  const validProperties = useMemo(() => mapProperties.filter((item) => Number.isFinite(item.latitude) && Number.isFinite(item.longitude)), [mapProperties])
  const center = validProperties[0] ? [validProperties[0].latitude, validProperties[0].longitude] : [6.5244, 3.3792]
  const mapKey = validProperties.map((item) => `${item.id}:${item.latitude}:${item.longitude}`).join('|') || 'fallback-map'

  return (
    <div className="property-map" style={{ minHeight: height }}>
      <MapContainer key={mapKey} center={center} zoom={property ? 15 : 11} scrollWheelZoom={false}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {!property && <MapBounds properties={validProperties} />}
        {validProperties.map((item) => (
          <Marker icon={markerIcon} key={item.id} position={[item.latitude, item.longitude]}>
            <Popup>
              <div className="map-popup">
                <strong>{item.title}</strong>
                <span><Icon name="pin" /> {item.location}</span>
                <span>{formatPrice(item.price)}/{item.priceType}</span>
                <Link to={`/property/${item.id}`}>View details</Link>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  )
}
