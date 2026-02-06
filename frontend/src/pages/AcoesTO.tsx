
import { useEffect, useMemo, useState, type CSSProperties } from 'react'
import type { ChangeEvent } from 'react'

import { Modal } from '../components/Modal'
import {
  API_URL,
  downloadActionAttachment,
  listActionAttachments,
  uploadActionAttachment
} from '../services/api'
import type { ActionAttachment } from '../services/api'
import {
  getStoredToken,
  getStoredUser,
  subscribeToUserChanges,
  type User
} from '../services/auth'
import {
  ACTION_GROUPS_UPDATED_EVENT,
  ACTION_ORIGINS_UPDATED_EVENT,
  readPersistedActionGroups,
  readPersistedOrigemGroups
} from '../utils/acoesStorage'
import { normalizeActionRow } from '../utils/actions'
import { Eye } from 'lucide-react'
import type { AcaoRecord, AcaoStatus } from '../types/acao'
import { getStoredActions, setStoredActions } from '../data/actionStore'
import { getStoredIncidents, subscribeToIncidents } from '../data/incidentStore'
import type { IncidenteRecord } from '../types/incidents'

type FilterState = {
  responsavel: string
  criticidade: string
  status: string
  grupo: string
  origem: string
}

type ActionFormState = {
  id_company: string
  id_usuario_solicitante: string
  id_usuario_responsavel: string
  status: AcaoStatus
  grupo_acao: string
  origem_acao: string
  criticidade: string
  data_vencimento: string
  texto_acao: string
  texto_enerramento: string
  texto_devolutiva: string
  incidente_codigo?: string
}

type ActionUser = { id: string; nome: string }

const initialFilters: FilterState = {
  responsavel: '',
  criticidade: '',
  status: '',
  grupo: '',
  origem: ''
}

const statusOptions: AcaoStatus[] = ['Aberta', 'Em andamento', 'Concluída']
const criticidadeOptions = ['Alta', 'Média', 'Baixa'] as const

const statusStyles: Record<AcaoStatus, { background: string; color: string }> = {
  Aberta: { background: 'rgba(59, 130, 246, 0.15)', color: '#2563eb' },
  'Em andamento': { background: 'rgba(234, 179, 8, 0.15)', color: '#f59e0b' },
  Concluída: { background: 'rgba(16, 185, 129, 0.15)', color: '#10b981' }
}

const formatDate = (value?: string) => {
  if (!value) return '—'
  const [year, month, day] = value.split('-')
  if (!year || !month || !day) return value
  return `${day}/${month}/${year}`
}

const createActionForm = (user: User | null): ActionFormState => ({
  id_company: user?.empresaId ?? '',
  id_usuario_solicitante: user?.id ?? '',
  id_usuario_responsavel: user?.id ?? '',
  status: 'Aberta',
  grupo_acao: '',
  origem_acao: 'Operação',
  criticidade: 'Alta',
  data_vencimento: '',
  texto_acao: '',
  texto_enerramento: '',
  texto_devolutiva: '',
  incidente_codigo: ''
})

