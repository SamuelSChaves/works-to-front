import { API_URL } from './api'

const USER_STORAGE_KEY = 'tecrail:user'
const TOKEN_STORAGE_KEY = 'tecrail:token'
const PERMISSIONS_STORAGE_KEY = 'tecrail:permissions'
const USER_CHANGE_EVENT = 'tecrail:user-changed'
const REDIRECT_STORAGE_KEY = 'tecrail:post-login-redirect'
const PERMISSIONS_TTL_MS = 10000

export type User = {
  id: string
  nome: string
  email?: string
  role?: string
  cargo?: string
  empresaId?: string
  coordenacaoId?: string
  coordenacao?: string
  equipeId?: string
  profileId?: string
  profileName?: string
}

export type LoginLinkInfo = {
  link_id: string
  expires_at: string
  email_hint?: string
}

export interface LoginLinkError extends Error {
  loginLink?: LoginLinkInfo
}

export type Permissions = Record<
  string,
  { leitura: boolean; criacao: boolean; edicao: boolean; exclusao: boolean }
>

let permissionsPromise: Promise<Permissions> | null = null
let lastPermissionsAt = 0

function emitUserChange() {
  window.dispatchEvent(new Event(USER_CHANGE_EVENT))
}

export function getStoredUser(): User | null {
  try {
    const raw = localStorage.getItem(USER_STORAGE_KEY)
    if (!raw) return null

    try {
      return JSON.parse(raw) as User
    } catch {
      localStorage.removeItem(USER_STORAGE_KEY)
      return null
    }
  } catch {
    return null
  }
}

export function getStoredToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_STORAGE_KEY)
  } catch {
    return null
  }
}

export function getStoredPermissions(): Permissions | null {
  try {
    const raw = localStorage.getItem(PERMISSIONS_STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as Permissions
  } catch {
    return null
  }
}

function setStoredUser(user: User) {
  try {
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user))
    emitUserChange()
  } catch {
    // ignore storage failures
  }
}

function setStoredToken(token: string) {
  try {
    localStorage.setItem(TOKEN_STORAGE_KEY, token)
  } catch {
    // ignore storage failures
  }
}

function setStoredPermissions(permissions: Permissions) {
  try {
    localStorage.setItem(PERMISSIONS_STORAGE_KEY, JSON.stringify(permissions))
    emitUserChange()
  } catch {
    // ignore storage failures
  }
}

export function logout() {
  void fetch(`${API_URL}/auth/logout`, {
    method: 'POST',
    credentials: 'include'
  }).catch(() => {
    // ignore logout failures
  })

  try {
    localStorage.removeItem(USER_STORAGE_KEY)
    localStorage.removeItem(TOKEN_STORAGE_KEY)
    localStorage.removeItem(PERMISSIONS_STORAGE_KEY)
    emitUserChange()
  } catch {
    // ignore storage failures
  }
}

export function setPostLoginRedirect(path: string) {
  try {
    localStorage.setItem(REDIRECT_STORAGE_KEY, path)
  } catch {
    // ignore storage failures
  }
}

export function consumePostLoginRedirect(): string | null {
  try {
    const value = localStorage.getItem(REDIRECT_STORAGE_KEY)
    if (value) {
      localStorage.removeItem(REDIRECT_STORAGE_KEY)
      return value
    }
    return null
  } catch {
    return null
  }
}

export async function login(cs: string, senha: string) {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ cs, senha })
  })

  const text = await response.text()
  let payload: Record<string, unknown> | null = null
  if (text) {
    try {
      payload = JSON.parse(text) as Record<string, unknown>
    } catch {
      payload = null
    }
  }

  const data = payload ?? {}

  if (!response.ok) {
    const error = new Error(
      (data?.error as string) || 'Erro ao efetuar login'
    ) as LoginLinkError
    if (data?.login_link) {
      error.loginLink = data.login_link as LoginLinkInfo
    }
    throw error
  }

  return handleAuthSuccess(data)
}

