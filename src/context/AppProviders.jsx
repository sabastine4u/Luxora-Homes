import { AuthProvider } from './AuthContext'
import { SocialProvider } from './SocialContext'
import { UIProvider } from './UIContext'

export default function AppProviders({ children }) {
  return (
    <UIProvider>
      <AuthProvider>
        <SocialProvider>{children}</SocialProvider>
      </AuthProvider>
    </UIProvider>
  )
}
