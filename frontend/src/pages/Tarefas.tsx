import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
  type ClipboardEvent,
  type FormEvent
} from 'react'
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
}

type TaskRow = {
  tarefa: string
  codigo: string
  periodicidade: string
  sistema: string
  sub_sistema: string
  medicao: 'true' | 'false' | ''
  criticidade: 'true' | 'false' | ''
  active: 'true' | 'false' | ''
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
  id_sigla: ''
}

const MAX_TASK_ROWS = 50

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

const modalGridStyle: CSSProperties = {
  width: '100%',
  borderRadius: 12,
  border: '1px dashed #94a3b8',
  padding: 12,
  background: '#f8fafc',
  display: 'flex',
  flexDirection: 'column',
  gap: 12
}

const modalGridScrollStyle: CSSProperties = {
  overflowY: 'auto',
  maxHeight: '360px',
  minHeight: '180px'
}

const modalGridTableStyle: CSSProperties = {
  width: '100%',
  borderCollapse: 'collapse',
  minWidth: 1100
}

function boolFromValue(value: unknown): boolean {
  return (
    value === true ||
    value === 'true' ||
    value === 1 ||
    value === '1'
  )
}

function createEmptyTaskRow(): TaskRow {
  return {
    tarefa: '',
    codigo: '',
    periodicidade: '',
    sistema: '',
    sub_sistema: '',
    medicao: 'true',
    criticidade: 'false',
    active: 'true'
  }
}

function normalizeYesNoValue(value: string | null | undefined): 'true' | 'false' | '' {
  const normalized = String(value ?? '').trim().toLowerCase()
  if (!normalized) return ''
  if (['sim', 's', '1', 'true'].includes(normalized)) {
    return 'true'
  }
  if (['nao', 'não', 'n', '0', 'false'].includes(normalized)) {
    return 'false'
  }
  return ''
}

