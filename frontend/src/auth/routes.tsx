import { Navigate, Outlet } from 'react-router'
import { useAuth } from './useAuth'

/** Only lets signed-in users through; everyone else goes to /login. */
export function RequireAuth() {
  const { token } = useAuth()
  return token ? <Outlet /> : <Navigate to="/login" replace />
}

/** Login/signup screens: a signed-in user goes straight to the profile. */
export function GuestOnly() {
  const { token } = useAuth()
  return token ? <Navigate to="/profile" replace /> : <Outlet />
}
