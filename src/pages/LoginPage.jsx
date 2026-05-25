import { useState } from 'react'
import Icon from '../components/common/Icon'

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false)

  return (
    <main className="auth-page">
      <a className="brand auth-brand" href="/"><span className="brand-mark"><Icon name="home" /></span><span>Luxora Homes</span></a>
      <section className="auth-card">
        <span className="eyebrow">Welcome back</span>
        <h1>Sign In</h1>
        <p>Access saved homes, viewing schedules, and agent messages.</p>
        <form className="auth-form" onSubmit={(event) => event.preventDefault()}>
          <label>Email Address<input type="email" placeholder="name@example.com" /></label>
          <label>Password<input type={showPassword ? 'text' : 'password'} placeholder="Enter your password" /></label>
          <div className="form-row">
            <label className="check-label"><input type="checkbox" /> Remember me</label>
            <a href="/auth/forgot-password">Forgot password?</a>
          </div>
          <button className="btn btn-primary" type="submit">Sign In <Icon name="arrow" /></button>
        </form>
        <button className="btn btn-outline auth-wide" type="button" onClick={() => setShowPassword((value) => !value)}>
          {showPassword ? 'Hide password' : 'Show password'}
        </button>
        <p className="auth-switch">Do not have an account? <a href="/auth/register">Create one</a></p>
      </section>
    </main>
  )
}
