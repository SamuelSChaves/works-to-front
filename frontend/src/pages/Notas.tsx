import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Modal } from '../components/Modal'
import { Tabs } from '../components/Tabs'
import { toast } from 'sonner'
import { API_URL } from '../services/api'
import {
  fetchPermissions,
  getStoredPermissions,
  getStoredToken,
  logout,
  setPostLoginRedirect
} from '../services/auth'

type NotaStatus =
  | 'Criado'
  | 'Novo'
  | 'Programado'
  | 'Ag. Material'
  | 'Ag'
  | 'Plano'
  | 'Cancelado'

type NotaListItem = {
  IDNOTA: number
  company_id: string
  id_ativo: string
  id_os: string | null
  nota_pendencia: string
  nota_status: NotaStatus
  nota_data_criada: string
  nota_data_programada: string | null
  nota_data_realizada: string | null
  nota_observacao_pcm: string | null
  nota_observacao_tecnico: string | null
  ATIVO_CODPE: string
  ATIVO_DESCRITIVO_OS: string
}

type Filters = {
  search: string
  status: string
}

type NotaFormState = {
  nota_pendencia: string
  nota_status: NotaStatus | ''
  id_os: string
  nota_data_programada: string
  nota_data_realizada: string
  nota_observacao_pcm: string
  nota_observacao_tecnico: string
}

type EditFormState = NotaFormState & {
  IDATIVO: string
}

type ChangeEntry = {
  id: number
  usuario_id: string
  data_hora: string
  campos_alterados: string
}

type AtivoOption = {
  id: string
  ATIVO_CODPE: string
  ATIVO_DESCRITIVO_OS: string
}

type DetailTabId = 'cadastro' | 'historico-alteracao'

const NOTA_STATUSES: NotaStatus[] = [
  'Criado',
  'Novo',
  'Programado',
  'Ag. Material',
  'Ag',
  'Plano',
  'Cancelado'
]

const fieldLabelStyle = {
  fontSize: 12,
  fontWeight: 600,
  color: '#475569'
}

const initialFilters: Filters = {
  search: '',
  status: ''
}

const initialFormState: NotaFormState = {
  nota_pendencia: '',
  nota_status: '',
  id_os: '',
  nota_data_programada: '',
  nota_data_realizada: '',
  nota_observacao_pcm: '',
  nota_observacao_tecnico: ''
}

const initialEditFormState: EditFormState = {
  ...initialFormState,
  IDATIVO: ''
}

function toText(value: unknown) {
  if (value === null || value === undefined) return ''
  return String(value)
}

function formatDate(value?: string) {
  if (!value) return '-'
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return value
  return parsed.toLocaleDateString('pt-BR')
}

function formatDateTime(value?: string) {
  if (!value) return '-'
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return value
  return parsed.toLocaleString('pt-BR')
}

function normalizeNota(raw: Record<string, unknown>): NotaListItem {
  const status = String(raw.nota_status ?? '').trim()
  return {
    IDNOTA: Number(raw.IDNOTA ?? raw.id ?? 0),
    company_id: toText(raw.company_id),
    id_ativo: toText(raw.id_ativo),
    id_os: toText(raw.id_os) || null,
    nota_pendencia: toText(raw.nota_pendencia),
    nota_status: NOTA_STATUSES.includes(status as NotaStatus)
      ? (status as NotaStatus)
      : 'Criado',
    nota_data_criada: toText(raw.nota_data_criada),
    nota_data_programada: toText(raw.nota_data_programada) || null,
    nota_data_realizada: toText(raw.nota_data_realizada) || null,
    nota_observacao_pcm: toText(raw.nota_observacao_pcm) || null,
    nota_observacao_tecnico: toText(raw.nota_observacao_tecnico) || null,
    ATIVO_CODPE: toText(raw.ATIVO_CODPE),
    ATIVO_DESCRITIVO_OS: toText(raw.ATIVO_DESCRITIVO_OS)
  }
}

async function getApiErrorMessage(response: Response, fallback: string) {
  if (response.status === 403) {
    return 'Voce nao tem permissao para executar esta operacao.'
  }
  const message = await response.text()
  return message || fallback
}

