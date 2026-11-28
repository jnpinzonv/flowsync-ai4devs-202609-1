import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { useAuth } from '@/auth/useAuth'
import { ApiError, getProfile, logout, type User } from '@/lib/api'
import { toFormErrors } from '@/lib/errors'

type State =
  | { status: 'loading' }
  | { status: 'ready'; user: User }
  | { status: 'error'; message: string }

const dateFormatter = new Intl.DateTimeFormat('es', { dateStyle: 'long' })

export function ProfilePage() {
  const { token, clearToken } = useAuth()
  const navigate = useNavigate()
  const [state, setState] = useState<State>({ status: 'loading' })
  const [loggingOut, setLoggingOut] = useState(false)
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    if (!token) return
    let cancelled = false

    getProfile(token)
      .then((user) => {
        if (!cancelled) setState({ status: 'ready', user })
      })
      .catch((error: unknown) => {
        if (cancelled) return
        if (error instanceof ApiError && error.status === 401) {
          // Expired or revoked token: drop it and RequireAuth sends us to /login.
          clearToken()
          return
        }
        setState({ status: 'error', message: toFormErrors(error).form ?? '' })
      })

    return () => {
      cancelled = true
    }
  }, [token, clearToken, attempt])

  async function handleLogout() {
    setLoggingOut(true)
    try {
      if (token) await logout(token)
    } catch {
      // The local session is cleared regardless; a failed revoke shouldn't trap the user.
    } finally {
      clearToken()
      navigate('/login', { replace: true })
    }
  }

  function retry() {
    setState({ status: 'loading' })
    setAttempt((n) => n + 1)
  }

  return (
    <main className="flex min-h-svh items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl">Tu perfil</CardTitle>
          <CardDescription>Datos de tu cuenta en FlowSync.</CardDescription>
        </CardHeader>
        <CardContent>
          {state.status === 'loading' && (
            <p className="text-sm text-muted-foreground">Cargando perfil…</p>
          )}
          {state.status === 'error' && (
            <div className="grid gap-3">
              <Alert variant="destructive">
                <AlertDescription>{state.message}</AlertDescription>
              </Alert>
              <Button variant="outline" onClick={retry}>
                Reintentar
              </Button>
            </div>
          )}
          {state.status === 'ready' && (
            <div className="flex items-center gap-4">
              <div
                aria-hidden="true"
                className="flex size-14 shrink-0 items-center justify-center rounded-full bg-primary text-lg font-semibold text-primary-foreground"
              >
                {state.user.initials}
              </div>
              <dl className="grid min-w-0 gap-1 text-sm">
                {state.user.fullName && (
                  <div>
                    <dt className="sr-only">Nombre</dt>
                    <dd className="font-medium">{state.user.fullName}</dd>
                  </div>
                )}
                <div>
                  <dt className="sr-only">Email</dt>
                  <dd className="truncate font-medium">{state.user.email}</dd>
                </div>
                <div>
                  <dt className="sr-only">Miembro desde</dt>
                  <dd className="text-muted-foreground">
                    Miembro desde{' '}
                    {dateFormatter.format(new Date(state.user.createdAt))}
                  </dd>
                </div>
              </dl>
            </div>
          )}
        </CardContent>
        <CardFooter>
          <Button
            variant="outline"
            className="w-full"
            onClick={handleLogout}
            disabled={loggingOut}
          >
            {loggingOut ? 'Cerrando sesión…' : 'Cerrar sesión'}
          </Button>
        </CardFooter>
      </Card>
    </main>
  )
}
