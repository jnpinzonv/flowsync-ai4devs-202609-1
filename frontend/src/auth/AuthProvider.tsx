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

  const setToken = useCallback((next: string) => {
    localStorage.setItem(STORAGE_KEY, next)
    setTokenState(next)
  }, [])

  const clearToken = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY)
    setTokenState(null)
  }, [])

  const value = useMemo(
    () => ({ token, setToken, clearToken }),
    [token, setToken, clearToken],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
