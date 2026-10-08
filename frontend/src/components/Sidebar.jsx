import { NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { accessForRole } from '../roleAccess'

const allLinks = [
  { to: '/', label: 'Dashboard' },
  { to: '/patients', label: 'Patients' },
  { to: '/emergencies', label: 'Emergencies' },
  { to: '/vehicles', label: 'EMS vehicles' },
  { to: '/hospitals', label: 'Hospitals' },
]

export default function Sidebar() {
  const { user, logout } = useAuth()
  const routes = accessForRole(user?.role).routes
  const links = allLinks.filter((link) => routes.includes(link.to))

  const getRoleBadgeClass = (role) => {
    if (role === 'Dispatcher') return 'badge red'
    if (role === 'Hospital Admin') return 'badge green'
    return 'badge blue'
  }

  return (
    <aside className="sidebar">
      <div className="sidebar-top">
        <div className="brand">
          Healthcare & EMS
          <small>Dispatch console</small>
        </div>
        <nav className="nav">
          {links.map((l) => (
            <NavLink key={l.to} to={l.to} end={l.to === '/'}>
              {l.label}
            </NavLink>
          ))}
        </nav>
      </div>

      {user && (
        <div className="sidebar-user">
          <div className="sidebar-user-info">
            <span className="sidebar-user-name">{user.name}</span>
            <div className="sidebar-user-meta">
              <span className={getRoleBadgeClass(user.role)}>{user.role}</span>
            </div>
          </div>
          <button type="button" className="btn-logout" onClick={logout}>
            Log out &rarr;
          </button>
        </div>
      )}
    </aside>
  )
}
