import { useState } from 'react'
import Icon from '../components/common/Icon'

const types = [
  ['buyer', 'Buyer', 'Browse, save, and schedule viewings'],
  ['seller', 'Seller', 'Prepare your property for market'],
  ['agent', 'Agent', 'Apply for verified listing access'],
]

export default function RegisterPage() {
  const defaultType = new URLSearchParams(window.location.search).get('type') || 'buyer'
  const [type, setType] = useState(defaultType)
  const [step, setStep] = useState(1)
  const isAgent = type === 'agent'

  const handleTypeChange = (value) => {
    setType(value)
    setStep(1)
  }

  return (
    <main className="auth-page auth-page-wide">
      <a className="brand auth-brand" href="/"><span className="brand-mark"><Icon name="home" /></span><span>Luxora Homes</span></a>
      <section className="auth-card register-card">
        <span className="eyebrow">Create account</span>
        <h1>Join Luxora</h1>
        <p>Select how you want to use the marketplace.</p>
        <div className="type-grid">
          {types.map(([value, label, note]) => (
            <button className={type === value ? 'is-active' : ''} key={value} onClick={() => handleTypeChange(value)} type="button">
              <strong>{label}</strong><span>{note}</span>
            </button>
          ))}
        </div>
        {isAgent && (
          <div className="stepper">
            {[1, 2, 3].map((value) => <button className={step === value ? 'is-active' : ''} key={value} onClick={() => setStep(value)} type="button">Step {value}</button>)}
          </div>
        )}
        <form className="auth-form two-col-form" onSubmit={(event) => event.preventDefault()}>
          {(!isAgent || step === 1) && (
            <>
              <label>Full Name<input placeholder="Enter your full name" /></label>
              <label>Email Address<input type="email" placeholder="name@example.com" /></label>
              <label>Phone Number<input placeholder="+234 ..." /></label>
              <label>Password<input type="password" placeholder="Create a password" /></label>
            </>
          )}
          {isAgent && step === 2 && (
            <>
              <label>Company Name<input placeholder="Agency or company name" /></label>
              <label>License Number<input placeholder="REBN/2026/12345" /></label>
              <label>Experience<select><option>3-5 years</option><option>5-10 years</option><option>10+ years</option></select></label>
              <label>Specialization<select><option>Luxury Real Estate</option><option>Commercial</option><option>Rental Management</option></select></label>
              <label className="full-field">Office Address<textarea rows="3" placeholder="Enter office address" /></label>
            </>
          )}
          {isAgent && step === 3 && (
            <>
              <label>ID Document<input type="file" /></label>
              <label>License Document<input type="file" /></label>
              <label className="full-field">Portfolio URL<input placeholder="https://..." /></label>
              <label className="full-field">Professional Bio<textarea rows="4" placeholder="Tell clients about your expertise" /></label>
            </>
          )}
          <label className="check-label full-field"><input type="checkbox" /> I agree to the marketplace terms and verification policy</label>
          {isAgent && step < 3 ? (
            <button className="btn btn-primary full-field" type="button" onClick={() => setStep((value) => value + 1)}>Continue <Icon name="arrow" /></button>
          ) : (
            <button className="btn btn-primary full-field" type="submit">Create Account <Icon name="arrow" /></button>
          )}
        </form>
        <p className="auth-switch">Already have an account? <a href="/auth/login">Sign in</a></p>
      </section>
    </main>
  )
}
