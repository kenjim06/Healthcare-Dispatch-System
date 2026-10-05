import { createContext, useContext, useState } from 'react'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('ems_user')
      return saved ? JSON.parse(saved) : null
    } catch {
      return null
    }
  })

  const login = (userData) => {
    setUser(userData)
    try {
      localStorage.setItem('ems_user', JSON.stringify(userData))
    } catch (e) {
      console.error('Failed to save session', e)
    }
  }

  const logout = () => {
    setUser(null)
    try {
      localStorage.removeItem('ems_user')
    } catch (e) {
      console.error('Failed to clear session', e)
    }
  }

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
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
