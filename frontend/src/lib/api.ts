const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3333/api/v1'

export type User = {
  id: number
  fullName: string | null
  email: string
  initials: string
  createdAt: string
  updatedAt: string | null
}

export type AuthResponse = {
  user: User
  token: string
}

/** One entry of the backend's `{ errors: [...] }` body (VineJS or auth errors). */
export type ApiFieldError = {
  message: string
  field?: string
  rule?: string
}

export class ApiError extends Error {
  readonly status: number
  readonly errors: ApiFieldError[]

  constructor(status: number, errors: ApiFieldError[]) {
    super(errors[0]?.message ?? `Request failed with status ${status}`)
    this.name = 'ApiError'
    this.status = status
    this.errors = errors
  }

  /** First error for a given field, if any. */
  fieldError(field: string): ApiFieldError | undefined {
    return this.errors.find((error) => error.field === field)
  }
}

/** Thrown when the backend can't be reached at all (down, CORS, offline). */
export class NetworkError extends Error {
  constructor() {
    super(
      'No se pudo conectar con el servidor. Inténtalo de nuevo en unos segundos.',
    )
    this.name = 'NetworkError'
  }
}

type RequestOptions = {
  method?: 'GET' | 'POST'
  body?: unknown
  token?: string | null
}

async function request<T>(
  path: string,
  { method = 'GET', body, token }: RequestOptions = {},
) {
  const headers: Record<string, string> = { Accept: 'application/json' }
  if (body !== undefined) headers['Content-Type'] = 'application/json'
  if (token) headers.Authorization = `Bearer ${token}`

  let response: Response
  try {
    response = await fetch(`${API_URL}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    })
  } catch {
    throw new NetworkError()
  }

  const json: unknown = await response.json().catch(() => null)

  if (!response.ok) {
    const errors =
      json &&
      typeof json === 'object' &&
      'errors' in json &&
      Array.isArray(json.errors)
        ? (json.errors as ApiFieldError[])
        : []
    throw new ApiError(response.status, errors)
  }

  // Successful payloads are wrapped in `{ data }`, except logout's `{ message }`.
  if (json && typeof json === 'object' && 'data' in json) return json.data as T
  return json as T
}

export function signup(input: {
  email: string
  password: string
  passwordConfirmation: string
}) {
  // The backend requires the `fullName` key to be present, even if null.
  return request<AuthResponse>('/auth/signup', {
    method: 'POST',
    body: { fullName: null, ...input },
  })
}

export function login(input: { email: string; password: string }) {
  return request<AuthResponse>('/auth/login', { method: 'POST', body: input })
}

export function getProfile(token: string) {
  return request<User>('/account/profile', { token })
}

export function logout(token: string) {
  return request<{ message: string }>('/account/logout', {
    method: 'POST',
    token,
  })
}
