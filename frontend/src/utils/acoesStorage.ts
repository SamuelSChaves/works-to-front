import { GRUPOS_ACOES_DEFAULT, type GrupoAcao } from '../data/gruposAcoes'
import { GRUPOS_ORIGEM_DEFAULT } from '../data/gruposOrigem'

const ACTION_GROUPS_STORAGE_KEY = 'tecrail-action-groups'
const ACTION_ORIGINS_STORAGE_KEY = 'tecrail-action-origins'

export const ACTION_GROUPS_UPDATED_EVENT = 'tecrail-action-groups-updated'
export const ACTION_ORIGINS_UPDATED_EVENT = 'tecrail-action-origins-updated'

const isBrowser = typeof window !== 'undefined'

function cloneActionGroups(source: GrupoAcao[]): GrupoAcao[] {
  return source.map(group => ({
    id: group.id,
    nome: group.nome,
    descricao: group.descricao,
    status: group.status
  }))
}

function normalizeGroup(value: unknown): GrupoAcao | null {
  if (typeof value !== 'object' || value === null) return null
  const candidate = value as GrupoAcao & Record<string, unknown>
  const id = typeof candidate.id === 'string' ? candidate.id.trim() : ''
  const nome = typeof candidate.nome === 'string' ? candidate.nome.trim() : ''
  const descricao =
    typeof candidate.descricao === 'string' ? candidate.descricao.trim() : ''
  const status =
    candidate.status === 'Ativo' || candidate.status === 'Inativo'
      ? candidate.status
      : 'Ativo'

  if (!id || !nome) {
    return null
  }

  return { id, nome, descricao, status }
}

function cloneOrigemGroups(): string[] {
  return GRUPOS_ORIGEM_DEFAULT.map(group => group)
}

export function readPersistedActionGroups(): GrupoAcao[] {
  if (!isBrowser) return cloneActionGroups(GRUPOS_ACOES_DEFAULT)

  const raw = window.localStorage.getItem(ACTION_GROUPS_STORAGE_KEY)
  if (!raw) {
    return cloneActionGroups(GRUPOS_ACOES_DEFAULT)
  }

  try {
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) {
      return cloneActionGroups(GRUPOS_ACOES_DEFAULT)
    }

    const normalized = parsed
      .map(item => normalizeGroup(item))
      .filter((group): group is GrupoAcao => group !== null)

    return normalized.length > 0 ? normalized : cloneActionGroups(GRUPOS_ACOES_DEFAULT)
  } catch {
    return cloneActionGroups(GRUPOS_ACOES_DEFAULT)
  }
}

export function persistActionGroups(groups: GrupoAcao[]): void {
  if (!isBrowser) return

  try {
    const payload = JSON.stringify(groups)
    window.localStorage.setItem(ACTION_GROUPS_STORAGE_KEY, payload)
    window.dispatchEvent(new CustomEvent(ACTION_GROUPS_UPDATED_EVENT))
  } catch {
    // ignore storage failures
  }
}

export function readPersistedOrigemGroups(): string[] {
  if (!isBrowser) return cloneOrigemGroups()

  const raw = window.localStorage.getItem(ACTION_ORIGINS_STORAGE_KEY)
  if (!raw) {
    return cloneOrigemGroups()
  }

  try {
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) {
      return cloneOrigemGroups()
    }

    const normalized = parsed
      .map(item => (typeof item === 'string' ? item.trim() : ''))
      .filter((value, index, array) => value && array.indexOf(value) === index)

    return normalized.length > 0 ? normalized : cloneOrigemGroups()
  } catch {
    return cloneOrigemGroups()
  }
}

export function persistOrigemGroups(groups: string[]): void {
  if (!isBrowser) return

  try {
    const normalized = Array.from(new Set(groups.map(group => group.trim()).filter(Boolean)))
    const payload = JSON.stringify(normalized)
    window.localStorage.setItem(ACTION_ORIGINS_STORAGE_KEY, payload)
    window.dispatchEvent(new CustomEvent(ACTION_ORIGINS_UPDATED_EVENT))
  } catch {
    // ignore write errors
  }
}