export async function fetchPermissions(): Promise<Permissions> {
  const cached = getStoredPermissions()
  const now = Date.now()
  if (cached && now - lastPermissionsAt < PERMISSIONS_TTL_MS) {
    return cached
  }
  if (permissionsPromise) {
    return permissionsPromise
  }

  permissionsPromise = (async () => {
    const token = getStoredToken()
    if (!token) {
      throw new Error('Token ausente')
    }
    const response = await fetch(`${API_URL}/auth/permissions`, {
      headers: { Authorization: `Bearer ${token}` },
      credentials: 'include'
    })
    if (!response.ok) {
      const message = await response.text()
      throw new Error(message || 'Erro ao carregar permissoes.')
    }
    const data = await response.json()
    const permissions = (data.permissions || {}) as Permissions
    setStoredPermissions(permissions)
    lastPermissionsAt = Date.now()
    return permissions
  })()

  try {
    return await permissionsPromise
  } finally {
    permissionsPromise = null
  }
}

export function subscribeToUserChanges(callback: () => void) {
  const handler = () => callback()
  window.addEventListener('storage', handler)
  window.addEventListener(USER_CHANGE_EVENT, handler)

  return () => {
    window.removeEventListener('storage', handler)
    window.removeEventListener(USER_CHANGE_EVENT, handler)
  }
}

export type PasswordResetConfirmPayload = {
  token_id: string
  token: string
  senha: string
}

export async function requestPasswordReset(cs: string): Promise<void> {
  const response = await fetch(`${API_URL}/auth/password-reset`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ cs })
  })
  if (!response.ok) {
    const message = await response.text()
    throw new Error(message || 'Erro ao solicitar recuperação de senha.')
  }
}

export async function confirmPasswordReset(
  payload: PasswordResetConfirmPayload
): Promise<void> {
  const response = await fetch(`${API_URL}/auth/password-reset/confirm`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })
  if (!response.ok) {
    const message = await response.text()
    throw new Error(message || 'Erro ao redefinir a senha.')
  }
}

export async function confirmLoginLink(
  linkId: string,
  token: string
): Promise<User> {
  const response = await fetch(`${API_URL}/auth/login/confirm`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ link_id: linkId, token })
  })

  const text = await response.text()
  let payload: Record<string, unknown> | null = null
  if (text) {
    try {
      payload = JSON.parse(text) as Record<string, unknown>
    } catch {
      payload = null
    }
  }

  if (!response.ok) {
    throw new Error(
      (payload?.error as string) || 'Erro ao confirmar o link de login.'
    )
  }

  return handleAuthSuccess(payload ?? {})
}

export async function resendLoginLink(
  linkId: string
): Promise<LoginLinkInfo | null> {
  const response = await fetch(`${API_URL}/auth/login/resend`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ link_id: linkId })
  })

  const payload = await response.json().catch(() => ({} as Record<string, unknown>))
  if (!response.ok) {
    throw new Error(
      (payload?.error as string) || 'Erro ao reenviar o link de login.'
    )
  }

  return (payload?.login_link as LoginLinkInfo) ?? null
}

async function handleAuthSuccess(payload: Record<string, unknown>): Promise<User> {
  const rawUser = (payload.user || {}) as Record<string, unknown>
  const normalizedUser: User = {
    id: String(rawUser.id ?? ''),
    nome: String(rawUser.nome ?? ''),
    email: rawUser.email as string | undefined,
    cargo: rawUser.cargo as string | undefined,
    empresaId: rawUser.company_id as string | undefined,
    coordenacaoId: rawUser.coordenacao as string | undefined,
    equipeId: rawUser.equipe as string | undefined,
    profileId: rawUser.profile_id as string | undefined,
    profileName: rawUser.profile_name as string | undefined
  }
  if (rawUser.role || rawUser.profile_name || rawUser.cargo) {
    normalizedUser.role =
      (rawUser.role as string | undefined) ||
      (rawUser.profile_name as string | undefined) ||
      (rawUser.cargo as string | undefined)
  }

  setStoredUser(normalizedUser)
  if (payload.token && typeof payload.token === 'string') {
    setStoredToken(payload.token)
  }

  try {
    await fetchPermissions()
  } catch {
    // ignore permissions failure on login
  }

  return normalizedUser
}
