import { useCallback, useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Modal } from '../components/Modal'
import { Tabs } from '../components/Tabs'
import { toast } from 'sonner'
import { OrdensServicoCreateModal } from './OrdensServicoCreateModal'
import {
  fetchPermissions,
  getStoredPermissions,
  getStoredToken,
  logout,
  setPostLoginRedirect
} from '../services/auth'
import { API_URL } from '../services/api'
import { formatBrasiliaDateTime } from '../utils/date'

type OrderServiceListItem = {
  id: string
  os_numero: number
  os_status: string
  os_pdm: number
  os_tipo: string
  os_checklist: number
  os_capex: number
  os_programado1: string | null
  os_programado2: string | null
  os_programado3: string | null
  os_programado4: string | null
  os_programado5: string | null
  os_realizado_em: string | null
  os_obs_pcm: string | null
  ATIVO_CODPE: string
  ATIVO_DESCRITIVO_OS: string
  ATIVO_EQUIPE: string
}

type OrderServiceDetail = {
  id: string
  os_numero: number
  estrutura_id: string
  ativo_id: string
  os_tipo: string
  os_pdm: number
  os_status: string
  os_checklist: number
  os_capex: number
  os_realizado_em: string | null
  os_programado1: string | null
  os_programado2: string | null
  os_programado3: string | null
  os_programado4: string | null
  os_programado5: string | null
  os_obs_pcm: string | null
  os_obs_tecnico: string | null
  os_ano: number
  os_mes: number
  ATIVO_CODPE: string
  ATIVO_DESCRITIVO_OS: string
  ATIVO_EQUIPE: string
  estrutura_coordenacao: string
  estrutura_equipe: string
}

type OrderServiceHistoryItem = {
  id: string
  action: 'criado' | 'atualizado'
  before_data: string | null
  after_data: string
  created_at: string
  changed_by_name: string | null
}

type EstruturaItem = {
  id: string
  coordenacao: string
  equipe: string
  cc: string
  execucao?: string
  status: string
}

type AtivoItem = {
  id: string
  ATIVO_CODPE: string
  ATIVO_DESCRITIVO_OS: string
  ATIVO_EQUIPE: string
}

type CreateFormState = {
  anoMes: string
  coordenacao: string
  equipe: string
  tipo: 'PDM' | 'EX' | 'RI' | ''
  pdm: '1' | '0'
  obsPcm: string
  checklist: '1' | '0'
  capex: '1' | '0'
}

type SortKey =
  | 'ATIVO_CODPE'
  | 'ATIVO_DESCRITIVO_OS'
  | 'os_status'
  | 'os_realizado_em'
  | 'os_programado1'
  | 'os_pdm'
  | 'os_tipo'
  | 'os_checklist'
  | 'os_obs_pcm'

const fieldLabelStyle = { fontSize: 12, fontWeight: 600, color: '#475569' }

function formatDate(value: string | null) {
  if (!value) return '-'
  return formatBrasiliaDateTime(value)
}

function formatShortDate(value: string | null) {
  const dateKey = toDateKey(value)
  if (!dateKey) return '-'
  const [year, month, day] = dateKey.split('-')
  if (!year || !month || !day) return dateKey
  return `${day}/${month}/${year}`
}

function toDateKey(value: string | null) {
  if (!value) return null
  const trimmed = String(value).trim()
  if (!trimmed) return null
  return trimmed.split('T')[0].split(' ')[0] || null
}

