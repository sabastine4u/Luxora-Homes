import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import Icon from '../components/common/Icon'
import { useAuth } from '../context/AuthContext'
import { useUI } from '../context/UIContext'
import { dashboardPathForRole } from '../hooks/useAuthGuard'

const resolvePostLoginPath = (user, from) => {
  const dashboardPath = dashboardPathForRole(user?.role)
  if (!from) return dashboardPath
  if (!from.startsWith('/dashboard/')) return from
  return from === dashboardPath || from.startsWith(`${dashboardPath}/`) ? from : dashboardPath
}

export default function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { login, isAuthLoading, authError } = useAuth()
  const { notify } = useUI()
  const [showPassword, setShowPassword] = useState(false)
  const [form, setForm] = useState({ email: 'john@luxora.demo', password: 'password' })

  const handleSubmit = async (event) => {
    event.preventDefault()
    try {
      const nextUser = await login(form)
      notify(`Welcome back, ${nextUser.name}.`)
      navigate(resolvePostLoginPath(nextUser, location.state?.from), { replace: true })
    } catch {
      notify('Sign in failed. Check the demo credentials.', 'error')
    }
  }

  return ( 
    <main className="login-split-page">
      <section className="login-visual-panel">
        <img src="https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200&h=1600&fit=crop" alt="Luxury property" />
        <div className="login-visual-card">
          <h2>Find Your Dream Home</h2>
          <p>Access thousands of premium properties with verified agents and seamless transactions.</p>
          <div className="login-visual-stats">
            <div><strong>50K+</strong><span>Properties</span></div>
            <div><strong>10K+</strong><span>Happy Clients</span></div>
            <div><strong>500+</strong><span>Agents</span></div>
          </div>
        </div>
      </section>

      <section className="login-form-panel">
        <div className="login-form-shell">
          <Link className="brand auth-brand" to="/"><span className="brand-mark"><Icon name="home" /></span><span>Luxora Homes</span></Link>
          <div className="auth-card login-card-flat">
            <span className="eyebrow">Welcome back</span>
            <h1>Sign In</h1>
            <p>Access your account and continue your property search.</p>
            <form className="auth-form" onSubmit={handleSubmit}>
              <label>Email Address<input type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} placeholder="Enter your email" required /></label>
              <label>Password<input type={showPassword ? 'text' : 'password'} value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} placeholder="Enter your password" required /></label>
              <div className="form-row">
                <label className="check-label"><input type="checkbox" /> Remember me</label>
                <Link to="/auth/forgot-password">Forgot password?</Link>
              </div>
              {authError && <p className="form-error">{authError}</p>}
              <button className="btn btn-primary" type="submit" disabled={isAuthLoading}>{isAuthLoading ? 'Signing in...' : 'Sign In'} <Icon name="arrow" /></button>
            </form>
            <button className="btn btn-outline auth-wide" type="button" onClick={() => setShowPassword((value) => !value)}>
              {showPassword ? 'Hide password' : 'Show password'}
            </button>
            <div className="auth-divider"><span>or continue with</span></div>
            <div className="social-login-grid">
              <button type="button" onClick={() => notify('Use the demo email login for this frontend preview.', 'warning')}>Google</button>
              <button type="button" onClick={() => notify('Use the demo email login for this frontend preview.', 'warning')}>Facebook</button>
            </div>
            <p className="auth-switch">Do not have an account? <Link to="/auth/register">Create one</Link></p>
          </div>
        </div>
      </section>
    </main>
  )
}
