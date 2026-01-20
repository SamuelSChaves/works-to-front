import { useCallback, useEffect, useMemo, useState, type CSSProperties, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Modal } from '../components/Modal'
import { toast } from 'sonner'
import { API_URL } from '../services/api'
import {
  fetchPermissions,
  getStoredPermissions,
  getStoredToken,
  logout,
  setPostLoginRedirect
} from '../services/auth'

type TarefaItem = {
  id: string
  id_sigla: string
  sigla: string
  tarefa: string
  medicao: boolean
  criticidade: boolean
  periodicidade: number
  sub_sistema: string | null
  sistema: string | null
  codigo: string
  active: boolean
}

type Filters = {
  sigla: string
  sistema: string
  tarefa: string
  active: 'true' | 'false' | 'all'
}

type SortKey = 'sigla' | 'tarefa'

type FormState = {
  sigla: string
  id_sigla: string
  tarefa: string
  codigo: string
  periodicidade: string
  sub_sistema: string
  sistema: string
  medicao: boolean
  criticidade: boolean
  active: boolean
}

const PAGE_SIZE_OPTIONS = [10, 20, 40]
const initialFilters: Filters = {
  sigla: '',
  sistema: '',
  tarefa: '',
  active: 'true'
}
const initialFormState: FormState = {
  sigla: '',
  id_sigla: '',
  tarefa: '',
  codigo: '',
  periodicidade: '7',
  sub_sistema: '',
  sistema: '',
  medicao: true,
  criticidade: false,
  active: true
}

const filtersCardStyle: CSSProperties = {
  borderRadius: 16,
  border: '1px solid #e2e8f0',
  background: '#ffffff',
  padding: 18,
  display: 'grid',
  gap: 16,
  boxShadow: '0 10px 20px rgba(15, 23, 42, 0.06)'
}

const filtersInputsStyle: CSSProperties = {
  display: 'flex',
  gap: 12,
  flexWrap: 'wrap'
}

const filterFieldStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 6,
  flex: '1 1 220px'
}

const filterInputStyle: CSSProperties = {
  padding: '10px 12px',
  borderRadius: 10,
  border: '1px solid #e2e8f0',
  background: '#f8fafc'
}

const filterSelectStyle: CSSProperties = {
  ...filterInputStyle,
  appearance: 'none'
}

const tableCardStyle: CSSProperties = {
  borderRadius: 16,
  border: '1px solid #e2e8f0',
  background: '#ffffff',
  overflow: 'hidden',
  boxShadow: '0 10px 20px rgba(15, 23, 42, 0.04)'
}

const tableStyle: CSSProperties = {
  width: '100%',
  borderCollapse: 'collapse'
}

const tableHeaderCellStyle: CSSProperties = {
  padding: 12,
  fontSize: 12,
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: 0.04,
  color: '#475569',
  borderBottom: '1px solid #e2e8f0',
  textAlign: 'left'
}

const tableBodyCellStyle: CSSProperties = {
  padding: 12,
  fontSize: 14,
  color: '#0f172a'
}

const paginationButtonStyle: CSSProperties = {
  padding: '6px 10px',
  borderRadius: 8,
  border: '1px solid #e2e8f0',
  background: '#ffffff',
  cursor: 'pointer'
}

function boolFromValue(value: unknown): boolean {
  return (
    value === true ||
    value === 'true' ||
    value === 1 ||
    value === '1'
  )
}

async function getApiErrorMessage(response: Response, fallback: string) {
  if (response.status === 403) {
    return 'Você não tem permissão para executar esta operação.'
  }
  const message = await response.text()
  return message || fallback
}

