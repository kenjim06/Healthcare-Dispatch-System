import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Sidebar from './components/Sidebar'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Patients from './pages/Patients'
import Emergencies from './pages/Emergencies'
import Vehicles from './pages/Vehicles'
import Hospitals from './pages/Hospitals'

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

function MainRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <ProtectedLayout>
            <Dashboard />
          </ProtectedLayout>
        }
      />
      <Route
        path="/patients"
        element={
          <ProtectedLayout>
            <Patients />
          </ProtectedLayout>
        }
      />
      <Route
        path="/emergencies"
        element={
          <ProtectedLayout>
            <Emergencies />
          </ProtectedLayout>
        }
      />
      <Route
        path="/vehicles"
        element={
          <ProtectedLayout>
            <Vehicles />
          </ProtectedLayout>
        }
      />
      <Route
        path="/hospitals"
        element={
          <ProtectedLayout>
            <Hospitals />
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
