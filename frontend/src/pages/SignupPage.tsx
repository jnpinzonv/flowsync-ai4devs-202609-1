import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router'
import { AuthLayout } from '@/components/AuthLayout'
import { FieldError } from '@/components/FieldError'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/auth/useAuth'
import { signup } from '@/lib/api'
import { toFormErrors, type FormErrors } from '@/lib/errors'

// Mirrors the backend's signupValidator so obvious mistakes never hit the API.
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PASSWORD_MIN = 8
const PASSWORD_MAX = 32

type Values = { email: string; password: string; passwordConfirmation: string }

function validate({ email, password, passwordConfirmation }: Values) {
  const fields: Record<string, string> = {}
  if (!EMAIL_PATTERN.test(email) || email.length > 254)
    fields.email = 'Introduce un email válido.'
  // The backend trims the password before checking its length, so do the same.
  const length = password.trim().length
  if (length < PASSWORD_MIN) {
    fields.password = `La contraseña debe tener al menos ${PASSWORD_MIN} caracteres (sin contar espacios al inicio o al final).`
  } else if (length > PASSWORD_MAX) {
    fields.password = `La contraseña no puede tener más de ${PASSWORD_MAX} caracteres.`
  }
  if (passwordConfirmation !== password) {
    fields.passwordConfirmation = 'Las contraseñas no coinciden.'
  }
  return fields
}

export function SignupPage() {
  const { setToken } = useAuth()
  const navigate = useNavigate()
  const [values, setValues] = useState<Values>({
    email: '',
    password: '',
    passwordConfirmation: '',
  })
  const [errors, setErrors] = useState<FormErrors>({ fields: {} })
  const [submitting, setSubmitting] = useState(false)

  function update(field: keyof Values) {
    return (event: { target: { value: string } }) =>
      setValues((current) => ({ ...current, [field]: event.target.value }))
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const input = { ...values, email: values.email.trim() }

    const fields = validate(input)
    if (Object.keys(fields).length > 0) {
      setErrors({ fields })
      return
    }

    setErrors({ fields: {} })
    setSubmitting(true)
    try {
      const { token } = await signup(input)
      setToken(token)
      navigate('/profile', { replace: true })
    } catch (error) {
      setErrors(
        toFormErrors(error, {
          visibleFields: ['email', 'password', 'passwordConfirmation'],
        }),
      )
      setSubmitting(false)
    }
  }

  const describedBy = (field: keyof Values) =>
    errors.fields[field] ? `${field}-error` : undefined

  return (
    <AuthLayout
      title="Crear cuenta"
      description="Regístrate con tu email y una contraseña."
      footer={
        <span>
          ¿Ya tienes cuenta?{' '}
          <Link
            to="/login"
            className="font-medium text-foreground underline underline-offset-4"
          >
            Inicia sesión
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
            value={values.email}
            onChange={update('email')}
            aria-invalid={Boolean(errors.fields.email)}
            aria-describedby={describedBy('email')}
          />
          <FieldError id="email-error" message={errors.fields.email} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="password">Contraseña</Label>
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            required
            value={values.password}
            onChange={update('password')}
            aria-invalid={Boolean(errors.fields.password)}
            aria-describedby={describedBy('password') ?? 'password-hint'}
          />
          {errors.fields.password ? (
            <FieldError id="password-error" message={errors.fields.password} />
          ) : (
            <p id="password-hint" className="text-sm text-muted-foreground">
              Entre {PASSWORD_MIN} y {PASSWORD_MAX} caracteres.
            </p>
          )}
        </div>
        <div className="grid gap-2">
          <Label htmlFor="passwordConfirmation">Repite la contraseña</Label>
          <Input
            id="passwordConfirmation"
            type="password"
            autoComplete="new-password"
            required
            value={values.passwordConfirmation}
            onChange={update('passwordConfirmation')}
            aria-invalid={Boolean(errors.fields.passwordConfirmation)}
            aria-describedby={describedBy('passwordConfirmation')}
          />
          <FieldError
            id="passwordConfirmation-error"
            message={errors.fields.passwordConfirmation}
          />
        </div>
        <Button type="submit" disabled={submitting}>
          {submitting ? 'Creando cuenta…' : 'Crear cuenta'}
        </Button>
      </form>
    </AuthLayout>
  )
}
