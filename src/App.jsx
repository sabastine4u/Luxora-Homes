import Navbar from './components/layout/Navbar'
import Footer from './components/layout/Footer'
import HeroSection from './components/sections/HeroSection'
import FeaturedProperties from './components/sections/FeaturedProperties'
import PropertyCategories from './components/sections/PropertyCategories'
import PopularCities from './components/sections/PopularCities'
import WhyChooseUs from './components/sections/WhyChooseUs'
import VerifiedAgents from './components/sections/VerifiedAgents'
import Testimonials from './components/sections/Testimonials'
import CTASection from './components/sections/CTASection'
import AgentsPage from './pages/AgentsPage'
import DashboardPage from './pages/DashboardPage'
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import ListingsPage from './pages/ListingsPage'
import LoginPage from './pages/LoginPage'
import PropertyDetailsPage from './pages/PropertyDetailsPage'
import RegisterPage from './pages/RegisterPage'
import './App.css'

function HomePage() {
  return (
    <>
      <Navbar />
      <HeroSection />
      <FeaturedProperties />
      <PropertyCategories />
      <PopularCities />
      <WhyChooseUs />
      <VerifiedAgents />
      <Testimonials />
      <CTASection />
      <Footer />
    </>
  )
}

function App() {
  const path = window.location.pathname
  const route = path.replace(/\/$/, '') || '/'

  if (route === '/listings') return <ListingsPage />
  if (route === '/agents') return <AgentsPage />
  if (route.startsWith('/property/')) return <PropertyDetailsPage />
  if (route === '/auth/login') return <LoginPage />
  if (route === '/auth/register') return <RegisterPage />
  if (route === '/auth/forgot-password') return <ForgotPasswordPage />
  if (route.startsWith('/dashboard/user')) return <DashboardPage variant="user" />
  if (route.startsWith('/dashboard/agent')) return <DashboardPage variant="agent" />
  if (route.startsWith('/dashboard/admin')) return <DashboardPage variant="admin" />

  return (
    <main className="app-shell">
      <HomePage />
    </main>
  )
}

export default App