export function Notas() {
  const navigate = useNavigate()
  const [notes, setNotes] = useState<NotaListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState<Filters>(initialFilters)
  const [sortKey, setSortKey] = useState<'IDNOTA' | 'nota_data_criada'>('nota_data_criada')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(() => {
    try {
      const stored = Number(localStorage.getItem('tecrail:notas:page-size') ?? '')
      return stored && stored > 0 ? stored : 50
    } catch {
      return 50
    }
  })
  const [modalOpen, setModalOpen] = useState(false)
  const [formState, setFormState] = useState<NotaFormState>(initialFormState)
  const [formErrors, setFormErrors] = useState<string[]>([])
  const [selectedAtivos, setSelectedAtivos] = useState<AtivoOption[]>([])
  const [ativoSearch, setAtivoSearch] = useState('')
  const [ativosOptions, setAtivosOptions] = useState<AtivoOption[]>([])
  const [ativosLoading, setAtivosLoading] = useState(false)
  const [ativosError, setAtivosError] = useState<string | null>(null)
  const [showAtivoDropdown, setShowAtivoDropdown] = useState(false)
  const ativoDropdownRef = useRef<HTMLDivElement | null>(null)
  const [permissions, setPermissions] = useState(() => getStoredPermissions())
  const [detailModalOpen, setDetailModalOpen] = useState(false)
  const [detailNote, setDetailNote] = useState<NotaListItem | null>(null)
  const [detailTab, setDetailTab] = useState<DetailTabId>('cadastro')
  const [detailLoading, setDetailLoading] = useState(false)
  const [detailError, setDetailError] = useState<string | null>(null)
  const [changeHistory, setChangeHistory] = useState<ChangeEntry[]>([])
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState<EditFormState>(initialEditFormState)
  const [editErrors, setEditErrors] = useState<string[]>([])
  const [savingNote, setSavingNote] = useState(false)

  const canRead = permissions?.notas?.leitura === true
  const canCreate = permissions?.notas?.criacao === true
  const canEdit = permissions?.notas?.edicao === true

  const redirectToLogin = useCallback(() => {
    setPostLoginRedirect(window.location.pathname + window.location.search)
    logout()
    navigate('/')
  }, [navigate])

  const fetchWithAuth = useCallback(
    async (url: string, fallback: string, init?: RequestInit) => {
      const token = getStoredToken()
      if (!token) {
        throw new Error('Sessao expirada. Faça login novamente.')
      }
      const headers = new Headers(init?.headers)
      headers.set('Authorization', `Bearer ${token}`)
      const response = await fetch(url, {
        ...init,
        headers
      })
      if (response.status === 401) {
        redirectToLogin()
        throw new Error('Sessao expirada. Faça login novamente.')
      }
      if (!response.ok) {
        const message = await getApiErrorMessage(response, fallback)
        throw new Error(message)
      }
      return response
    },
    [redirectToLogin]
  )

  const initializeEditForm = useCallback((note: NotaListItem | null) => {
    if (!note) {
      setEditForm(initialEditFormState)
      return
    }
    setEditForm({
      ...initialEditFormState,
      IDATIVO: note.id_ativo,
      nota_pendencia: note.nota_pendencia,
      nota_status: note.nota_status,
      id_os: note.id_os || '',
      nota_data_programada: note.nota_data_programada || '',
      nota_data_realizada: note.nota_data_realizada || '',
      nota_observacao_pcm: note.nota_observacao_pcm || '',
      nota_observacao_tecnico: note.nota_observacao_tecnico || ''
    })
  }, [])

  const handleDetailTabChange = (tabId: string) => {
    setDetailTab(tabId as DetailTabId)
  }

  const resetFilters = () => {
    setFilters(initialFilters)
    setPage(1)
  }

  const updateFilters = (changes: Partial<Filters>) => {
    setFilters(prev => ({ ...prev, ...changes }))
    setPage(1)
  }

  useEffect(() => {
    const token = getStoredToken()
    if (!token) return
    fetchPermissions()
      .then(setPermissions)
      .catch(() => setPermissions(getStoredPermissions()))
  }, [])

  useEffect(() => {
    let isMounted = true
    if (!canRead) {
      setLoading(false)
      setNotes([])
      setError('Voce nao tem permissao para visualizar as notas.')
      return () => {
        isMounted = false
      }
    }

    const loadNotas = async () => {
      setLoading(true)
      setError(null)
      try {
        const params = new URLSearchParams()
        if (filters.search.trim()) {
          params.set('search', filters.search.trim())
        }
        if (filters.status) {
          params.set('status', filters.status)
        }
        const url = `${API_URL}/notas${params.toString() ? `?${params.toString()}` : ''}`
        const response = await fetchWithAuth(url, 'Erro ao carregar notas.')
        if (!isMounted) return
        const data = await response.json()
        const list = Array.isArray(data.notas) ? data.notas : []
        if (!isMounted) return
        setNotes(list.map((item: Record<string, unknown>) => normalizeNota(item)))
      } catch (err) {
        if (!isMounted) return
        const message = err instanceof Error ? err.message : 'Erro ao carregar notas.'
        setError(message)
        setNotes([])
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    loadNotas()
    return () => {
      isMounted = false
    }
  }, [canRead, filters, fetchWithAuth])

  useEffect(() => {
    let isMounted = true
    const loadAtivos = async () => {
      setAtivosLoading(true)
      setAtivosError(null)
      try {
        const response = await fetchWithAuth(
          `${API_URL}/ativos`,
          'Erro ao carregar ativos disponiveis.'
        )
        if (!isMounted) return
        const data = await response.json()
        const list = Array.isArray(data.ativos)
          ? data.ativos
          : Array.isArray(data)
            ? data
            : []
        if (!isMounted) return
        setAtivosOptions(
          list
            .map((item: Record<string, unknown>) => ({
              id: toText(item.id),
              ATIVO_CODPE: toText(item.ATIVO_CODPE),
              ATIVO_DESCRITIVO_OS: toText(item.ATIVO_DESCRITIVO_OS)
            }))
            .filter((option: AtivoOption) => Boolean(option.id && option.ATIVO_CODPE))
        )
      } catch (err) {
        if (!isMounted) return
        const message =
          err instanceof Error
            ? err.message
            : 'Erro ao carregar ativos disponiveis.'
        setAtivosError(message)
      } finally {
        if (isMounted) {
          setAtivosLoading(false)
        }
      }
    }

    loadAtivos()
    return () => {
      isMounted = false
    }
  }, [fetchWithAuth])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        ativoDropdownRef.current &&
        !ativoDropdownRef.current.contains(event.target as Node)
      ) {
        setShowAtivoDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const handleAtivoSearchChange = (value: string) => {
    setAtivoSearch(value)
    setShowAtivoDropdown(true)
  }

  const handleSelectAtivo = (ativo: AtivoOption) => {
    setSelectedAtivos(prev => {
      if (prev.some(item => item.id === ativo.id)) return prev
      return [...prev, ativo]
    })
    setAtivoSearch('')
    setShowAtivoDropdown(false)
  }

  const removeSelectedAtivo = (id: string) => {
    setSelectedAtivos(prev => prev.filter(item => item.id !== id))
  }

  const ativoSuggestions = useMemo(() => {
    const term = ativoSearch.trim().toLowerCase()
    const matches = ativosOptions.filter(option => {
      if (selectedAtivos.some(item => item.id === option.id)) {
        return false
      }
      if (!term) return true
      return (
        option.ATIVO_CODPE.toLowerCase().includes(term) ||
        option.ATIVO_DESCRITIVO_OS.toLowerCase().includes(term)
      )
    })
    return matches.slice(0, 8)
  }, [ativoSearch, ativosOptions, selectedAtivos])

  const handleOpenNewNota = () => {
    if (!canCreate) return
    setFormState(initialFormState)
    setSelectedAtivos([])
    setFormErrors([])
    setModalOpen(true)
  }

  const handleCloseNewNota = () => {
    setModalOpen(false)
    setFormErrors([])
    setSelectedAtivos([])
    setAtivoSearch('')
  }

  const handleFormChange = (field: keyof NotaFormState, value: string) => {
    setFormState(prev => ({ ...prev, [field]: value }))
  }

  const handleCreateNota = async () => {
    const errors: string[] = []
    if (!selectedAtivos.length) {
      errors.push('Selecione ao menos um ativo.')
    }
    if (!formState.nota_pendencia.trim()) {
      errors.push('Informe a pendencia ou descricao.')
    }
    if (!formState.nota_status) {
      errors.push('Selecione um status para a nota.')
    }
    setFormErrors(errors)
    if (errors.length) return

    if (!canCreate) {
      setFormErrors(['Voce nao tem permissao para criar notas.'])
      return
    }

    try {
      const response = await fetchWithAuth(
        `${API_URL}/notas`,
        'Erro ao criar nota.',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ativos: selectedAtivos.map(ativo => ativo.id),
            nota_pendencia: formState.nota_pendencia,
            nota_status: formState.nota_status,
            nota_data_programada: formState.nota_data_programada || null,
            nota_data_realizada: formState.nota_data_realizada || null,
            nota_observacao_pcm: formState.nota_observacao_pcm || null,
            nota_observacao_tecnico: formState.nota_observacao_tecnico || null,
            id_os: formState.id_os || null
          })
        }
      )
      const data = await response.json()
      const createdList = Array.isArray(data.notas) ? data.notas : []
      if (!createdList.length) {
        throw new Error('Resposta invalida do servidor.')
      }
      const normalized = createdList.map((item: Record<string, unknown>) =>
        normalizeNota(item)
      )
      setNotes(prev => [...normalized, ...prev])
      toast.success('Nota criada com sucesso.')
      handleCloseNewNota()
      setFormState(initialFormState)
      setPage(1)
      setError(null)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao criar nota.'
      setFormErrors([message])
      setError(message)
    }
  }

  const loadNoteDetail = useCallback(
    async (noteId: number) => {
      setDetailLoading(true)
      setDetailError(null)
      setChangeHistory([])
      try {
        const detailResponse = await fetchWithAuth(
          `${API_URL}/notas/detail?id=${noteId}`,
          'Erro ao carregar os detalhes da nota.'
        )
        const detailData = await detailResponse.json()
        const detailItem = normalizeNota(detailData.nota ?? detailData)
        setDetailNote(detailItem)
        initializeEditForm(detailItem)

        const historyResponse = await fetchWithAuth(
          `${API_URL}/notas/historico/alteracao?nota_id=${noteId}`,
          'Erro ao carregar o histórico de alteração.'
        )
        const historyData = await historyResponse.json()
        setChangeHistory(
          Array.isArray(historyData.history) ? historyData.history : []
        )
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Erro ao carregar os detalhes.'
        setDetailError(message)
      } finally {
        setDetailLoading(false)
      }
    },
    [fetchWithAuth, initializeEditForm]
  )

  const openNoteDetail = (note: NotaListItem) => {
    setDetailModalOpen(true)
    setDetailTab('cadastro')
    setDetailNote(note)
    initializeEditForm(note)
    loadNoteDetail(note.IDNOTA)
  }

  const closeDetailModal = () => {
    setDetailModalOpen(false)
    setDetailNote(null)
    setChangeHistory([])
    setDetailError(null)
    setIsEditing(false)
    setEditErrors([])
  }

  const handleEditStart = () => {
    setIsEditing(true)
    setEditErrors([])
  }

  const handleEditCancel = () => {
    if (detailNote) {
      initializeEditForm(detailNote)
    }
    setIsEditing(false)
    setEditErrors([])
  }

  const handleEditFormChange = (field: keyof EditFormState, value: string) => {
    setEditForm(prev => ({ ...prev, [field]: value }))
  }

  const handleSaveNote = async () => {
    if (!detailNote) return
    const errors: string[] = []
    if (!editForm.nota_pendencia.trim()) {
      errors.push('Informe a pendencia ou descricao.')
    }
    if (!editForm.nota_status) {
      errors.push('Selecione um status para a nota.')
    }
    setEditErrors(errors)
    if (errors.length) {
      return
    }
    setSavingNote(true)
    try {
      const response = await fetchWithAuth(
        `${API_URL}/notas`,
        'Erro ao salvar a nota.',
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            IDNOTA: detailNote.IDNOTA,
            ...editForm
          })
        }
      )
      const data = await response.json()
      const updated = normalizeNota(
        data.nota ??
          (Array.isArray(data.notas) ? data.notas[0] : null) ??
          data
      )
      setDetailNote(updated)
      setNotes(prev =>
        prev.map(note => (note.IDNOTA === updated.IDNOTA ? updated : note))
      )
      toast.success('Nota atualizada com sucesso.')
      setIsEditing(false)
      setEditErrors([])
      await loadNoteDetail(updated.IDNOTA)
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Erro ao salvar a nota.'
      setEditErrors([message])
    } finally {
      setSavingNote(false)
    }
  }

  const filteredNotes = useMemo(() => {
    const term = filters.search.trim().toLowerCase()
    return notes.filter(note => {
      const matchesSearch =
        !term ||
        note.nota_pendencia.toLowerCase().includes(term) ||
        note.ATIVO_CODPE.toLowerCase().includes(term) ||
        note.ATIVO_DESCRITIVO_OS.toLowerCase().includes(term) ||
        note.id_ativo.toLowerCase().includes(term)
      const matchesStatus =
        !filters.status || note.nota_status === filters.status
      return matchesSearch && matchesStatus
    })
  }, [filters, notes])

  const sortedNotes = useMemo(() => {
    const list = [...filteredNotes]
    list.sort((a, b) => {
      const dir = sortDir === 'asc' ? 1 : -1
      if (sortKey === 'IDNOTA') {
        return (a.IDNOTA - b.IDNOTA) * dir
      }
      const valueA = a.nota_data_criada
      const valueB = b.nota_data_criada
      if (!valueA && !valueB) return 0
      if (!valueA) return 1 * dir
      if (!valueB) return -1 * dir
      return valueA.localeCompare(valueB) * dir
    })
    return list
  }, [filteredNotes, sortDir, sortKey])

  const totalPages = Math.max(1, Math.ceil(sortedNotes.length / pageSize))

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages)
    }
    if (page < 1) {
      setPage(1)
    }
  }, [page, totalPages])

  const pagedNotes = useMemo(() => {
    const start = (page - 1) * pageSize
    return sortedNotes.slice(start, start + pageSize)
  }, [page, pageSize, sortedNotes])

  const handlePageSizeChange = (value: number) => {
    setPageSize(value)
    try {
      localStorage.setItem('tecrail:notas:page-size', String(value))
    } catch {
      // ignore
    }
    setPage(1)
  }

  const handleSortChange = (key: 'IDNOTA' | 'nota_data_criada') => {
    if (sortKey === key) {
      setSortDir(prev => (prev === 'asc' ? 'desc' : 'asc'))
      return
    }
    setSortKey(key)
    setSortDir('desc')
  }

  if (!canRead) {
    return (
      <section style={{ padding: 24 }}>
        <div style={{ color: '#b91c1c', fontWeight: 600 }}>
          Voce nao tem permissao para acessar esta tela.
        </div>
      </section>
    )
  }

  return (
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
              d="M4 6h16M4 12h16M4 18h16"
              fill="none"
              stroke="#2563eb"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
          <h2 style={{ margin: 0, fontSize: 24 }}>Notas</h2>
        </div>
        <p style={{ margin: 0, color: '#64748b' }}>
          Registro de pendencias e observacoes por ativo.
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
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 320px', position: 'relative' }}>
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
              placeholder="Buscar por ativo, CODPE ou pendencia..."
              value={filters.search}
              onChange={event =>
                updateFilters({ search: event.target.value })
              }
              style={{
                padding: '10px 12px 10px 34px',
                borderRadius: 10,
                border: '1px solid #e2e8f0',
                width: '100%'
              }}
            />
          </div>
          <select
            value={filters.status}
            onChange={event => updateFilters({ status: event.target.value })}
            style={{
              padding: '10px 12px',
              borderRadius: 10,
              border: '1px solid #e2e8f0'
            }}
          >
            <option value="">Todos os status</option>
            {NOTA_STATUSES.map(status => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
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
            <strong style={{ color: '#1e293b' }}>{filteredNotes.length}</strong>{' '}
            notas filtradas
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            {canCreate && (
              <button
                type="button"
                onClick={handleOpenNewNota}
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
                Nova nota
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

      {loading && (
        <div style={{ color: '#64748b', fontSize: 13 }}>
          Carregando notas...
        </div>
      )}
      {!loading && notes.length === 0 && error && (
        <div style={{ color: '#f87171', fontSize: 13 }}>{error}</div>
      )}

      <div
        style={{
          borderRadius: 16,
          border: '1px solid #e2e8f0',
          background: '#ffffff',
          overflow: 'hidden'
        }}
      >
        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse'
          }}
        >
          <thead style={{ background: '#ffffff' }}>
            <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
              <th
                style={{ padding: 12, cursor: 'pointer', textAlign: 'left' }}
                onClick={() => handleSortChange('IDNOTA')}
              >
                ID {sortKey === 'IDNOTA' ? (sortDir === 'asc' ? '↑' : '↓') : ''}
              </th>
              <th style={{ textAlign: 'left' }}>Empresa</th>
              <th style={{ textAlign: 'left' }}>Ativo</th>
              <th style={{ textAlign: 'left' }}>Status</th>
              <th style={{ textAlign: 'left' }}>Pendencia</th>
              <th
                style={{ cursor: 'pointer', textAlign: 'left' }}
                onClick={() => handleSortChange('nota_data_criada')}
              >
                Criada{' '}
                {sortKey === 'nota_data_criada'
                  ? sortDir === 'asc'
                    ? '↑'
                    : '↓'
                  : ''}
              </th>
              <th style={{ textAlign: 'left' }}>Programada</th>
              <th style={{ textAlign: 'left' }}>Realizada</th>
              <th style={{ textAlign: 'left' }}>Observacao PCM</th>
              <th style={{ textAlign: 'left' }}>Observacao tecnico</th>
            </tr>
          </thead>
          <tbody>
            {pagedNotes.map(note => (
              <tr key={note.IDNOTA} style={{ borderTop: '1px solid #e2e8f0' }}>
                <td style={{ padding: 12 }}>
                  <button
                    type="button"
                    onClick={() => openNoteDetail(note)}
                    style={{
                      border: 'none',
                      background: 'transparent',
                      color: '#1d4ed8',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    {note.IDNOTA}
                  </button>
                </td>
                <td style={{ padding: 12 }}>{note.company_id || '-'}</td>
                <td style={{ padding: 12 }}>
                  <div>{note.ATIVO_CODPE || note.id_ativo}</div>
                  <div style={{ fontSize: 12, color: '#64748b' }}>
                    {note.ATIVO_DESCRITIVO_OS || '-'}
                  </div>
                </td>
                <td style={{ padding: 12 }}>
                  <span
                    style={{
                      padding: '4px 10px',
                      borderRadius: 999,
                      background: '#e0e7ff',
                      color: '#3730a3',
                      fontSize: 12,
                      fontWeight: 600
                    }}
                  >
                    {note.nota_status}
                  </span>
                </td>
                <td style={{ padding: 12 }}>{note.nota_pendencia}</td>
                <td style={{ padding: 12 }}>
                  {formatDate(note.nota_data_criada)}
                </td>
                <td style={{ padding: 12 }}>
                  {formatDate(note.nota_data_programada ?? undefined)}
                </td>
                <td style={{ padding: 12 }}>
                  {formatDate(note.nota_data_realizada ?? undefined)}
                </td>
                <td style={{ padding: 12 }}>
                  {note.nota_observacao_pcm || '-'}
                </td>
                <td style={{ padding: 12 }}>
                  {note.nota_observacao_tecnico || '-'}
                </td>
              </tr>
            ))}
            {pagedNotes.length === 0 && !loading && (
              <tr>
                <td
                  colSpan={10}
                  style={{ padding: 16, color: '#94a3b8', textAlign: 'left' }}
                >
                  Nenhuma nota encontrada.
                </td>
              </tr>
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
          Mostrando{' '}
          {pagedNotes.length ? (page - 1) * pageSize + 1 : 0}-
          {Math.min(page * pageSize, sortedNotes.length)} de {sortedNotes.length}
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <label style={{ fontSize: 12, color: '#64748b' }}>Page size</label>
          <select
            value={pageSize}
            onChange={event => handlePageSizeChange(Number(event.target.value))}
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

      <Modal
        title="Nova nota"
        isOpen={modalOpen}
        onClose={handleCloseNewNota}
        footer={
          <>
            <button
              type="button"
              onClick={handleCloseNewNota}
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
              onClick={handleCreateNota}
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
        <div style={{ display: 'grid', gap: 12 }}>
          {formErrors.length > 0 && (
            <div style={{ color: '#f87171', fontSize: 12 }}>
              {formErrors.map(error => (
                <div key={error}>{error}</div>
              ))}
            </div>
          )}
          <div style={{ display: 'grid', gap: 6 }}>
            <label style={fieldLabelStyle}>Ativos *</label>
            <div ref={ativoDropdownRef} style={{ position: 'relative' }}>
              <input
                placeholder="Buscar por CODPE ou descritivo..."
                value={ativoSearch}
                onChange={event => handleAtivoSearchChange(event.target.value)}
                onFocus={() => setShowAtivoDropdown(true)}
                style={{
                  padding: '10px 12px',
                  borderRadius: 10,
                  border: '1px solid #e2e8f0',
                  width: '100%'
                }}
              />
              {showAtivoDropdown && (
                <div
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 4px)',
                    left: 0,
                    right: 0,
                    borderRadius: 10,
                    border: '1px solid #e2e8f0',
                    background: '#ffffff',
                    boxShadow: '0 10px 20px rgba(15, 23, 42, 0.08)',
                    zIndex: 20,
                    maxHeight: 220,
                    overflowY: 'auto'
                  }}
                >
                  {ativosLoading ? (
                    <div
                      style={{
                        padding: '10px 12px',
                        color: '#64748b',
                        fontSize: 12
                      }}
                    >
                      Carregando ativos...
                    </div>
                  ) : ativoSuggestions.length === 0 ? (
                    <div
                      style={{
                        padding: '10px 12px',
                        color: '#94a3b8',
                        fontSize: 12
                      }}
                    >
                      Nenhum ativo encontrado.
                    </div>
                  ) : (
                    ativoSuggestions.map(ativo => (
                      <button
                        key={`${ativo.id}-${ativo.ATIVO_CODPE}`}
                        type="button"
                        onMouseDown={event => {
                          event.preventDefault()
                          handleSelectAtivo(ativo)
                        }}
                        style={{
                          width: '100%',
                          border: 'none',
                          background: 'transparent',
                          padding: '10px 12px',
                          cursor: 'pointer',
                          textAlign: 'left'
                        }}
                      >
                        <div
                          style={{
                            fontWeight: 600,
                            color: '#1d4ed8'
                          }}
                        >
                          {ativo.ATIVO_CODPE}
                        </div>
                        <div
                          style={{
                            fontSize: 13,
                            color: '#475569'
                          }}
                        >
                          {ativo.ATIVO_DESCRITIVO_OS}
                        </div>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {selectedAtivos.map(ativo => (
                <div
                  key={ativo.id}
                  style={{
                    padding: '6px 10px',
                    borderRadius: 999,
                    background: '#e0f2fe',
                    color: '#0c4a6e',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6
                  }}
                >
                  <span>
                    {ativo.ATIVO_CODPE} - {ativo.ATIVO_DESCRITIVO_OS}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeSelectedAtivo(ativo.id)}
                    style={{
                      border: 'none',
                      background: 'transparent',
                      cursor: 'pointer',
                      color: '#0c4a6e'
                    }}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
            {ativosError && (
              <div style={{ color: '#f87171', fontSize: 12 }}>
                {ativosError}
              </div>
            )}
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: 12
            }}
          >
            <div style={{ display: 'grid', gap: 6 }}>
              <label style={fieldLabelStyle}>Pendencia *</label>
              <textarea
                value={formState.nota_pendencia}
                onChange={event =>
                  handleFormChange('nota_pendencia', event.target.value)
                }
                style={{
                  padding: '10px 12px',
                  borderRadius: 10,
                  border: '1px solid #e2e8f0',
                  minHeight: 80,
                  resize: 'vertical'
                }}
              />
            </div>
            <div style={{ display: 'grid', gap: 6 }}>
              <label style={fieldLabelStyle}>Status *</label>
              <select
                value={formState.nota_status}
                onChange={event =>
                  handleFormChange(
                    'nota_status',
                    event.target.value as NotaStatus
                  )
                }
                style={{
                  padding: '10px 12px',
                  borderRadius: 10,
                  border: '1px solid #e2e8f0'
                }}
              >
                <option value="">Selecione</option>
                {NOTA_STATUSES.map(status => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>
            <div style={{ display: 'grid', gap: 6 }}>
              <label style={fieldLabelStyle}>OS relacionada</label>
              <input
                value={formState.id_os}
                onChange={event => handleFormChange('id_os', event.target.value)}
                style={{
                  padding: '10px 12px',
                  borderRadius: 10,
                  border: '1px solid #e2e8f0'
                }}
              />
            </div>
            <div style={{ display: 'grid', gap: 6 }}>
              <label style={fieldLabelStyle}>Data programada</label>
              <input
                type="date"
                value={formState.nota_data_programada}
                onChange={event =>
                  handleFormChange('nota_data_programada', event.target.value)
                }
                style={{
                  padding: '10px 12px',
                  borderRadius: 10,
                  border: '1px solid #e2e8f0'
                }}
              />
            </div>
            <div style={{ display: 'grid', gap: 6 }}>
              <label style={fieldLabelStyle}>Data realizada</label>
              <input
                type="date"
                value={formState.nota_data_realizada}
                onChange={event =>
                  handleFormChange('nota_data_realizada', event.target.value)
                }
                style={{
                  padding: '10px 12px',
                  borderRadius: 10,
                  border: '1px solid #e2e8f0'
                }}
              />
            </div>
          </div>
          <div style={{ display: 'grid', gap: 6 }}>
            <label style={fieldLabelStyle}>Observacao PCM</label>
            <textarea
              value={formState.nota_observacao_pcm}
              onChange={event =>
                handleFormChange('nota_observacao_pcm', event.target.value)
              }
              style={{
                padding: '10px 12px',
                borderRadius: 10,
                border: '1px solid #e2e8f0',
                minHeight: 70,
                resize: 'vertical'
              }}
            />
          </div>
          <div style={{ display: 'grid', gap: 6 }}>
            <label style={fieldLabelStyle}>Observacao tecnico</label>
            <textarea
              value={formState.nota_observacao_tecnico}
              onChange={event =>
                handleFormChange('nota_observacao_tecnico', event.target.value)
              }
              style={{
                padding: '10px 12px',
                borderRadius: 10,
                border: '1px solid #e2e8f0',
                minHeight: 70,
                resize: 'vertical'
              }}
            />
          </div>
        </div>
      </Modal>
      <Modal
        title={detailNote ? `Nota #${detailNote.IDNOTA}` : 'Detalhe da nota'}
        isOpen={detailModalOpen}
        onClose={closeDetailModal}
        fullScreen
        footer={
          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: 10,
              flexWrap: 'wrap'
            }}
          >
            <button
              type="button"
              onClick={closeDetailModal}
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
            {canEdit && detailNote && !isEditing && (
              <button
                type="button"
                onClick={handleEditStart}
                style={{
                  padding: '10px 16px',
                  borderRadius: 10,
                  border: '1px solid #e2e8f0',
                  background: '#ffffff',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Editar nota
              </button>
            )}
          </div>
        }
      >
        <Tabs
          tabs={[
            { id: 'cadastro', label: 'Cadastro' },
            { id: 'historico-alteracao', label: 'Histórico de alteração' }
          ]}
          activeId={detailTab}
          onChange={handleDetailTabChange}
        />
        {canEdit && detailNote && isEditing && (
          <div
            style={{
              display: 'flex',
              gap: 10,
              alignItems: 'center',
              marginTop: 12,
              flexWrap: 'wrap'
            }}
          >
            <>
              <button
                type="button"
                onClick={handleSaveNote}
                disabled={savingNote}
                style={{
                  padding: '10px 16px',
                  borderRadius: 10,
                  border: 'none',
                  background: '#059669',
                  color: '#ffffff',
                  fontWeight: 600,
                  cursor: savingNote ? 'not-allowed' : 'pointer'
                }}
              >
                {savingNote ? 'Salvando...' : 'Salvar alterações'}
              </button>
              <button
                type="button"
                onClick={handleEditCancel}
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
            </>
          </div>
        )}
        {editErrors.length > 0 && (
          <div style={{ color: '#f87171', fontSize: 12, marginTop: 6 }}>
            {editErrors.map(error => (
              <div key={error}>{error}</div>
            ))}
          </div>
        )}
        {detailLoading && (
          <div style={{ color: '#64748b', fontSize: 13, marginTop: 12 }}>
            Carregando detalhes...
          </div>
        )}
        {detailError && (
          <div style={{ color: '#f87171', fontSize: 13, marginTop: 12 }}>
            {detailError}
          </div>
        )}
        {detailTab === 'cadastro' && detailNote && (
          <div style={{ display: 'grid', gap: 16, marginTop: 12 }}>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: 12
              }}
            >
              <div style={{ display: 'grid', gap: 6 }}>
                <span style={fieldLabelStyle}>Pendencia</span>
                {isEditing ? (
                  <textarea
                    value={editForm.nota_pendencia}
                    onChange={event =>
                      handleEditFormChange('nota_pendencia', event.target.value)
                    }
                    style={{
                      padding: '10px 12px',
                      borderRadius: 10,
                      border: '1px solid #e2e8f0',
                      minHeight: 80,
                      resize: 'vertical'
                    }}
                  />
                ) : (
                  <div>{detailNote.nota_pendencia || '-'}</div>
                )}
              </div>
              <div style={{ display: 'grid', gap: 6 }}>
                <span style={fieldLabelStyle}>Status</span>
                {isEditing ? (
                  <select
                    value={editForm.nota_status}
                    onChange={event =>
                      handleEditFormChange(
                        'nota_status',
                        event.target.value as NotaStatus
                      )
                    }
                    style={{
                      padding: '10px 12px',
                      borderRadius: 10,
                      border: '1px solid #e2e8f0'
                    }}
                  >
                    <option value="">Selecione</option>
                    {NOTA_STATUSES.map(status => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div>{detailNote.nota_status}</div>
                )}
              </div>
              <div style={{ display: 'grid', gap: 6 }}>
                <span style={fieldLabelStyle}>Ativo (CODPE)</span>
                <div>{detailNote.ATIVO_CODPE || '-'}</div>
              </div>
              <div style={{ display: 'grid', gap: 6 }}>
                <span style={fieldLabelStyle}>Ativo (Descritivo)</span>
                <div>{detailNote.ATIVO_DESCRITIVO_OS || '-'}</div>
              </div>
            </div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: 12
              }}
            >
              <div style={{ display: 'grid', gap: 6 }}>
                <span style={fieldLabelStyle}>OS relacionada</span>
                {isEditing ? (
                  <input
                    value={editForm.id_os}
                    onChange={event =>
                      handleEditFormChange('id_os', event.target.value)
                    }
                    style={{
                      padding: '10px 12px',
                      borderRadius: 10,
                      border: '1px solid #e2e8f0'
                    }}
                  />
                ) : (
                  <div>{detailNote.id_os || '-'}</div>
                )}
              </div>
              <div style={{ display: 'grid', gap: 6 }}>
                <span style={fieldLabelStyle}>Data programada</span>
                {isEditing ? (
                  <input
                    type="date"
                    value={editForm.nota_data_programada}
                    onChange={event =>
                      handleEditFormChange(
                        'nota_data_programada',
                        event.target.value
                      )
                    }
                    style={{
                      padding: '10px 12px',
                      borderRadius: 10,
                      border: '1px solid #e2e8f0'
                    }}
                  />
                ) : (
                  <div>{formatDate(detailNote.nota_data_programada ?? undefined)}</div>
                )}
              </div>
              <div style={{ display: 'grid', gap: 6 }}>
                <span style={fieldLabelStyle}>Data realizada</span>
                {isEditing ? (
                  <input
                    type="date"
                    value={editForm.nota_data_realizada}
                    onChange={event =>
                      handleEditFormChange(
                        'nota_data_realizada',
                        event.target.value
                      )
                    }
                    style={{
                      padding: '10px 12px',
                      borderRadius: 10,
                      border: '1px solid #e2e8f0'
                    }}
                  />
                ) : (
                  <div>{formatDate(detailNote.nota_data_realizada ?? undefined)}</div>
                )}
              </div>
            </div>
            <div style={{ display: 'grid', gap: 6 }}>
              <span style={fieldLabelStyle}>Observacao PCM</span>
              {isEditing ? (
                <textarea
                  value={editForm.nota_observacao_pcm}
                  onChange={event =>
                    handleEditFormChange(
                      'nota_observacao_pcm',
                      event.target.value
                    )
                  }
                  style={{
                    padding: '10px 12px',
                    borderRadius: 10,
                    border: '1px solid #e2e8f0',
                    minHeight: 90,
                    resize: 'vertical'
                  }}
                />
              ) : (
                <div style={{ whiteSpace: 'pre-line' }}>
                  {detailNote.nota_observacao_pcm || '-'}
                </div>
              )}
            </div>
            <div style={{ display: 'grid', gap: 6 }}>
              <span style={fieldLabelStyle}>Observacao tecnico</span>
              {isEditing ? (
                <textarea
                  value={editForm.nota_observacao_tecnico}
                  onChange={event =>
                    handleEditFormChange(
                      'nota_observacao_tecnico',
                      event.target.value
                    )
                  }
                  style={{
                    padding: '10px 12px',
                    borderRadius: 10,
                    border: '1px solid #e2e8f0',
                    minHeight: 90,
                    resize: 'vertical'
                  }}
                />
              ) : (
                <div style={{ whiteSpace: 'pre-line' }}>
                  {detailNote.nota_observacao_tecnico || '-'}
                </div>
              )}
            </div>
          </div>
        )}
        {detailTab === 'historico-alteracao' && (
          <div style={{ marginTop: 12, fontFamily: 'inherit' }}>
            {detailLoading ? (
              <div style={{ color: '#64748b', fontSize: 13 }}>
                Carregando histórico de alteração...
              </div>
            ) : changeHistory.length === 0 ? (
              <div style={{ color: '#94a3b8' }}>
                Nenhum registro de alteração encontrado.
              </div>
            ) : (
              <div
                style={{
                  borderRadius: 12,
                  border: '1px solid #e2e8f0',
                  overflow: 'hidden'
                }}
              >
                <table
                  style={{
                    width: '100%',
                    borderCollapse: 'collapse'
                  }}
                >
                  <thead style={{ background: '#ffffff' }}>
                    <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                      <th style={{ padding: 12, textAlign: 'left' }}>Usuário</th>
                      <th style={{ textAlign: 'left' }}>Data / Hora</th>
                      <th style={{ textAlign: 'left' }}>Campos alterados</th>
                    </tr>
                  </thead>
                  <tbody>
                    {changeHistory.map(entry => (
                      <tr
                        key={entry.id}
                        style={{ borderTop: '1px solid #e2e8f0' }}
                      >
                        <td style={{ padding: 12 }}>
                          {entry.usuario_id || 'Desconhecido'}
                        </td>
                        <td style={{ padding: 12 }}>
                          {formatDateTime(entry.data_hora)}
                        </td>
                        <td
                          style={{
                            padding: 12,
                            maxWidth: 320,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}
                          title={entry.campos_alterados}
                        >
                          {entry.campos_alterados}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </Modal>
    </section>
  )
}
