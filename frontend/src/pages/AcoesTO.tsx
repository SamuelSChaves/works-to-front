
import { useEffect, useMemo, useState } from 'react'

import { Modal } from '../components/Modal'
import { API_URL } from '../services/api'
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
import {
  sampleActions,
  type AcaoRecord,
  type AcaoStatus
} from '../data/sampleActions'

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
  texto_devolutiva: ''
})

export function AcoesTO() {
  const [actions, setActions] = useState<AcaoRecord[]>(sampleActions)
  const [filters, setFilters] = useState<FilterState>(initialFilters)
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedAction, setSelectedAction] = useState<AcaoRecord | null>(null)
  const [currentUser, setCurrentUser] = useState<User | null>(() => getStoredUser())
  const [formState, setFormState] = useState<ActionFormState>(() =>
    createActionForm(getStoredUser())
  )
  const [availableUsers, setAvailableUsers] = useState<ActionUser[]>([])
  const [actionGroups, setActionGroups] = useState(() => readPersistedActionGroups())
  const [origemGroups, setOrigemGroups] = useState(() => readPersistedOrigemGroups())

  useEffect(() => {
    const unsubscribe = subscribeToUserChanges(() => {
      setCurrentUser(getStoredUser())
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

  const userRole = currentUser?.role?.toLowerCase() ?? 'leitura'
  const canCreateAction = userRole === 'admin' || userRole === 'edicao'
  const canModifyAction = (action: AcaoRecord | null) => {
    if (!action || !currentUser) return false
    if (userRole === 'admin' || userRole === 'edicao') return true
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

  const responsibleIds = useMemo(() => {
    return Array.from(new Set(actions.map(action => action.id_usuario_responsavel))).filter(Boolean)
  }, [actions])

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
      texto_devolutiva: action.texto_devolutiva
    })
    setIsModalOpen(true)
  }

  const handleSave = () => {
    if (!formState.grupo_acao.trim() || !formState.texto_acao.trim()) return

    if (modalMode === 'create') {
      const nextId = Math.max(0, ...actions.map(action => action.id_acao)) + 1
      const newAction: AcaoRecord = {
        id_company: formState.id_company || currentUser?.empresaId || '',
        id_acao: nextId,
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
        texto_devolutiva: ''
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
      texto_devolutiva: formState.texto_devolutiva.trim()
    }

    setActions(prev => prev.map(action => (action.id_acao === selectedAction.id_acao ? updatedAction : action)))
    setSelectedAction(null)
    setIsModalOpen(false)
  }

  const handleClose = () => {
    setIsModalOpen(false)
    setSelectedAction(null)
  }

  const hasEditPermission = modalMode === 'create' ? canCreateAction : canModifyAction(selectedAction)
  const canSave = hasEditPermission && formState.grupo_acao.trim() && formState.texto_acao.trim()
  const fieldsTemplate = '2.5fr 1fr 1fr 1fr 0.9fr 1fr 1fr 0.9fr'
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
          {canCreateAction && (
            <button
              type="button"
              onClick={openCreateModal}
              style={{
                padding: '10px 18px',
                borderRadius: 12,
                border: 'none',
                background: 'linear-gradient(90deg, #2563eb, #312e81)',
                color: '#ffffff',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Nova ação
            </button>
          )}
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

        <div
          style={{
            borderRadius: 18,
            border: '1px solid #e2e8f0',
            background: '#ffffff',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }}
        >
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: fieldsTemplate,
              gap: 0,
              padding: '12px 12px',
              background: '#f8fafc',
              fontSize: 12,
              fontWeight: 600,
              color: '#475569'
            }}
          >
            <span>Descrição</span>
            <span>Responsável</span>
            <span>Grupo</span>
            <span>Origem</span>
            <span>Criticidade</span>
            <span>Vencimento</span>
            <span>Status</span>
            <span style={{ justifySelf: 'end' }}>Ações</span>
          </div>

          {filteredActions.length === 0 ? (
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
            filteredActions.map(action => {
              const responsavelNome = nameLookup[action.id_usuario_responsavel] || action.id_usuario_responsavel
              const solicitanteNome = nameLookup[action.id_usuario_solicitante] || action.id_usuario_solicitante
              const statusStyle = statusStyles[action.status] ?? statusStyles.Aberta
              const podeEditar = canModifyAction(action)
              const vencimentoFormatado = action.data_vencimento ? formatDate(action.data_vencimento) : '—'

              return (
                <div
                  key={action.id_acao}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: fieldsTemplate,
                    alignItems: 'center',
                    gap: 0,
                    padding: '14px 12px',
                    borderTop: '1px solid #f1f5f9'
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontWeight: 600,
                        color: '#0f172a',
                        lineHeight: 1.4,
                        wordBreak: 'break-word'
                      }}
                    >
                      #{action.id_acao} {action.texto_acao}
                    </div>
                    <div style={{ fontSize: 12, color: '#64748b', marginTop: 6 }}>
                      Solicitante: {solicitanteNome}
                    </div>
                  </div>
                  <div style={{ fontSize: 13, color: '#0f172a' }}>{responsavelNome}</div>
                  <div style={{ fontSize: 13, color: '#0f172a' }}>{action.grupo_acao || '—'}</div>
                  <div style={{ fontSize: 13, color: '#0f172a' }}>{action.origem_acao || '—'}</div>
                  <div style={{ fontSize: 13, color: '#0f172a' }}>{action.criticidade || '—'}</div>
                  <div style={{ fontSize: 13, color: '#0f172a' }}>{vencimentoFormatado}</div>
                  <div>
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
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <button
                      type="button"
                      onClick={() => openEditModal(action)}
                      disabled={!podeEditar}
                      style={{
                        borderRadius: 10,
                        border: '1px solid #2563eb',
                        background: podeEditar ? '#2563eb' : '#d1d5db',
                        color: '#ffffff',
                        padding: '8px 14px',
                        cursor: podeEditar ? 'pointer' : 'not-allowed',
                        fontWeight: 600
                      }}
                    >
                      Editar
                    </button>
                  </div>
                </div>
              )
            })
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
                  onChange={event => setFormState(prev => ({ ...prev, texto_enerramento: event.target.value }))}
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
                  onChange={event => setFormState(prev => ({ ...prev, texto_devolutiva: event.target.value }))}
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
