import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router'
import { AuthLayout } from '@/components/AuthLayout'
import { FieldError } from '@/components/FieldError'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/auth/useAuth'
import { login } from '@/lib/api'
import { toFormErrors, type FormErrors } from '@/lib/errors'

export function LoginPage() {
  const { setToken } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState<FormErrors>({ fields: {} })
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setErrors({ fields: {} })
    setSubmitting(true)
    try {
      const { token } = await login({ email: email.trim(), password })
      setToken(token)
      navigate('/profile', { replace: true })
    } catch (error) {
      setErrors(
        toFormErrors(error, {
          statusMessages: { 400: 'Email o contraseña incorrectos.' },
          visibleFields: ['email', 'password'],
        }),
      )
      setSubmitting(false)
    }
  }

  return (
    <AuthLayout
      title="Iniciar sesión"
      description="Entra con tu email y tu contraseña."
      footer={
        <span>
          ¿No tienes cuenta?{' '}
          <Link
            to="/signup"
            className="font-medium text-foreground underline underline-offset-4"
          >
            Regístrate
          </Link>
        </span>
      }
    >
      <form onSubmit={handleSubmit} noValidate className="grid gap-4">
        {errors.form && (
          <Alert variant="destructive">
            <AlertDescription>{errors.form}</AlertDescription>
          </Alert>
        )}
        <div className="grid gap-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            aria-invalid={Boolean(errors.fields.email)}
            aria-describedby={errors.fields.email ? 'email-error' : undefined}
          />
          <FieldError id="email-error" message={errors.fields.email} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="password">Contraseña</Label>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            aria-invalid={Boolean(errors.fields.password)}
            aria-describedby={
              errors.fields.password ? 'password-error' : undefined
            }
          />
          <FieldError id="password-error" message={errors.fields.password} />
        </div>
        <Button
          type="submit"
          disabled={submitting || !email.trim() || !password.trim()}
        >
          {submitting ? 'Entrando…' : 'Entrar'}
        </Button>
      </form>
    </AuthLayout>
  )
}
