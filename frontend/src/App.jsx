import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Sidebar from './components/Sidebar'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Emergencies from './pages/Emergencies'
import Vehicles from './pages/Vehicles'
import Hospitals from './pages/Hospitals'
import { accessForRole } from './roleAccess'
import { OperationsProvider, useOperations } from './context/OperationsContext'

function ProtectedLayout({ children }) {
  const { user, isLoading: isAuthLoading } = useAuth()
  const { isLoading, error, clearError, retryDataLoad } = useOperations()
  const location = useLocation()

  if (isAuthLoading) {
    return <main className="main" role="status">Verifying your session…</main>
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return (
    <div className="app">
      <Sidebar />
      <main className={`main${location.pathname === '/' ? ' main-dashboard' : ''}`}>
        {isLoading && <div className="login-alert alert-info" role="status">Connecting to the operations API…</div>}
        {error && (
          <div className="login-alert alert-error" role="alert">
            <span>Operations API error: {error}</span>
            <button type="button" className="alert-close" onClick={retryDataLoad} aria-label="Retry loading operations data">Retry</button>
            <button type="button" className="alert-close" onClick={clearError} aria-label="Dismiss error">×</button>
          </div>
        )}
        {children}
      </main>
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
        <OperationsProvider>
          <MainRoutes />
        </OperationsProvider>
      </BrowserRouter>
    </AuthProvider>
  )
}
