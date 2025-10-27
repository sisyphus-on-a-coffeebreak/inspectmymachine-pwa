import { Navigate, Outlet, useLocation } from "react-router-dom"
import { useAuth } from "@/providers/useAuth"
export default function ProtectedRoute() {
  const { token } = useAuth()
  const loc = useLocation()
  if (!token) return <Navigate to="/login" replace state={{ from: loc }} />
  return <Outlet />
}
