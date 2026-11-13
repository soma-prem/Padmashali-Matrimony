import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import PasswordInput from '../components/PasswordInput.jsx'
import { toast } from '../api/api.js'
import { useLanguage } from '../context/LanguageContext.jsx'

export default function Login() {
  const { login } = useAuth()
  const { t } = useLanguage()
  const navigate = useNavigate()
  const location = useLocation()
  const justRegistered = location.state?.registered || false
  const passwordReset = location.state?.passwordReset || false
  const presetEmail = location.state?.email || ''
  const successToastShown = useRef(false)

  const [form, setForm] = useState({ email: presetEmail, password: '' })
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (successToastShown.current) return
    if (justRegistered) toast.success('Registration successful! Please log in.')
    else if (passwordReset) toast.success('Password reset successful! Please log in with your new password.')
    else return
    successToastShown.current = true
  }, [justRegistered, passwordReset])

  const update = (key) => (e) => {
    setForm((prev) => ({ ...prev, [key]: e.target.value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.email || !form.password) {
      setError('Please enter your email and password.')
      return
    }

    try {
      setError('')
      setSubmitting(true)
      const user = await login(form.email.trim(), form.password)
      // Admins land on the admin dashboard; members land on their profile.
      if (user.role === 'admin') {
        navigate('/admin', { replace: true })
      } else {
        navigate('/profile', { replace: true })
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="auth-page">
      <form className="auth-card" onSubmit={handleSubmit} noValidate>
        <h1>{t('Welcome back')}</h1>
        <p className="auth-subtitle">{t('Sign in to your account')}</p>

        {error && <p className="form-error" role="alert">{error}</p>}

        <label className="form-label" htmlFor="login-email">
          {t('Email')}
        </label>
        <input
          id="login-email"
          type="email"
          className="form-input"
          placeholder="you@example.com"
          value={form.email}
          onChange={update('email')}
          autoComplete="email"
          required
        />

        <label className="form-label" htmlFor="login-password">
          Password
        </label>
        <PasswordInput
          id="login-password"
          placeholder={t('Your password')}
          value={form.password}
          onChange={update('password')}
          autoComplete="current-password"
          required
        />

        <p className="forgot-link">
          <Link to="/forgot-password">{t('Forgot password?')}</Link>
        </p>

        <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
          {submitting ? t('Signing in…') : t('Login')}
        </button>

        <p className="auth-switch">
          {t('New here?')} <Link to="/register">{t('Register')}</Link>
        </p>
      </form>
    </div>
  )
}
