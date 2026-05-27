import { AuthProvider } from './AuthContext'
import { ListingProvider } from './ListingContext'
import { SocialProvider } from './SocialContext'
import { UIProvider } from './UIContext'

export default function AppProviders({ children }) {
  return (
    <UIProvider>
      <AuthProvider>
        <ListingProvider>
          <SocialProvider>{children}</SocialProvider>
        </ListingProvider>
      </AuthProvider>
    </UIProvider>
  )
}
