import { Navigate } from "react-router-dom"
import { useAuthStore } from "../stores/authStore"

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuthStore()

  if (loading) return null
  if (!user) return <Navigate to="/auth" />

  return children
}