function getTodayKey() {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function getStatusStyles(status: string) {
  switch (status) {
    case 'CRIADO':
      return { background: '#dbeafe', color: '#1d4ed8' }
    case 'PROGRAMADO':
      return { background: '#fef3c7', color: '#b45309' }
    case 'REALIZADO':
      return { background: '#dcfce7', color: '#15803d' }
    case 'CANCELADO':
      return { background: '#fee2e2', color: '#b91c1c' }
    default:
      return { background: '#e2e8f0', color: '#475569' }
  }
}

function getMaxProgramadoDate(item: OrderServiceListItem) {
  const values = [
    item.os_programado1,
    item.os_programado2,
    item.os_programado3,
    item.os_programado4,
    item.os_programado5
  ]

  let maxValue: string | null = null
  let maxKey: string | null = null

  values.forEach(value => {
    const dateKey = toDateKey(value)
    if (!dateKey) return
    if (!maxKey || dateKey > maxKey) {
      maxKey = dateKey
      maxValue = value
    }
  })

  return maxValue
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

export function OrdensServico() {
  const navigate = useNavigate()
  const location = useLocation()

  const [permissions, setPermissions] = useState(() => getStoredPermissions())
  const [items, setItems] = useState<OrderServiceListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState({
    anoMes: '',
    status: '',
    tipo: '',
    pdm: '',
    capex: '',
    coordenacao: '',
    equipe: '',
    search: '',
    osNumero: ''
  })

  const resetFilters = () => {
    setFilters({
      anoMes: '',
      status: '',
      tipo: '',
      pdm: '',
      capex: '',
      coordenacao: '',
      equipe: '',
      search: '',
      osNumero: ''
    })
  }

  const [estruturas, setEstruturas] = useState<EstruturaItem[]>([])
  const [ativos, setAtivos] = useState<AtivoItem[]>([])
  const [selectedAtivos, setSelectedAtivos] = useState<AtivoItem[]>([])

  const [modalOpen, setModalOpen] = useState(false)
  const [returnTo, setReturnTo] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('os')
  const [historyItems, setHistoryItems] = useState<OrderServiceHistoryItem[]>([])
  const [historyLoading, setHistoryLoading] = useState(false)
  const [historyError, setHistoryError] = useState<string | null>(null)
  const [detail, setDetail] = useState<OrderServiceDetail | null>(null)
  const [originalStatus, setOriginalStatus] = useState<string | null>(null)
  const canDeleteOs = permissions?.planejamento?.exclusao === true
  const [sort, setSort] = useState<{ key: SortKey; dir: 'asc' | 'desc' }>({
    key: 'ATIVO_CODPE',
    dir: 'asc'
  })
  const [pageSize, setPageSize] = useState(() => {
    try {
      const value = localStorage.getItem('tecrail:os:page-size')
      return value ? Number(value) : 50
    } catch {
      return 50
    }
  })
  const [page, setPage] = useState(1)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [bulkStatus, setBulkStatus] = useState('')
  const [bulkTipo, setBulkTipo] = useState('')
  const todayKey = useMemo(() => getTodayKey(), [])

  const [createForm, setCreateForm] = useState<CreateFormState>({
    anoMes: '',
    coordenacao: '',
    equipe: '',
    tipo: '',
    pdm: '0',
    obsPcm: '',
    checklist: '0',
    capex: '0'
  })
  const [createModalOpen, setCreateModalOpen] = useState(false)

  useEffect(() => {
    const token = getStoredToken()
    if (!token) {
      setError('Sessao expirada. Faca login novamente.')
      setLoading(false)
      return
    }

    const loadList = async () => {
      if (!filters.coordenacao) {
        setItems([])
        setLoading(false)
        return
      }
      try {
        const params = new URLSearchParams()
        if (filters.anoMes) {
          const [ano, mes] = filters.anoMes.split('-')
          if (ano) params.set('ano', ano)
          if (mes) params.set('mes', mes)
        }
        if (filters.osNumero) params.set('os_numero', filters.osNumero)
        if (filters.status) params.set('status', filters.status)
        if (filters.tipo) params.set('tipo', filters.tipo)
        if (filters.pdm) params.set('pdm', filters.pdm)
        if (filters.capex) params.set('capex', filters.capex)
        if (filters.coordenacao && filters.equipe) {
          params.set('coordenacao', filters.coordenacao)
        }
        if (filters.equipe) params.set('equipe', filters.equipe)
        if (filters.search) params.set('search', filters.search)

        const response = await fetch(`${API_URL}/os?${params.toString()}`, {
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
            'Erro ao carregar OS.'
          )
          throw new Error(message)
        }

        const data = await response.json()
        setItems(Array.isArray(data.os) ? data.os : [])
        setError(null)
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Erro ao carregar OS.'
        setError(message)
      } finally {
        setLoading(false)
      }
    }

    loadList()
  }, [filters, navigate])

  useEffect(() => {
    const token = getStoredToken()
    if (!token) return
    fetchPermissions()
      .then(setPermissions)
      .catch(() => setPermissions(getStoredPermissions()))
  }, [navigate])
  useEffect(() => {
    const token = getStoredToken()
    if (!token) return
    fetch(`${API_URL}/estrutura`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(response => {
        if (response.status === 401) {
          setPostLoginRedirect(window.location.pathname + window.location.search)
          logout()
          navigate('/')
          return null
        }
        if (!response.ok) return null
        return response.json()
      })
      .then(data => {
        if (!data) return
        const list = Array.isArray(data.estrutura) ? data.estrutura : []
        setEstruturas(
          list.filter(
            (item: EstruturaItem) =>
              item.status === 'ativo' && item.execucao === 'sim'
          )
        )
      })
      .catch(() => {
        setEstruturas([])
      })
  }, [navigate])

  const equipeOptions = useMemo(() => {
    const list = filters.coordenacao
      ? estruturas.filter(item => item.coordenacao === filters.coordenacao)
      : estruturas
    return Array.from(new Set(list.map(item => item.equipe)))
  }, [estruturas, filters.coordenacao])

  const sortedItems = useMemo(() => {
    const sorted = [...items]
    const dir = sort.dir === 'asc' ? 1 : -1
    sorted.sort((a, b) => {
      const key = sort.key
      const valA =
        key === 'os_programado1' ? getMaxProgramadoDate(a) : a[key]
      const valB =
        key === 'os_programado1' ? getMaxProgramadoDate(b) : b[key]
      if (valA == null && valB == null) return 0
      if (valA == null) return 1 * dir
      if (valB == null) return -1 * dir
      if (key === 'os_pdm' || key === 'os_checklist') {
        return (Number(valA) - Number(valB)) * dir
      }
      return String(valA).localeCompare(String(valB)) * dir
    })
    return sorted
  }, [items, sort])

  const totalPages = Math.max(1, Math.ceil(sortedItems.length / pageSize))
  const pagedItems = useMemo(() => {
    const start = (page - 1) * pageSize
    return sortedItems.slice(start, start + pageSize)
  }, [sortedItems, page, pageSize])

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages)
    }
    if (page < 1) {
      setPage(1)
    }
  }, [page, totalPages])

  const allPageSelected =
    pagedItems.length > 0 && pagedItems.every(item => selectedIds.includes(item.id))

  const openNewOs = () => {
    setCreateModalOpen(true)
    setActiveTab('os')
    setSelectedAtivos([])
    setAtivos([])
    setCreateForm({
      anoMes: '',
      coordenacao: '',
      equipe: '',
      tipo: '',
      pdm: '0',
      obsPcm: '',
      checklist: '0',
      capex: '0'
    })
  }

  const toggleSelectAll = () => {
    if (allPageSelected) {
      const remaining = selectedIds.filter(
        id => !pagedItems.some(item => item.id === id)
      )
      setSelectedIds(remaining)
      return
    }
    const next = new Set(selectedIds)
    pagedItems.forEach(item => next.add(item.id))
    setSelectedIds(Array.from(next))
  }

  const toggleSelect = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    )
  }

  const clearBulkSelection = () => {
    setSelectedIds([])
    setBulkStatus('')
    setBulkTipo('')
  }

  const applyBulkUpdate = async () => {
    if (!selectedIds.length) return
    if (!bulkStatus && !bulkTipo) {
      toast.error('Selecione um status ou tipo para alterar.')
      return
    }
    const token = getStoredToken()
    if (!token) return

    try {
      const response = await fetch(`${API_URL}/os/bulk`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          ids: selectedIds,
          os_status: bulkStatus || undefined,
          os_tipo: bulkTipo || undefined
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
          'Erro ao atualizar OS.'
        )
        throw new Error(message)
      }

      toast.success('Registros atualizados com sucesso!')
      clearBulkSelection()
      setFilters({ ...filters })
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Erro ao atualizar OS.'
      toast.error(message)
    }
  }

  const openEditOs = useCallback(
    async (id: string) => {
      const token = getStoredToken()
      if (!token) return
      setModalOpen(true)
      setActiveTab('os')
      setHistoryItems([])
      setDetail(null)

      try {
        const response = await fetch(`${API_URL}/os/detail?id=${id}`, {
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
            'Erro ao carregar OS.'
          )
          throw new Error(message)
        }
        const data = await response.json()
        setDetail(data.os as OrderServiceDetail)
        setOriginalStatus((data.os as OrderServiceDetail).os_status)
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Erro ao carregar OS.'
        setError(message)
      }
    },
    [navigate]
  )

  useEffect(() => {
    const state = location.state as { editId?: string; returnTo?: string } | null
    if (!state?.editId) return
    setReturnTo(state.returnTo || null)
    openEditOs(state.editId)
    navigate(location.pathname, { replace: true, state: null })
  }, [location.pathname, location.state, navigate, openEditOs])

  const handleCloseModal = () => {
    setModalOpen(false)
    setOriginalStatus(null)
    if (returnTo) {
      navigate(returnTo, { replace: true })
    }
  }

  const fetchHistory = async (osId: string) => {
    const token = getStoredToken()
    if (!token) return
    try {
      setHistoryLoading(true)
      const response = await fetch(
        `${API_URL}/os/history?os_id=${encodeURIComponent(osId)}`,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      if (!response.ok) {
        const message = await getApiErrorMessage(
          response,
          'Erro ao carregar historico.'
        )
        throw new Error(message)
      }
      const data = await response.json()
      setHistoryItems(Array.isArray(data.history) ? data.history : [])
      setHistoryError(null)
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Erro ao carregar historico.'
      setHistoryError(message)
    } finally {
      setHistoryLoading(false)
    }
  }

  useEffect(() => {
    if (modalOpen && detail?.id) {
      fetchHistory(detail.id)
    }
  }, [modalOpen, detail?.id])

  const allowEdit = originalStatus ? originalStatus !== 'REALIZADO' : true
  const isProgramado1Locked =
    detail &&
    detail.os_status === 'PROGRAMADO' &&
    !detail.os_realizado_em &&
    Boolean(toDateKey(detail.os_programado1)) &&
    (toDateKey(detail.os_programado1) || '') < todayKey

  const toggleSort = (key: SortKey) => {
    setSort(prev => {
      if (prev.key === key) {
        return { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' }
      }
      return { key, dir: 'asc' }
    })
  }

  const sortIndicator = (key: SortKey) => {
    if (sort.key !== key) return ''
    return sort.dir === 'asc' ? ' ^' : ' v'
  }

  const handleUpdate = async () => {
    if (!detail) return
    const token = getStoredToken()
    if (!token) return

    try {
      const response = await fetch(`${API_URL}/os`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(detail)
      })
      if (!response.ok) {
        const message = await getApiErrorMessage(
          response,
          'Erro ao atualizar OS.'
        )
        throw new Error(message)
      }
      const data = await response.json()
      setDetail(data.os)
      toast.success('Registro modificado com sucesso!')
      setFilters({ ...filters })
      if (returnTo) {
        navigate(returnTo, { replace: true })
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Erro ao atualizar OS.'
      toast.error(message)
    }
  }

  const handleCancelOs = async (osId: string) => {
    if (!canDeleteOs) {
      toast.error('Seu perfil nao tem permissao para excluir.')
      return
    }
    if (!window.confirm('Confirmar exclusao da OS?')) {
      return
    }
    const token = getStoredToken()
    if (!token) return

    try {
      const response = await fetch(`${API_URL}/os`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ id: osId, os_status: 'CANCELADO' })
      })
      if (!response.ok) {
        const message = await getApiErrorMessage(
          response,
          'Erro ao excluir OS.'
        )
        throw new Error(message)
      }
      const data = await response.json()
      const updated = data.os as OrderServiceDetail
      setItems(prev =>
        prev.map(item =>
          item.id === osId ? { ...item, os_status: updated.os_status } : item
        )
      )
      if (detail?.id === osId) {
        setDetail(updated)
      }
      toast.success('Registro excluido com sucesso!')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao excluir OS.'
      setError(message)
    }
  }

  const statusOptions = ['CRIADO', 'PROGRAMADO', 'REALIZADO', 'CANCELADO']
  const tipoOptions = ['PDM', 'EX', 'RI']
  return (
    <section style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <header style={{ display: 'grid', gap: 6 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <svg width="26" height="26" viewBox="0 0 24 24" aria-hidden="true">
            <path
              d="M7 2h10a2 2 0 012 2v16a2 2 0 01-2 2H7a2 2 0 01-2-2V4a2 2 0 012-2z"
              fill="none"
              stroke="#2563eb"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <path
              d="M8 6h8M8 10h8M8 14h5"
              fill="none"
              stroke="#2563eb"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
          <h2 style={{ margin: 0, fontSize: 24 }}>Painel de Ordens de Serviço</h2>
        </div>
        <p style={{ margin: 0, color: '#64748b' }}>
          Gerencie e acompanhe todas as ordens de servico geradas.
        </p>
      </header>

      <div
        style={{
          borderRadius: 16,
          border: '1px solid #e2e8f0',
          background: '#ffffff',
          padding: 18,
          display: 'grid',
          gap: 16,
          boxShadow: '0 10px 20px rgba(15, 23, 42, 0.06)'
        }}
      >
        <strong style={{ fontSize: 14 }}>Filtros</strong>
        <div style={{ display: 'grid', gap: 12 }}>
          <div
            style={{
              display: 'flex',
              gap: 12,
              flexWrap: 'nowrap',
              overflowX: 'auto',
              paddingBottom: 4,
              alignItems: 'flex-end'
            }}
          >
            <div style={{ display: 'grid', gap: 6, minWidth: 140, flex: '0 0 140px' }}>
            <label style={fieldLabelStyle}>Mês</label>
            <input
              type="month"
              value={filters.anoMes}
              onChange={event =>
                setFilters(prev => ({ ...prev, anoMes: event.target.value }))
              }
              style={{
                padding: '10px 12px',
                borderRadius: 10,
                border: '1px solid #e2e8f0'
              }}
            />
            </div>
            <div style={{ width: 36 }} />
            <div style={{ display: 'grid', gap: 6, minWidth: 140, flex: '0 0 140px' }}>
            <label style={fieldLabelStyle}>Tipo de OS</label>
            <select
              value={filters.tipo}
              onChange={event =>
                setFilters(prev => ({ ...prev, tipo: event.target.value }))
              }
              style={{
                padding: '10px 12px',
                borderRadius: 10,
                border: '1px solid #e2e8f0'
              }}
            >
              <option value="">Todos</option>
              {tipoOptions.map(option => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            </div>
            <div style={{ display: 'grid', gap: 6, minWidth: 140, flex: '0 0 140px' }}>
              <label style={fieldLabelStyle}>Status</label>
              <select
                value={filters.status}
                onChange={event =>
                  setFilters(prev => ({ ...prev, status: event.target.value }))
                }
                style={{
                  padding: '10px 12px',
                  borderRadius: 10,
                  border: '1px solid #e2e8f0'
                }}
              >
                <option value="">Todos</option>
                {statusOptions.map(option => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
            <div style={{ display: 'grid', gap: 6, minWidth: 140, flex: '0 0 140px' }}>
            <label style={fieldLabelStyle}>Coordenação</label>
            <select
              value={filters.coordenacao}
              onChange={event =>
                setFilters(prev => ({
                  ...prev,
                  coordenacao: event.target.value,
                  equipe: ''
                }))
              }
              style={{
                padding: '10px 12px',
                borderRadius: 10,
                border: '1px solid #e2e8f0'
              }}
            >
              <option value="">Selecione</option>
              {Array.from(new Set(estruturas.map(item => item.coordenacao))).map(
                value => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                )
              )}
            </select>
            </div>
            <div style={{ display: 'grid', gap: 6, minWidth: 140, flex: '0 0 140px' }}>
            <label style={fieldLabelStyle}>Equipe</label>
            <select
              value={filters.equipe}
              onChange={event =>
                setFilters(prev => ({ ...prev, equipe: event.target.value }))
              }
              disabled={!equipeOptions.length}
                style={{
                  padding: '10px 12px',
                  borderRadius: 10,
                  border: '1px solid #e2e8f0'
                }}
            >
              <option value="">Todas</option>
              {equipeOptions.map(option => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
            <div style={{ display: 'grid', gap: 6, minWidth: 140, flex: '0 0 140px' }}>
            <label style={fieldLabelStyle}>PDM</label>
            <select
              value={filters.pdm}
              onChange={event =>
                setFilters(prev => ({ ...prev, pdm: event.target.value }))
              }
              style={{
                padding: '10px 12px',
                borderRadius: 10,
                border: '1px solid #e2e8f0'
              }}
            >
              <option value="">Todos</option>
              <option value="1">Sim</option>
              <option value="0">Nao</option>
            </select>
            </div>
            <div style={{ display: 'grid', gap: 6, minWidth: 220, flex: '0 0 220px' }}>
              <label style={fieldLabelStyle}>Busca</label>
              <div style={{ position: 'relative' }}>
                <span
                  style={{
                    position: 'absolute',
                    left: 10,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#94a3b8'
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
                    <path
                      d="M21 21l-4.35-4.35m1.85-5.65a7 7 0 11-14 0 7 7 0 0114 0z"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </svg>
                </span>
                <input
                  placeholder="Buscar..."
                  value={filters.search}
                  onChange={event =>
                    setFilters(prev => ({ ...prev, search: event.target.value }))
                  }
                  style={{
                    padding: '10px 12px 10px 34px',
                    borderRadius: 10,
                    border: '1px solid #e2e8f0',
                    width: '100%'
                  }}
                />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, marginLeft: 'auto', flex: '0 0 auto' }}>
              <button
                type="button"
                onClick={openNewOs}
                style={{
                  padding: '10px 16px',
                  borderRadius: 10,
                  border: 'none',
                  background: '#1d4ed8',
                  color: '#ffffff',
                  fontWeight: 600,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap'
                }}
              >
                Criar OS
              </button>
              <button
                type="button"
                onClick={resetFilters}
                style={{
                  padding: '10px 16px',
                  borderRadius: 10,
                  border: '1px solid #e2e8f0',
                  background: '#ffffff',
                  fontWeight: 600,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap'
                }}
              >
                Limpar
              </button>
            </div>
          </div>
        </div>
      </div>

      {loading && (
        <div style={{ color: '#64748b', fontSize: 13 }}>Carregando OS...</div>
      )}
      {error && <div style={{ color: '#f87171', fontSize: 13 }}>{error}</div>}

      {filters.coordenacao ? (
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
              <th style={{ padding: 12 }}>
                <input
                  type="checkbox"
                  checked={allPageSelected}
                  onChange={toggleSelectAll}
                />
              </th>
              <th style={{ padding: 12 }}>IDOS</th>
              <th
                style={{ cursor: 'pointer' }}
                onClick={() => toggleSort('ATIVO_CODPE')}
              >
                IDCOD{sortIndicator('ATIVO_CODPE')}
              </th>
              <th
                style={{ cursor: 'pointer' }}
                onClick={() => toggleSort('ATIVO_DESCRITIVO_OS')}
              >
                DESCRITIVO ATIVO{sortIndicator('ATIVO_DESCRITIVO_OS')}
              </th>
              <th style={{ cursor: 'pointer' }} onClick={() => toggleSort('os_pdm')}>
                PDM{sortIndicator('os_pdm')}
              </th>
              <th style={{ cursor: 'pointer' }} onClick={() => toggleSort('os_tipo')}>
                TIPO{sortIndicator('os_tipo')}
              </th>
              <th
                style={{ cursor: 'pointer' }}
                onClick={() => toggleSort('os_checklist')}
              >
                CHK{sortIndicator('os_checklist')}
              </th>
              <th
                style={{ cursor: 'pointer' }}
                onClick={() => toggleSort('os_realizado_em')}
              >
                DATA REAL.{sortIndicator('os_realizado_em')}
              </th>
              <th
                style={{ cursor: 'pointer' }}
                onClick={() => toggleSort('os_programado1')}
              >
                DATA PROG{sortIndicator('os_programado1')}
              </th>
              <th style={{ cursor: 'pointer' }} onClick={() => toggleSort('os_status')}>
                STATUS{sortIndicator('os_status')}
              </th>
              <th
                style={{ cursor: 'pointer' }}
                onClick={() => toggleSort('os_obs_pcm')}
              >
                OBSERVAÇÕES{sortIndicator('os_obs_pcm')}
              </th>
            </tr>
          </thead>
          <tbody>
            {pagedItems.map(item => (
              <tr key={item.id} style={{ borderTop: '1px solid #e2e8f0' }}>
                <td>
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(item.id)}
                    onChange={() => toggleSelect(item.id)}
                  />
                </td>
                <td style={{ padding: 12 }}>
                  <button
                    type="button"
                    onClick={() => openEditOs(item.id)}
                    style={{
                      border: 'none',
                      background: 'transparent',
                      color: '#1d4ed8',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    {item.os_numero}
                  </button>
                </td>
                <td>{item.ATIVO_CODPE}</td>
                <td>{item.ATIVO_DESCRITIVO_OS}</td>
                <td>{item.os_pdm === 1 ? 'Sim' : 'Nao'}</td>
                <td>{item.os_tipo}</td>
                <td>{item.os_checklist === 1 ? 'Sim' : 'Nao'}</td>
                <td>{formatDate(item.os_realizado_em)}</td>
                <td>{formatShortDate(getMaxProgramadoDate(item))}</td>
                <td>
                  <span
                    style={{
                      padding: '4px 10px',
                      borderRadius: 999,
                      fontWeight: 700,
                      fontSize: 12,
                      display: 'inline-block',
                      ...getStatusStyles(item.os_status)
                    }}
                  >
                    {item.os_status}
                  </span>
                </td>
                <td>{item.os_obs_pcm || '-'}</td>
              </tr>
            ))}
            {!items.length && !loading && (
              <tr>
                <td colSpan={11} style={{ padding: 16, color: '#94a3b8' }}>
                  Nenhuma OS encontrada.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      ) : (
        <div
          style={{
            borderRadius: 16,
            border: '1px dashed #cbd5f5',
            background: '#ffffff',
            padding: 24,
            textAlign: 'center',
            color: '#64748b'
          }}
        >
          Selecione uma coordenacao para visualizar as OS.
        </div>
      )}

      {selectedIds.length > 0 && (
        <div
          style={{
            position: 'fixed',
            left: 'calc(50% + 130px)',
            bottom: 24,
            transform: 'translateX(-50%)',
            width: 'min(1270px, calc(100% - 32px))',
            minHeight: 'clamp(72px, 12vh, 120px)',
            borderRadius: 16,
            background: '#0f172a',
            color: '#e2e8f0',
            padding: '12px 16px',
            boxShadow: '0 18px 30px rgba(15, 23, 42, 0.25)',
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            zIndex: 50,
            overflowX: 'auto'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: '0 0 auto' }}>
            <input type="checkbox" checked readOnly />
            <strong>{selectedIds.length} selecionados</strong>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: '0 0 auto' }}>
            <span style={{ fontSize: 12, color: '#94a3b8' }}>Alterar status</span>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'nowrap' }}>
              {statusOptions.map(status => {
                const color =
                  status === 'CRIADO'
                    ? '#2563eb'
                    : status === 'PROGRAMADO'
                      ? '#f59e0b'
                      : status === 'REALIZADO'
                        ? '#16a34a'
                        : '#dc2626'
                return (
                  <button
                    key={status}
                    type="button"
                    onClick={() => setBulkStatus(status)}
                    style={{
                      padding: '6px 12px',
                      borderRadius: 8,
                      border: bulkStatus === status ? `2px solid ${color}` : 'none',
                      background: color,
                      color: '#ffffff',
                      fontWeight: 600,
                      cursor: 'pointer',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {status}
                  </button>
                )
              })}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: '0 0 auto' }}>
            <span style={{ fontSize: 12, color: '#94a3b8' }}>Alterar tipo</span>
            <select
              value={bulkTipo}
              onChange={event => setBulkTipo(event.target.value)}
              style={{
                padding: '8px 10px',
                borderRadius: 8,
                border: '1px solid #334155',
                background: '#0f172a',
                color: '#e2e8f0',
                minWidth: 140
              }}
            >
              <option value="">Selecione...</option>
              {tipoOptions.map(option => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginLeft: 'auto' }}>
            <button
              type="button"
              onClick={applyBulkUpdate}
              style={{
                padding: '8px 16px',
                borderRadius: 8,
                border: 'none',
                background: '#2563eb',
                color: '#ffffff',
                fontWeight: 700,
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}
            >
              Aplicar
            </button>
            <button
              type="button"
              onClick={clearBulkSelection}
              style={{
                border: 'none',
                background: 'transparent',
                color: '#e2e8f0',
                cursor: 'pointer',
                fontWeight: 600,
                whiteSpace: 'nowrap'
              }}
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '10px 4px'
        }}
      >
        <div style={{ fontSize: 12, color: '#64748b' }}>
          Mostrando {sortedItems.length ? (page - 1) * pageSize + 1 : 0}-
          {Math.min(page * pageSize, sortedItems.length)} de {sortedItems.length}
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <label style={{ fontSize: 12, color: '#64748b' }}>Page size</label>
          <select
            value={pageSize}
            onChange={event => {
              const next = Number(event.target.value)
              setPageSize(next)
              try {
                localStorage.setItem('tecrail:os:page-size', String(next))
              } catch {
                // ignore storage failures
              }
              setPage(1)
            }}
            style={{
              padding: '6px 8px',
              borderRadius: 8,
              border: '1px solid #e2e8f0'
            }}
          >
            <option value={50}>50</option>
            <option value={100}>100</option>
            <option value={200}>200</option>
          </select>
          <button
            type="button"
            onClick={() => setPage(1)}
            disabled={page === 1}
            style={{
              padding: '6px 10px',
              borderRadius: 8,
              border: '1px solid #e2e8f0',
              background: '#ffffff',
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
              padding: '6px 10px',
              borderRadius: 8,
              border: '1px solid #e2e8f0',
              background: '#ffffff',
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
              padding: '6px 10px',
              borderRadius: 8,
              border: '1px solid #e2e8f0',
              background: '#ffffff',
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
              padding: '6px 10px',
              borderRadius: 8,
              border: '1px solid #e2e8f0',
              background: '#ffffff',
              cursor: page === totalPages ? 'not-allowed' : 'pointer'
            }}
          >
            {'>>'}
          </button>
        </div>
      </div>

      <OrdensServicoCreateModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        estruturas={estruturas}
        ativos={ativos}
        setAtivos={setAtivos}
        createForm={createForm}
        setCreateForm={setCreateForm}
        selectedAtivos={selectedAtivos}
        setSelectedAtivos={setSelectedAtivos}
        onCreated={() => setFilters({ ...filters })}
      />

      <Modal
        title="Detalhe da OS"
        isOpen={modalOpen}
        onClose={handleCloseModal}
        fullScreen
        footer={
          <>
            <button
              type="button"
              onClick={handleCloseModal}
              style={{
                padding: '10px 16px',
                borderRadius: 10,
                border: '1px solid #e2e8f0',
                background: '#ffffff',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Fechar
            </button>
            {canDeleteOs && detail && (
              <button
                type="button"
                onClick={() => handleCancelOs(detail.id)}
                style={{
                  padding: '10px 16px',
                  borderRadius: 10,
                  border: '1px solid #fecaca',
                  background: '#fee2e2',
                  color: '#b91c1c',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                Excluir OS
              </button>
            )}
            {allowEdit && (
              <button
                type="button"
                onClick={handleUpdate}
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
            )}
          </>
        }
      >
        <Tabs
          tabs={[
            { id: 'os', label: 'OS' },
            { id: 'historico', label: 'Histórico' },
            { id: 'materiais', label: 'Materiais' },
            { id: 'checklist', label: 'Checklist' },
            { id: 'apontamentos', label: 'Apontamentos' }
          ]}
          activeId={activeTab}
          onChange={setActiveTab}
        />
        {activeTab === 'os' && detail && (
          <div style={{ display: 'grid', gap: 12 }}>
            <div style={{ fontWeight: 600 }}>
              OS #{detail.os_numero} - {detail.ATIVO_CODPE}
            </div>
            <div style={{ color: '#64748b' }}>{detail.ATIVO_DESCRITIVO_OS}</div>
            <div style={{ fontWeight: 700, color: '#0f172a' }}>Dados</div>
            <div
              style={{
                display: 'flex',
                gap: 12,
                flexWrap: 'nowrap',
                overflowX: 'auto',
                paddingBottom: 4,
                alignItems: 'flex-end'
              }}
            >
              <div style={{ display: 'grid', gap: 6 }}>
                <label style={fieldLabelStyle}>Ano/Mês</label>
                <input
                  type="month"
                  value={`${detail.os_ano}-${String(detail.os_mes).padStart(2, '0')}`}
                  disabled={!allowEdit}
                  onChange={event =>
                    setDetail(prev => {
                      if (!prev) return prev
                      const [anoValue, mesValue] = event.target.value.split('-')
                      return {
                        ...prev,
                        os_ano: Number(anoValue),
                        os_mes: Number(mesValue)
                      }
                    })
                  }
                  style={{ padding: '10px 12px', borderRadius: 10, border: '1px solid #e2e8f0' }}
                />
              </div>
              <div style={{ display: 'grid', gap: 6 }}>
                <label style={fieldLabelStyle}>Coordenação</label>
                <input
                  value={detail.estrutura_coordenacao}
                  disabled
                  style={{ padding: '10px 12px', borderRadius: 10, border: '1px solid #e2e8f0' }}
                />
              </div>
            
              <div style={{ display: 'grid', gap: 6 }}>
                <label style={fieldLabelStyle}>Equipe</label>
                <input
                  value={detail.estrutura_equipe}
                  disabled
                  style={{ padding: '10px 12px', borderRadius: 10, border: '1px solid #e2e8f0' }}
                />
              </div>
              <div style={{ display: 'grid', gap: 6 }}>
                <label style={fieldLabelStyle}>Ativo (CODPE)</label>
                <input
                  value={detail.ATIVO_CODPE}
                  disabled
                  style={{ padding: '10px 12px', borderRadius: 10, border: '1px solid #e2e8f0' }}
                />
              </div>
              <div style={{ display: 'grid', gap: 6 }}>
                <label style={fieldLabelStyle}>Ativo (Descritivo)</label>
                <input
                  value={detail.ATIVO_DESCRITIVO_OS}
                  disabled
                  style={{ padding: '10px 12px', borderRadius: 10, border: '1px solid #e2e8f0' }}
                />
              </div>
            </div>
            <div style={{ fontWeight: 700, color: '#0f172a' }}>Parâmetros</div>
            <div
              style={{
                display: 'flex',
                gap: 12,
                flexWrap: 'nowrap',
                overflowX: 'auto',
                paddingBottom: 4,
                alignItems: 'flex-end'
              }}
            >
              <div style={{ display: 'grid', gap: 6 }}>
                <label style={fieldLabelStyle}>Tipo</label>
                <select
                  value={detail.os_tipo}
                  disabled={!allowEdit}
                  onChange={event =>
                    setDetail(prev =>
                      prev ? { ...prev, os_tipo: event.target.value } : prev
                    )
                  }
                  style={{ padding: '10px 12px', borderRadius: 10, border: '1px solid #e2e8f0' }}
                >
                  {tipoOptions.map(option => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>
              <div style={{ display: 'grid', gap: 6 }}>
                <label style={fieldLabelStyle}>PDM</label>
                <select
                  value={String(detail.os_pdm)}
                  disabled={!allowEdit}
                  onChange={event =>
                    setDetail(prev =>
                      prev
                        ? { ...prev, os_pdm: Number(event.target.value) }
                        : prev
                    )
                  }
                  style={{ padding: '10px 12px', borderRadius: 10, border: '1px solid #e2e8f0' }}
                >
                  <option value="1">Sim</option>
                  <option value="0">Nao</option>
                </select>
              </div>
              <div style={{ display: 'grid', gap: 6 }}>
                <label style={fieldLabelStyle}>Checklist</label>
                <select
                  value={String(detail.os_checklist)}
                  disabled={!allowEdit}
                  onChange={event =>
                    setDetail(prev =>
                      prev
                        ? { ...prev, os_checklist: Number(event.target.value) }
                        : prev
                    )
                  }
                  style={{ padding: '10px 12px', borderRadius: 10, border: '1px solid #e2e8f0' }}
                >
                  <option value="1">Sim</option>
                  <option value="0">Nao</option>
                </select>
              </div>
              <div style={{ display: 'grid', gap: 6 }}>
                <label style={fieldLabelStyle}>Capex</label>
                <select
                  value={String(detail.os_capex)}
                  disabled={!allowEdit}
                  onChange={event =>
                    setDetail(prev =>
                      prev
                        ? { ...prev, os_capex: Number(event.target.value) }
                        : prev
                    )
                  }
                  style={{ padding: '10px 12px', borderRadius: 10, border: '1px solid #e2e8f0' }}
                >
                  <option value="1">Sim</option>
                  <option value="0">Nao</option>
                </select>
              </div>
            </div>

            <div style={{ fontWeight: 700, color: '#0f172a' }}>Programação</div>
            <div
              style={{
                display: 'flex',
                gap: 12,
                flexWrap: 'nowrap',
                overflowX: 'auto',
                paddingBottom: 4
              }}
            >
              <div style={{ display: 'grid', gap: 6, minWidth: 140 }}>
                <label style={fieldLabelStyle}>Data 1o prog</label>
                <input
                  type="date"
                  value={detail.os_programado1 || ''}
                  disabled={!allowEdit || Boolean(isProgramado1Locked)}
                  onChange={event =>
                    setDetail(prev =>
                      prev ? { ...prev, os_programado1: event.target.value } : prev
                    )
                  }
                  style={{ padding: '10px 12px', borderRadius: 10, border: '1px solid #e2e8f0' }}
                />
              </div>
              <div style={{ display: 'grid', gap: 6, minWidth: 140 }}>
                <label style={fieldLabelStyle}>Data 2o prog</label>
                <input
                  type="date"
                  value={detail.os_programado2 || ''}
                  disabled={!allowEdit}
                  onChange={event =>
                    setDetail(prev =>
                      prev ? { ...prev, os_programado2: event.target.value } : prev
                    )
                  }
                  style={{ padding: '10px 12px', borderRadius: 10, border: '1px solid #e2e8f0' }}
                />
              </div>
              <div style={{ display: 'grid', gap: 6, minWidth: 140 }}>
                <label style={fieldLabelStyle}>Data 3o prog</label>
                <input
                  type="date"
                  value={detail.os_programado3 || ''}
                  disabled={!allowEdit}
                  onChange={event =>
                    setDetail(prev =>
                      prev ? { ...prev, os_programado3: event.target.value } : prev
                    )
                  }
                  style={{ padding: '10px 12px', borderRadius: 10, border: '1px solid #e2e8f0' }}
                />
              </div>
              <div style={{ display: 'grid', gap: 6, minWidth: 140 }}>
                <label style={fieldLabelStyle}>Data 4o prog</label>
                <input
                  type="date"
                  value={detail.os_programado4 || ''}
                  disabled={!allowEdit}
                  onChange={event =>
                    setDetail(prev =>
                      prev ? { ...prev, os_programado4: event.target.value } : prev
                    )
                  }
                  style={{ padding: '10px 12px', borderRadius: 10, border: '1px solid #e2e8f0' }}
                />
              </div>
              <div style={{ display: 'grid', gap: 6, minWidth: 140 }}>
                <label style={fieldLabelStyle}>Data 5o prog</label>
                <input
                  type="date"
                  value={detail.os_programado5 || ''}
                  disabled={!allowEdit}
                  onChange={event =>
                    setDetail(prev =>
                      prev ? { ...prev, os_programado5: event.target.value } : prev
                    )
                  }
                  style={{ padding: '10px 12px', borderRadius: 10, border: '1px solid #e2e8f0' }}
                />
              </div>
            </div>

            <div style={{ fontWeight: 700, color: '#0f172a' }}>Status</div>
            <div
              style={{
                display: 'flex',
                gap: 12,
                flexWrap: 'nowrap',
                overflowX: 'auto',
                paddingBottom: 4
              }}
            >
              <div style={{ display: 'grid', gap: 6 }}>
                <label style={fieldLabelStyle}>Data Realizado</label>
                <input
                  type="date"
                  value={detail.os_realizado_em || ''}
                  disabled={!allowEdit}
                  onChange={event =>
                    setDetail(prev =>
                      prev ? { ...prev, os_realizado_em: event.target.value } : prev
                    )
                  }
                  style={{ padding: '10px 12px', borderRadius: 10, border: '1px solid #e2e8f0', width: 140 }}
                />
              </div>
              <div style={{ display: 'grid', gap: 6 }}>
                <label style={fieldLabelStyle}>Status</label>
                <select
                  value={detail.os_status}
                  disabled={!allowEdit}
                  onChange={event =>
                    setDetail(prev =>
                      prev ? { ...prev, os_status: event.target.value } : prev
                    )
                  }
                  style={{
                    padding: '10px 12px',
                    borderRadius: 10,
                    border: '1px solid #e2e8f0',
                    fontWeight: 700,
                    ...getStatusStyles(detail.os_status),
                    width: 160
                  }}
                >
                  {statusOptions.map(option => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div style={{ fontWeight: 700, color: '#0f172a' }}>Observações</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
              <div style={{ display: 'grid', gap: 6 }}>
                <label style={fieldLabelStyle}>Observação Técnico</label>
                <input
                  value={detail.os_obs_tecnico || ''}
                  disabled={!allowEdit}
                  onChange={event =>
                    setDetail(prev =>
                      prev ? { ...prev, os_obs_tecnico: event.target.value } : prev
                    )
                  }
                  style={{ padding: '10px 12px', borderRadius: 10, border: '1px solid #e2e8f0' }}
                />
              </div>
              <div style={{ display: 'grid', gap: 6 }}>
                <label style={fieldLabelStyle}>Observação PCM</label>
                <input
                  value={detail.os_obs_pcm || ''}
                  disabled={!allowEdit}
                  onChange={event =>
                    setDetail(prev =>
                      prev ? { ...prev, os_obs_pcm: event.target.value } : prev
                    )
                  }
                  style={{ padding: '10px 12px', borderRadius: 10, border: '1px solid #e2e8f0' }}
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'historico' && (
          <div style={{ display: 'grid', gap: 12 }}>
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
              (historyItems.length ? (
                <div
                  style={{
                    display: 'grid',
                    gap: 8,
                    maxHeight: 320,
                    overflowY: 'auto',
                    paddingRight: 4
                  }}
                >
                  {historyItems.map(item => (
                    <div
                      key={item.id}
                      style={{
                        padding: '10px 12px',
                        borderRadius: 10,
                        background: '#ffffff',
                        border: '1px solid #e2e8f0'
                      }}
                    >
                      <div style={{ fontWeight: 600 }}>
                        {item.action === 'criado' ? 'Criado' : 'Atualizado'}
                      </div>
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

        {activeTab !== 'os' && activeTab !== 'historico' && (
          <div style={{ color: '#94a3b8', fontSize: 13 }}>
            Conteudo em preparacao para esta aba.
          </div>
        )}
      </Modal>
    </section>
  )
}

