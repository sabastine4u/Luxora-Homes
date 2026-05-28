import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import Icon from '../components/common/Icon'
import { useAuth } from '../context/AuthContext'
import { useUI } from '../context/UIContext'

const types = [
  ['buyer', 'Buyer', 'Browse, save, and schedule viewings'],
  ['seller', 'Seller', 'Prepare your property for market'],
  ['agent', 'Agent', 'Apply for verified listing access'],
]

export default function RegisterPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { register, isAuthLoading, authError } = useAuth()
  const { notify } = useUI()
  const defaultType = searchParams.get('type') || 'buyer'
  const [type, setType] = useState(defaultType)
  const [step, setStep] = useState(1)
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', company: '', license: '', idDocument: null, licenseDocument: null })
  const isAgent = type === 'agent'

  const handleTypeChange = (value) => {
    setType(value)
    setStep(1)
  }

  const updateForm = (field, value) => setForm((current) => ({ ...current, [field]: value }))
  const updateFile = (field, file) => updateForm(field, file ? { name: file.name, size: file.size, type: file.type } : null)

  const handleSubmit = async (event) => {
    event.preventDefault()
    try {
      const nextUser = await register({ ...form, type })
      notify(type === 'agent' ? 'Agent application created.' : 'Account created.')
      navigate(`/dashboard/${nextUser.role === 'agent' ? 'agent' : 'user'}`, { replace: true })
    } catch (error) {
      notify(error.message || 'Could not create the account.', 'error')
    }
  }

  return (
    <main className="auth-page auth-page-wide">
      <Link className="brand auth-brand" to="/"><span className="brand-mark"><Icon name="home" /></span><span>Luxora Homes</span></Link>
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
        <form className="auth-form two-col-form" onSubmit={handleSubmit}>
          {(!isAgent || step === 1) && (
            <>
              <label>Full Name<input value={form.name} onChange={(event) => updateForm('name', event.target.value)} placeholder="Enter your full name" required /></label>
              <label>Email Address<input type="email" value={form.email} onChange={(event) => updateForm('email', event.target.value)} placeholder="name@example.com" required /></label>
              <label>Phone Number<input value={form.phone} onChange={(event) => updateForm('phone', event.target.value)} placeholder="+234 ..." /></label>
              <label>Password<input type="password" value={form.password} onChange={(event) => updateForm('password', event.target.value)} placeholder="Create a password" required /></label>
            </>
          )}
          {isAgent && step === 2 && (
            <>
              <label>Company Name<input value={form.company} onChange={(event) => updateForm('company', event.target.value)} placeholder="Agency or company name" /></label>
              <label>License Number<input value={form.license} onChange={(event) => updateForm('license', event.target.value)} placeholder="REBN/2026/12345" /></label>
              <label>Experience<select><option>3-5 years</option><option>5-10 years</option><option>10+ years</option></select></label>
              <label>Specialization<select><option>Luxury Real Estate</option><option>Commercial</option><option>Rental Management</option></select></label>
              <label className="full-field">Office Address<textarea rows="3" placeholder="Enter office address" /></label>
            </>
          )}
          {isAgent && step === 3 && (
            <>
              <label>ID Document<input type="file" onChange={(event) => updateFile('idDocument', event.target.files?.[0])} /></label>
              <label>License Document<input type="file" onChange={(event) => updateFile('licenseDocument', event.target.files?.[0])} /></label>
              <label className="full-field">Portfolio URL<input placeholder="https://..." /></label>
              <label className="full-field">Professional Bio<textarea rows="4" placeholder="Tell clients about your expertise" /></label>
            </>
          )}
          <label className="check-label full-field"><input type="checkbox" /> I agree to the marketplace terms and verification policy</label>
          {isAgent && step < 3 ? (
            <button className="btn btn-primary full-field" type="button" onClick={() => setStep((value) => value + 1)}>Continue <Icon name="arrow" /></button>
          ) : (
            <>
              {authError && <p className="form-error full-field">{authError}</p>}
              <button className="btn btn-primary full-field" type="submit" disabled={isAuthLoading}>{isAuthLoading ? 'Creating...' : 'Create Account'} <Icon name="arrow" /></button>
            </>
          )}
        </form>
        <p className="auth-switch">Already have an account? <Link to="/auth/login">Sign in</Link></p>
      </section>
    </main>
  )
}
