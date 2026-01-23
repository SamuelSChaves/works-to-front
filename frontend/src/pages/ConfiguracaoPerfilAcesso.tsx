import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Tabs } from '../components/Tabs'
import { Modal } from '../components/Modal'
import { toast } from 'sonner'
import { SCREEN_PERMISSIONS } from '../config/screens'
import {
  fetchPermissions,
  getStoredPermissions,
  getStoredToken,
  getStoredUser,
  logout,
  setPostLoginRedirect
} from '../services/auth'
import { API_URL } from '../services/api'
import { formatBrasiliaDateTime } from '../utils/date'

type PermissionKey = 'leitura' | 'criacao' | 'edicao' | 'exclusao'

type PermissionItem = {
  id: string
  label: string
  leitura: boolean
  criacao: boolean
  edicao: boolean
  exclusao: boolean
}

type ProfilePermission = {
  profile_id: string
  screen_id: string
  leitura: number
  criacao: number
  edicao: number
  exclusao: number
}

type Profile = {
  id: string
  name: string
  status: 'ativo' | 'inativo'
  created_at: string
  updated_at: string
  permissions: ProfilePermission[]
}

type ProfileFormState = {
  id: string
  name: string
  status: 'ativo' | 'inativo'
  permissions: PermissionItem[]
}

type ProfileHistoryItem = {
  id: string
  changes: string
  created_at: string
  changed_by_name: string | null
}

type HistoryEntry = {
  id: string
  at: string
  by: string
  changes: string
}

type UserHistoryItem = {
  id: string
  changes: string
  created_at: string
  changed_by_name: string | null
}

type EstruturaHistoryItem = {
  id: string
  action: 'criado' | 'atualizado'
  before_data: string | null
  after_data: string
  created_at: string
  changed_by_name: string | null
}

type UserFormState = {
  id: string
  nome: string
  email: string
  cs: string
  escala: string
  profileId: string
  senha?: string
  Coordenação: string
  equipeAtual: string
  equipeAditiva: string
  cargo: string
  status: 'Ativo' | 'Inativo'
  createdAt: string
  createdBy: string
  coordenacao?: string
}

type UserRecord = {
  id: string
  nome: string
  email: string
  cs: string
  escala: string
  profileId: string
  profileName: string
  status: 'Ativo' | 'Inativo'
  cargo: string
  Coordenação: string
  coordenacao: string
  equipeAtual: string
  equipeAditiva: string
  createdAt: string
  createdBy: string
  history: HistoryEntry[]
}

type UserSortKey =
  | 'nome'
  | 'email'
  | 'cs'
  | 'escala'
  | 'status'
  | 'profileName'
  | 'cargo'

type EstruturaFormState = {
  id: string
  Coordenação: string
  equipe: string
  cc: string
  execucao: string
  status: 'Ativo' | 'Inativo' | 'Excluido'
  createdAt: string
  createdBy: string
}

type EstruturaRecord = {
  id: string
  Coordenação: string
  equipe: string
  cc: string
  execucao: string
  status: 'Ativo' | 'Inativo' | 'Excluido'
  createdAt: string
  createdBy: string
}

const permissionScreens: PermissionItem[] = SCREEN_PERMISSIONS.map(item => ({
  ...item
}))

const initialUsers: UserRecord[] = []

function defaultPermissions(): PermissionItem[] {
  return permissionScreens.map(item => ({ ...item }))
}

function formatDate(value: string) {
  return formatBrasiliaDateTime(value)
}

function buildHistoryEntry(by: string, changes: string): HistoryEntry {
  return {
    id: `h-${Date.now()}`,
    at: new Date().toISOString(),
    by,
    changes
  }
}

const fieldLabelStyle = { fontSize: 12, fontWeight: 600, color: '#475569' }

const DRAFT_KEY = 'tecrail:draft:configuracao-usuario'
const TAB_KEY = 'tecrail:draft:configuracao-tab'

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

function isValidPassword(value: string): boolean {
  if (value.length < 7) return false
  const hasLetter = /[A-Za-z]/.test(value)
  const hasNumber = /[0-9]/.test(value)
  const hasSpecial = /[!@#$%&]/.test(value)
  return hasLetter && hasNumber && hasSpecial
}

type DraftPayload = {
  mode: 'new' | 'edit'
  data: UserFormState
  isOpen: boolean
}

function loadDraft(): DraftPayload | null {
  try {
    const raw = localStorage.getItem(DRAFT_KEY)
    return raw ? (JSON.parse(raw) as DraftPayload) : null
  } catch {
    return null
  }
}

function saveDraft(value: DraftPayload | null) {
  try {
    if (!value) {
      localStorage.removeItem(DRAFT_KEY)
      return
    }
    const sanitized = {
      ...value,
      data: { ...value.data, senha: '' }
    }
    localStorage.setItem(DRAFT_KEY, JSON.stringify(sanitized))
  } catch {
    // ignore storage failures
  }
}

function saveActiveTab(value: string) {
  try {
    localStorage.setItem(TAB_KEY, value)
  } catch {
    // ignore storage failures
  }
}

function loadActiveTab(): string | null {
  try {
    return localStorage.getItem(TAB_KEY)
  } catch {
    return null
  }
}

function toUserRecord(apiUser: {
  id: string
  nome: string
  email: string
  cs: string
  escala?: string
  profile_id?: string | null
  profile_name?: string | null
  cargo: string | null
  Coordenação: string | null
  equipe: string | null
  equipe_aditiva?: string | null
  status: string
  created_at: string
  coordenacao?: string | null
}): UserRecord {
  return {
    id: apiUser.id,
    nome: apiUser.nome,
    email: apiUser.email,
    cs: apiUser.cs,
    escala: apiUser.escala || '',
    profileId: apiUser.profile_id || '',
    profileName: apiUser.profile_name || '',
    status: apiUser.status === 'ativo' ? 'Ativo' : 'Inativo',
    cargo: apiUser.cargo ?? '',
    coordenacao: apiUser.coordenacao ?? apiUser.Coordenação ?? '',
    Coordenação: apiUser.coordenacao ?? apiUser.Coordenação ?? '',
    equipeAtual: apiUser.equipe ?? '',
    equipeAditiva: apiUser.equipe_aditiva ?? '',
    createdAt: apiUser.created_at,
    createdBy: 'Sistema',
    history: []
  }
}

function toApiStatus(value: 'Ativo' | 'Inativo' | 'Excluido'): 'ativo' | 'inativo' {
  return value === 'Ativo' ? 'ativo' : 'inativo'
}

function toPermissionItems(permissions: ProfilePermission[]): PermissionItem[] {
  return permissionScreens.map(screen => {
    const match = permissions.find(item => item.screen_id === screen.id)
    return {
      ...screen,
      leitura: Boolean(match?.leitura),
      criacao: Boolean(match?.criacao),
      edicao: Boolean(match?.edicao),
      exclusao: Boolean(match?.exclusao)
    }
  })
}

function toApiPermissions(items: PermissionItem[]) {
  return items.map(item => ({
    screen_id: item.id,
    leitura: item.leitura,
    criacao: item.criacao,
    edicao: item.edicao,
    exclusao: item.exclusao
  }))
}

function countPermissions(
  items: ProfilePermission[],
  key: 'leitura' | 'criacao' | 'edicao' | 'exclusao'
) {
  return items.filter(item => item[key]).length
}

function createEmptyProfile(): ProfileFormState {
  return {
    id: '',
    name: '',
    status: 'ativo',
    permissions: defaultPermissions()
  }
}

function createEmptyForm(createdBy: string): UserFormState {
  return {
    id: '',
    nome: '',
    email: '',
    cs: '',
    escala: '',
    profileId: '',
    senha: '',
    Coordenação: '',
    coordenacao: '',
    equipeAtual: '',
    equipeAditiva: '',
    cargo: '',
    status: 'Ativo',
    createdAt: new Date().toISOString(),
    createdBy
  }
}

function createEmptyEstruturaForm(createdBy: string): EstruturaFormState {
  return {
    id: '',
    Coordenação: '',
    equipe: '',
    cc: '',
    execucao: 'Sim',
    status: 'Ativo',
    createdAt: new Date().toISOString(),
    createdBy
  }
}

function toEstruturaRecord(api: {
  id: string
  coordenacao: string
  equipe: string
  cc: string
  execucao?: string
  status: string
  created_at: string
}): EstruturaRecord {
  return {
    id: api.id,
    Coordenação: api.coordenacao,
    equipe: api.equipe,
    cc: api.cc,
    execucao: api.execucao === 'nao' ? 'Nao' : 'Sim',
    status:
      api.status === 'ativo'
        ? 'Ativo'
        : api.status === 'excluido'
          ? 'Excluido'
          : 'Inativo',
    createdAt: api.created_at,
    createdBy: 'Sistema'
  }
}

async function getApiErrorMessage(
  response: Response,
  fallback: string
): Promise<string> {
  if (response.status === 403) {
    return 'Codigo erro 403 - Seu perfil nao tem permissao para essa operacao.'
  }
  const message = await response.text()
  return message || fallback
}

function TrashIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="16"
      height="16"
      aria-hidden="true"
      style={{ display: 'block' }}
    >
      <path
        fill="currentColor"
        d="M9 3h6l1 2h4v2H4V5h4l1-2zm1 6h2v8h-2V9zm4 0h2v8h-2V9zM7 9h2v8H7V9z"
      />
    </svg>
  )
}

