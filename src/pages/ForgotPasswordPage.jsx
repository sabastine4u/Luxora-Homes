import { useState } from 'react'
import Icon from '../components/common/Icon'

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false)
  const [email, setEmail] = useState('')

  return (
    <main className="auth-page">
      <a className="brand auth-brand" href="/"><span className="brand-mark"><Icon name="home" /></span><span>Luxora Homes</span></a>
      <section className="auth-card">
        {!sent ? (
          <>
            <span className="eyebrow">Account recovery</span>
            <h1>Forgot Password?</h1>
            <p>Enter your email and we will send a reset link.</p>
            <form className="auth-form" onSubmit={(event) => { event.preventDefault(); setSent(true) }}>
              <label>Email Address<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="name@example.com" required /></label>
              <button className="btn btn-primary" type="submit">Send Reset Link <Icon name="arrow" /></button>
            </form>
          </>
        ) : (
          <div className="success-state">
            <span><Icon name="check" /></span>
            <h1>Check Your Email</h1>
            <p>We sent a password reset link to {email}.</p>
            <button className="btn btn-outline" onClick={() => setSent(false)} type="button">Try another email</button>
          </div>
        )}
        <p className="auth-switch"><a href="/auth/login">Back to Sign In</a></p>
      </section>
    </main>
  )
}
