import { ApiError, NetworkError } from './api'

const GENERIC_ERROR = 'Algo salió mal. Inténtalo de nuevo.'

/** Spanish messages for the VineJS rules the auth forms can trigger. */
const RULE_MESSAGES: Record<string, string> = {
  'database.unique': 'Ese email ya está registrado. ¿Quieres iniciar sesión?',
  email: 'Introduce un email válido.',
  required: 'Este campo es obligatorio.',
  minLength: 'La contraseña debe tener al menos 8 caracteres.',
  maxLength: 'Es demasiado largo.',
  sameAs: 'Las contraseñas no coinciden.',
}

export type FormErrors = {
  /** Message for the whole form (shown in an alert). */
  form?: string
  /** Messages keyed by field name. */
  fields: Record<string, string>
}

/**
 * Turns whatever the API layer threw into messages a user can act on, so no
 * raw status codes or English backend strings reach the screen.
 */
export function toFormErrors(
  error: unknown,
  statusMessages: Record<number, string> = {},
): FormErrors {
  if (error instanceof NetworkError) return { form: error.message, fields: {} }
  if (!(error instanceof ApiError)) return { form: GENERIC_ERROR, fields: {} }

  if (statusMessages[error.status])
    return { form: statusMessages[error.status], fields: {} }

  if (error.status === 422) {
    const fields: Record<string, string> = {}
    for (const { field, rule, message } of error.errors) {
      if (!field || fields[field]) continue
      fields[field] = (rule && RULE_MESSAGES[rule]) || message
    }
    if (Object.keys(fields).length > 0) return { fields }
  }

  return { form: GENERIC_ERROR, fields: {} }
}
