import { useCallback, useMemo, useState, type ReactNode } from 'react'
import { AuthContext } from './auth-context'

const STORAGE_KEY = 'flowsync.token'

function readStoredToken() {
  try {
    return localStorage.getItem(STORAGE_KEY)
  } catch {
    return null
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setTokenState] = useState<string | null>(readStoredToken)

  // Storage can throw (blocked, quota); the in-memory session must still update.
  const setToken = useCallback((next: string) => {
    try {
      localStorage.setItem(STORAGE_KEY, next)
    } catch {
      // Session lasts until reload.
    }
    setTokenState(next)
  }, [])

  const clearToken = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch {
      // Nothing persisted to remove.
    }
    setTokenState(null)
  }, [])

  const value = useMemo(
    () => ({ token, setToken, clearToken }),
    [token, setToken, clearToken],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