const YES_NO_OPTIONS = [
  { value: 'true', label: 'Sim' },
  { value: 'false', label: 'Não' }
]

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
  const [taskRows, setTaskRows] = useState<TaskRow[]>(() => [createEmptyTaskRow()])
  const [gridError, setGridError] = useState<string | null>(null)
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
  const sistemaOptions = useMemo(
    () =>
      Array.from(
        new Set(
          tarefas
            .map(tarefa => tarefa.sistema ?? '')
            .filter(value => value)
        )
      ).sort((a, b) => a.localeCompare(b)),
    [tarefas]
  )
  const subSistemaOptions = useMemo(
    () =>
      Array.from(
        new Set(
          tarefas
            .map(tarefa => tarefa.sub_sistema ?? '')
            .filter(value => value)
        )
      ).sort((a, b) => a.localeCompare(b)),
    [tarefas]
  )

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

  const handleTaskRowChange = (
    index: number,
    field: keyof TaskRow,
    value: string
  ) => {
    setTaskRows(prev =>
      prev.map((row, rowIndex) =>
        rowIndex === index ? { ...row, [field]: value } : row
      )
    )
    setGridError(null)
  }

  const addTaskRow = () => {
    if (taskRows.length >= MAX_TASK_ROWS) {
      setGridError(`Não é possível adicionar mais que ${MAX_TASK_ROWS} linhas.`)
      return
    }
    setTaskRows(prev => [...prev, createEmptyTaskRow()])
  }

  const removeTaskRow = (index: number) => {
    setTaskRows(prev => {
      if (prev.length <= 1) {
        return [createEmptyTaskRow()]
      }
      return prev.filter((_, rowIndex) => rowIndex !== index)
    })
  }

  const handleGridPaste = (event: ClipboardEvent<HTMLDivElement>) => {
    const clipboard = event.clipboardData?.getData('text/plain')
    if (!clipboard) return
    event.preventDefault()
    const rows = clipboard
      .split(/\r?\n/)
      .map(line => line.trim())
      .filter(line => line.length > 0)
    if (!rows.length) return
    if (rows.length > MAX_TASK_ROWS) {
      setGridError(
        `O limite de ${MAX_TASK_ROWS} linhas por colagem foi ultrapassado.`
      )
      return
    }
    if (taskRows.length + rows.length > MAX_TASK_ROWS) {
      setGridError(
        `O limite de ${MAX_TASK_ROWS} linhas foi ultrapassado ao colar o conteúdo.`
      )
      return
    }
    const parsedRows: TaskRow[] = rows.map(line => {
      const columns = line.split(/\t/)
      return {
        tarefa: columns[0]?.trim() ?? '',
        codigo: columns[1]?.trim() ?? '',
        periodicidade: columns[2]?.trim() ?? '',
        sistema: columns[3]?.trim() ?? '',
        sub_sistema: columns[4]?.trim() ?? '',
        medicao: normalizeYesNoValue(columns[5]),
        criticidade: normalizeYesNoValue(columns[6]),
        active: normalizeYesNoValue(columns[7])
      }
    })
    setTaskRows(prev => [...prev, ...parsedRows])
    setGridError(null)
  }

  const handleCreateSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setFormErrors([])
    setGridError(null)
    const sigla = formState.sigla.trim()
    const idSigla = formState.id_sigla.trim() || sigla

    const errors: string[] = []
    if (!sigla) {
      errors.push('Sigla é obrigatória.')
    }
    if (!idSigla) {
      errors.push('Identificador da sigla é obrigatório.')
    }
    if (taskRows.length === 0) {
      errors.push('Adicione ao menos uma linha na grade antes de salvar.')
    }

    const normalizedRows: {
      tarefa: string
      codigo: string
      periodicidade: number
      sistema: string
      sub_sistema: string
      medicao: boolean
      criticidade: boolean
      active: boolean
    }[] = []

    taskRows.forEach((row, index) => {
      const rowErrors: string[] = []
      const tarefa = row.tarefa.trim()
      const codigo = row.codigo.trim()
      const periodicidadeRaw = Number(row.periodicidade)
      const sistema = row.sistema.trim()
      const subSistema = row.sub_sistema.trim()
      if (!tarefa) {
        rowErrors.push('Descrição da tarefa é obrigatória.')
      }
      if (!codigo) {
        rowErrors.push('Código interno é obrigatório.')
      }
      if (!Number.isFinite(periodicidadeRaw)) {
        rowErrors.push('Periodicidade inválida.')
      } else if (!Number.isInteger(periodicidadeRaw)) {
        rowErrors.push('Periodicidade deve ser um número inteiro.')
      } else if (periodicidadeRaw < 1 || periodicidadeRaw > 60) {
        rowErrors.push('Periodicidade precisa estar entre 1 e 60.')
      }
      if (!sistema) {
        rowErrors.push('Sistema é obrigatório.')
      }
      if (!subSistema) {
        rowErrors.push('Sub sistema é obrigatório.')
      }
      if (row.medicao !== 'true' && row.medicao !== 'false') {
        rowErrors.push('Medição precisa ser Sim ou Não.')
      }
      if (row.criticidade !== 'true' && row.criticidade !== 'false') {
        rowErrors.push('Criticidade precisa ser Sim ou Não.')
      }
      if (row.active !== 'true' && row.active !== 'false') {
        rowErrors.push('Ativa precisa ser Sim ou Não.')
      }
      if (tarefa && tarefa.length > 260) {
        rowErrors.push('Descrição não pode ultrapassar 260 caracteres.')
      }
      if (rowErrors.length) {
        errors.push(`Linha ${index + 1}: ${rowErrors.join(' ')}`)
      } else {
        normalizedRows.push({
          tarefa,
          codigo,
          periodicidade: Math.trunc(periodicidadeRaw),
          sistema,
          sub_sistema: subSistema,
          medicao: row.medicao === 'true',
          criticidade: row.criticidade === 'true',
          active: row.active === 'true'
        })
      }
    })

    if (!errors.length && normalizedRows.length === 0) {
      errors.push('Adicione ao menos uma tarefa válida antes de salvar.')
    }

    if (errors.length) {
      setFormErrors(errors)
      return
    }

    const confirmMessage = `Deseja criar ${normalizedRows.length} tarefas?`
    if (!window.confirm(confirmMessage)) {
      return
    }

    try {
      setCreating(true)
      await fetchWithAuth(
        `${API_URL}/tarefas`,
        'Erro ao criar tarefas.',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sigla,
            id_sigla: idSigla,
            tarefas: normalizedRows.map(row => ({
              tarefa: row.tarefa,
              codigo: row.codigo,
              periodicidade: row.periodicidade,
              medicao: row.medicao,
              criticidade: row.criticidade,
              active: row.active,
              sistema: row.sistema,
              sub_sistema: row.sub_sistema
            }))
          })
        }
      )
      toast.success('Tarefas criadas com sucesso.')
      setModalOpen(false)
      setFormState(initialFormState)
      setTaskRows([createEmptyTaskRow()])
      setGridError(null)
      if (page === 1) {
        await loadTasks(1)
      } else {
        setPage(1)
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Não foi possível criar tarefas.'
      setFormErrors([message])
    } finally {
      setCreating(false)
    }
  }

  const handleOpenModal = () => {
    setFormErrors([])
    setFormState(initialFormState)
    setTaskRows([createEmptyTaskRow()])
    setGridError(null)
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
        width="min(1180px, 95vw)"
        maxWidth="1400px"
      >
        <form
          onSubmit={handleCreateSubmit}
          style={{
            width: '100%',
            maxHeight: '80vh',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: 18,
            alignItems: 'center'
          }}
        >
          {formErrors.length > 0 && (
            <div style={{ color: '#f87171', fontSize: 12 }}>
              {formErrors.map((item, index) => (
                <div key={index}>{item}</div>
              ))}
            </div>
          )}
          <div
            style={{
              width: '100%',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: 12
            }}
          >
            <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span style={{ fontSize: 12, fontWeight: 600 }}>Sigla</span>
              <input
                type="text"
                value={formState.sigla}
                onChange={event =>
                  setFormState(prev => ({ ...prev, sigla: event.target.value }))
                }
                required
                style={{
                  padding: 10,
                  borderRadius: 10,
                  border: '1px solid #d1d5db'
                }}
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
                style={{
                  padding: 10,
                  borderRadius: 10,
                  border: '1px solid #d1d5db'
                }}
              />
            </label>
          </div>
          <div style={modalGridStyle} onPaste={handleGridPaste}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 8,
                marginBottom: 8
              }}
            >
              <strong>Grade de tarefas</strong>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <span style={{ fontSize: 12, color: '#475569' }}>
                  Cole do Excel (até {MAX_TASK_ROWS} linhas por vez)
                </span>
                <button
                  type="button"
                  onClick={addTaskRow}
                  disabled={taskRows.length >= MAX_TASK_ROWS}
                  style={{
                    padding: '6px 10px',
                    borderRadius: 8,
                    border: '1px solid #d1d5db',
                    background: '#ffffff',
                    cursor:
                      taskRows.length >= MAX_TASK_ROWS ? 'not-allowed' : 'pointer'
                  }}
                >
                  Adicionar linha
                </button>
              </div>
            </div>
            <div style={modalGridScrollStyle}>
              <div style={{ width: '100%', overflowX: 'auto' }}>
                <table style={modalGridTableStyle}>
                  <thead>
                    <tr>
                      <th style={{ ...tableHeaderCellStyle, textAlign: 'left' }}>Descrição da tarefa</th>
                      <th style={tableHeaderCellStyle}>Código interno</th>
                      <th style={tableHeaderCellStyle}>Periodicidade</th>
                      <th style={tableHeaderCellStyle}>Sistema</th>
                      <th style={tableHeaderCellStyle}>Sub sistema</th>
                      <th style={tableHeaderCellStyle}>Medição</th>
                      <th style={tableHeaderCellStyle}>Criticidade</th>
                      <th style={tableHeaderCellStyle}>Ativa</th>
                    </tr>
                  </thead>
                  <tbody>
                    {taskRows.map((row, index) => (
                      <tr key={`task-row-${index}`} style={{ borderTop: '1px solid #e2e8f0' }}>
                        <td
                          style={{
                            ...tableBodyCellStyle,
                            paddingTop: 16,
                            paddingBottom: 16
                          }}
                        >
                          <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                            <input
                              type="text"
                              value={row.tarefa}
                              maxLength={260}
                              onChange={event =>
                                handleTaskRowChange(index, 'tarefa', event.target.value)
                              }
                              placeholder="Descrição"
                              style={{
                                flex: 1,
                                minWidth: 0,
                                padding: '10px 14px',
                                borderRadius: 6,
                                border: '1px solid #d1d5db'
                              }}
                            />
                            <button
                              type="button"
                              onClick={() => removeTaskRow(index)}
                              style={{
                                padding: '4px 10px',
                                borderRadius: 8,
                                border: '1px solid #d1d5db',
                                background: '#f8fafc',
                                color: '#1f2937',
                                fontSize: 12,
                                cursor: 'pointer',
                                height: 38
                              }}
                            >
                              Remover
                            </button>
                          </div>
                        </td>
                        <td style={tableBodyCellStyle}>
                          <input
                            type="text"
                            value={row.codigo}
                            onChange={event =>
                              handleTaskRowChange(index, 'codigo', event.target.value)
                            }
                            placeholder="Código"
                            style={{
                              width: '100%',
                              padding: 6,
                              borderRadius: 6,
                              border: '1px solid #d1d5db'
                            }}
                          />
                        </td>
                        <td style={tableBodyCellStyle}>
                          <input
                            type="number"
                            min={1}
                            max={60}
                            value={row.periodicidade}
                            onChange={event =>
                              handleTaskRowChange(index, 'periodicidade', event.target.value)
                            }
                            placeholder="1-60"
                            style={{
                              width: '100%',
                              padding: 6,
                              borderRadius: 6,
                              border: '1px solid #d1d5db'
                            }}
                          />
                        </td>
                        <td style={tableBodyCellStyle}>
                          <input
                            type="text"
                            list={sistemaOptions.length ? 'sistema-options' : undefined}
                            value={row.sistema}
                            onChange={event =>
                              handleTaskRowChange(index, 'sistema', event.target.value)
                            }
                            placeholder="Sistema"
                            style={{
                              width: '100%',
                              padding: 6,
                              borderRadius: 6,
                              border: '1px solid #d1d5db'
                            }}
                          />
                          {sistemaOptions.length > 0 && (
                            <datalist id="sistema-options">
                              {sistemaOptions.map(option => (
                                <option key={`sistema-${option}`} value={option} />
                              ))}
                            </datalist>
                          )}
                        </td>
                        <td style={tableBodyCellStyle}>
                          <input
                            type="text"
                            list={subSistemaOptions.length ? 'subsistema-options' : undefined}
                            value={row.sub_sistema}
                            onChange={event =>
                              handleTaskRowChange(index, 'sub_sistema', event.target.value)
                            }
                            placeholder="Sub sistema"
                            style={{
                              width: '100%',
                              padding: 6,
                              borderRadius: 6,
                              border: '1px solid #d1d5db'
                            }}
                          />
                          {subSistemaOptions.length > 0 && (
                            <datalist id="subsistema-options">
                              {subSistemaOptions.map(option => (
                                <option key={`sub-${option}`} value={option} />
                              ))}
                            </datalist>
                          )}
                        </td>
                        <td style={tableBodyCellStyle}>
                          <select
                            value={row.medicao}
                            onChange={event =>
                              handleTaskRowChange(index, 'medicao', event.target.value)
                            }
                            style={{
                              width: '100%',
                              padding: 6,
                              borderRadius: 6,
                              border: '1px solid #d1d5db'
                            }}
                          >
                            {YES_NO_OPTIONS.map(option => (
                              <option key={`medicao-${option.value}`} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td style={tableBodyCellStyle}>
                          <select
                            value={row.criticidade}
                            onChange={event =>
                              handleTaskRowChange(index, 'criticidade', event.target.value)
                            }
                            style={{
                              width: '100%',
                              padding: 6,
                              borderRadius: 6,
                              border: '1px solid #d1d5db'
                            }}
                          >
                            {YES_NO_OPTIONS.map(option => (
                              <option key={`criticidade-${option.value}`} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td style={tableBodyCellStyle}>
                          <select
                            value={row.active}
                            onChange={event =>
                              handleTaskRowChange(index, 'active', event.target.value)
                            }
                            style={{
                              width: '100%',
                              padding: 6,
                              borderRadius: 6,
                              border: '1px solid #d1d5db'
                            }}
                          >
                            {YES_NO_OPTIONS.map(option => (
                              <option key={`active-${option.value}`} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            {gridError && (
              <div style={{ color: '#b91c1c', fontSize: 12, marginTop: 8 }}>{gridError}</div>
            )}
          </div>
          <button
            type="submit"
            disabled={creating}
            style={{
              padding: '10px 16px',
              borderRadius: 10,
              border: 'none',
              background: '#1d4ed8',
              color: '#ffffff',
              fontWeight: 600,
              cursor: creating ? 'not-allowed' : 'pointer'
            }}
          >
            {creating ? 'Salvando...' : 'Salvar'}
          </button>
        </form>
      </Modal>
    </div>
  )
}
