import { useListings } from '../context/ListingContext'
import { useSocial } from '../context/SocialContext'

export function useFavoriteProperties() {
  const social = useSocial()
  const { allListings } = useListings()
  const favoriteProperties = allListings.filter((property) => social.favoriteIds.includes(property.id))
  const recentProperties = allListings.filter((property) => social.recentIds.includes(property.id))
  const compareProperties = allListings.filter((property) => social.compareIds.includes(property.id))

  return {
    ...social,
    favoriteProperties,
    recentProperties,
    compareProperties,
  }
}
