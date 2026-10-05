import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const DEMO_PROFILES = [
  {
    role: 'Dispatcher',
    name: 'Officer Sarah Jenkins',
    email: 's.jenkins@dispatch.ems.gov',
    badge: 'DSP-9042',
    color: 'badge red',
  },
  {
    role: 'Lead Paramedic',
    name: 'Capt. Marcus Vance',
    email: 'm.vance@unit1.ems.gov',
    badge: 'EMS-401',
    color: 'badge blue',
  },
  {
    role: 'Hospital Admin',
    name: 'Dr. Elena Rostova',
    email: 'e.rostova@metrohealth.org',
    badge: 'HSP-108',
    color: 'badge green',
  },
]

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState('Dispatcher')
  const [rememberMe, setRememberMe] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [infoMessage, setInfoMessage] = useState('')

  const from = location.state?.from?.pathname || '/'

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!email.trim()) {
      setError('Please enter your Dispatch ID or Email address.')
      return
    }
    if (!password.trim()) {
      setError('Please enter your password.')
      return
    }

    // Extract name from email or use default
    const namePart = email.split('@')[0].replace('.', ' ')
    const formattedName = namePart.charAt(0).toUpperCase() + namePart.slice(1)

    login({
      name: formattedName || 'Authorized User',
      email: email.trim(),
      role: role,
      badge: 'AUTH-' + Math.floor(1000 + Math.random() * 9000),
      rememberMe,
    })

    navigate(from, { replace: true })
  }

  const handleDemoLogin = (profile) => {
    login({
      name: profile.name,
      email: profile.email,
      role: profile.role,
      badge: profile.badge,
      rememberMe: true,
    })
    navigate(from, { replace: true })
  }

  const handleForgotPassword = (e) => {
    e.preventDefault()
    setInfoMessage('Password reset instructions have been sent to your supervisor or system admin.')
  }

  return (
    <div className="login-wrapper">
      <div className="login-card panel">
        <div className="login-header">
          <div className="brand">
            Healthcare & EMS
            <small>Dispatch console</small>
          </div>
          <span className="badge blue login-badge">Secure Access Portal</span>
        </div>

        <div className="login-body">
          <h1>Sign in</h1>
          <p className="lead">
            Access real-time emergency dispatch queue, hospital capacity, and unit telemetry.
          </p>

          {error && (
            <div className="login-alert alert-error">
              <span>⚠️ {error}</span>
              <button type="button" className="alert-close" onClick={() => setError('')}>&times;</button>
            </div>
          )}

          {infoMessage && (
            <div className="login-alert alert-info">
              <span>ℹ️ {infoMessage}</span>
              <button type="button" className="alert-close" onClick={() => setInfoMessage('')}>&times;</button>
            </div>
          )}

          <form onSubmit={handleSubmit} className="login-form">
            <div className="form-group">
              <label htmlFor="role-select">Access Role</label>
              <select
                id="role-select"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="form-control"
              >
                <option value="Dispatcher">Dispatcher Console</option>
                <option value="Lead Paramedic">EMS Field Unit</option>
                <option value="Hospital Admin">Hospital Network Admin</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="email">Email or Dispatch ID</label>
              <input
                id="email"
                type="text"
                placeholder="e.g. s.jenkins@dispatch.ems.gov"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value)
                  if (error) setError('')
                }}
                className="form-control"
                autoComplete="username"
              />
            </div>

            <div className="form-group">
              <div className="label-with-link">
                <label htmlFor="password">Password</label>
                <a href="#forgot" onClick={handleForgotPassword} className="forgot-link">
                  Forgot password?
                </a>
              </div>
              <div className="password-input-wrap">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value)
                    if (error) setError('')
                  }}
                  className="form-control"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="toggle-password-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            <div className="form-row check-row">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                <span>Remember session on this device</span>
              </label>
            </div>

            <button type="submit" className="btn-primary login-btn">
              Sign In to Console &rarr;
            </button>
          </form>

          <div className="demo-divider">
            <span>Or quick sign-in as</span>
          </div>

          <div className="demo-presets">
            {DEMO_PROFILES.map((p) => (
              <button
                key={p.role}
                type="button"
                className="demo-chip-btn"
                onClick={() => handleDemoLogin(p)}
              >
                <span className={p.color}>{p.role}</span>
                <span className="demo-chip-name">{p.name}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="login-footer muted">
          Healthcare & EMS Dispatch Console v2.4 &bull; Encrypted Telemetry Active
        </div>
      </div>
    </div>
  )
}
