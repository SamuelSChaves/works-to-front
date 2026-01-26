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

  if (!response.ok) {
    const error = await response.text()
    throw new Error(error || 'Erro ao efetuar login')
  }

  const payload = await response.json()
  const rawUser = payload.user || {}
  const normalizedUser: User = {
    id: rawUser.id,
    nome: rawUser.nome,
    email: rawUser.email,
    cargo: rawUser.cargo,
    empresaId: rawUser.company_id,
    coordenacaoId: rawUser.coordenacao,
    equipeId: rawUser.equipe,
    profileId: rawUser.profile_id,
    profileName: rawUser.profile_name
  }
  if (rawUser.role || rawUser.profile_name || rawUser.cargo) {
    normalizedUser.role = rawUser.role || rawUser.profile_name || rawUser.cargo
  }

  setStoredUser(normalizedUser)
  if (payload.token) {
    setStoredToken(payload.token)
  }

  try {
    await fetchPermissions()
  } catch {
    // ignore permissions failure on login
  }

  return normalizedUser
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
