import { useEffect } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
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
import AgencyPage from './pages/AgencyPage'
import DashboardPage from './pages/DashboardPage'
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import ListingsPage from './pages/ListingsPage'
import LoginPage from './pages/LoginPage'
import PropertyDetailsPage from './pages/PropertyDetailsPage'
import RegisterPage from './pages/RegisterPage'
import { ProtectedRoute } from './hooks/useAuthGuard'
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

function ScrollToRouteTarget() {
  const { hash, pathname, search } = useLocation()

  useEffect(() => {
    if (hash) {
      const target = document.getElementById(decodeURIComponent(hash.slice(1)))
      if (target) {
        target.scrollIntoView({ block: 'start' })
        return
      }
    }

    window.scrollTo({ top: 0, left: 0 })
  }, [hash, pathname, search])

  return null
}

function App() {
  return (
    <>
      <ScrollToRouteTarget />
      <Routes>
        <Route path="/" element={<main className="app-shell"><HomePage /></main>} />
        <Route path="/listings" element={<ListingsPage />} />
        <Route path="/agents" element={<AgentsPage />} />
        <Route path="/agency/:id" element={<AgencyPage />} />
        <Route path="/property/:id" element={<PropertyDetailsPage />} />
        <Route path="/auth/login" element={<LoginPage />} />
        <Route path="/auth/register" element={<RegisterPage />} />
        <Route path="/auth/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/dashboard/user/*" element={<ProtectedRoute roles={['user', 'agent', 'admin']}><DashboardPage variant="user" /></ProtectedRoute>} />
        <Route path="/dashboard/agent/*" element={<ProtectedRoute roles={['agent', 'admin']}><DashboardPage variant="agent" /></ProtectedRoute>} />
        <Route path="/dashboard/admin/*" element={<ProtectedRoute roles={['admin']}><DashboardPage variant="admin" /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  )
}

export default App
