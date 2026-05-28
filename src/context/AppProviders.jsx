import { AuthProvider } from './AuthContext'
import { useAuth } from './AuthContext'
import { ListingProvider } from './ListingContext'
import { ContentProvider } from './ContentContext'
import { SocialProvider } from './SocialContext'
import { UIProvider } from './UIContext'

function SocialProviderScope({ children }) {
  const { user } = useAuth()
  return <SocialProvider key={user?.id || user?.email || 'guest'}>{children}</SocialProvider>
}

export default function AppProviders({ children }) {
  return (
    <UIProvider>
      <AuthProvider>
        <ContentProvider>
          <ListingProvider>
            <SocialProviderScope>{children}</SocialProviderScope>
          </ListingProvider>
        </ContentProvider>
      </AuthProvider>
    </UIProvider>
  )
}
