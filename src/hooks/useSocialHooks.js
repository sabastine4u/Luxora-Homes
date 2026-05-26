import { listingProperties } from '../data/marketplace'
import { useSocial } from '../context/SocialContext'

export function useFavoriteProperties() {
  const social = useSocial()
  const favoriteProperties = listingProperties.filter((property) => social.favoriteIds.includes(property.id))
  const recentProperties = listingProperties.filter((property) => social.recentIds.includes(property.id))

  return {
    ...social,
    favoriteProperties,
    recentProperties,
  }
}
