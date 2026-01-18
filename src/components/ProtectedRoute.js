import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

// Redirects to login if user not authenticated
export default function ProtectedRoute({ children }) {
  const { user } = useAuth()
  return user ? children : <Navigate to="/login" />
}