import { NavLink } from 'react-router-dom'

const links = [
  { to: '/', label: 'Dashboard' },
  { to: '/patients', label: 'Patients' },
  { to: '/emergencies', label: 'Emergencies' },
  { to: '/vehicles', label: 'EMS vehicles' },
  { to: '/hospitals', label: 'Hospitals' },
]

export default function Sidebar() {
  return (
    <aside className="sidebar">
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
    </aside>
  )
}
