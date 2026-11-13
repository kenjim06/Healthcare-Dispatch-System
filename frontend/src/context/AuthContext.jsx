import { createContext, useContext, useEffect, useState } from 'react'
import { api } from '../api'

const AuthContext = createContext(null)

function readStoredToken() {
  try {
    return localStorage.getItem('ems_token') || sessionStorage.getItem('ems_token')
  } catch {
    return null
  }
}

function clearStoredToken() {
  localStorage.removeItem('ems_token')
  sessionStorage.removeItem('ems_token')
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(readStoredToken)
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(Boolean(readStoredToken()))
  const [error, setError] = useState('')

  useEffect(() => {
    const handleUnauthorized = () => {
      clearStoredToken()
      setToken(null)
      setUser(null)
      setIsLoading(false)
      setError('Your session has expired. Please sign in again.')
    }
    window.addEventListener('ems:unauthorized', handleUnauthorized)
    return () => window.removeEventListener('ems:unauthorized', handleUnauthorized)
  }, [])

  useEffect(() => {
    if (!token) {
      return undefined
    }

    let isCurrent = true
    api.getCurrentUser(token)
      .then((authenticatedUser) => {
        if (isCurrent) setUser(authenticatedUser)
      })
      .catch((sessionError) => {
        if (!isCurrent) return
        clearStoredToken()
        setToken(null)
        setUser(null)
        setError(`Your saved session could not be verified: ${sessionError.message}`)
      })
      .finally(() => {
        if (isCurrent) setIsLoading(false)
      })

    return () => {
      isCurrent = false
    }
  }, [token])

  const login = async (email, password, rememberMe) => {
    setError('')
    const session = await api.login({ email: email.trim(), password })
    clearStoredToken()
    const storage = rememberMe ? localStorage : sessionStorage
    storage.setItem('ems_token', session.token)
    setToken(session.token)
    setUser(session.user)
    setIsLoading(false)
    return session.user
  }

  const logout = () => {
    clearStoredToken()
    setToken(null)
    setUser(null)
    setError('')
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, error, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
