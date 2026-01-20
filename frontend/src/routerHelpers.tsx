import { Suspense, type ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { getStoredUser, setPostLoginRedirect } from './services/auth'

export function SuspenseLoader({ children }: { children: ReactNode }) {
  return <Suspense fallback={<div>Carregando...</div>}>{children}</Suspense>
}

export function RequireAuth({ children }: { children: ReactNode }) {
  const user = getStoredUser()
  if (!user) {
    setPostLoginRedirect(window.location.pathname + window.location.search)
    return <Navigate to="/" replace />
  }
  return children
}

export function RedirectIfAuthenticated({ children }: { children: ReactNode }) {
  const user = getStoredUser()
  if (user) {
    return <Navigate to="/app" replace />
  }
  return children
}
