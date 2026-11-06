import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

const STEPS = { EMAIL: 'EMAIL', OTP: 'OTP', DETAILS: 'DETAILS' }
const OTP_LENGTH = 6
const RESEND_COOLDOWN = 60 // seconds

export default function Register() {
  const { sendOtp, verifyOtp, register } = useAuth()
  const navigate = useNavigate()

  const [step, setStep] = useState(STEPS.EMAIL)
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState(Array(OTP_LENGTH).fill(''))
  const [form, setForm] = useState({ name: '', password: '', confirmPassword: '' })
  const [emailVerifiedToken, setEmailVerifiedToken] = useState('')

  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Resend cooldown
  const [cooldown, setCooldown] = useState(0)
  const cooldownRef = useRef(null)

  // Refs for OTP input boxes
  const otpRefs = useRef([])

  useEffect(() => {
    return () => clearInterval(cooldownRef.current)
  }, [])

  function startCooldown() {
    setCooldown(RESEND_COOLDOWN)
    clearInterval(cooldownRef.current)
    cooldownRef.current = setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(cooldownRef.current)
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  // --- Step 1: Send OTP ---
  const handleSendOtp = async (e) => {
    e.preventDefault()
    setError('')

    const trimmed = email.trim().toLowerCase()
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setError('Please enter a valid email address.')
      return
    }

    try {
      setSubmitting(true)
      await sendOtp(trimmed)
      setEmail(trimmed)
      setStep(STEPS.OTP)
      startCooldown()
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  // --- OTP input handlers ---
  const handleOtpChange = (index, value) => {
    if (!/^\d?$/.test(value)) return // only single digits
    const newOtp = [...otp]
    newOtp[index] = value
    setOtp(newOtp)

    // auto-advance to next box
    if (value && index < OTP_LENGTH - 1) {
      otpRefs.current[index + 1]?.focus()
    }
  }

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus()
    }
  }

  const handleOtpPaste = (e) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').trim().slice(0, OTP_LENGTH)
    if (!/^\d+$/.test(pasted)) return
    const digits = pasted.split('')
    const newOtp = [...otp]
    digits.forEach((d, i) => {
      newOtp[i] = d
    })
    setOtp(newOtp)
    // Focus the next empty box or the last one
    const nextEmpty = newOtp.findIndex((d) => !d)
    otpRefs.current[nextEmpty >= 0 ? nextEmpty : OTP_LENGTH - 1]?.focus()
  }

  // --- Step 2: Verify OTP ---
  const handleVerifyOtp = async (e) => {
    e.preventDefault()
    setError('')

    const otpString = otp.join('')
    if (otpString.length < OTP_LENGTH) {
      setError('Please enter the full 6-digit code.')
      return
    }

    try {
      setSubmitting(true)
      const { emailVerifiedToken: token } = await verifyOtp(email, otpString)
      setEmailVerifiedToken(token)
      setStep(STEPS.DETAILS)
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  // Resend OTP
  const handleResend = async () => {
    if (cooldown > 0) return
    setError('')
    try {
      setSubmitting(true)
      await sendOtp(email)
      setOtp(Array(OTP_LENGTH).fill(''))
      startCooldown()
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  // --- Step 3: Complete registration ---
  const updateForm = (key) => (e) => {
    setForm((prev) => ({ ...prev, [key]: e.target.value }))
  }

  const handleRegister = async (e) => {
    e.preventDefault()
    setError('')

    if (form.name.trim().length < 2) {
      setError('Name must be at least 2 characters.')
      return
    }
    if (form.password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    try {
      setSubmitting(true)
      await register(form.name.trim(), form.password, emailVerifiedToken)
      navigate('/login', { state: { registered: true, email } })
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  // --- Progress indicator ---
  const stepNumber = step === STEPS.EMAIL ? 1 : step === STEPS.OTP ? 2 : 3
  const stepLabels = ['Email', 'Verify', 'Account']

  return (
    <div className="auth-page">
      <form
        className="auth-card"
        onSubmit={
          step === STEPS.EMAIL
            ? handleSendOtp
            : step === STEPS.OTP
              ? handleVerifyOtp
              : handleRegister
        }
        noValidate
      >
        <h1>Create account</h1>
        <p className="auth-subtitle">Join the Padmashali Samaj Matrimony community</p>

        {/* Step progress bar */}
        <div className="otp-steps">
          {stepLabels.map((label, i) => (
            <div key={label} className={`otp-step ${i + 1 <= stepNumber ? 'active' : ''}`}>
              <span className="otp-step-number">{i + 1}</span>
              <span className="otp-step-label">{label}</span>
            </div>
          ))}
        </div>

        {error && <p className="form-error" role="alert">{error}</p>}

        {/* --- Step 1: Email --- */}
        {step === STEPS.EMAIL && (
          <>
            <label className="form-label" htmlFor="reg-email">
              Email address
            </label>
            <input
              id="reg-email"
              type="email"
              className="form-input"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              autoFocus
              required
            />

            <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
              {submitting ? 'Sending OTP…' : 'Send Verification Code'}
            </button>
          </>
        )}

        {/* --- Step 2: OTP --- */}
        {step === STEPS.OTP && (
          <>
            <p className="otp-info">
              We've sent a 6-digit code to <strong>{email}</strong>
            </p>

            <div className="otp-inputs" onPaste={handleOtpPaste}>
              {otp.map((digit, i) => (
                <input
                  key={i}
                  ref={(el) => (otpRefs.current[i] = el)}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  className="otp-box"
                  value={digit}
                  onChange={(e) => handleOtpChange(i, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(i, e)}
                  autoFocus={i === 0}
                />
              ))}
            </div>

            <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
              {submitting ? 'Verifying…' : 'Verify Code'}
            </button>

            <p className="otp-resend">
              Didn't receive it?{' '}
              {cooldown > 0 ? (
                <span className="otp-resend-timer">Resend in {cooldown}s</span>
              ) : (
                <button
                  type="button"
                  className="otp-resend-btn"
                  onClick={handleResend}
                  disabled={submitting}
                >
                  Resend OTP
                </button>
              )}
            </p>

            <button
              type="button"
              className="btn-text"
              onClick={() => {
                setStep(STEPS.EMAIL)
                setOtp(Array(OTP_LENGTH).fill(''))
                setError('')
              }}
            >
              ← Change email
            </button>
          </>
        )}

        {/* --- Step 3: Name & Password --- */}
        {step === STEPS.DETAILS && (
          <>
            <p className="otp-info">
              ✅ <strong>{email}</strong> verified! Now set up your account.
            </p>

            <label className="form-label" htmlFor="reg-name">
              Full name
            </label>
            <input
              id="reg-name"
              type="text"
              className="form-input"
              placeholder="e.g. Ravi Kumar"
              value={form.name}
              onChange={updateForm('name')}
              autoComplete="name"
              autoFocus
              required
            />

            <label className="form-label" htmlFor="reg-password">
              Password
            </label>
            <input
              id="reg-password"
              type="password"
              className="form-input"
              placeholder="At least 8 characters"
              value={form.password}
              onChange={updateForm('password')}
              autoComplete="new-password"
              minLength={8}
              required
            />

            <label className="form-label" htmlFor="reg-confirm">
              Confirm password
            </label>
            <input
              id="reg-confirm"
              type="password"
              className="form-input"
              placeholder="Re-enter password"
              value={form.confirmPassword}
              onChange={updateForm('confirmPassword')}
              autoComplete="new-password"
              required
            />

            <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
              {submitting ? 'Creating account…' : 'Register'}
            </button>
          </>
        )}

        <p className="auth-switch">
          Already have an account? <Link to="/login">Login</Link>
        </p>
      </form>
    </div>
  )
}
