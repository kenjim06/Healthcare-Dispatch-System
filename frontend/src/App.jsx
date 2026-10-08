import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Sidebar from './components/Sidebar'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Patients from './pages/Patients'
import Emergencies from './pages/Emergencies'
import Vehicles from './pages/Vehicles'
import Hospitals from './pages/Hospitals'
import { accessForRole } from './roleAccess'

function ProtectedLayout({ children }) {
  const { user } = useAuth()
  const location = useLocation()

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return (
    <div className="app">
      <Sidebar />
      <main className="main">{children}</main>
    </div>
  )
}

function RoleProtected({ children, path }) {
  const { user } = useAuth()
  if (!accessForRole(user?.role).routes.includes(path)) return <Navigate to="/" replace />
  return children
}

function MainRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <ProtectedLayout>
            <RoleProtected path="/"><Dashboard /></RoleProtected>
          </ProtectedLayout>
        }
      />
      <Route
        path="/patients"
        element={
          <ProtectedLayout>
            <RoleProtected path="/patients"><Patients /></RoleProtected>
          </ProtectedLayout>
        }
      />
      <Route
        path="/emergencies"
        element={
          <ProtectedLayout>
            <RoleProtected path="/emergencies"><Emergencies /></RoleProtected>
          </ProtectedLayout>
        }
      />
      <Route
        path="/vehicles"
        element={
          <ProtectedLayout>
            <RoleProtected path="/vehicles"><Vehicles /></RoleProtected>
          </ProtectedLayout>
        }
      />
      <Route
        path="/hospitals"
        element={
          <ProtectedLayout>
            <RoleProtected path="/hospitals"><Hospitals /></RoleProtected>
          </ProtectedLayout>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <MainRoutes />
      </BrowserRouter>
    </AuthProvider>
  )
}