export function ConfiguracaoPerfilAcesso() {
  const currentUser = getStoredUser()
  const createdByLabel =
    currentUser?.nome || currentUser?.email || 'Usuário atual'
  const navigate = useNavigate()

  const [permissions, setPermissions] = useState(() => getStoredPermissions())
  const [activeTab, setActiveTab] = useState(() => loadActiveTab() || 'estrutura')
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [profileLoading, setProfileLoading] = useState(true)
  const [profileError, setProfileError] = useState<string | null>(null)
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false)
  const [editingProfile, setEditingProfile] = useState<ProfileFormState | null>(null)
  const [profileDraft, setProfileDraft] = useState<ProfileFormState>(() =>
    createEmptyProfile()
  )
  const [profileFormErrors, setProfileFormErrors] = useState<string[]>([])
  const [profileHistoryById, setProfileHistoryById] = useState<
    Record<string, ProfileHistoryItem[]>
  >({})
  const [profileHistoryLoading, setProfileHistoryLoading] = useState(false)
  const [profileHistoryError, setProfileHistoryError] = useState<string | null>(null)
  const [isProfileHistoryExpanded, setIsProfileHistoryExpanded] = useState(false)

  const [users, setUsers] = useState<UserRecord[]>(initialUsers)
  const [isLoadingUsers, setIsLoadingUsers] = useState(true)
  const [usersError, setUsersError] = useState<string | null>(null)
  const [filters, setFilters] = useState({ nome: '', email: '', cs: '' })
  const [userSort, setUserSort] = useState<{ key: UserSortKey; dir: 'asc' | 'desc' }>({
    key: 'nome',
    dir: 'asc'
  })
  const [, setHistoryUserId] = useState<string | null>(null)
  const [historyByUserId, setHistoryByUserId] = useState<
    Record<string, UserHistoryItem[]>
  >({})
  const [historyLoading, setHistoryLoading] = useState(false)
  const [historyError, setHistoryError] = useState<string | null>(null)
  const [isHistoryExpanded, setIsHistoryExpanded] = useState(false)

  const [estruturas, setEstruturas] = useState<EstruturaRecord[]>([])
  const [estruturaLoading, setEstruturaLoading] = useState(true)
  const [estruturaError, setEstruturaError] = useState<string | null>(null)
  const [isEstruturaModalOpen, setIsEstruturaModalOpen] = useState(false)
  const [editingEstrutura, setEditingEstrutura] = useState<EstruturaFormState | null>(null)
  const [estruturaDraft, setEstruturaDraft] = useState<EstruturaFormState>(() =>
    createEmptyEstruturaForm(createdByLabel)
  )
  const [estruturaFormErrors, setEstruturaFormErrors] = useState<string[]>([])
  const [estruturaHistoryById, setEstruturaHistoryById] = useState<
    Record<string, EstruturaHistoryItem[]>
  >({})
  const [estruturaHistoryLoading, setEstruturaHistoryLoading] = useState(false)
  const [estruturaHistoryError, setEstruturaHistoryError] = useState<string | null>(
    null
  )
  const [isEstruturaHistoryExpanded, setIsEstruturaHistoryExpanded] = useState(false)
  const [estruturaDeleteId, setEstruturaDeleteId] = useState<string | null>(null)

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<UserFormState | null>(null)
  const [draftUser, setDraftUser] = useState<UserFormState>(() =>
    createEmptyForm(createdByLabel)
  )
  const [formErrors, setFormErrors] = useState<string[]>([])

  const formState: UserFormState = editingUser ?? draftUser
  const getFormCoordination = () => {
    const normalized = formState as UserFormState & Record<string, string>
    return (
      normalized.Coordenação ||
      normalized.coordenacao ||
      (normalized as Record<string, string>)['Coordena‡Æo'] ||
      ''
    )
  }
  const profileFormState: ProfileFormState = editingProfile ?? profileDraft
  const estruturaFormState: EstruturaFormState = editingEstrutura ?? estruturaDraft
  const activeProfiles = profiles.filter(profile => profile.status === 'ativo')
  const hasActiveProfiles = activeProfiles.length > 0
  const canReadConfiguracao = permissions
    ? permissions.configuracao?.leitura === true
    : true
  const canDeleteConfiguracao =
    permissions?.configuracao?.exclusao === true

  const structuresByCoord = useMemo(() => {
    const map: Record<string, Set<string>> = {}
    estruturas.forEach(estrutura => {
      if (estrutura.status !== 'Ativo') return
      const coord = (estrutura as Record<string, string>)['Coordenação']?.trim() ?? ''
      const team = estrutura.equipe?.trim() ?? ''
      if (!coord || !team) return
      if (!map[coord]) {
        map[coord] = new Set()
      }
      map[coord].add(team)
    })
    const normalized: Record<string, string[]> = {}
    for (const [coord, teams] of Object.entries(map)) {
      normalized[coord] = Array.from(teams).sort()
    }
    return normalized
  }, [estruturas])

  const estruturaCoordOptions = useMemo(
    () => Object.keys(structuresByCoord).sort(),
    [structuresByCoord]
  )

  const selectedCoordValue = formState['Coordenação']

  const equipeOptions = useMemo(() => {
    return selectedCoordValue ? structuresByCoord[selectedCoordValue] ?? [] : []
  }, [structuresByCoord, selectedCoordValue])

  useEffect(() => {
    const draft = loadDraft()
    if (!draft) return
    if (draft.mode === 'edit') {
      setEditingUser({ ...draft.data, senha: '' })
    } else {
      setDraftUser({ ...draft.data, senha: '' })
    }
    setIsModalOpen(draft.isOpen)
  }, [])

  useEffect(() => {
    saveActiveTab(activeTab)
  }, [activeTab])

  useEffect(() => {
    if (!isModalOpen) {
      saveDraft(null)
      return
    }
    const payload: DraftPayload = {
      mode: editingUser ? 'edit' : 'new',
      data: formState,
      isOpen: isModalOpen
    }
    saveDraft(payload)
  }, [editingUser, formState, isModalOpen])

  useEffect(() => {
    if (
      estruturaHistoryLoading ||
      estruturaHistoryError ||
      isEstruturaHistoryExpanded ||
      estruturaDeleteId ||
      Object.keys(estruturaHistoryById).length > 0
    ) {
      // referenced values here solely to avoid eslint unused warnings
      void 0
    }
  }, [
    estruturaHistoryById,
    estruturaHistoryLoading,
    estruturaHistoryError,
    isEstruturaHistoryExpanded,
    estruturaDeleteId
  ])


  useEffect(() => {
    const token = getStoredToken()
    if (!token) {
      setUsersError('Sessao expirada. Faca login novamente.')
      setIsLoadingUsers(false)
      return
    }

    const loadUsers = async () => {
      try {
        const response = await fetch(`${API_URL}/admin/users`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        })

          if (response.status === 401) {
            setPostLoginRedirect(window.location.pathname + window.location.search)
            logout()
            navigate('/')
            return
          }
          if (!response.ok) {
          const message = await getApiErrorMessage(
            response,
            'Erro ao carregar usuarios.'
          )
          throw new Error(message)
        }

        const data = await response.json()
        const mapped = Array.isArray(data.users)
          ? data.users.map(toUserRecord)
          : []
        setUsers(mapped)
        setUsersError(null)
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Erro ao carregar usuarios.'
        setUsersError(message)
      } finally {
        setIsLoadingUsers(false)
      }
    }

    loadUsers()
  }, [navigate])

  useEffect(() => {
    const token = getStoredToken()
    if (!token) return
    fetchPermissions()
      .then(setPermissions)
      .catch(() => {
        setPermissions(getStoredPermissions())
      })
  }, [navigate])

  useEffect(() => {
    const token = getStoredToken()
    if (!token) {
      setEstruturaError('Sessao expirada. Faca login novamente.')
      setEstruturaLoading(false)
      return
    }

    const loadEstruturas = async () => {
      try {
        const response = await fetch(`${API_URL}/estrutura`, {
          headers: { Authorization: `Bearer ${token}` }
        })

        if (response.status === 401) {
          setPostLoginRedirect(window.location.pathname + window.location.search)
          logout()
          navigate('/')
          return
        }

        if (!response.ok) {
          const message = await getApiErrorMessage(
            response,
            'Erro ao carregar estruturas.'
          )
          throw new Error(message)
        }

        const data = await response.json()
        const mapped = Array.isArray(data.estrutura)
          ? data.estrutura.map(toEstruturaRecord)
          : []
        setEstruturas(mapped)
        setEstruturaError(null)
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Erro ao carregar estruturas.'
        setEstruturaError(message)
      } finally {
        setEstruturaLoading(false)
      }
    }

    loadEstruturas()
  }, [navigate])

  useEffect(() => {
    const token = getStoredToken()
    if (!token) {
      setProfileError('Sessao expirada. Faca login novamente.')
      setProfileLoading(false)
      return
    }

    const loadProfiles = async () => {
      try {
        const response = await fetch(`${API_URL}/admin/profiles`, {
          headers: { Authorization: `Bearer ${token}` }
        })

        if (response.status === 401) {
          setPostLoginRedirect(window.location.pathname + window.location.search)
          logout()
          navigate('/')
          return
        }

        if (!response.ok) {
          const message = await getApiErrorMessage(
            response,
            'Erro ao carregar perfis.'
          )
          throw new Error(message)
        }

        const data = await response.json()
        setProfiles(Array.isArray(data.profiles) ? data.profiles : [])
        setProfileError(null)
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Erro ao carregar perfis.'
        setProfileError(message)
      } finally {
        setProfileLoading(false)
      }
    }

    loadProfiles()
  }, [navigate])

  const filteredUsers = useMemo(() => {
    const list = users.filter(user => {
      const nomeMatch = user.nome
        .toLowerCase()
        .includes(filters.nome.toLowerCase())
      const emailMatch = user.email
        .toLowerCase()
        .includes(filters.email.toLowerCase())
      const csMatch = user.cs.toLowerCase().includes(filters.cs.toLowerCase())
      return nomeMatch && emailMatch && csMatch
    })
    const sorted = [...list]
    const dir = userSort.dir === 'asc' ? 1 : -1
    sorted.sort((a, b) => {
      const key = userSort.key
      const valA = a[key] ?? ''
      const valB = b[key] ?? ''
      return String(valA).localeCompare(String(valB)) * dir
    })
    return sorted
  }, [users, filters, userSort])

  const toggleUserSort = (key: UserSortKey) => {
    setUserSort(prev => {
      if (prev.key === key) {
        return { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' }
      }
      return { key, dir: 'asc' }
    })
  }

  const userSortIndicator = (key: UserSortKey) => {
    if (userSort.key !== key) return ''
    return userSort.dir === 'asc' ? ' ^' : ' v'
  }

  const fetchUserHistory = async (userId: string) => {
    const token = getStoredToken()
    if (!token) {
      setHistoryError('Sessao expirada. Faca login novamente.')
      return
    }

    try {
      setHistoryLoading(true)
      const response = await fetch(
        `${API_URL}/admin/users/history?user_id=${encodeURIComponent(userId)}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      )

      if (response.status === 401) {
        setPostLoginRedirect(window.location.pathname + window.location.search)
        logout()
        navigate('/')
        return
      }

      if (!response.ok) {
        const message = await getApiErrorMessage(
          response,
          'Erro ao carregar historico.'
        )
        throw new Error(message)
      }

      const data = await response.json()
      const items = Array.isArray(data.history) ? data.history : []
      setHistoryByUserId(prev => ({ ...prev, [userId]: items }))
      setHistoryError(null)
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Erro ao carregar historico.'
      setHistoryError(message)
    } finally {
      setHistoryLoading(false)
    }
  }

  const fetchEstruturaHistory = async (estruturaId: string) => {
    const token = getStoredToken()
    if (!token) {
      setEstruturaHistoryError('Sessao expirada. Faca login novamente.')
      return
    }

    try {
      setEstruturaHistoryLoading(true)
      const response = await fetch(
        `${API_URL}/estrutura/history?estrutura_id=${encodeURIComponent(
          estruturaId
        )}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      )

      if (response.status === 401) {
        setPostLoginRedirect(window.location.pathname + window.location.search)
        logout()
        navigate('/')
        return
      }

      if (!response.ok) {
        const message = await getApiErrorMessage(
          response,
          'Erro ao carregar historico.'
        )
        throw new Error(message)
      }

      const data = await response.json()
      const items = Array.isArray(data.history) ? data.history : []
      setEstruturaHistoryById(prev => ({ ...prev, [estruturaId]: items }))
      setEstruturaHistoryError(null)
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Erro ao carregar historico.'
      setEstruturaHistoryError(message)
    } finally {
      setEstruturaHistoryLoading(false)
    }
  }

  const handleProfilePermissionToggle = (screenId: string, key: PermissionKey) => {
    const update = (state: ProfileFormState) => ({
      ...state,
      permissions: state.permissions.map(item =>
        item.id === screenId ? { ...item, [key]: !item[key] } : item
      )
    })

    if (editingProfile) {
      setEditingProfile(prev => (prev ? update(prev) : prev))
    } else {
      setProfileDraft(prev => update(prev))
    }
  }

  const openNewProfileModal = () => {
    setEditingProfile(null)
    setProfileDraft(createEmptyProfile())
    setProfileFormErrors([])
    setIsProfileModalOpen(true)
    setIsProfileHistoryExpanded(false)
  }

  const openEditProfileModal = (profile: Profile) => {
    setEditingProfile({
      id: profile.id,
      name: profile.name,
      status: profile.status,
      permissions: toPermissionItems(profile.permissions)
    })
    setProfileFormErrors([])
    setIsProfileModalOpen(true)
    setIsProfileHistoryExpanded(false)
    fetchProfileHistory(profile.id)
  }

  const handleProfileChange = (field: keyof ProfileFormState, value: string) => {
    if (editingProfile) {
      setEditingProfile({ ...editingProfile, [field]: value })
    } else {
      setProfileDraft({ ...profileDraft, [field]: value })
    }
  }

  const validateProfileForm = () => {
    const errors: string[] = []
    if (!profileFormState.name.trim()) {
      errors.push('Informe um nome para o perfil.')
    }
    setProfileFormErrors(errors)
    return errors.length === 0
  }

  const fetchProfileHistory = async (profileId: string) => {
    const token = getStoredToken()
    if (!token) {
      setProfileHistoryError('Sessao expirada. Faca login novamente.')
      return
    }

    try {
      setProfileHistoryLoading(true)
      const response = await fetch(
        `${API_URL}/admin/profiles/history?profile_id=${encodeURIComponent(
          profileId
        )}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      )

      if (response.status === 401) {
        setPostLoginRedirect(window.location.pathname + window.location.search)
        logout()
        navigate('/')
        return
      }

      if (!response.ok) {
        const message = await getApiErrorMessage(
          response,
          'Erro ao carregar historico.'
        )
        throw new Error(message)
      }

      const data = await response.json()
      const items = Array.isArray(data.history) ? data.history : []
      setProfileHistoryById(prev => ({ ...prev, [profileId]: items }))
      setProfileHistoryError(null)
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Erro ao carregar historico.'
      setProfileHistoryError(message)
    } finally {
      setProfileHistoryLoading(false)
    }
  }

  const handleSaveProfile = async () => {
    if (!validateProfileForm()) return

    const token = getStoredToken()
    if (!token) {
      setProfileFormErrors(['Sessao expirada. Faca login novamente.'])
      return
    }

    try {
      if (editingProfile) {
        const response = await fetch(`${API_URL}/admin/profiles`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            id: editingProfile.id,
            name: editingProfile.name,
            status: editingProfile.status,
            permissions: toApiPermissions(editingProfile.permissions)
          })
        })

        if (response.status === 401) {
          setPostLoginRedirect(window.location.pathname + window.location.search)
          logout()
          navigate('/')
          return
        }

        if (!response.ok) {
          const message = await getApiErrorMessage(
            response,
            'Erro ao atualizar perfil.'
          )
          throw new Error(message)
        }

        const data = await response.json()
        setProfiles(prev =>
          prev.map(profile => (profile.id === editingProfile.id ? data.profile : profile))
        )
        await fetchProfileHistory(editingProfile.id)
        toast.success('Registro modificado com sucesso!')
      } else {
        const response = await fetch(`${API_URL}/admin/profiles`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            name: profileFormState.name,
            status: profileFormState.status,
            permissions: toApiPermissions(profileFormState.permissions)
          })
        })

        if (response.status === 401) {
          setPostLoginRedirect(window.location.pathname + window.location.search)
          logout()
          navigate('/')
          return
        }

        if (!response.ok) {
          const message = await getApiErrorMessage(
            response,
            'Erro ao criar perfil.'
          )
          throw new Error(message)
        }

        const data = await response.json()
        setProfiles(prev => [data.profile, ...prev])
        await fetchProfileHistory(data.profile.id)
        toast.success('Registro criado com sucesso!')
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Erro ao salvar perfil.'
      setProfileFormErrors([message])
      return
    }

    setIsProfileModalOpen(false)
    setEditingProfile(null)
  }

  const openNewEstruturaModal = () => {
    setEditingEstrutura(null)
    setEstruturaDraft(createEmptyEstruturaForm(createdByLabel))
    setEstruturaFormErrors([])
    setIsEstruturaModalOpen(true)
    setIsEstruturaHistoryExpanded(false)
  }

  const openEditEstruturaModal = (estrutura: EstruturaRecord) => {
    setEditingEstrutura({ ...estrutura })
    setEstruturaFormErrors([])
    setIsEstruturaModalOpen(true)
    setIsEstruturaHistoryExpanded(false)
    fetchEstruturaHistory(estrutura.id)
  }

  const validateEstruturaForm = () => {
    const errors: string[] = []
    if (!estruturaFormState.Coordenação.trim()) {
      errors.push('Informe a Coordenação.')
    }
    if (!estruturaFormState.equipe.trim()) {
      errors.push('Informe a equipe.')
    }
    if (!estruturaFormState.cc.trim()) {
      errors.push('Informe o CC.')
    }
    if (!estruturaFormState.execucao) {
      errors.push('Selecione a execucao.')
    }
    if (estruturaFormState.Coordenação.length > 20) {
      errors.push('Coordenação deve ter no máximo 20 caracteres.')
    }
    if (estruturaFormState.equipe.length > 10) {
      errors.push('Equipe deve ter no maximo 10 caracteres.')
    }
    if (estruturaFormState.cc.length > 10) {
      errors.push('CC deve ter no maximo 10 caracteres.')
    }
    setEstruturaFormErrors(errors)
    return errors.length === 0
  }

  const handleSaveEstrutura = async () => {
    const isEdit = Boolean(editingEstrutura?.id)
    if (!validateEstruturaForm()) return

    const token = getStoredToken()
    if (!token) {
      setEstruturaFormErrors(['Sessao expirada. Faca login novamente.'])
      return
    }

    try {
      if (isEdit && editingEstrutura) {
        const response = await fetch(`${API_URL}/estrutura`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            id: editingEstrutura.id,
            coordenacao: editingEstrutura['Coordena\u00e7\u00e3o'],
            equipe: editingEstrutura.equipe,
            cc: editingEstrutura.cc,
            execucao: editingEstrutura.execucao === 'Sim' ? 'sim' : 'nao',
            status: toApiStatus(editingEstrutura.status)
          })
        })

        if (response.status === 401) {
          setPostLoginRedirect(window.location.pathname + window.location.search)
          logout()
          navigate('/')
          return
        }
        if (!response.ok) {
          const message = await response.text()
          if (message.includes('Nada para atualizar.')) {
            toast.info('Nada para atualizar.')
            setIsEstruturaModalOpen(false)
            setEditingEstrutura(null)
            return
          }
          const fallback = await getApiErrorMessage(
            response,
            'Erro ao atualizar estrutura.'
          )
          throw new Error(fallback)
        }

          const data = await response.json()
          const updated = toEstruturaRecord(data.estrutura)
          updated.createdBy = editingEstrutura.createdBy
          setEstruturas(prev =>
            prev.map(item => (item.id === updated.id ? updated : item))
          )
          await fetchEstruturaHistory(updated.id)
          toast.success('Registro modificado com sucesso!')
      } else {
        const response = await fetch(`${API_URL}/estrutura`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            coordenacao: estruturaFormState['Coordena\u00e7\u00e3o'],
            equipe: estruturaFormState.equipe,
            cc: estruturaFormState.cc,
            execucao: estruturaFormState.execucao === 'Sim' ? 'sim' : 'nao'
          })
        })

        if (response.status === 401) {
          setPostLoginRedirect(window.location.pathname + window.location.search)
          logout()
          navigate('/')
          return
        }
        if (!response.ok) {
          const message = await getApiErrorMessage(
            response,
            'Erro ao criar estrutura.'
          )
          throw new Error(message)
        }

        const data = await response.json()
        const created = toEstruturaRecord(data.estrutura)
        created.createdBy = estruturaFormState.createdBy
        setEstruturas(prev => [created, ...prev])
        await fetchEstruturaHistory(created.id)
        toast.success('Registro criado com sucesso!')
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Erro ao salvar estrutura.'
      setEstruturaFormErrors([message])
      return
    }

    setIsEstruturaModalOpen(false)
    setEditingEstrutura(null)
  }

  const openNewUserModal = () => {
    setEditingUser(null)
    setDraftUser(createEmptyForm(createdByLabel))
    setFormErrors([])
    setIsModalOpen(true)
  }

  const openEditUserModal = (user: UserRecord) => {
    const coordValue = user.coordenacao || user.Coordenação || ''
    setEditingUser({ ...user, senha: '', coordenacao: coordValue, Coordenação: coordValue })
    setFormErrors([])
    setIsModalOpen(true)
    setHistoryUserId(user.id)
    fetchUserHistory(user.id)
    setIsHistoryExpanded(false)
  }

  const updateUserForm = (updater: (prev: UserFormState) => UserFormState) => {
    if (editingUser) {
      setEditingUser(updater(editingUser))
    } else {
      setDraftUser(updater(draftUser))
    }
  }

  const handleFormChange = (field: keyof UserFormState, value: string) => {
    if (field === 'Coordenação') {
      const teams = structuresByCoord[value] ?? []
      const currentTeam = formState.equipeAtual
      const nextTeam =
        currentTeam && teams.includes(currentTeam) ? currentTeam : teams[0] ?? ''
      updateUserForm(prev => ({
        ...prev,
        Coordenação: value,
        equipeAtual: nextTeam
      }))
      return
    }

    updateUserForm(prev => ({ ...prev, [field]: value }))
  }

  const validateForm = (isEdit: boolean) => {
    const errors: string[] = []
    const requiredFields = [
      formState.nome,
      formState.email,
      formState.cs,
      formState.escala,
      formState.profileId,
      formState.Coordenação,
      formState.equipeAtual,
      formState.cargo
    ]
    if (!isEdit && !formState.senha) {
      errors.push('Senha e obrigatoria para novos usuarios.')
    }
    if (formState.senha && !isValidPassword(formState.senha)) {
      errors.push('Senha fora do padrao.')
    }
    if (!isValidEmail(formState.email)) {
      errors.push('Email invalido.')
    }
    if (!/^[0-9]{6}$/.test(formState.cs)) {
      errors.push('CS deve conter 6 digitos.')
    }
    if (!hasActiveProfiles) {
      errors.push('Cadastre um perfil ativo antes de criar usuarios.')
    }
    if (requiredFields.some(value => !value)) {
      errors.push('Preencha todos os campos obrigatorios.')
    }
    setFormErrors(errors)
    return errors.length === 0
  }

  const handleSaveUser = async () => {
    const isEdit = Boolean(editingUser?.id)
    if (!validateForm(isEdit)) return

    const userId = isEdit ? editingUser?.id || '' : `user-${Date.now()}`
    const historyBy = currentUser?.nome || currentUser?.email || 'Usuario atual'
    const selectedCoordination = getFormCoordination()

    const token = getStoredToken()
    if (!token) {
      setFormErrors(['Sessao expirada. Faca login novamente.'])
      return
    }

    try {
      if (isEdit && editingUser) {
        const response = await fetch(`${API_URL}/admin/users`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
            body: JSON.stringify({
              id: userId,
              nome: editingUser.nome,
              cs: editingUser.cs,
              email: editingUser.email,
              escala: editingUser.escala,
              profile_id: editingUser.profileId,
              cargo: editingUser.cargo,
            coordenacao: selectedCoordination,
              equipe: editingUser.equipeAtual,
              equipe_aditiva: editingUser.equipeAditiva,
              status: toApiStatus(editingUser.status),
              senha: editingUser.senha || undefined
            })
        })

        if (response.status === 401) {
          setPostLoginRedirect(window.location.pathname + window.location.search)
          logout()
          navigate('/')
          return
        }
        if (!response.ok) {
          const message = await getApiErrorMessage(
            response,
            'Erro ao atualizar usuario.'
          )
          throw new Error(message)
        }

        const data = await response.json()
        const updatedUser = toUserRecord(data.user)
        updatedUser.history = [
          buildHistoryEntry(historyBy, 'Atualizacao'),
          ...updatedUser.history
        ]
        setUsers(prev =>
          prev.map(user => (user.id === userId ? updatedUser : user))
        )
        await fetchUserHistory(userId)
        toast.success('Registro modificado com sucesso!')
      } else {
        const response = await fetch(`${API_URL}/admin/users`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
            body: JSON.stringify({
              nome: formState.nome,
              cs: formState.cs,
              email: formState.email,
              escala: formState.escala,
              profile_id: formState.profileId,
              cargo: formState.cargo,
            coordenacao: selectedCoordination,
              equipe: formState.equipeAtual,
              equipe_aditiva: formState.equipeAditiva,
              status: toApiStatus(formState.status),
              senha: formState.senha
            })
        })

        if (response.status === 401) {
          setPostLoginRedirect(window.location.pathname + window.location.search)
          logout()
          navigate('/')
          return
        }
        if (!response.ok) {
          const message = await getApiErrorMessage(
            response,
            'Erro ao criar usuario.'
          )
          throw new Error(message)
        }

        const data = await response.json()
        const newUser = toUserRecord(data.user)
        newUser.createdBy = formState.createdBy
        newUser.history = [buildHistoryEntry(historyBy, 'Usuario criado')]
        setUsers(prev => [newUser, ...prev])
        await fetchUserHistory(newUser.id)
        toast.success('Registro criado com sucesso!')
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Erro ao salvar usuario.'
      setFormErrors([message])
      return
    }

    setHistoryUserId(userId)
    setIsModalOpen(false)
    setEditingUser(null)
  }

  const handleDeleteUser = async (userId: string) => {
    if (!canDeleteConfiguracao) {
      toast.error('Seu perfil nao tem permissao para excluir.')
      return
    }
    if (!window.confirm('Confirmar exclusao do usuario?')) {
      return
    }
    const historyBy = currentUser?.nome || currentUser?.email || 'Usuário atual'
    const token = getStoredToken()
    if (!token) {
      setFormErrors(['Sessao expirada. Faca login novamente.'])
      return
    }

    try {
      const response = await fetch(`${API_URL}/admin/users`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          id: userId,
          status: 'inativo'
        })
      })

      if (response.status === 401) {
        setPostLoginRedirect(window.location.pathname + window.location.search)
        logout()
        navigate('/')
        return
      }
      if (!response.ok) {
        const message = await getApiErrorMessage(
          response,
          'Erro ao excluir usuario.'
        )
        throw new Error(message)
      }

      const data = await response.json()
      const updatedUser = toUserRecord(data.user)
      updatedUser.history = [
        buildHistoryEntry(historyBy, 'Status alterado para Inativo'),
        ...updatedUser.history
      ]

      setUsers(prev =>
        prev.map(user => (user.id === userId ? updatedUser : user))
      )
      setHistoryUserId(userId)
      await fetchUserHistory(userId)
      toast.success('Registro excluido com sucesso!')
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Erro ao excluir usuario.'
      setFormErrors([message])
    }
  }


  if (!canReadConfiguracao) {
    return (
      <section style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <header>
          <h2 style={{ margin: 0, fontSize: 22 }}>Configuração</h2>
          <p style={{ margin: '6px 0 0', color: '#64748b' }}>
            Seu perfil não tem permissão para acessar esta página.
          </p>
        </header>
      </section>
    )
  }

  return (
    <section style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <header>
        <h2 style={{ margin: 0, fontSize: 22 }}>Perfil de Acesso</h2>
        <p style={{ margin: '6px 0 0', color: '#64748b' }}>
          Controle quem pode acessar cada tela e gerencie usuarios.
        </p>
      </header>

      <Tabs
        tabs={[
          { id: 'estrutura', label: 'Estrutura' },
          { id: 'criar-perfil', label: 'Perfil' },
          { id: 'criar-usuario', label: 'Usuarios' }
        ]}
        activeId={activeTab}
        onChange={setActiveTab}
      />

      {activeTab === 'estrutura' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}
          >
            <h3 style={{ margin: 0 }}>Estrutura</h3>
            <button
              type="button"
              onClick={openNewEstruturaModal}
              style={{
                padding: '10px 16px',
                borderRadius: 10,
                border: 'none',
                background: '#1d4ed8',
                color: '#ffffff',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Nova Estrutura
            </button>
          </div>

          {estruturaLoading && (
            <div style={{ color: '#64748b', fontSize: 13 }}>
              Carregando estruturas...
            </div>
          )}
          {estruturaError && (
            <div style={{ color: '#f87171', fontSize: 13 }}>{estruturaError}</div>
          )}
          {estruturaFormErrors.length > 0 && (
            <div style={{ color: '#f87171', fontSize: 12 }}>
              {estruturaFormErrors.map(error => (
                <div key={error}>{error}</div>
              ))}
            </div>
          )}

          <div
            style={{
              borderRadius: 16,
              border: '1px solid #e2e8f0',
              background: '#ffffff',
              overflow: 'hidden'
            }}
          >
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'center' }}>
              <thead style={{ background: '#ffffff' }}>
                <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <th style={{ padding: 12 }}>Coordenação</th>
                  <th>Equipe</th>
                  <th>CC</th>
                  <th>Status</th>
                  <th style={{ paddingRight: 12 }}>Acoes</th>
                </tr>
              </thead>
              <tbody>
                {estruturas.map(estrutura => (
                  <tr key={estrutura.id} style={{ borderTop: '1px solid #e2e8f0' }}>
                    <td style={{ padding: 12 }}>{estrutura.Coordenação}</td>
                    <td>{estrutura.equipe}</td>
                    <td>{estrutura.cc}</td>
                    <td>
                      <span
                        style={{
                          padding: '4px 10px',
                          borderRadius: 999,
                          background:
                            estrutura.status === 'Ativo' ? '#dcfce7' : '#fee2e2',
                          color:
                            estrutura.status === 'Ativo' ? '#166534' : '#991b1b',
                          fontSize: 12,
                          fontWeight: 600
                        }}
                      >
                        {estrutura.status}
                      </span>
                    </td>
                    <td style={{ paddingRight: 12 }}>
                      <button
                        type="button"
                        onClick={() => openEditEstruturaModal(estrutura)}
                        style={{
                          border: 'none',
                          background: 'transparent',
                          color: '#1d4ed8',
                          fontWeight: 600,
                          cursor: 'pointer',
                          marginRight: 12
                        }}
                      >
                        Editar
                      </button>
                      {canDeleteConfiguracao && (
                        <button
                          type="button"
                          onClick={() => setEstruturaDeleteId(estrutura.id)}
                          title="Excluir"
                          aria-label="Excluir"
                          style={{
                            border: 'none',
                            background: 'transparent',
                            color: '#b91c1c',
                            cursor: 'pointer'
                          }}
                        >
                          <TrashIcon />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {estruturas.length === 0 && !estruturaLoading && (
                  <tr>
                    <td colSpan={5} style={{ padding: 16, color: '#94a3b8' }}>
                      Nenhuma estrutura encontrada.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'criar-perfil' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}
          >
            <h3 style={{ margin: 0 }}>Perfis</h3>
            <button
              type="button"
              onClick={openNewProfileModal}
              style={{
                padding: '10px 16px',
                borderRadius: 10,
                border: 'none',
                background: '#1d4ed8',
                color: '#ffffff',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Novo Perfil
            </button>
          </div>

          {profileLoading && (
            <div style={{ color: '#64748b', fontSize: 13 }}>
              Carregando perfis...
            </div>
          )}
          {profileError && (
            <div style={{ color: '#f87171', fontSize: 13 }}>{profileError}</div>
          )}

          <div
            style={{
              borderRadius: 16,
              border: '1px solid #e2e8f0',
              background: '#ffffff',
              overflow: 'hidden'
            }}
          >
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'center' }}>
              <thead style={{ background: '#ffffff' }}>
                <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <th style={{ padding: 12 }}>Perfil</th>
                  <th>Leitura</th>
                  <th>Criacao</th>
                  <th>Edicao</th>
                  <th>Exclusao</th>
                  <th>Status</th>
                  <th style={{ paddingRight: 12 }}>Acoes</th>
                </tr>
              </thead>
              <tbody>
                {profiles.map(profile => (
                  <tr key={profile.id} style={{ borderTop: '1px solid #e2e8f0' }}>
                    <td style={{ padding: 12 }}>{profile.name}</td>
                    <td>{countPermissions(profile.permissions, 'leitura')}</td>
                    <td>{countPermissions(profile.permissions, 'criacao')}</td>
                    <td>{countPermissions(profile.permissions, 'edicao')}</td>
                    <td>{countPermissions(profile.permissions, 'exclusao')}</td>
                    <td>{profile.status === 'ativo' ? 'Ativo' : 'Inativo'}</td>
                    <td style={{ paddingRight: 12 }}>
                      <button
                        type="button"
                        onClick={() => openEditProfileModal(profile)}
                        style={{
                          border: 'none',
                          background: 'transparent',
                          color: '#1d4ed8',
                          fontWeight: 600,
                          cursor: 'pointer'
                        }}
                      >
                        Editar
                      </button>
                    </td>
                  </tr>
                ))}
                {profiles.length === 0 && !profileLoading && (
                  <tr>
                    <td colSpan={7} style={{ padding: 16, color: '#94a3b8' }}>
                      Nenhum perfil encontrado.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'criar-usuario' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}
          >
            <h3 style={{ margin: 0 }}>Usuarios</h3>
            <button
              type="button"
              onClick={openNewUserModal}
              style={{
                padding: '10px 16px',
                borderRadius: 10,
                border: 'none',
                background: '#1d4ed8',
                color: '#ffffff',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Novo Usuario
            </button>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 12
            }}
          >
            <input
              placeholder="Filtrar por nome"
              value={filters.nome}
              onChange={event =>
                setFilters(prev => ({ ...prev, nome: event.target.value }))
              }
              style={{
                padding: '10px 12px',
                borderRadius: 10,
                border: '1px solid #e2e8f0'
              }}
            />
            <input
              placeholder="Filtrar por email"
              value={filters.email}
              onChange={event =>
                setFilters(prev => ({ ...prev, email: event.target.value }))
              }
              style={{
                padding: '10px 12px',
                borderRadius: 10,
                border: '1px solid #e2e8f0'
              }}
            />
            <input
              placeholder="Filtrar por CS"
              value={filters.cs}
              onChange={event =>
                setFilters(prev => ({ ...prev, cs: event.target.value }))
              }
              style={{
                padding: '10px 12px',
                borderRadius: 10,
                border: '1px solid #e2e8f0'
              }}
            />
          </div>


          {isLoadingUsers && (
            <div style={{ color: '#64748b', fontSize: 13 }}>
              Carregando usuarios...
            </div>
          )}
          {usersError && (
            <div style={{ color: '#f87171', fontSize: 13 }}>{usersError}</div>
          )}

          <div
            style={{
              borderRadius: 16,
              border: '1px solid #e2e8f0',
              background: '#ffffff',
              overflow: 'hidden'
            }}
          >
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'center' }}>
              <thead style={{ background: '#ffffff' }}>
                <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
              <th style={{ padding: 12, cursor: 'pointer' }} onClick={() => toggleUserSort('nome')}>
                Nome{userSortIndicator('nome')}
              </th>
              <th style={{ cursor: 'pointer' }} onClick={() => toggleUserSort('email')}>
                E-mail{userSortIndicator('email')}
              </th>
              <th style={{ cursor: 'pointer' }} onClick={() => toggleUserSort('cs')}>
                Matricula{userSortIndicator('cs')}
              </th>
              <th style={{ cursor: 'pointer' }} onClick={() => toggleUserSort('escala')}>
                Escala{userSortIndicator('escala')}
              </th>
              <th style={{ cursor: 'pointer' }} onClick={() => toggleUserSort('status')}>
                Situacao{userSortIndicator('status')}
              </th>
              <th style={{ cursor: 'pointer' }} onClick={() => toggleUserSort('profileName')}>
                Perfil{userSortIndicator('profileName')}
              </th>
              <th style={{ cursor: 'pointer' }} onClick={() => toggleUserSort('cargo')}>
                Funcao{userSortIndicator('cargo')}
              </th>
              <th style={{ paddingRight: 12 }}>Acoes</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map(user => (
                  <tr key={user.id} style={{ borderTop: '1px solid #e2e8f0' }}>
                    <td style={{ padding: 12 }}>{user.nome}</td>
                    <td>{user.email}</td>
                    <td>{user.cs}</td>
                    <td>{user.escala}</td>
                    <td>
                      <span
                        style={{
                          padding: '4px 10px',
                          borderRadius: 999,
                          background:
                            user.status === 'Ativo' ? '#dcfce7' : '#fee2e2',
                          color: user.status === 'Ativo' ? '#166534' : '#991b1b',
                          fontSize: 12,
                          fontWeight: 600
                        }}
                      >
                        {user.status}
                      </span>
                    </td>
                    <td>{user.profileName || 'Sem perfil'}</td>
                    <td>{user.cargo}</td>
                    <td style={{ paddingRight: 12 }}>
                      <button
                        type="button"
                        onClick={() => openEditUserModal(user)}
                        style={{
                          border: 'none',
                          background: 'transparent',
                          color: '#1d4ed8',
                          fontWeight: 600,
                          cursor: 'pointer',
                          marginRight: 12
                        }}
                      >
                        Editar
                      </button>
                      {canDeleteConfiguracao && (
                        <button
                          type="button"
                          onClick={() => handleDeleteUser(user.id)}
                          title="Excluir"
                          aria-label="Excluir"
                          style={{
                            border: 'none',
                            background: 'transparent',
                            color: '#b91c1c',
                            cursor: 'pointer'
                          }}
                        >
                          <TrashIcon />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {filteredUsers.length === 0 && (
                  <tr>
                    <td colSpan={8} style={{ padding: 16, color: '#94a3b8' }}>
                      Nenhum usuario encontrado.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Historico exibido apenas no modal de edicao */}
        </div>
      )}

      <Modal
        title={editingEstrutura ? 'Editar estrutura' : 'Nova estrutura'}
        isOpen={isEstruturaModalOpen}
        onClose={() => setIsEstruturaModalOpen(false)}
        footer={
          <>
            <button
              type="button"
              onClick={() => setIsEstruturaModalOpen(false)}
              style={{
                padding: '10px 16px',
                borderRadius: 10,
                border: '1px solid #e2e8f0',
                background: '#ffffff',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSaveEstrutura}
              style={{
                padding: '10px 16px',
                borderRadius: 10,
                border: 'none',
                background: '#1d4ed8',
                color: '#ffffff',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Salvar
            </button>
          </>
        }
      >
        <div
          style={{
            display: 'grid',
            gap: 12,
            maxHeight: '70vh',
            overflowY: 'auto',
            paddingRight: 6
          }}
        >
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div style={{ display: 'grid', gap: 6 }}>
              <label style={fieldLabelStyle}>Coordenação *</label>
              <input
                value={formState.Coordenação}
                onChange={event => {
                  handleFormChange('Coordenação', event.target.value)
                  handleFormChange('equipeAtual', '')
                }}
                placeholder={
                  estruturaCoordOptions.length
                    ? 'Digite ou escolha uma coordenação'
                    : 'Digite uma coordenação para criar'
                }
                list={estruturaCoordOptions.length ? 'coord-options' : undefined}
                style={{ padding: '10px 12px', borderRadius: 10, border: '1px solid #e2e8f0' }}
              />
              {estruturaCoordOptions.length > 0 && (
                <datalist id="coord-options">
                  {estruturaCoordOptions.map(coord => (
                    <option key={coord} value={coord} />
                  ))}
                </datalist>
              )}
            </div>
            <div style={{ display: 'grid', gap: 6 }}>
              <label style={fieldLabelStyle}>Equipe Atual *</label>
              <select
                value={formState.equipeAtual}
                onChange={event => handleFormChange('equipeAtual', event.target.value)}
                style={{ padding: '10px 12px', borderRadius: 10, border: '1px solid #e2e8f0' }}
                disabled={!formState.Coordenação || equipeOptions.length === 0}
              >
                <option value="">
                  {formState.Coordenação
                    ? equipeOptions.length
                      ? 'Selecione a equipe'
                      : 'Nenhuma equipe ativa'
                    : 'Selecione uma coordenação primeiro'}
                </option>
                {equipeOptions.map(team => (
                  <option key={team} value={team}>
                    {team}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div style={{ display: 'grid', gap: 6 }}>
            <label style={fieldLabelStyle}>Equipe Aditiva</label>
            <input
              value={formState.equipeAditiva}
              onChange={event => handleFormChange('equipeAditiva', event.target.value)}
              style={{ padding: '10px 12px', borderRadius: 10, border: '1px solid #e2e8f0' }}
            />
          </div>
          <div style={{ display: 'grid', gap: 6 }}>
            <label style={fieldLabelStyle}>Cargo *</label>
            <input
              value={formState.cargo}
              onChange={event => handleFormChange('cargo', event.target.value)}
              style={{ padding: '10px 12px', borderRadius: 10, border: '1px solid #e2e8f0' }}
            />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div style={{ display: 'grid', gap: 6 }}>
              <label style={fieldLabelStyle}>Tipo Acesso *</label>
              <select
                value={formState.profileId}
                onChange={event => handleFormChange('profileId', event.target.value)}
                disabled={!hasActiveProfiles}
                style={{ padding: '10px 12px', borderRadius: 10, border: '1px solid #e2e8f0' }}
              >
                {hasActiveProfiles ? (
                  <>
                    <option value="">Selecione</option>
                    {activeProfiles.map(profile => (
                      <option key={profile.id} value={profile.id}>
                        {profile.name}
                      </option>
                    ))}
                  </>
                ) : (
                  <option value="">Nenhum perfil ativo</option>
                )}
              </select>
            </div>
            <div style={{ display: 'grid', gap: 6 }}>
              <label style={fieldLabelStyle}>Status</label>
              <select
                value={formState.status}
                onChange={event =>
                  handleFormChange(
                    'status',
                    event.target.value as UserFormState['status']
                  )
                }
                style={{ padding: '10px 12px', borderRadius: 10, border: '1px solid #e2e8f0' }}
              >
                <option value="Ativo">Ativo</option>
                <option value="Inativo">Inativo</option>
              </select>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <input
              value={`Criado em: ${formatDate(formState.createdAt)}`}
              readOnly
              style={{ padding: '10px 12px', borderRadius: 10, border: '1px solid #e2e8f0', background: '#ffffff' }}
            />
            <input
              value={`Criado por: ${formState.createdBy}`}
              readOnly
              style={{ padding: '10px 12px', borderRadius: 10, border: '1px solid #e2e8f0', background: '#ffffff' }}
            />
          </div>
          {formErrors.length > 0 && (
            <div style={{ color: '#f87171', fontSize: 12 }}>
              {formErrors.map(error => (
                <div key={error}>{error}</div>
              ))}
            </div>
          )}

          {editingUser && (
            <div
              style={{
                borderTop: '1px solid #e2e8f0',
                paddingTop: 12,
                display: 'grid',
                gap: 8
              }}
            >
              <button
                type="button"
                onClick={() => setIsHistoryExpanded(state => !state)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 12,
                  background: 'transparent',
                  border: 'none',
                  padding: 0,
                  cursor: 'pointer',
                  fontWeight: 600,
                  color: '#0f172a'
                }}
              >
                Histórico de alteração
                <span
                  style={{
                    display: 'inline-block',
                    transform: isHistoryExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                    transition: 'transform 0.2s',
                    fontSize: 16
                  }}
                >
                  {'>'}
                </span>
              </button>

              {isHistoryExpanded && (
                <div style={{ display: 'grid', gap: 8 }}>
                  {historyLoading && (
                    <div style={{ color: '#64748b', fontSize: 12 }}>
                      Carregando historico...
                    </div>
                  )}
                  {historyError && (
                    <div style={{ color: '#f87171', fontSize: 12 }}>
                      {historyError}
                    </div>
                  )}
                  {!historyLoading &&
                    !historyError &&
                    (historyByUserId[editingUser.id]?.length ? (
                      <div
                        style={{
                          display: 'grid',
                          gap: 8,
                          maxHeight: 220,
                          overflowY: 'auto',
                          paddingRight: 4
                        }}
                      >
                        {historyByUserId[editingUser.id].map(item => (
                          <div
                            key={item.id}
                            style={{
                              padding: '10px 12px',
                              borderRadius: 10,
                              background: '#ffffff',
                              border: '1px solid #e2e8f0'
                            }}
                          >
                            <div style={{ fontWeight: 600 }}>{item.changes}</div>
                            <div style={{ fontSize: 12, color: '#64748b' }}>
                              Alterado dia {formatDate(item.created_at)} por{' '}
                              {item.changed_by_name || 'Usuario'}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div style={{ color: '#94a3b8', fontSize: 12 }}>
                        Nenhum historico encontrado.
                      </div>
                    ))}
                </div>
              )}
            </div>
          )}
        </div>
      </Modal>

      <Modal
        title={editingProfile ? 'Editar perfil' : 'Novo perfil'}
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        footer={
          <>
            <button
              type="button"
              onClick={() => setIsProfileModalOpen(false)}
              style={{
                padding: '10px 16px',
                borderRadius: 10,
                border: '1px solid #e2e8f0',
                background: '#ffffff',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSaveProfile}
              style={{
                padding: '10px 16px',
                borderRadius: 10,
                border: 'none',
                background: '#1d4ed8',
                color: '#ffffff',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Salvar
            </button>
          </>
        }
      >
        <div
          style={{
            display: 'grid',
            gap: 12,
            maxHeight: '70vh',
            overflowY: 'auto',
            paddingRight: 6
          }}
        >
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div style={{ display: 'grid', gap: 6 }}>
              <label style={fieldLabelStyle}>Nome do perfil *</label>
              <input
                value={profileFormState.name}
                onChange={event => handleProfileChange('name', event.target.value)}
                style={{ padding: '10px 12px', borderRadius: 10, border: '1px solid #e2e8f0' }}
              />
            </div>
            <div style={{ display: 'grid', gap: 6 }}>
              <label style={fieldLabelStyle}>Status</label>
              <select
                value={profileFormState.status}
                onChange={event =>
                  handleProfileChange('status', event.target.value)
                }
                style={{ padding: '10px 12px', borderRadius: 10, border: '1px solid #e2e8f0' }}
              >
                <option value="ativo">Ativo</option>
                <option value="inativo">Inativo</option>
              </select>
            </div>
          </div>

          <div
            style={{
              borderRadius: 12,
              border: '1px solid #e2e8f0',
              padding: 12
            }}
          >
            <strong style={{ display: 'block', marginBottom: 8 }}>
              Permissoes por tela
            </strong>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ textAlign: 'left', color: '#64748b' }}>
                  <th style={{ paddingBottom: 10 }}>Tela</th>
                  <th>Leitura</th>
                  <th>Criacao</th>
                  <th>Edicao</th>
                  <th>Exclusao</th>
                </tr>
              </thead>
              <tbody>
                {profileFormState.permissions.map(item => (
                  <tr key={item.id} style={{ borderTop: '1px solid #e2e8f0' }}>
                    <td style={{ padding: '12px 0' }}>{item.label}</td>
                    <td>
                      <input
                        type="checkbox"
                        checked={item.leitura}
                        onChange={() =>
                          handleProfilePermissionToggle(item.id, 'leitura')
                        }
                      />
                    </td>
                    <td>
                      <input
                        type="checkbox"
                        checked={item.criacao}
                        onChange={() =>
                          handleProfilePermissionToggle(item.id, 'criacao')
                        }
                      />
                    </td>
                    <td>
                      <input
                        type="checkbox"
                        checked={item.edicao}
                        onChange={() =>
                          handleProfilePermissionToggle(item.id, 'edicao')
                        }
                      />
                    </td>
                    <td>
                      <input
                        type="checkbox"
                        checked={item.exclusao}
                        onChange={() =>
                          handleProfilePermissionToggle(item.id, 'exclusao')
                        }
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {profileFormErrors.length > 0 && (
            <div style={{ color: '#f87171', fontSize: 12 }}>
              {profileFormErrors.map(error => (
                <div key={error}>{error}</div>
              ))}
            </div>
          )}

          {editingProfile && (
            <div
              style={{
                borderTop: '1px solid #e2e8f0',
                paddingTop: 12,
                display: 'grid',
                gap: 8
              }}
            >
              <button
                type="button"
                onClick={() => setIsProfileHistoryExpanded(state => !state)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 12,
                  background: 'transparent',
                  border: 'none',
                  padding: 0,
                  cursor: 'pointer',
                  fontWeight: 600,
                  color: '#0f172a'
                }}
              >
                Histórico de alteração
                <span
                  style={{
                    display: 'inline-block',
                    transform: isProfileHistoryExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                    transition: 'transform 0.2s',
                    fontSize: 16
                  }}
                >
                  {'>'}
                </span>
              </button>

              {isProfileHistoryExpanded && (
                <div style={{ display: 'grid', gap: 8 }}>
                  {profileHistoryLoading && (
                    <div style={{ color: '#64748b', fontSize: 12 }}>
                      Carregando historico...
                    </div>
                  )}
                  {profileHistoryError && (
                    <div style={{ color: '#f87171', fontSize: 12 }}>
                      {profileHistoryError}
                    </div>
                  )}
                  {!profileHistoryLoading &&
                    !profileHistoryError &&
                    (profileHistoryById[editingProfile.id]?.length ? (
                      <div
                        style={{
                          display: 'grid',
                          gap: 8,
                          maxHeight: 220,
                          overflowY: 'auto',
                          paddingRight: 4
                        }}
                      >
                        {profileHistoryById[editingProfile.id].map(item => (
                          <div
                            key={item.id}
                            style={{
                              padding: '10px 12px',
                              borderRadius: 10,
                              background: '#ffffff',
                              border: '1px solid #e2e8f0'
                            }}
                          >
                            <div style={{ fontWeight: 600 }}>{item.changes}</div>
                            <div style={{ fontSize: 12, color: '#64748b' }}>
                              Alterado dia {formatDate(item.created_at)} por{' '}
                              {item.changed_by_name || 'Usuario'}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div style={{ color: '#94a3b8', fontSize: 12 }}>
                        Nenhum historico encontrado.
                      </div>
                    ))}
                </div>
              )}
            </div>
          )}
        </div>
      </Modal>
      <Modal
        title={editingUser ? 'Editar usuario' : 'Novo usuario'}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        footer={
          <>
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              style={{
                padding: '10px 16px',
                borderRadius: 10,
                border: '1px solid #e2e8f0',
                background: '#ffffff',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSaveUser}
              style={{
                padding: '10px 16px',
                borderRadius: 10,
                border: 'none',
                background: '#1d4ed8',
                color: '#ffffff',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Salvar
            </button>
          </>
        }
      >
        <div
          style={{
            display: 'grid',
            gap: 12,
            maxHeight: '70vh',
            overflowY: 'auto',
            paddingRight: 6
          }}
        >
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 12
            }}
          >
            <div style={{ display: 'grid', gap: 6 }}>
              <label style={fieldLabelStyle}>Nome *</label>
              <input
                value={formState.nome}
                onChange={event => handleFormChange('nome', event.target.value)}
                style={{ padding: '10px 12px', borderRadius: 10, border: '1px solid #e2e8f0' }}
              />
            </div>
            <div style={{ display: 'grid', gap: 6 }}>
              <label style={fieldLabelStyle}>Email *</label>
              <input
                value={formState.email}
                onChange={event => handleFormChange('email', event.target.value)}
                style={{ padding: '10px 12px', borderRadius: 10, border: '1px solid #e2e8f0' }}
              />
            </div>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 12
            }}
          >
            <div style={{ display: 'grid', gap: 6 }}>
              <label style={fieldLabelStyle}>CS *</label>
              <input
                value={formState.cs}
                onChange={event => handleFormChange('cs', event.target.value)}
                style={{ padding: '10px 12px', borderRadius: 10, border: '1px solid #e2e8f0' }}
              />
            </div>
            <div style={{ display: 'grid', gap: 6 }}>
              <label style={fieldLabelStyle}>Escala *</label>
              <select
                value={formState.escala}
                onChange={event => handleFormChange('escala', event.target.value)}
                style={{ padding: '10px 12px', borderRadius: 10, border: '1px solid #e2e8f0' }}
              >
                <option value="">Selecione</option>
                <option value="ADM">ADM</option>
                <option value="6x2">6x2</option>
              </select>
            </div>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 12
            }}
          >
            <div style={{ display: 'grid', gap: 6 }}>
              <label style={fieldLabelStyle}>Perfil *</label>
              <select
                value={formState.profileId}
                onChange={event => handleFormChange('profileId', event.target.value)}
                disabled={!hasActiveProfiles}
                style={{ padding: '10px 12px', borderRadius: 10, border: '1px solid #e2e8f0' }}
              >
                {hasActiveProfiles ? (
                  <>
                    <option value="">Selecione</option>
                    {activeProfiles.map(profile => (
                      <option key={profile.id} value={profile.id}>
                        {profile.name}
                      </option>
                    ))}
                  </>
                ) : (
                  <option value="">Nenhum perfil ativo</option>
                )}
              </select>
            </div>
            <div style={{ display: 'grid', gap: 6 }}>
              <label style={fieldLabelStyle}>Senha</label>
              <input
                type="password"
                value={formState.senha ?? ''}
                onChange={event => handleFormChange('senha', event.target.value)}
                style={{ padding: '10px 12px', borderRadius: 10, border: '1px solid #e2e8f0' }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div style={{ display: 'grid', gap: 6 }}>
            <label style={fieldLabelStyle}>Coordenação *</label>
            <input
              value={formState.Coordenação}
              onChange={event => {
                handleFormChange('Coordenação', event.target.value)
                handleFormChange('equipeAtual', '')
              }}
              placeholder={
                estruturaCoordOptions.length
                  ? 'Digite ou escolha uma coordenação'
                  : 'Carregando coordenação'
              }
              list={estruturaCoordOptions.length ? 'coord-options-perfil' : undefined}
              style={{ padding: '10px 12px', borderRadius: 10, border: '1px solid #e2e8f0' }}
            />
            {estruturaCoordOptions.length > 0 && (
              <datalist id="coord-options-perfil">
                {estruturaCoordOptions.map(coord => (
                  <option key={coord} value={coord} />
                ))}
              </datalist>
            )}
          </div>
            <div style={{ display: 'grid', gap: 6 }}>
              <label style={fieldLabelStyle}>Equipe *</label>
              <select
                value={formState.equipeAtual}
                onChange={event => handleFormChange('equipeAtual', event.target.value)}
                disabled={!formState.Coordenação || equipeOptions.length === 0}
                style={{ padding: '10px 12px', borderRadius: 10, border: '1px solid #e2e8f0' }}
              >
                <option value="">
                  {formState.Coordenação
                    ? equipeOptions.length
                      ? 'Selecione a equipe'
                      : 'Nenhuma equipe ativa'
                    : 'Selecione uma coordenação primeiro'}
                </option>
                {equipeOptions.map(team => (
                  <option key={team} value={team}>
                    {team}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 12
            }}
          >
            <div style={{ display: 'grid', gap: 6 }}>
              <label style={fieldLabelStyle}>Equipe Aditiva</label>
              <input
                value={formState.equipeAditiva}
                onChange={event => handleFormChange('equipeAditiva', event.target.value)}
                style={{ padding: '10px 12px', borderRadius: 10, border: '1px solid #e2e8f0' }}
              />
            </div>
            <div style={{ display: 'grid', gap: 6 }}>
              <label style={fieldLabelStyle}>Cargo *</label>
              <input
                value={formState.cargo}
                onChange={event => handleFormChange('cargo', event.target.value)}
                style={{ padding: '10px 12px', borderRadius: 10, border: '1px solid #e2e8f0' }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gap: 12 }}>
            <div style={{ display: 'grid', gap: 6 }}>
              <label style={fieldLabelStyle}>Status</label>
              <select
                value={formState.status}
                onChange={event =>
                  handleFormChange(
                    'status',
                    event.target.value as UserFormState['status']
                  )
                }
                style={{ padding: '10px 12px', borderRadius: 10, border: '1px solid #e2e8f0' }}
              >
                <option value="Ativo">Ativo</option>
                <option value="Inativo">Inativo</option>
              </select>
            </div>
          </div>

          {formErrors.length > 0 && (
            <div style={{ color: '#f87171', fontSize: 12 }}>
              {formErrors.map(error => (
                <div key={error}>{error}</div>
              ))}
            </div>
          )}

          {editingUser && (
            <div
              style={{
                borderTop: '1px solid #e2e8f0',
                paddingTop: 12,
                display: 'grid',
                gap: 8
              }}
            >
              <button
                type="button"
                onClick={() => setIsHistoryExpanded(state => !state)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 12,
                  background: 'transparent',
                  border: 'none',
                  padding: 0,
                  cursor: 'pointer',
                  fontWeight: 600,
                  color: '#0f172a'
                }}
              >
                Historico de alteracao
                <span
                  style={{
                    display: 'inline-block',
                    transform: isHistoryExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                    transition: 'transform 0.2s',
                    fontSize: 16
                  }}
                >
                  {'>'}
                </span>
              </button>

              {isHistoryExpanded && (
                <div style={{ display: 'grid', gap: 8 }}>
                  {historyLoading && (
                    <div style={{ color: '#64748b', fontSize: 12 }}>
                      Carregando historico...
                    </div>
                  )}
                  {historyError && (
                    <div style={{ color: '#f87171', fontSize: 12 }}>
                      {historyError}
                    </div>
                  )}
                  {!historyLoading &&
                    !historyError &&
                    (historyByUserId[editingUser.id]?.length ? (
                      <div
                        style={{
                          display: 'grid',
                          gap: 8,
                          maxHeight: 220,
                          overflowY: 'auto',
                          paddingRight: 4
                        }}
                      >
                        {historyByUserId[editingUser.id].map(item => (
                          <div
                            key={item.id}
                            style={{
                              padding: '10px 12px',
                              borderRadius: 10,
                              background: '#ffffff',
                              border: '1px solid #e2e8f0'
                            }}
                          >
                            <div style={{ fontWeight: 600 }}>{item.changes}</div>
                            <div style={{ fontSize: 12, color: '#64748b' }}>
                              Alterado dia {formatDate(item.created_at)} por{' '}
                              {item.changed_by_name || 'Usuario'}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div style={{ color: '#94a3b8', fontSize: 12 }}>
                        Nenhum historico encontrado.
                      </div>
                    ))}
                </div>
              )}
            </div>
          )}
        </div>
      </Modal>
    </section>
  )
}
