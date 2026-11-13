import { useEffect, useRef, useState } from 'react'
import { NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { api } from '../api'
import { accessForRole } from '../roleAccess'

const allLinks = [
  { to: '/', label: 'Dashboard' },
  { to: '/emergencies', label: 'Emergencies' },
  { to: '/vehicles', label: 'EMS vehicles' },
  { to: '/hospitals', label: 'Hospitals' },
]

function DatabaseStatus() {
  const [status, setStatus] = useState('checking')

  useEffect(() => {
    let isCurrent = true
    const check = () => {
      api.getHealth()
        .then(() => {
          if (isCurrent) setStatus('connected')
        })
        .catch(() => {
          if (isCurrent) setStatus('disconnected')
        })
    }

    check()
    const timer = window.setInterval(check, 30_000)
    return () => {
      isCurrent = false
      window.clearInterval(timer)
    }
  }, [])

  const label = {
    checking: 'Checking database…',
    connected: 'Database connected',
    disconnected: 'Database unavailable',
  }[status]

  return (
    <div className={`database-status database-status--${status}`} role="status" aria-live="polite">
      <span className="database-status-dot" aria-hidden="true" />
      {label}
    </div>
  )
}

export default function Sidebar() {
  const { user, logout } = useAuth()
  const accountRef = useRef(null)
  const profileButtonRef = useRef(null)
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false)
  const routes = accessForRole(user?.role).routes
  const links = allLinks.filter((link) => routes.includes(link.to))

  useEffect(() => {
    if (!isAccountMenuOpen) return undefined

    const closeOnOutsideClick = (event) => {
      if (!accountRef.current?.contains(event.target)) setIsAccountMenuOpen(false)
    }
    const closeOnEscape = (event) => {
      if (event.key !== 'Escape') return
      setIsAccountMenuOpen(false)
      profileButtonRef.current?.focus()
    }

    document.addEventListener('pointerdown', closeOnOutsideClick)
    document.addEventListener('keydown', closeOnEscape)
    return () => {
      document.removeEventListener('pointerdown', closeOnOutsideClick)
      document.removeEventListener('keydown', closeOnEscape)
    }
  }, [isAccountMenuOpen])

  return (
    <header className="topbar">
      <div className="topbar-brand">
        <div className="brand">
          H&amp;E
          <small>Dispatch console</small>
        </div>
      </div>
      <nav className="nav topbar-nav" aria-label="Main navigation">
          {links.map((l) => (
            <NavLink key={l.to} to={l.to} end={l.to === '/'}>
              {l.label}
            </NavLink>
          ))}
      </nav>
      <div className="topbar-actions">
        <DatabaseStatus />
        <div className="topbar-account" ref={accountRef}>
          <button
            ref={profileButtonRef}
            className="topbar-profile-button"
            type="button"
            aria-label={`Account menu for ${user?.name || 'user'}`}
            aria-expanded={isAccountMenuOpen}
            aria-controls="account-menu"
            onClick={() => setIsAccountMenuOpen((isOpen) => !isOpen)}
          >
            <span className="topbar-user-initial" aria-hidden="true">
              {user?.name?.trim().charAt(0).toUpperCase() || 'U'}
            </span>
          </button>
          <div
            className="account-menu"
            id="account-menu"
            role="group"
            aria-label="Account options"
            hidden={!isAccountMenuOpen}
          >
            <div className="account-menu-user">
              <strong>{user?.name}</strong>
              <span>{user?.role}</span>
            </div>
            <button type="button" className="account-menu-logout" onClick={logout}>
              Log out
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}