export function Tarefas() {
  const navigate = useNavigate()
  const [filters, setFilters] = useState<Filters>(initialFilters)
  const [sort, setSort] = useState<SortKey>('sigla')
  const [order, setOrder] = useState<'asc' | 'desc'>('asc')
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(PAGE_SIZE_OPTIONS[1])
  const [tarefas, setTarefas] = useState<TarefaItem[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [formState, setFormState] = useState<FormState>(initialFormState)
  const [formErrors, setFormErrors] = useState<string[]>([])
  const [creating, setCreating] = useState(false)
  const [permissions, setPermissions] = useState(() => getStoredPermissions())
  const [siglaOptions, setSiglaOptions] = useState<string[]>([])

  const redirectToLogin = useCallback(() => {
    setPostLoginRedirect(window.location.pathname + window.location.search)
    logout()
    navigate('/')
  }, [navigate])

  const fetchWithAuth = useCallback(
    async (url: string, fallback: string, init?: RequestInit) => {
      const token = getStoredToken()
      if (!token) {
        redirectToLogin()
        throw new Error('Sessão expirada. Faça login novamente.')
      }
      const headers = new Headers(init?.headers)
      headers.set('Authorization', `Bearer ${token}`)
      const response = await fetch(url, { ...init, headers })
      if (response.status === 401) {
        redirectToLogin()
        throw new Error('Sessão expirada. Faça login novamente.')
      }
      if (!response.ok) {
        const message = await getApiErrorMessage(response, fallback)
        throw new Error(message)
      }
      return response
    },
    [redirectToLogin]
  )

  const loadTasks = useCallback(
    async (pageNumber: number) => {
      setLoading(true)
      setError(null)
      try {
        const params = new URLSearchParams()
        params.set('page', String(pageNumber))
        params.set('per_page', String(perPage))
        params.set('sort', sort)
        params.set('order', order)
        if (filters.sigla.trim()) {
          params.set('sigla', filters.sigla.trim())
        }
        if (filters.tarefa.trim()) {
          params.set('tarefa', filters.tarefa.trim())
        }
        if (filters.sistema.trim()) {
          params.set('sistema', filters.sistema.trim())
        }
        if (filters.active) {
          params.set('active', filters.active)
        }

        const response = await fetchWithAuth(
          `${API_URL}/tarefas?${params.toString()}`,
          'Erro ao carregar tarefas.'
        )
        const data = await response.json()
        const items = (Array.isArray(data.tarefas) ? data.tarefas : []) as Record<string, unknown>[]
        setTarefas(
          items.map((item: Record<string, unknown>) => ({
            id: String(item.id ?? ''),
            id_sigla: String(item.id_sigla ?? ''),
            sigla: String(item.sigla ?? ''),
            tarefa: String(item.tarefa ?? ''),
            periodicidade: Number(item.periodicidade ?? 0),
            sub_sistema: item.sub_sistema ? String(item.sub_sistema) : null,
            sistema: item.sistema ? String(item.sistema) : null,
            codigo: String(item.codigo ?? ''),
            medicao: boolFromValue(item.medicao),
            criticidade: boolFromValue(item.criticidade),
            active: boolFromValue(item.active)
          }))
        )
        const metaTotal =
          typeof data.meta?.total === 'number'
            ? data.meta.total
            : items.length
        setTotal(metaTotal)
        setSiglaOptions(
          Array.from(
            new Set(
              items
                .map(item => String(item.sigla ?? ''))
                .filter(sigla => sigla)
            )
          ).sort((a, b) => a.localeCompare(b))
        )
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : 'Não foi possível carregar tarefas.'
        setError(message)
      } finally {
        setLoading(false)
      }
    },
    [filters, order, perPage, sort, fetchWithAuth]
  )

  useEffect(() => {
    loadTasks(page)
  }, [loadTasks, page])

  useEffect(() => {
    const token = getStoredToken()
    if (!token) return
    fetchPermissions()
      .then(setPermissions)
      .catch(() => setPermissions(getStoredPermissions()))
  }, [])

  const totalPages = useMemo(() => {
    if (!perPage) return 1
    const effectiveTotal = Math.max(total, 1)
    return Math.max(1, Math.ceil(effectiveTotal / perPage))
  }, [perPage, total])

  const infoStart = total === 0 ? 0 : (page - 1) * perPage + 1
  const infoEnd = Math.min(total, page * perPage)

  const canCreate = permissions?.tarefas?.criacao === true

  const handleSort = (key: SortKey) => {
    if (sort === key) {
      setOrder(prev => (prev === 'asc' ? 'desc' : 'asc'))
    } else {
      setSort(key)
      setOrder('asc')
    }
    setPage(1)
  }

  const handleFilterChange = (field: keyof Filters, value: string) => {
    setFilters(prev => ({ ...prev, [field]: value }))
    setPage(1)
  }

  const handlePerPageChange = (value: number) => {
    setPerPage(value)
    setPage(1)
  }

  const resetFilters = () => {
    setFilters(initialFilters)
    setPerPage(PAGE_SIZE_OPTIONS[1])
    setPage(1)
  }

  const handleCreateSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setFormErrors([])
    const sigla = formState.sigla.trim()
    const tarefa = formState.tarefa.trim()
    const codigo = formState.codigo.trim()
    const idSigla = formState.id_sigla.trim() || sigla
    const periodicidadeValor = Number(formState.periodicidade)

    const errors: string[] = []
    if (!sigla) {
      errors.push('Sigla é obrigatória.')
    }
    if (!idSigla) {
      errors.push('Identificador da sigla é obrigatório.')
    }
    if (!tarefa) {
      errors.push('Tarefa é obrigatória.')
    }
    if (!codigo) {
      errors.push('Código da tarefa é obrigatório.')
    }
    if (!Number.isFinite(periodicidadeValor)) {
      errors.push('Periodicidade inválida.')
    } else {
      const periodicidade = Math.trunc(periodicidadeValor)
      if (periodicidade < 1 || periodicidade > 60) {
        errors.push('Periodicidade precisa estar entre 1 e 60.')
      }
    }
    if (tarefa && tarefa.length > 255) {
      errors.push('A descrição não pode ultrapassar 255 caracteres.')
    }

    if (errors.length) {
      setFormErrors(errors)
      return
    }

    try {
      setCreating(true)
      await fetchWithAuth(
        `${API_URL}/tarefas`,
        'Erro ao criar tarefa.',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sigla,
            id_sigla: idSigla,
            tarefa,
            codigo,
            periodicidade: Math.trunc(periodicidadeValor),
            medicao: formState.medicao,
            criticidade: formState.criticidade,
            active: formState.active,
            sistema: formState.sistema.trim() || null,
            sub_sistema: formState.sub_sistema.trim() || null
          })
        }
      )
      toast.success('Tarefa criada com sucesso.')
      setModalOpen(false)
      setFormState(initialFormState)
      if (page === 1) {
        await loadTasks(1)
      } else {
        setPage(1)
      }
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : 'Não foi possível criar a tarefa.'
      setFormErrors([message])
    } finally {
      setCreating(false)
    }
  }

  const handleOpenModal = () => {
    setFormErrors([])
    setFormState(initialFormState)
    setModalOpen(true)
  }

  return (
    <div
      style={{
        padding: 24,
        minHeight: '100%',
        backgroundColor: '#f8fafc',
        color: '#0f172a'
      }}
    >
      <section
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
          fontFamily: 'inherit'
        }}
      >
        <header style={{ display: 'grid', gap: 6 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <svg width="26" height="26" viewBox="0 0 24 24" aria-hidden="true">
              <path
                d="M4 6h16M7 12h10M10 18h7"
                fill="none"
                stroke="#2563eb"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
            <h2 style={{ margin: 0, fontSize: 24 }}>Tarefas padrão</h2>
          </div>
          <p style={{ margin: 0, color: '#64748b' }}>
            Gerencie as tarefas padrão e aplique filtros antes da criação de ordens.
          </p>
        </header>

        <div style={filtersCardStyle}>
          <strong style={{ fontSize: 14 }}>Filtros</strong>
          <div style={filtersInputsStyle}>
            <label style={filterFieldStyle}>
              <span style={{ fontSize: 12, fontWeight: 600 }}>Sigla</span>
              <select
                value={filters.sigla}
                onChange={event =>
                  handleFilterChange('sigla', event.target.value)
                }
                style={filterSelectStyle}
              >
                <option value="">Selecione</option>
                {siglaOptions.map(option => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
            <label style={filterFieldStyle}>
              <span style={{ fontSize: 12, fontWeight: 600 }}>Tarefa</span>
              <input
                type="text"
                value={filters.tarefa}
                onChange={event =>
                  handleFilterChange('tarefa', event.target.value)
                }
                placeholder="Buscar por tarefa..."
                style={filterInputStyle}
              />
            </label>
            <label style={filterFieldStyle}>
              <span style={{ fontSize: 12, fontWeight: 600 }}>Sistema</span>
              <input
                type="text"
                value={filters.sistema}
                onChange={event =>
                  handleFilterChange('sistema', event.target.value)
                }
                placeholder="Energia, Comunicação..."
                style={filterInputStyle}
              />
            </label>
            <label style={filterFieldStyle}>
              <span style={{ fontSize: 12, fontWeight: 600 }}>Status</span>
              <select
                value={filters.active}
                onChange={event =>
                  handleFilterChange('active', event.target.value)
                }
                style={filterSelectStyle}
              >
                <option value="true">Ativas</option>
                <option value="false">Inativas</option>
                <option value="all">Todas</option>
              </select>
            </label>
          </div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderTop: '1px solid #e2e8f0',
              paddingTop: 12
            }}
          >
            <div style={{ color: '#64748b', fontSize: 13 }}>
              Total:{' '}
              <strong style={{ color: '#0f172a' }}>{total}</strong> tarefas
            </div>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              {canCreate && (
                <button
                  type="button"
                  onClick={handleOpenModal}
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
                  Nova tarefa
                </button>
              )}
              <button
                type="button"
                onClick={resetFilters}
                style={{
                  padding: '10px 16px',
                  borderRadius: 10,
                  border: '1px solid #e2e8f0',
                  background: '#ffffff',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Limpar filtros
              </button>
            </div>
          </div>
        </div>

        <div style={tableCardStyle}>
          <table style={tableStyle}>
            <thead style={{ background: '#ffffff' }}>
              <tr>
                <th
                  onClick={() => handleSort('sigla')}
                  style={{ ...tableHeaderCellStyle, cursor: 'pointer' }}
                >
                  Sigla {sort === 'sigla' ? (order === 'asc' ? '▲' : '▼') : ''}
                </th>
                <th
                  onClick={() => handleSort('tarefa')}
                  style={{ ...tableHeaderCellStyle, cursor: 'pointer' }}
                >
                  Tarefa {sort === 'tarefa' ? (order === 'asc' ? '▲' : '▼') : ''}
                </th>
                <th
                  style={{
                    ...tableHeaderCellStyle,
                    textAlign: 'center',
                    cursor: 'default'
                  }}
                >
                  Medição
                </th>
                <th
                  style={{
                    ...tableHeaderCellStyle,
                    textAlign: 'center',
                    cursor: 'default'
                  }}
                >
                  Criticidade
                </th>
                <th
                  style={{
                    ...tableHeaderCellStyle,
                    textAlign: 'center',
                    cursor: 'default'
                  }}
                >
                  Periodicidade
                </th>
                <th style={tableHeaderCellStyle}>Sub sistema</th>
                <th style={tableHeaderCellStyle}>Sistema</th>
                <th style={tableHeaderCellStyle}>Código</th>
                <th
                  style={{
                    ...tableHeaderCellStyle,
                    textAlign: 'center',
                    cursor: 'default'
                  }}
                >
                  Ativa
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={9}
                    style={{
                      ...tableBodyCellStyle,
                      textAlign: 'center',
                      borderBottom: 'none'
                    }}
                  >
                    Carregando tarefas...
                  </td>
                </tr>
              ) : tarefas.length === 0 ? (
                <tr>
                  <td
                    colSpan={9}
                    style={{
                      ...tableBodyCellStyle,
                      textAlign: 'center',
                      borderBottom: 'none',
                      color: '#64748b'
                    }}
                  >
                    {error || 'Nenhuma tarefa encontrada.'}
                  </td>
                </tr>
              ) : (
                tarefas.map(tarefa => (
                  <tr key={tarefa.id} style={{ borderTop: '1px solid #e2e8f0' }}>
                    <td style={tableBodyCellStyle}>{tarefa.sigla}</td>
                    <td style={tableBodyCellStyle}>{tarefa.tarefa}</td>
                    <td
                      style={{
                        ...tableBodyCellStyle,
                        textAlign: 'center'
                      }}
                    >
                      {tarefa.medicao ? 'Sim' : 'Não'}
                    </td>
                    <td
                      style={{
                        ...tableBodyCellStyle,
                        textAlign: 'center'
                      }}
                    >
                      {tarefa.criticidade ? 'Sim' : 'Não'}
                    </td>
                    <td
                      style={{
                        ...tableBodyCellStyle,
                        textAlign: 'center'
                      }}
                    >
                      {tarefa.periodicidade}
                    </td>
                    <td style={tableBodyCellStyle}>
                      {tarefa.sub_sistema || '-'}
                    </td>
                    <td style={tableBodyCellStyle}>
                      {tarefa.sistema || '-'}
                    </td>
                    <td style={tableBodyCellStyle}>{tarefa.codigo}</td>
                    <td
                      style={{
                        ...tableBodyCellStyle,
                        textAlign: 'center',
                        color: tarefa.active ? '#047857' : '#b91c1c',
                        fontWeight: 600
                      }}
                    >
                      {tarefa.active ? 'Sim' : 'Não'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '10px 4px'
          }}
        >
          <div style={{ fontSize: 12, color: '#64748b' }}>
            Mostrando {infoStart}-{infoEnd} de {total} tarefas
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <label style={{ fontSize: 12, color: '#64748b' }}>
              Itens por página
            </label>
            <select
              value={perPage}
              onChange={event =>
                handlePerPageChange(
                  Number(event.target.value) || PAGE_SIZE_OPTIONS[0]
                )
              }
              style={{
                padding: '6px 8px',
                borderRadius: 8,
                border: '1px solid #e2e8f0'
              }}
            >
              {PAGE_SIZE_OPTIONS.map(option => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => setPage(1)}
              disabled={page === 1}
              style={{
                ...paginationButtonStyle,
                opacity: page === 1 ? 0.4 : 1,
                cursor: page === 1 ? 'not-allowed' : 'pointer'
              }}
            >
              {'<<'}
            </button>
            <button
              type="button"
              onClick={() => setPage(prev => Math.max(1, prev - 1))}
              disabled={page === 1}
              style={{
                ...paginationButtonStyle,
                opacity: page === 1 ? 0.4 : 1,
                cursor: page === 1 ? 'not-allowed' : 'pointer'
              }}
            >
              {'<'}
            </button>
            <span style={{ fontSize: 12, color: '#64748b' }}>
              {page} / {totalPages}
            </span>
            <button
              type="button"
              onClick={() => setPage(prev => Math.min(totalPages, prev + 1))}
              disabled={page === totalPages}
              style={{
                ...paginationButtonStyle,
                opacity: page === totalPages ? 0.4 : 1,
                cursor: page === totalPages ? 'not-allowed' : 'pointer'
              }}
            >
              {'>'}
            </button>
            <button
              type="button"
              onClick={() => setPage(totalPages)}
              disabled={page === totalPages}
              style={{
                ...paginationButtonStyle,
                opacity: page === totalPages ? 0.4 : 1,
                cursor: page === totalPages ? 'not-allowed' : 'pointer'
              }}
            >
              {'>>'}
            </button>
          </div>
        </div>
      </section>

      <Modal
        title="Nova tarefa padrão"
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
      >
        <form
          onSubmit={handleCreateSubmit}
          style={{ display: 'flex', flexDirection: 'column', gap: 12 }}
        >
          {formErrors.length > 0 && (
            <div style={{ color: '#f87171', fontSize: 12 }}>
              {formErrors.map((item, index) => (
                <div key={index}>{item}</div>
              ))}
            </div>
          )}
          <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ fontSize: 12, fontWeight: 600 }}>Sigla</span>
            <input
              type="text"
              value={formState.sigla}
              onChange={event =>
                setFormState(prev => ({ ...prev, sigla: event.target.value }))
              }
              required
              style={{ padding: 10, borderRadius: 10, border: '1px solid #d1d5db' }}
            />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ fontSize: 12, fontWeight: 600 }}>
              Identificador da sigla (id_sigla)
            </span>
            <input
              type="text"
              value={formState.id_sigla}
              onChange={event =>
                setFormState(prev => ({ ...prev, id_sigla: event.target.value }))
              }
              placeholder="Mantenha o mesmo valor da sigla ou use um código"
              style={{ padding: 10, borderRadius: 10, border: '1px solid #d1d5db' }}
            />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ fontSize: 12, fontWeight: 600 }}>Descrição da tarefa</span>
            <input
              type="text"
              maxLength={255}
              value={formState.tarefa}
              onChange={event =>
                setFormState(prev => ({ ...prev, tarefa: event.target.value }))
              }
              required
              style={{ padding: 10, borderRadius: 10, border: '1px solid #d1d5db' }}
            />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ fontSize: 12, fontWeight: 600 }}>Código interno</span>
            <input
              type="text"
              value={formState.codigo}
              onChange={event =>
                setFormState(prev => ({ ...prev, codigo: event.target.value }))
              }
              required
              style={{ padding: 10, borderRadius: 10, border: '1px solid #d1d5db' }}
            />
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 12 }}>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span style={{ fontSize: 12, fontWeight: 600 }}>Periodicidade</span>
              <input
                type="number"
                min={1}
                max={60}
                value={formState.periodicidade}
                onChange={event =>
                  setFormState(prev => ({
                    ...prev,
                    periodicidade: event.target.value
                  }))
                }
                required
                style={{ padding: 10, borderRadius: 10, border: '1px solid #d1d5db' }}
              />
            </label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span style={{ fontSize: 12, fontWeight: 600 }}>Sistema</span>
              <input
                type="text"
                value={formState.sistema}
                onChange={event =>
                  setFormState(prev => ({ ...prev, sistema: event.target.value }))
                }
                style={{ padding: 10, borderRadius: 10, border: '1px solid #d1d5db' }}
              />
            </label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span style={{ fontSize: 12, fontWeight: 600 }}>Sub sistema</span>
              <input
                type="text"
                value={formState.sub_sistema}
                onChange={event =>
                  setFormState(prev => ({
                    ...prev,
                    sub_sistema: event.target.value
                  }))
                }
                style={{ padding: 10, borderRadius: 10, border: '1px solid #d1d5db' }}
              />
            </label>
          </div>
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 12,
              marginTop: 6
            }}
          >
            <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <input
                type="checkbox"
                checked={formState.medicao}
                onChange={event =>
                  setFormState(prev => ({ ...prev, medicao: event.target.checked }))
                }
              />
              Medição
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <input
                type="checkbox"
                checked={formState.criticidade}
                onChange={event =>
                  setFormState(prev => ({
                    ...prev,
                    criticidade: event.target.checked
                  }))
                }
              />
              Criticidade
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <input
                type="checkbox"
                checked={formState.active}
                onChange={event =>
                  setFormState(prev => ({ ...prev, active: event.target.checked }))
                }
              />
              Ativa
            </label>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 12 }}>
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              style={{
                borderRadius: 10,
                padding: '8px 14px',
                border: '1px solid #475569',
                background: 'transparent',
                cursor: 'pointer'
              }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={creating}
              style={{
                borderRadius: 10,
                padding: '8px 14px',
                border: 'none',
                background: '#2563eb',
                color: '#ffffff',
                fontWeight: 600,
                cursor: 'pointer',
                opacity: creating ? 0.6 : 1
              }}
            >
              {creating ? 'Salvando...' : 'Criar tarefa'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