export function AcoesTO() {
  const [actions, setActions] = useState<AcaoRecord[]>(() => [...getStoredActions()])
  const [filters, setFilters] = useState<FilterState>(initialFilters)
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'view'>('create')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedAction, setSelectedAction] = useState<AcaoRecord | null>(null)
  const [currentUser, setCurrentUser] = useState<User | null>(() => getStoredUser())
  const [formState, setFormState] = useState<ActionFormState>(() =>
    createActionForm(getStoredUser())
  )
  const [availableUsers, setAvailableUsers] = useState<ActionUser[]>([])
  const [actionGroups, setActionGroups] = useState(() => readPersistedActionGroups())
  const [origemGroups, setOrigemGroups] = useState(() => readPersistedOrigemGroups())
  const [actionAttachments, setActionAttachments] = useState<ActionAttachment[]>([])
  const [attachmentsLoading, setAttachmentsLoading] = useState(false)
  const [attachmentsError, setAttachmentsError] = useState<string | null>(null)
  const [uploadingAttachments, setUploadingAttachments] = useState(false)
  const [incidentOptions, setIncidentOptions] = useState<IncidenteRecord[]>(() => [
    ...getStoredIncidents()
  ])

  useEffect(() => {
    const unsubscribe = subscribeToUserChanges(() => {
      setCurrentUser(getStoredUser())
    })
    return unsubscribe
  }, [])

  useEffect(() => {
    const unsubscribe = subscribeToIncidents(current => {
      setIncidentOptions([...current])
    })
    return unsubscribe
  }, [])

  useEffect(() => {
    if (!currentUser) {
      setFormState(createActionForm(null))
      return
    }

      if (modalMode === 'create') {
        setFormState(prev => ({
          ...prev,
          id_company: currentUser.empresaId ?? prev.id_company,
          id_usuario_solicitante: currentUser.id,
          id_usuario_responsavel: currentUser.id
        }))
      }
  }, [currentUser, modalMode])

  useEffect(() => {
    setStoredActions(actions)
  }, [actions])

  useEffect(() => {
    if (!currentUser) {
      setAvailableUsers([])
      return
    }

    const token = getStoredToken()
    if (!token) {
      setAvailableUsers([])
      return
    }

    let isActive = true

    const loadUsers = async () => {
      try {
        const response = await fetch(`${API_URL}/admin/users`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        if (!response.ok) {
          throw new Error('Falha ao carregar usuários das ações')
        }
        const payload = await response.json()
        if (!isActive) return

        const users: ActionUser[] = Array.isArray(payload.users)
          ? payload.users
              .map((entry: unknown) => ({
                id: String((entry as { id?: unknown }).id ?? ''),
                nome: String((entry as { nome?: unknown }).nome ?? '')
              }))
              .filter(
                (user: ActionUser): user is ActionUser => Boolean(user.id && user.nome)
              )
          : []

        const baseUsers: ActionUser[] = currentUser?.id
          ? users.filter(user => user.id !== currentUser.id)
          : users

        const normalizedUsers = [...baseUsers]
        if (currentUser && currentUser.id) {
          const alreadyIncluded = normalizedUsers.some(user => user.id === currentUser.id)
          if (!alreadyIncluded) {
            normalizedUsers.unshift({
              id: currentUser.id,
              nome: currentUser.nome || currentUser.email || currentUser.id
            })
          }
        }

        if (isActive) {
          setAvailableUsers(normalizedUsers)
        }
      } catch (error) {
        console.error('Falha ao carregar usuários das ações', error)
        if (isActive) {
          setAvailableUsers(
            currentUser && currentUser.id
              ? [
                  {
                    id: currentUser.id,
                    nome: currentUser.nome || currentUser.email || currentUser.id
                  }
                ]
              : []
          )
        }
      }
    }

    loadUsers()

    return () => {
      isActive = false
    }
  }, [currentUser])

  useEffect(() => {
    let cancelled = false
    const token = getStoredToken()
    if (!token) {
      setActions([])
      return
    }

    const loadActions = async () => {
      try {
        const response = await fetch(`${API_URL}/acoes`, {
          headers: { Authorization: `Bearer ${token}` }
        })

        if (!response.ok) {
          const message = await response.text()
          throw new Error(message || 'Erro ao carregar ações pendentes.')
        }

        if (cancelled) return

        const payload = await response.json()
        const rows: Record<string, unknown>[] = Array.isArray(payload?.acoes)
          ? payload.acoes
          : Array.isArray(payload?.actions)
          ? payload.actions
          : []

        if (!rows.length) {
          setActions([])
          return
        }

        const normalized = rows.map(row => normalizeActionRow(row))
        setActions(normalized)
      } catch (error) {
        console.error('Erro ao carregar ações pendentes.', error)
        if (!cancelled) {
          setActions([])
        }
      }
    }

    loadActions()

    return () => {
      cancelled = true
    }
  }, [currentUser])

  useEffect(() => {
    if (typeof window === 'undefined') return undefined

    const handleGroupsUpdate = () => {
      setActionGroups(readPersistedActionGroups())
    }
    const handleOriginsUpdate = () => {
      setOrigemGroups(readPersistedOrigemGroups())
    }

    window.addEventListener(ACTION_GROUPS_UPDATED_EVENT, handleGroupsUpdate)
    window.addEventListener(ACTION_ORIGINS_UPDATED_EVENT, handleOriginsUpdate)

    return () => {
      window.removeEventListener(ACTION_GROUPS_UPDATED_EVENT, handleGroupsUpdate)
      window.removeEventListener(ACTION_ORIGINS_UPDATED_EVENT, handleOriginsUpdate)
    }
  }, [])

  useEffect(() => {
    let cancelled = false

    if (!selectedAction || modalMode !== 'edit' || !isModalOpen) {
      setActionAttachments([])
      setAttachmentsError(null)
      setAttachmentsLoading(false)
      return
    }

    const token = getStoredToken()
    if (!token) {
      setAttachmentsError('Sessão expirada. Faça login para ver anexos.')
      setActionAttachments([])
      setAttachmentsLoading(false)
      return
    }

    const load = async () => {
      setAttachmentsLoading(true)
      setAttachmentsError(null)
      try {
        const items = await listActionAttachments(selectedAction.id_acao, token)
        if (!cancelled) {
          setActionAttachments(items)
        }
      } catch (error) {
        if (!cancelled) {
          setAttachmentsError(
            error instanceof Error ? error.message : 'Erro ao carregar anexos.'
          )
        }
      } finally {
        if (!cancelled) {
          setAttachmentsLoading(false)
        }
      }
    }

    load()

    return () => {
      cancelled = true
    }
  }, [selectedAction, modalMode, isModalOpen])

  const userRole = currentUser?.role?.trim().toLowerCase() ?? 'leitura'
  const isAdminRole = userRole === 'admin' || userRole === 'administrador'
  const canCreateAction = isAdminRole || userRole === 'edicao'
  const canModifyAction = (action: AcaoRecord | null) => {
    if (!action || !currentUser) return false
    if (action.status === 'Concluída') return false
    return (
      currentUser.id === action.id_usuario_responsavel ||
      currentUser.id === action.id_usuario_solicitante
    )
  }

  const handleFilterChange = (field: keyof FilterState, value: string) => {
    setFilters(prev => ({ ...prev, [field]: value }))
  }

  const filteredActions = useMemo(() => {
    return actions.filter(action => {
      const matchesResponsavel = !filters.responsavel || action.id_usuario_responsavel === filters.responsavel
      const matchesCriticidade = !filters.criticidade || action.criticidade === filters.criticidade
      const matchesStatus = !filters.status || action.status === filters.status
      const matchesGrupo = !filters.grupo || action.grupo_acao === filters.grupo
      const matchesOrigem = !filters.origem || action.origem_acao === filters.origem
      return (
        matchesResponsavel &&
        matchesCriticidade &&
        matchesStatus &&
        matchesGrupo &&
        matchesOrigem
      )
    })
  }, [actions, filters])

  const sortedFilteredActions = useMemo(() => {
    return [...filteredActions].sort((a, b) => {
      const aTime = new Date(a.data_criado || '').getTime() || 0
      const bTime = new Date(b.data_criado || '').getTime() || 0
      return bTime - aTime
    })
  }, [filteredActions])

  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const totalPages = Math.max(1, Math.ceil(sortedFilteredActions.length / pageSize))
  const pagedActions = useMemo(() => {
    const start = (page - 1) * pageSize
    return sortedFilteredActions.slice(start, start + pageSize)
  }, [page, pageSize, sortedFilteredActions])

  const pageStart = sortedFilteredActions.length ? (page - 1) * pageSize + 1 : 0
  const pageEnd = Math.min(page * pageSize, sortedFilteredActions.length)

  useEffect(() => {
    setPage(1)
  }, [filters, sortedFilteredActions.length])

  const responsibleIds = useMemo(() => {
    return Array.from(new Set(actions.map(action => action.id_usuario_responsavel))).filter(Boolean)
  }, [actions])

  const eligibleIncidents = useMemo(() => {
    return incidentOptions.filter(
      incident => incident.status === 'Aberto' || incident.status === 'Em andamento'
    )
  }, [incidentOptions])

  const activeGroupNames = useMemo(() => {
    return actionGroups.filter(group => group.status === 'Ativo').map(group => group.nome)
  }, [actionGroups])

  const originOptions = useMemo(() => origemGroups, [origemGroups])

  const nameLookup = useMemo(() => {
    const map: Record<string, string> = {}

    availableUsers.forEach(user => {
      if (!user.id) return
      const nome = user.nome.trim() || user.id
      map[user.id] = nome
    })

    if (currentUser?.id && !map[currentUser.id]) {
      map[currentUser.id] = currentUser.nome?.trim() || currentUser.email || currentUser.id
    }

    responsibleIds.forEach(id => {
      if (!id) return
      if (!map[id]) {
        map[id] = id
      }
    })

    return map
  }, [availableUsers, currentUser, responsibleIds])

  const responsibleOptions = useMemo(() => {
    return Object.entries(nameLookup)
      .map(([id, nome]) => ({ id, nome }))
      .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR', { sensitivity: 'base' }))
  }, [nameLookup])

  const stats = useMemo(() => {
    const today = new Date().toISOString().split('T')[0]
    const base = { abertas: 0, andamento: 0, vencidas: 0, concluidas: 0 }
    return actions.reduce((acc, action) => {
      if (action.status === 'Aberta') acc.abertas += 1
      if (action.status === 'Em andamento') acc.andamento += 1
      if (action.status === 'Concluída') acc.concluidas += 1
      if (action.data_vencimento && action.data_vencimento < today && action.status !== 'Concluída') {
        acc.vencidas += 1
      }
      return acc
    }, base)
  }, [actions])

  const openCreateModal = () => {
    setModalMode('create')
    setFormState(createActionForm(currentUser))
    setSelectedAction(null)
    setIsModalOpen(true)
  }

  const openEditModal = (action: AcaoRecord) => {
    if (action.status === 'Concluída' || !canModifyAction(action)) {
      return
    }
    setModalMode('edit')
    setSelectedAction(action)
    setFormState({
      id_company: action.id_company,
      id_usuario_solicitante: action.id_usuario_solicitante,
      id_usuario_responsavel: action.id_usuario_responsavel,
      status: action.status,
      grupo_acao: action.grupo_acao,
      origem_acao: action.origem_acao,
      criticidade: action.criticidade,
      data_vencimento: action.data_vencimento,
      texto_acao: action.texto_acao,
      texto_enerramento: action.texto_enerramento,
      texto_devolutiva: action.texto_devolutiva,
      incidente_codigo: action.incidente_codigo ?? ''
    })
    setIsModalOpen(true)
  }

  const openViewModal = (action: AcaoRecord) => {
    setModalMode('view')
    setSelectedAction(action)
    setFormState({
      id_company: action.id_company,
      id_usuario_solicitante: action.id_usuario_solicitante,
      id_usuario_responsavel: action.id_usuario_responsavel,
      status: action.status,
      grupo_acao: action.grupo_acao,
      origem_acao: action.origem_acao,
      criticidade: action.criticidade,
      data_vencimento: action.data_vencimento,
      texto_acao: action.texto_acao,
      texto_enerramento: action.texto_enerramento,
      texto_devolutiva: action.texto_devolutiva,
      incidente_codigo: action.incidente_codigo ?? ''
    })
    setIsModalOpen(true)
  }

  const handleSave = () => {
    if (isViewMode) return
    if (!formState.grupo_acao.trim() || !formState.texto_acao.trim()) return

    if (modalMode === 'create') {
      const nextId = Math.max(0, ...actions.map(action => action.id_acao)) + 1
      const newAction: AcaoRecord = {
        id_company: formState.id_company || currentUser?.empresaId || '',
        id_acao: nextId,
        id_acao_raw: `acao_${String(nextId).padStart(3, '0')}`,
        id_usuario_solicitante: formState.id_usuario_solicitante,
        id_usuario_responsavel: formState.id_usuario_responsavel,
        data_criado: new Date().toISOString().split('T')[0],
        data_vencimento: formState.data_vencimento,
        status: 'Aberta',
        grupo_acao: formState.grupo_acao.trim(),
        origem_acao: formState.origem_acao,
        equipe: 'Equipe Campo',
        criticidade: formState.criticidade,
        texto_acao: formState.texto_acao.trim(),
        texto_enerramento: '',
        texto_devolutiva: '',
        incidente_codigo: formState.incidente_codigo?.trim() || undefined
      }

      setActions(prev => [newAction, ...prev])
      setIsModalOpen(false)
      return
    }

    if (!selectedAction) return

    const updatedAction: AcaoRecord = {
      ...selectedAction,
      id_company: formState.id_company || selectedAction.id_company,
      id_usuario_solicitante: formState.id_usuario_solicitante,
      id_usuario_responsavel: formState.id_usuario_responsavel,
      status: formState.status,
      grupo_acao: formState.grupo_acao.trim(),
      origem_acao: formState.origem_acao,
      criticidade: formState.criticidade,
      data_vencimento: formState.data_vencimento,
      texto_acao: formState.texto_acao.trim(),
      texto_enerramento: formState.texto_enerramento.trim(),
      texto_devolutiva: formState.texto_devolutiva.trim(),
      incidente_codigo: formState.incidente_codigo?.trim() || undefined
    }

    setActions(prev => prev.map(action => (action.id_acao === selectedAction.id_acao ? updatedAction : action)))
    setSelectedAction(null)
    setIsModalOpen(false)
  }

  const handleAttachmentChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files?.length || !selectedAction || modalMode !== 'edit' || !hasEditPermission) {
      event.target.value = ''
      return
    }

    const token = getStoredToken()
    if (!token) {
      setAttachmentsError('Sessão expirada. Faça login novamente para anexar arquivos.')
      event.target.value = ''
      return
    }

    setUploadingAttachments(true)
    setAttachmentsError(null)
    setAttachmentsLoading(true)

    const actionIdForApi =
      selectedAction.id_acao_raw || String(selectedAction.id_acao)
    try {
      for (const file of Array.from(files)) {
        await uploadActionAttachment(actionIdForApi, file, token)
      }
      const refreshed = await listActionAttachments(actionIdForApi, token)
      setActionAttachments(refreshed)
    } catch (error) {
      setAttachmentsError(
        error instanceof Error ? error.message : 'Erro ao enviar anexos.'
      )
    } finally {
      setAttachmentsLoading(false)
      setUploadingAttachments(false)
      event.target.value = ''
    }
  }

  const handleDownloadAttachment = async (attachment: ActionAttachment) => {
    const token = getStoredToken()
    if (!token) {
      setAttachmentsError('Sessão expirada. Faça login novamente para baixar arquivos.')
      return
    }

    try {
      await downloadActionAttachment(attachment, token)
    } catch (error) {
      setAttachmentsError(
        error instanceof Error ? error.message : 'Erro ao baixar anexo.'
      )
    }
  }

  const handleClose = () => {
    setIsModalOpen(false)
    setSelectedAction(null)
    setActionAttachments([])
    setAttachmentsError(null)
    setAttachmentsLoading(false)
  }

  const isViewMode = modalMode === 'view'
  const hasEditPermission =
    modalMode === 'create'
      ? canCreateAction
      : modalMode === 'edit'
      ? canModifyAction(selectedAction)
      : false
  const canSave =
    hasEditPermission &&
    formState.grupo_acao.trim() &&
    formState.texto_acao.trim()
  const solicitanteNome =
    nameLookup[formState.id_usuario_solicitante] || currentUser?.nome || currentUser?.email || 'Solicitante não carregado'

  return (
    <main
      style={{
        padding: 32,
        display: 'flex',
        flexDirection: 'column',
        gap: 24,
        minHeight: '100%',
        background: '#f4f6fb'
      }}
    >
      <header
        style={{
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          gap: 6
        }}
      >
        <h1 style={{ margin: 0 }}>Ações TO</h1>
        <p style={{ margin: 0, color: '#64748b' }}>
          Centralize os fluxos de responsabilidade e acompanhe criticidade, prazos e resultados.
        </p>
      </header>

      <section
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
          gap: 12
        }}
      >
        <article
          style={{
            borderRadius: 14,
            border: '1px solid #e2e8f0',
            padding: 18,
            background: '#ffffff',
            textAlign: 'center'
          }}
        >
          <p style={{ margin: 0, fontSize: 12, color: '#2563eb' }}>Abertas</p>
          <strong style={{ fontSize: 32 }}>{stats.abertas}</strong>
        </article>
        <article
          style={{
            borderRadius: 14,
            border: '1px solid #e2e8f0',
            padding: 18,
            background: '#ffffff',
            textAlign: 'center'
          }}
        >
          <p style={{ margin: 0, fontSize: 12, color: '#a16207' }}>Em andamento</p>
          <strong style={{ fontSize: 32 }}>{stats.andamento}</strong>
        </article>
        <article
          style={{
            borderRadius: 14,
            border: '1px solid #e2e8f0',
            padding: 18,
            background: '#ffffff',
            textAlign: 'center'
          }}
        >
          <p style={{ margin: 0, fontSize: 12, color: '#b91c1c' }}>Vencidas</p>
          <strong style={{ fontSize: 32 }}>{stats.vencidas}</strong>
        </article>
        <article
          style={{
            borderRadius: 14,
            border: '1px solid #e2e8f0',
            padding: 18,
            background: '#ffffff',
            textAlign: 'center'
          }}
        >
          <p style={{ margin: 0, fontSize: 12, color: '#15803d' }}>Concluídas</p>
          <strong style={{ fontSize: 32 }}>{stats.concluidas}</strong>
        </article>
      </section>

      <section
        style={{
          background: '#ffffff',
          borderRadius: 18,
          border: '1px solid #e2e8f0',
          padding: 20,
          display: 'flex',
          flexDirection: 'column',
          gap: 16
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            flexWrap: 'wrap',
            gap: 12
          }}
        >
          <div style={{ fontWeight: 600, fontSize: 16 }}>Filtros</div>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: 16
          }}
        >
          <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ fontSize: 12, color: '#94a3b8' }}>Responsável</span>
            <select
              value={filters.responsavel}
              onChange={event => handleFilterChange('responsavel', event.target.value)}
              style={{
                borderRadius: 10,
                border: '1px solid #e2e8f0',
                padding: '10px 12px',
                background: '#f8fafc',
                color: '#0f172a'
              }}
            >
              <option value="">Todos</option>
              {responsibleOptions.map(option => (
                <option key={option.id} value={option.id}>
                  {option.nome}
                </option>
              ))}
            </select>
          </label>

          <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ fontSize: 12, color: '#94a3b8' }}>Criticidade</span>
            <select
              value={filters.criticidade}
              onChange={event => handleFilterChange('criticidade', event.target.value)}
              style={{
                borderRadius: 10,
                border: '1px solid #e2e8f0',
                padding: '10px 12px',
                background: '#f8fafc',
                color: '#0f172a'
              }}
            >
              <option value="">Todas</option>
              {criticidadeOptions.map(option => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>

          <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ fontSize: 12, color: '#94a3b8' }}>Status</span>
            <select
              value={filters.status}
              onChange={event => handleFilterChange('status', event.target.value)}
              style={{
                borderRadius: 10,
                border: '1px solid #e2e8f0',
                padding: '10px 12px',
                background: '#f8fafc',
                color: '#0f172a'
              }}
            >
              <option value="">Todos</option>
              {statusOptions.map(option => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>

          <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ fontSize: 12, color: '#94a3b8' }}>Grupo</span>
            <select
              value={filters.grupo}
              onChange={event => handleFilterChange('grupo', event.target.value)}
              style={{
                borderRadius: 10,
                border: '1px solid #e2e8f0',
                padding: '10px 12px',
                background: '#f8fafc',
                color: '#0f172a'
              }}
            >
              <option value="">Todos</option>
              {activeGroupNames.map(group => (
                <option key={group} value={group}>
                  {group}
                </option>
              ))}
            </select>
          </label>

          <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ fontSize: 12, color: '#94a3b8' }}>Origem</span>
            <select
              value={filters.origem}
              onChange={event => handleFilterChange('origem', event.target.value)}
              style={{
                borderRadius: 10,
                border: '1px solid #e2e8f0',
                padding: '10px 12px',
                background: '#f8fafc',
                color: '#0f172a'
              }}
            >
              <option value="">Todas</option>
              {originOptions.map(origin => (
                <option key={origin} value={origin}>
                  {origin}
                </option>
              ))}
            </select>
          </label>
        </div>

        {canCreateAction && (
          <div style={{ display: 'flex', justifyContent: 'flex-end', margin: '12px 0' }}>
            <button type="button" onClick={openCreateModal} style={newActionButtonStyle}>
              Nova ação
            </button>
          </div>
        )}

        <div style={actionsTableCardStyle}>
          <div style={actionsTableHeaderStyle}>
            <div style={actionsHeaderTextStyle}>
              <span style={{ fontWeight: 600 }}>Ações</span>
              <span style={{ fontSize: 13, color: '#475569' }}>
                {sortedFilteredActions.length ? 'Ordenadas da mais nova para a mais antiga' : 'Nenhuma ação encontrada'}
              </span>
            </div>
          </div>
          <div style={{ overflowX: 'auto' }}>
            {sortedFilteredActions.length === 0 ? (
              <div
                style={{
                  padding: '20px 12px',
                  color: '#94a3b8',
                  fontSize: 13,
                  textAlign: 'center'
                }}
              >
                Nenhuma ação encontrada.
              </div>
            ) : (
              <table style={actionsTableStyle}>
                <thead>
                <tr>
                  <th style={tableHeadStyle}>ID</th>
                  <th style={tableHeadCenterStyle}>Ação</th>
                  <th style={tableHeadCenterStyle}>Responsável</th>
                  <th style={tableHeadCenterStyle}>Grupo</th>
                  <th style={tableHeadCenterStyle}>Origem</th>
                  <th style={tableHeadCenterStyle}>Criticidade</th>
                  <th style={tableHeadCenterStyle}>Vencimento</th>
                  <th style={tableHeadCenterStyle}>Status</th>
                  <th style={tableHeadCenterStyle}>Visualizar</th>
                </tr>
                </thead>
                <tbody>
                  {pagedActions.map(action => {
                    const responsavelNome = nameLookup[action.id_usuario_responsavel] || action.id_usuario_responsavel
                    const solicitanteNome = nameLookup[action.id_usuario_solicitante] || action.id_usuario_solicitante
                    const statusStyle = statusStyles[action.status] ?? statusStyles.Aberta
                    const podeEditar = canModifyAction(action)
                    const vencimentoFormatado = action.data_vencimento ? formatDate(action.data_vencimento) : '—'

                    return (
                      <tr key={action.id_acao} style={tableRowStyle}>
                <td style={tableCellStyle}>
                  {podeEditar ? (
                    <button
                      type="button"
                      onClick={() => openEditModal(action)}
                      style={{
                        border: 'none',
                        background: 'none',
                        padding: 0,
                        margin: 0,
                        font: 'inherit',
                        color: '#2563eb',
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      #{action.id_acao}
                    </button>
                  ) : (
                    <span style={{ fontWeight: 600 }}>#{action.id_acao}</span>
                  )}
                </td>
                <td style={tableCellCenterStyle}>
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6
                    }}
                  >
                    <span style={{ fontWeight: 600, color: '#0f172a', lineHeight: 1.4 }}>
                      {action.texto_acao}
                    </span>
                    <div style={{ fontSize: 12, color: '#64748b' }}>
                      Solicitante: {solicitanteNome}
                    </div>
                  </div>
                </td>
                <td style={tableCellCenterStyle}>{responsavelNome}</td>
                <td style={tableCellCenterStyle}>{action.grupo_acao || '—'}</td>
                <td style={tableCellCenterStyle}>{action.origem_acao || '—'}</td>
                <td style={tableCellCenterStyle}>{action.criticidade || '—'}</td>
                <td style={tableCellCenterStyle}>{vencimentoFormatado}</td>
                <td style={tableCellCenterStyle}>
                  <span
                    style={{
                      padding: '4px 10px',
                      borderRadius: 999,
                      fontSize: 12,
                      fontWeight: 600,
                      background: statusStyle.background,
                      color: statusStyle.color
                    }}
                  >
                    {action.status}
                  </span>
                </td>
                <td style={tableCellCenterStyle}>
                  <button
                    type="button"
                    onClick={() => openViewModal(action)}
                    style={visualButtonStyle}
                    title="Visualizar ação"
                  >
                    <Eye size={16} />
                  </button>
                </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>
          {sortedFilteredActions.length > 0 && (
            <div style={paginationRowStyle}>
              <span style={{ fontSize: 13, color: '#475569' }}>
                Mostrando {pageStart}-{pageEnd} de {sortedFilteredActions.length}
              </span>
              <div style={paginationControlsStyle}>
                <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12, color: '#475569' }}>
                  Mostrar
                  <select
                    value={pageSize}
                    onChange={event => {
                      setPageSize(Number(event.target.value))
                      setPage(1)
                    }}
                    style={{
                      borderRadius: 8,
                      border: '1px solid #e2e8f0',
                      padding: '6px 10px',
                      background: '#ffffff',
                      fontSize: 13
                    }}
                  >
                    {[10, 25, 50].map(size => (
                      <option key={size} value={size}>
                        {size}
                      </option>
                    ))}
                  </select>
                </label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    type="button"
                    onClick={() => setPage(prev => Math.max(1, prev - 1))}
                    disabled={page <= 1}
                    style={paginationButtonStyle}
                  >
                    Anterior
                  </button>
                  <button
                    type="button"
                    onClick={() => setPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={page >= totalPages}
                    style={paginationButtonStyle}
                  >
                    Próxima
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      <Modal
        title={modalMode === 'create' ? 'Nova ação' : `Ação #${selectedAction?.id_acao ?? '—'}`}
        isOpen={isModalOpen}
        onClose={handleClose}
        footer={
          <>
            <button
              type="button"
              onClick={handleClose}
              style={{
                padding: '8px 14px',
                borderRadius: 10,
                border: '1px solid #e2e8f0',
                background: '#ffffff',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Cancelar
            </button>
            {hasEditPermission && (
              <button
                type="button"
                onClick={handleSave}
                disabled={!canSave}
                style={{
                  padding: '8px 14px',
                  borderRadius: 10,
                  border: 'none',
                  background: canSave ? 'linear-gradient(90deg, #2563eb, #1d4ed8)' : '#9ca3af',
                  color: '#ffffff',
                  fontWeight: 600,
                  cursor: canSave ? 'pointer' : 'not-allowed'
                }}
              >
                Salvar
              </button>
            )}
          </>
        }
      >
        <div style={{ display: 'grid', gap: 18 }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: 16
            }}
          >
            <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span style={{ fontSize: 12, color: '#64748b' }}>Solicitante</span>
              <input
                value={solicitanteNome}
                disabled
                style={{
                  borderRadius: 10,
                  border: '1px solid #e2e8f0',
                  padding: '10px 12px',
                  background: '#f8fafc',
                  color: '#0f172a'
                }}
              />
            </label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span style={{ fontSize: 12, color: '#64748b' }}>Responsável</span>
              <select
                value={formState.id_usuario_responsavel}
                onChange={event =>
                  setFormState(prev => ({ ...prev, id_usuario_responsavel: event.target.value }))
                }
                disabled={!hasEditPermission}
                style={{
                  borderRadius: 10,
                  border: '1px solid #e2e8f0',
                  padding: '10px 12px',
                  background: '#ffffff',
                  color: '#0f172a'
                }}
              >
                <option value="">Selecione</option>
                {responsibleOptions.map(option => (
                  <option key={option.id} value={option.id}>
                    {option.nome}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: 16
            }}
          >
            {modalMode === 'edit' && (
              <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <span style={{ fontSize: 12, color: '#64748b' }}>Status</span>
                <select
                  value={formState.status}
                  onChange={event => setFormState(prev => ({ ...prev, status: event.target.value as AcaoStatus }))}
                  disabled={!hasEditPermission}
                  style={{
                    borderRadius: 10,
                    border: '1px solid #e2e8f0',
                    padding: '10px 12px',
                    background: '#ffffff',
                    color: '#0f172a'
                  }}
                >
                  {statusOptions.map(option => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>
            )}

            <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span style={{ fontSize: 12, color: '#64748b' }}>Grupo</span>
              <select
                value={formState.grupo_acao}
                onChange={event => setFormState(prev => ({ ...prev, grupo_acao: event.target.value }))}
                disabled={!hasEditPermission}
                style={{
                  borderRadius: 10,
                  border: '1px solid #e2e8f0',
                  padding: '10px 12px',
                  background: '#ffffff',
                  color: '#0f172a'
                }}
              >
                <option value="">Selecione</option>
                {activeGroupNames.map(group => (
                  <option key={group} value={group}>
                    {group}
                  </option>
                ))}
              </select>
            </label>

            <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span style={{ fontSize: 12, color: '#64748b' }}>Origem da ação</span>
              <select
                value={formState.origem_acao}
                onChange={event => setFormState(prev => ({ ...prev, origem_acao: event.target.value }))}
                disabled={!hasEditPermission}
                style={{
                  borderRadius: 10,
                  border: '1px solid #e2e8f0',
                  padding: '10px 12px',
                  background: '#ffffff',
                  color: '#0f172a'
                }}
              >
                <option value="">Selecione</option>
                {originOptions.map(origin => (
                  <option key={origin} value={origin}>
                    {origin}
                  </option>
                ))}
              </select>
            </label>

            <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span style={{ fontSize: 12, color: '#64748b' }}>Criticidade</span>
              <select
                value={formState.criticidade}
                onChange={event => setFormState(prev => ({ ...prev, criticidade: event.target.value }))}
                disabled={!hasEditPermission}
                style={{
                  borderRadius: 10,
                  border: '1px solid #e2e8f0',
                  padding: '10px 12px',
                  background: '#ffffff',
                  color: '#0f172a'
                }}
              >
                {criticidadeOptions.map(option => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>

            <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span style={{ fontSize: 12, color: '#64748b' }}>Vencimento</span>
              <input
                type="date"
                value={formState.data_vencimento}
                onChange={event => setFormState(prev => ({ ...prev, data_vencimento: event.target.value }))}
                disabled={!hasEditPermission}
                style={{
                  borderRadius: 10,
                  border: '1px solid #e2e8f0',
                  padding: '10px 12px',
                  background: '#ffffff',
                  color: '#0f172a'
                }}
              />
            </label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span style={{ fontSize: 12, color: '#64748b' }}>Incidente vinculado (opcional)</span>
              <input
                list="incidentOptions"
                value={formState.incidente_codigo ?? ''}
                onChange={event =>
                  setFormState(prev => ({ ...prev, incidente_codigo: event.target.value }))
                }
                disabled={!hasEditPermission}
                placeholder="Código do incidente"
                style={{
                  borderRadius: 10,
                  border: '1px solid #e2e8f0',
                  padding: '10px 12px',
                  background: '#ffffff',
                  color: '#0f172a'
                }}
              />
              <datalist id="incidentOptions">
                {eligibleIncidents.map(incident => (
                  <option key={incident.codigo} value={incident.codigo}>
                    {incident.titulo}
                  </option>
                ))}
              </datalist>
              <span style={{ fontSize: 11, color: '#64748b' }}>
                Apenas incidentes em status Aberto ou Em andamento aparecem aqui.
              </span>
            </label>
          </div>

          <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ fontSize: 12, color: '#64748b' }}>Ação</span>
            <textarea
              rows={3}
              value={formState.texto_acao}
              onChange={event => setFormState(prev => ({ ...prev, texto_acao: event.target.value }))}
              disabled={!hasEditPermission}
              style={{
                borderRadius: 12,
                border: '1px solid #e2e8f0',
                padding: '10px 12px',
                background: '#ffffff',
                color: '#0f172a',
                resize: 'vertical'
              }}
            />
          </label>

          {modalMode === 'edit' && (
            <>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                  gap: 16
                }}
              >
                <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <span style={{ fontSize: 12, color: '#64748b' }}>Encerramento</span>
                  <textarea
                    rows={2}
                    value={formState.texto_enerramento}
                    onChange={event =>
                      setFormState(prev => ({ ...prev, texto_enerramento: event.target.value }))
                    }
                    disabled={!hasEditPermission}
                    style={{
                      borderRadius: 10,
                      border: '1px solid #e2e8f0',
                      padding: '10px 12px',
                      background: '#ffffff',
                      color: '#0f172a',
                      resize: 'vertical'
                    }}
                  />
                </label>
                <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <span style={{ fontSize: 12, color: '#64748b' }}>Devolutiva</span>
                  <textarea
                    rows={2}
                    value={formState.texto_devolutiva}
                    onChange={event =>
                      setFormState(prev => ({ ...prev, texto_devolutiva: event.target.value }))
                    }
                    disabled={!hasEditPermission}
                    style={{
                      borderRadius: 10,
                      border: '1px solid #e2e8f0',
                      padding: '10px 12px',
                      background: '#ffffff',
                      color: '#0f172a',
                      resize: 'vertical'
                    }}
                  />
                </label>
              </div>
              <section
                style={{
                  borderRadius: 14,
                  border: '1px solid #e2e8f0',
                  padding: 16,
                  background: '#f8fafc',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 12
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: 12,
                    flexWrap: 'wrap'
                  }}
                >
                  <strong style={{ fontSize: 14 }}>Anexos</strong>
                  <label
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '8px 14px',
                      borderRadius: 10,
                      border: '1px solid #e2e8f0',
                      background: hasEditPermission ? '#ffffff' : '#f1f5f9',
                      color: hasEditPermission ? '#0f172a' : '#94a3b8',
                      fontWeight: 600,
                      cursor: hasEditPermission && !uploadingAttachments ? 'pointer' : 'not-allowed'
                    }}
                  >
                    {uploadingAttachments ? 'Enviando...' : 'Adicionar anexo'}
                    <input
                      type="file"
                      multiple
                      onChange={handleAttachmentChange}
                      disabled={!hasEditPermission || uploadingAttachments}
                      style={{ display: 'none' }}
                    />
                  </label>
                </div>
                {attachmentsError && (
                  <p style={{ color: '#b91c1c', margin: 0, fontSize: 13 }}>{attachmentsError}</p>
                )}
                {attachmentsLoading && (
                  <p style={{ margin: 0, color: '#64748b', fontSize: 13 }}>Carregando anexos...</p>
                )}
                {!attachmentsLoading && actionAttachments.length === 0 && (
                  <p style={{ margin: 0, color: '#64748b', fontSize: 13 }}>
                    Nenhum anexo encontrado para esta ação.
                  </p>
                )}
                {!attachmentsLoading && actionAttachments.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {actionAttachments.map(attachment => (
                      <div
                        key={attachment.id}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          gap: 12,
                          padding: '10px 12px',
                          borderRadius: 10,
                          background: '#ffffff',
                          border: '1px solid #e2e8f0'
                        }}
                      >
                        <div>
                          <strong>{attachment.filename || 'Sem nome'}</strong>
                          <p
                            style={{
                              margin: '4px 0 0',
                              fontSize: 12,
                              color: '#475569'
                            }}
                          >
                            {formatDateTime(attachment.created_at)} ·{' '}
                            {formatFileSize(attachment.size)}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDownloadAttachment(attachment)}
                          style={{
                            borderRadius: 999,
                            border: '1px solid #2563eb',
                            background: '#2563eb',
                            color: '#ffffff',
                            padding: '6px 12px',
                            fontWeight: 600,
                            cursor: 'pointer'
                          }}
                        >
                          Baixar
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </>
          )}

          {!hasEditPermission && (
            <p style={{ color: '#b91c1c', fontSize: 13 }}>
              Apenas o responsável, o criador da ação ou um perfil com permissão pode ajustar os dados.
            </p>
          )}
        </div>
      </Modal>
    </main>
  )
}

function formatDateTime(value?: string): string {
  if (!value) return '—'
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return value
  return parsed.toLocaleString('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short'
  })
}

function formatFileSize(value: number | null): string {
  if (!value || value <= 0) return '—'
  if (value < 1024) {
    return `${value} B`
  }
  const kilobytes = value / 1024
  if (kilobytes < 1024) {
    return `${kilobytes.toFixed(1)} KB`
  }
  const megabytes = kilobytes / 1024
  return `${megabytes.toFixed(1)} MB`
}

const actionsTableCardStyle: CSSProperties = {
  borderRadius: 18,
  border: '1px solid #e2e8f0',
  background: '#ffffff',
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
  gap: 16
}

const actionsTableHeaderStyle: CSSProperties = {
  padding: '16px 20px 0',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  gap: 12
}

const actionsHeaderTextStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 4
}

const actionsTableStyle: CSSProperties = {
  width: '100%',
  borderCollapse: 'collapse',
  minWidth: 720
}

const tableHeadStyle: CSSProperties = {
  textAlign: 'left',
  padding: '12px 16px',
  fontSize: 12,
  fontWeight: 600,
  color: '#475569',
  borderBottom: '1px solid #e2e8f0',
  background: '#f8fafc'
}

const tableHeadCenterStyle: CSSProperties = {
  ...tableHeadStyle,
  textAlign: 'center'
}

const tableCellStyle: CSSProperties = {
  padding: '14px 16px',
  fontSize: 13,
  color: '#0f172a',
  borderBottom: '1px solid #f1f5f9',
  verticalAlign: 'top'
}

const tableCellCenterStyle: CSSProperties = {
  ...tableCellStyle,
  textAlign: 'center'
}

const tableRowStyle: CSSProperties = {
  background: '#ffffff'
}

const paginationRowStyle: CSSProperties = {
  padding: '16px 20px',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  flexWrap: 'wrap',
  gap: 12
}

const paginationControlsStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 12
}

const paginationButtonStyle: CSSProperties = {
  padding: '6px 12px',
  borderRadius: 8,
  border: '1px solid #cbd5f5',
  background: '#ffffff',
  color: '#0f172a',
  cursor: 'pointer',
  fontSize: 13,
  fontWeight: 600
}

const visualButtonStyle: CSSProperties = {
  padding: 6,
  borderRadius: '50%',
  border: '1px solid #c7d2fe',
  background: '#eff6ff',
  color: '#2563eb',
  cursor: 'pointer',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center'
}

const newActionButtonStyle: CSSProperties = {
  padding: '10px 18px',
  borderRadius: 12,
  border: 'none',
  background: 'linear-gradient(90deg, #2563eb, #312e81)',
  color: '#ffffff',
  fontWeight: 600,
  cursor: 'pointer'
}
