import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const { login, error: sessionError } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const from = location.state?.from?.pathname || '/'

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setIsSubmitting(true)
    try {
      await login(email, password, rememberMe)
      navigate(from, { replace: true })
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : String(loginError))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="login-wrapper">
      <div className="login-card panel">
        <div className="login-header">
          <div className="brand">
            Healthcare &amp; EMS
            <small>Dispatch console</small>
          </div>
          <span className="badge blue login-badge">Authorized accounts only</span>
        </div>

        <div className="login-body">
          <h1>Sign in</h1>
          <p className="lead">
            Sign in with an account issued by your system administrator.
          </p>

          {(error || sessionError) && (
            <div className="login-alert alert-error" role="alert">
              <span>{error || sessionError}</span>
              <button
                type="button"
                className="alert-close"
                onClick={() => setError('')}
                aria-label="Dismiss error"
              >
                &times;
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit} className="login-form">
            <div className="form-group">
              <label htmlFor="email">Email address</label>
              <input
                id="email"
                type="email"
                placeholder="name@example.org"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="form-control"
                autoComplete="username"
                required
              />
            </div>

            <div className="form-group">
              <div className="label-with-link">
                <label htmlFor="password">Password</label>
              </div>
              <div className="password-input-wrap">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="form-control"
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  className="toggle-password-btn"
                  onClick={() => setShowPassword((visible) => !visible)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(event) => setRememberMe(event.target.checked)}
              />
              <span>Remember session on this device</span>
            </label>

            <button type="submit" className="btn-primary login-btn" disabled={isSubmitting}>
              {isSubmitting ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
        </div>

        <div className="login-footer muted">
          Access is verified by the dispatch API.
        </div>
      </div>
    </div>
  )
}
