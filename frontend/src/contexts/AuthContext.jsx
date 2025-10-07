import { createContext, useContext, useState, useEffect } from 'react'
import { api } from '../services/api'

const AuthContext = createContext({})

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (token) {
      // Verify token and get user info
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`
      // For now, we'll just set a basic user object
      // In a real app, you'd verify the token with the backend
      setUser({
        id: 1,
        email: 'user@example.com',
        role: localStorage.getItem('userRole') || 'student'
      })
    }
    setLoading(false)
  }, [])

  const login = async (email, password) => {
    try {
      const response = await api.post('/auth/login', { email, password })
      const { token } = response.data
      
      localStorage.setItem('token', token)
      localStorage.setItem('userRole', 'student') // You'd get this from the response
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`
      
      setUser({
        id: 1,
        email,
        role: 'student'
      })
      
      return { success: true }
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.error || 'Login failed' 
      }
    }
  }

  const register = async (email, password, role = 'student') => {
    try {
      await api.post('/auth/register', { email, password, role })
      return { success: true }
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.error || 'Registration failed' 
      }
    }
  }

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('userRole')
    delete api.defaults.headers.common['Authorization']
    setUser(null)
  }

  const value = {
    user,
    login,
    register,
    logout,
    loading
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
