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

type ComponenteListItem = {
  IDCOMPONETE: number
  IDATIVO: string
  ATIVO_CODPE: string
  ATIVO_DESCRITIVO_OS: string
  ATIVO_SIGLA: string
  ATIVO_COORDENACAO: string
  ATIVO_EQUIPE: string
  COMP_NOME: string
  COMP_SERIAL: string
  COMP_DATA: string
  COMP_MODELO: string
  COMP_DESCRICAO: string
}

type ComponenteFormState = Omit<
  ComponenteListItem,
  | 'IDCOMPONETE'
  | 'ATIVO_CODPE'
  | 'ATIVO_DESCRITIVO_OS'
  | 'ATIVO_SIGLA'
  | 'ATIVO_COORDENACAO'
  | 'ATIVO_EQUIPE'
>

type Filters = {
  ativoSearch: string
  componentName: string
  modelo: string
  serial: string
}

type SortKey =
  | 'IDCOMPONETE'
  | 'IDATIVO'
  | 'COMP_NOME'
  | 'COMP_MODELO'
  | 'COMP_DATA'

type ManutencaoEntry = {
  id: number
  hist_manut_data_hora: string
  hist_manut_id_os: string | null
  hist_manut_id_componente: number
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

type DetailTabId =
  | 'cadastro'
  | 'historico-manutencao'
  | 'historico-alteracao'

const initialFilters: Filters = {
  ativoSearch: '',
  componentName: '',
  modelo: '',
  serial: ''
}

const initialFormState: ComponenteFormState = {
  IDATIVO: '',
  COMP_NOME: '',
  COMP_SERIAL: '',
  COMP_DATA: '',
  COMP_MODELO: '',
  COMP_DESCRICAO: ''
}

const fieldLabelStyle = {
  fontSize: 12,
  fontWeight: 600,
  color: '#475569'
}

function toText(value: unknown) {
  if (value === null || value === undefined) return ''
  return String(value)
}

function normalizeComponente(raw: Record<string, unknown>): ComponenteListItem {
  return {
    IDCOMPONETE: Number(raw.IDCOMPONETE ?? raw.id ?? 0),
    IDATIVO: toText(raw.IDATIVO ?? raw.ATIVO_CODPE ?? ''),
    ATIVO_CODPE: toText(raw.ATIVO_CODPE ?? raw.IDATIVO ?? ''),
    ATIVO_DESCRITIVO_OS: toText(
      raw.ATIVO_DESCRITIVO_OS ?? raw.ATIVO_DESCRITIVO ?? ''
    ),
    ATIVO_SIGLA: toText(raw.ATIVO_SIGLA),
    ATIVO_COORDENACAO: toText(raw.ATIVO_COORDENACAO ?? raw.COORDENACAO ?? ''),
    ATIVO_EQUIPE: toText(raw.ATIVO_EQUIPE ?? raw.EQUIPE ?? ''),
    COMP_NOME: toText(raw.COMP_NOME),
    COMP_SERIAL: toText(raw.COMP_SERIAL),
    COMP_DATA: toText(raw.COMP_DATA),
    COMP_MODELO: toText(raw.COMP_MODELO),
    COMP_DESCRICAO: toText(raw.COMP_DESCRICAO)
  }
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

async function getApiErrorMessage(response: Response, fallback: string) {
  if (response.status === 403) {
    return 'Você não tem permissão para executar esta operação.'
  }
  const message = await response.text()
  return message || fallback
}
export function Componentes() {
  const navigate = useNavigate()
  const [componentes, setComponentes] = useState<ComponenteListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState<Filters>(initialFilters)
  const [sort, setSort] = useState<{ key: SortKey; dir: 'asc' | 'desc' }>({
    key: 'COMP_NOME',
    dir: 'asc'
  })
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(() => {
    try {
      const stored = Number(
        localStorage.getItem('tecrail:componentes:page-size') ?? ''
      )
      return stored && stored > 0 ? stored : 50
    } catch {
      return 50
    }
  })
  const [modalOpen, setModalOpen] = useState(false)
  const [formState, setFormState] = useState<ComponenteFormState>(initialFormState)
  const [formErrors, setFormErrors] = useState<string[]>([])
  const [ativoSearch, setAtivoSearch] = useState('')
  const [ativosOptions, setAtivosOptions] = useState<AtivoOption[]>([])
  const [ativosLoading, setAtivosLoading] = useState(false)
  const [ativosError, setAtivosError] = useState<string | null>(null)
  const [selectedAtivo, setSelectedAtivo] = useState<AtivoOption | null>(null)
  const [showAtivoDropdown, setShowAtivoDropdown] = useState(false)
  const ativoDropdownRef = useRef<HTMLDivElement | null>(null)
  const [permissions, setPermissions] = useState(() => getStoredPermissions())
  const [detailModalOpen, setDetailModalOpen] = useState(false)
  const [detailComponent, setDetailComponent] =
    useState<ComponenteListItem | null>(null)
  const [detailTab, setDetailTab] = useState<DetailTabId>('cadastro')
  const [maintenanceHistory, setMaintenanceHistory] = useState<ManutencaoEntry[]>(
    []
  )
  const [changeHistory, setChangeHistory] = useState<ChangeEntry[]>([])
  const [detailLoading, setDetailLoading] = useState(false)
  const [detailError, setDetailError] = useState<string | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState<ComponenteFormState>(initialFormState)
  const [editErrors, setEditErrors] = useState<string[]>([])
  const [confirmModalOpen, setConfirmModalOpen] = useState(false)
  const [pendingEditSave, setPendingEditSave] = useState(false)

  const canRead = permissions?.componentes?.leitura === true
  const canCreate = permissions?.componentes?.criacao === true
  const canDelete = permissions?.componentes?.exclusao === true
  const canEdit = permissions?.componentes?.edicao === true

  const redirectToLogin = useCallback(() => {
    setPostLoginRedirect(window.location.pathname + window.location.search)
    logout()
    navigate('/')
  }, [navigate])

  const fetchWithAuth = useCallback(
    async (
      url: string,
      fallback: string,
      init?: RequestInit
    ) => {
      const token = getStoredToken()
      if (!token) {
        throw new Error('Sessão expirada. Faça login novamente.')
      }
      const headers = new Headers(init?.headers)
      headers.set('Authorization', `Bearer ${token}`)
      const response = await fetch(url, {
        ...init,
        headers
      })
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

  const handleDetailTabChange = (tabId: string) => {
    setDetailTab(tabId as DetailTabId)
  }

  const initializeEditForm = useCallback((component: ComponenteListItem | null) => {
    if (!component) {
      setEditForm(initialFormState)
      setIsEditing(false)
      setEditErrors([])
      return
    }

    setEditForm({
      IDATIVO: component.IDATIVO,
      COMP_NOME: component.COMP_NOME,
      COMP_SERIAL: component.COMP_SERIAL,
      COMP_DATA: component.COMP_DATA,
      COMP_MODELO: component.COMP_MODELO,
      COMP_DESCRICAO: component.COMP_DESCRICAO
    })
    setEditErrors([])
    setIsEditing(false)
  }, [])

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
      setComponentes([])
      setError('Você não tem permissão para visualizar os componentes.')
      return () => {
        isMounted = false
      }
    }

    const loadComponentes = async () => {
      setLoading(true)
      setError(null)
      try {
        const response = await fetchWithAuth(
          `${API_URL}/componentes`,
          'Erro ao carregar componentes.'
        )
        if (!isMounted) return
        const data = await response.json()
        const list = Array.isArray(data.componentes)
          ? data.componentes
          : Array.isArray(data)
            ? data
            : []
        if (!isMounted) return
        setComponentes(list.map((item: Record<string, unknown>) => normalizeComponente(item)))
      } catch (err) {
        if (!isMounted) return
        const message =
          err instanceof Error ? err.message : 'Erro ao carregar componentes.'
        setError(message)
        setComponentes([])
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    loadComponentes()
    return () => {
      isMounted = false
    }
  }, [canRead, navigate, fetchWithAuth])
  useEffect(() => {
    let isMounted = true

    const loadAtivos = async () => {
      setAtivosLoading(true)
      setAtivosError(null)
      try {
        const response = await fetchWithAuth(
          `${API_URL}/ativos`,
          'Erro ao carregar ativos disponíveis.'
        )
        if (!isMounted) return
        const data = await response.json()
        const list = Array.isArray(data.ativos)
          ? data.ativos
          : Array.isArray(data)
            ? data
            : []
        if (!isMounted) return
        const mappedAtivos: AtivoOption[] = list.map((item: Record<string, unknown>) => ({
          id: item.id ?? '',
          ATIVO_CODPE: item.ATIVO_CODPE ?? '',
          ATIVO_DESCRITIVO_OS: item.ATIVO_DESCRITIVO_OS ?? ''
        }))
        setAtivosOptions(
          mappedAtivos.filter(
            (ativo: AtivoOption) => Boolean(ativo.id && ativo.ATIVO_CODPE)
          )
        )
      } catch (err) {
        if (!isMounted) return
        const message =
          err instanceof Error
            ? err.message
            : 'Erro ao carregar ativos disponíveis.'
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
    setSelectedAtivo(null)
    setFormState(prev => ({ ...prev, IDATIVO: '' }))
    setShowAtivoDropdown(true)
  }

  const handleSelectAtivo = (ativo: AtivoOption) => {
    setSelectedAtivo(ativo)
    setFormState(prev => ({ ...prev, IDATIVO: ativo.id }))
    setAtivoSearch(`${ativo.ATIVO_CODPE} - ${ativo.ATIVO_DESCRITIVO_OS}`)
    setShowAtivoDropdown(false)
  }

  const ativoSuggestions = useMemo(() => {
    const term = ativoSearch.trim().toLowerCase()
    const matches = ativosOptions.filter(option => {
      if (!term) return true
      return (
        option.ATIVO_CODPE.toLowerCase().includes(term) ||
        option.ATIVO_DESCRITIVO_OS.toLowerCase().includes(term)
      )
    })
    return matches.slice(0, 8)
  }, [ativosOptions, ativoSearch])

  const updateFilters = (changes: Partial<Filters>) => {
    setFilters(prev => ({ ...prev, ...changes }))
    setPage(1)
  }

  const resetFilters = () => {
    setFilters(initialFilters)
    setPage(1)
  }

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

  const filteredComponentes = useMemo(() => {
    return componentes.filter(item => {
      const ativoTerm = filters.ativoSearch.trim().toLowerCase()
      const matchesAtivo =
        !ativoTerm ||
        item.ATIVO_CODPE.toLowerCase().includes(ativoTerm) ||
        item.ATIVO_DESCRITIVO_OS.toLowerCase().includes(ativoTerm)
      const matchesComponent =
        !filters.componentName || item.COMP_NOME === filters.componentName
      const matchesModelo =
        !filters.modelo || item.COMP_MODELO === filters.modelo
      const matchesSerial = !filters.serial
        ? true
        : item.COMP_SERIAL.toLowerCase().includes(filters.serial.toLowerCase())
      return matchesAtivo && matchesComponent && matchesModelo && matchesSerial
    })
  }, [componentes, filters])

  const sortedComponentes = useMemo(() => {
    const list = [...filteredComponentes]
    list.sort((a, b) => {
      const dir = sort.dir === 'asc' ? 1 : -1
      const valueA = a[sort.key]
      const valueB = b[sort.key]
      if (valueA == null && valueB == null) return 0
      if (valueA == null) return 1 * dir
      if (valueB == null) return -1 * dir
      if (sort.key === 'IDCOMPONETE') {
        return (Number(valueA) - Number(valueB)) * dir
      }
      return String(valueA).localeCompare(String(valueB)) * dir
    })
    return list
  }, [filteredComponentes, sort])

  const totalPages = Math.max(1, Math.ceil(sortedComponentes.length / pageSize))

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages)
    }
    if (page < 1) {
      setPage(1)
    }
  }, [page, totalPages])

  const pagedComponentes = useMemo(() => {
    const start = (page - 1) * pageSize
    return sortedComponentes.slice(start, start + pageSize)
  }, [page, pageSize, sortedComponentes])

  const handlePageSizeChange = (value: number) => {
    setPageSize(value)
    try {
      localStorage.setItem('tecrail:componentes:page-size', String(value))
    } catch {
      // ignore
    }
    setPage(1)
  }

  const componentOptions = useMemo(() => {
    return Array.from(new Set(componentes.map(item => item.COMP_NOME)))
      .filter(Boolean)
      .sort()
  }, [componentes])

  const modeloOptions = useMemo(() => {
    return Array.from(new Set(componentes.map(item => item.COMP_MODELO)))
      .filter(Boolean)
      .sort()
  }, [componentes])

  const resetAtivoSelection = () => {
    setSelectedAtivo(null)
    setAtivoSearch('')
    setShowAtivoDropdown(false)
  }

  const openNewComponente = () => {
    if (!canCreate) return
    setFormState(initialFormState)
    setFormErrors([])
    resetAtivoSelection()
    setModalOpen(true)
  }

  const closeNewComponenteModal = () => {
    setModalOpen(false)
    resetAtivoSelection()
  }

  const handleFormChange = (field: keyof ComponenteFormState, value: string) => {
    setFormState(prev => ({ ...prev, [field]: value }))
  }

  const handleCreateComponente = async () => {
    const errors = []
    if (!formState.IDATIVO.trim()) {
      errors.push('Informe o ativo.')
    }
    if (!formState.COMP_NOME.trim()) {
      errors.push('Informe o nome do componente.')
    }
    if (!formState.COMP_MODELO.trim()) {
      errors.push('Informe o modelo.')
    }
    setFormErrors(errors)
    if (errors.length) return

    if (!canCreate) {
      setFormErrors(['Você não tem permissão para criar componentes.'])
      return
    }

    try {
      const response = await fetch(`${API_URL}/componentes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getStoredToken() ?? ''}`
        },
        body: JSON.stringify(formState)
      })

      if (response.status === 401) {
        redirectToLogin()
        return
      }

      if (!response.ok) {
        const message = await getApiErrorMessage(
          response,
          'Erro ao criar componente.'
        )
        throw new Error(message)
      }

      const data = await response.json()
      const created =
        data.componente ??
        (Array.isArray(data.componentes) ? data.componentes[0] : null) ??
        data

      if (!created) {
        throw new Error('Resposta inválida do servidor.')
      }

      setComponentes(prev => [normalizeComponente(created), ...prev])
      toast.success('Componente criado com sucesso.')
      closeNewComponenteModal()
      setFormState(initialFormState)
      setPage(1)
      setError(null)
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Erro ao criar componente.'
      setFormErrors([message])
      setError(message)
    }
  }

  const handleDeleteComponente = async (id: number) => {
    if (!window.confirm('Confirmar exclusão do componente?')) {
      return
    }

    if (!canDelete) {
      setError('Você não tem permissão para remover componentes.')
      return
    }

    try {
      const response = await fetch(`${API_URL}/componentes/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${getStoredToken() ?? ''}`
        }
      })

      if (response.status === 401) {
        redirectToLogin()
        return
      }

      if (!response.ok) {
        const message = await getApiErrorMessage(
          response,
          'Erro ao remover componente.'
        )
        throw new Error(message)
      }

      setComponentes(prev => prev.filter(item => item.IDCOMPONETE !== id))
      toast.success('Componente removido.')
      setError(null)
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Erro ao remover componente.'
      setError(message)
    }
  }

  const openOsDetail = (osId: string) => {
    if (!osId) return
    navigate('/app/ordens-servico', {
      state: { editId: osId, returnTo: '/app/componentes' }
    })
  }

  const loadComponentDetail = async (componentId: number) => {
    setDetailLoading(true)
    setDetailError(null)
    setMaintenanceHistory([])
    setChangeHistory([])
    try {
      const detailResponse = await fetchWithAuth(
        `${API_URL}/componentes/detail?id=${componentId}`,
        'Erro ao carregar os detalhes do componente.'
      )
      const detailData = await detailResponse.json()
      const detailItem = normalizeComponente(
        detailData.componente ?? detailData
      )
      setDetailComponent(detailItem)
      initializeEditForm(detailItem)

      const manutResponse = await fetchWithAuth(
        `${API_URL}/componentes/historico/manutencao?component_id=${componentId}`,
        'Erro ao carregar o histórico de manutenção.'
      )
      const manutData = await manutResponse.json()
      setMaintenanceHistory(
        Array.isArray(manutData.history) ? manutData.history : []
      )

      const changeResponse = await fetchWithAuth(
        `${API_URL}/componentes/historico/alteracao?component_id=${componentId}`,
        'Erro ao carregar o histórico de alteração.'
      )
      const changeData = await changeResponse.json()
      setChangeHistory(Array.isArray(changeData.history) ? changeData.history : [])
    } catch (err) {
      if (err instanceof Error && err.message.includes('Sessão expirada')) {
        return
      }
      const message =
        err instanceof Error ? err.message : 'Erro ao carregar os detalhes.'
      setDetailError(message)
    } finally {
      setDetailLoading(false)
    }
  }

  const openComponentDetail = (item: ComponenteListItem) => {
    setDetailModalOpen(true)
    setDetailTab('cadastro')
    setDetailComponent(item)
    loadComponentDetail(item.IDCOMPONETE)
  }

  const closeDetailModal = () => {
    setDetailModalOpen(false)
    setDetailComponent(null)
    setMaintenanceHistory([])
    setChangeHistory([])
    setDetailError(null)
    initializeEditForm(null)
    setConfirmModalOpen(false)
  }

  const editDiffSummary = useMemo(() => {
    if (!detailComponent) return []
    const fields: Array<{ key: keyof ComponenteFormState; label: string }> = [
      { key: 'COMP_NOME', label: 'Componente' },
      { key: 'COMP_MODELO', label: 'Modelo' },
      { key: 'COMP_SERIAL', label: 'Serial' },
      { key: 'COMP_DATA', label: 'Instalação' },
      { key: 'COMP_DESCRICAO', label: 'Descrição' }
    ]
    return fields.reduce<Array<{ label: string; before: string; after: string }>>(
      (acc, field) => {
        const before = detailComponent[field.key] ?? ''
        const after = editForm[field.key] ?? ''
        if (before !== after) {
          acc.push({ label: field.label, before, after })
        }
        return acc
      },
      []
    )
  }, [detailComponent, editForm])

  const handleEditFormChange = (field: keyof ComponenteFormState, value: string) => {
    setEditForm(prev => ({ ...prev, [field]: value }))
  }

  const handleEditCancel = () => {
    if (detailComponent) {
      initializeEditForm(detailComponent)
    } else {
      initializeEditForm(null)
    }
  }

  const handleSaveClick = () => {
    const errors: string[] = []
    if (!editForm.COMP_NOME.trim()) {
      errors.push('Informe o nome do componente.')
    }
    if (!editForm.COMP_MODELO.trim()) {
      errors.push('Informe o modelo do componente.')
    }
    if (!editDiffSummary.length) {
      errors.push('Nenhuma alteração detectada.')
    }
    setEditErrors(errors)
    if (errors.length) {
      return
    }
    setConfirmModalOpen(true)
  }

  const handleConfirmSave = async () => {
    if (!detailComponent) return
    setPendingEditSave(true)
    try {
      const response = await fetchWithAuth(
        `${API_URL}/componentes`,
        'Erro ao salvar as alterações.',
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            IDCOMPONETE: detailComponent.IDCOMPONETE,
            ...editForm
          })
        }
      )
      const data = await response.json()
      const updated =
        data.componente ??
        (Array.isArray(data.componentes) ? data.componentes[0] : null) ??
        data
      if (!updated) {
        throw new Error('Resposta inválida do servidor.')
      }
      const normalized = normalizeComponente(updated)
      setComponentes(prev =>
        prev.map(item =>
          item.IDCOMPONETE === normalized.IDCOMPONETE ? normalized : item
        )
      )
      toast.success('Alterações salvas com sucesso.')
      setIsEditing(false)
      await loadComponentDetail(normalized.IDCOMPONETE)
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Erro ao salvar as alterações.'
      setEditErrors([message])
    } finally {
      setPendingEditSave(false)
      setConfirmModalOpen(false)
    }
  }
  if (!canRead) {
    return (
      <section style={{ padding: 24 }}>
        <div style={{ color: '#b91c1c', fontWeight: 600 }}>
          Você não tem permissão para acessar este módulo.
        </div>
      </section>
    )
  }

  return (
    <section style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <header style={{ display: 'grid', gap: 6 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <svg width="26" height="26" viewBox="0 0 24 24" aria-hidden="true">
            <path
              d="M3 12h3l2-6 4 12 3-8h6"
              fill="none"
              stroke="#2563eb"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <h2 style={{ margin: 0, fontSize: 24 }}>Componentes</h2>
        </div>
        <p style={{ margin: 0, color: '#64748b' }}>
          Monitoramento dos componentes que acompanham cada ativo.
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
              placeholder="Buscar por ativo (CODPE ou descritor)..."
              value={filters.ativoSearch}
              onChange={event =>
                updateFilters({ ativoSearch: event.target.value })
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
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: 12
          }}
        >
          <select
            value={filters.componentName}
            onChange={event =>
              updateFilters({ componentName: event.target.value })
            }
            style={{
              padding: '10px 12px',
              borderRadius: 10,
              border: '1px solid #e2e8f0'
            }}
          >
            <option value="">Todos os componentes</option>
            {componentOptions.map(value => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
          <select
            value={filters.modelo}
            onChange={event => updateFilters({ modelo: event.target.value })}
            style={{
              padding: '10px 12px',
              borderRadius: 10,
              border: '1px solid #e2e8f0'
            }}
          >
            <option value="">Todos os modelos</option>
            {modeloOptions.map(value => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
          <input
            placeholder="Serial"
            value={filters.serial}
            onChange={event => updateFilters({ serial: event.target.value })}
            style={{
              padding: '10px 12px',
              borderRadius: 10,
              border: '1px solid #e2e8f0'
            }}
          />
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
            <strong style={{ color: '#1e293b' }}>
              {filteredComponentes.length}
            </strong>{' '}
            componentes filtrados
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            {canCreate && (
              <button
                type="button"
                onClick={openNewComponente}
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
                Novo componente
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
          Carregando componentes...
        </div>
      )}
      {!loading && componentes.length === 0 && error && (
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
                onClick={() => toggleSort('IDCOMPONETE')}
              >
                ID{sortIndicator('IDCOMPONETE')}
              </th>
              <th
                style={{ cursor: 'pointer', textAlign: 'left' }}
                onClick={() => toggleSort('IDATIVO')}
              >
                Ativo{sortIndicator('IDATIVO')}
              </th>
              <th
                style={{ cursor: 'pointer', textAlign: 'left' }}
                onClick={() => toggleSort('COMP_NOME')}
              >
                Componente{sortIndicator('COMP_NOME')}
              </th>
              <th
                style={{ cursor: 'pointer', textAlign: 'left' }}
                onClick={() => toggleSort('COMP_MODELO')}
              >
                Modelo{sortIndicator('COMP_MODELO')}
              </th>
              <th style={{ textAlign: 'left' }}>Serial</th>
              <th
                style={{ cursor: 'pointer', textAlign: 'left' }}
                onClick={() => toggleSort('COMP_DATA')}
              >
                Instalação{sortIndicator('COMP_DATA')}
              </th>
              <th style={{ textAlign: 'left' }}>Descrição</th>
              <th style={{ paddingRight: 12 }}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {pagedComponentes.map(item => (
              <tr key={item.IDCOMPONETE} style={{ borderTop: '1px solid #e2e8f0' }}>
                <td style={{ padding: 12 }}>
                  <button
                    type="button"
                    style={{
                      border: 'none',
                      background: 'transparent',
                      color: '#1d4ed8',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                    onClick={() => openComponentDetail(item)}
                  >
                    {item.IDCOMPONETE}
                  </button>
                </td>
                <td style={{ padding: 12 }}>{item.ATIVO_CODPE || item.IDATIVO}</td>
                <td style={{ padding: 12 }}>{item.COMP_NOME}</td>
                <td style={{ padding: 12 }}>{item.COMP_MODELO}</td>
                <td style={{ padding: 12 }}>{item.COMP_SERIAL || '-'}</td>
                <td style={{ padding: 12 }}>{formatDate(item.COMP_DATA)}</td>
                <td
                  style={{
                    padding: 12,
                    maxWidth: 200,
                    textAlign: 'left',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}
                  title={item.COMP_DESCRICAO}
                >
                  {item.COMP_DESCRICAO || '-'}
                </td>
                <td style={{ paddingRight: 12 }}>
                  {canDelete && (
                    <button
                      type="button"
                      onClick={() => handleDeleteComponente(item.IDCOMPONETE)}
                      title="Excluir"
                      aria-label="Excluir"
                      style={{
                        border: 'none',
                        background: 'transparent',
                        color: '#b91c1c',
                        cursor: 'pointer'
                      }}
                    >
                      x
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {pagedComponentes.length === 0 && !loading && (
              <tr>
                <td
                  colSpan={8}
                  style={{ padding: 16, color: '#94a3b8', textAlign: 'left' }}
                >
                  Nenhum componente encontrado.
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
          {pagedComponentes.length ? (page - 1) * pageSize + 1 : 0}-
          {Math.min(page * pageSize, sortedComponentes.length)} de{' '}
          {sortedComponentes.length}
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
        title="Novo componente"
        isOpen={modalOpen}
      onClose={closeNewComponenteModal}
        footer={
          <>
            <button
              type="button"
              onClick={closeNewComponenteModal}
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
              onClick={handleCreateComponente}
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
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: 12
            }}
          >
            <div style={{ display: 'grid', gap: 6 }}>
              <label style={fieldLabelStyle}>Ativo *</label>
              <div ref={ativoDropdownRef} style={{ position: 'relative' }}>
                <input
                  placeholder="Busque por CODPE ou descritivo..."
                  value={ativoSearch}
                  onChange={event =>
                    handleAtivoSearchChange(event.target.value)
                  }
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
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                  gap: 8
                }}
              >
                <div style={{ display: 'grid', gap: 3 }}>
                  <span style={{ ...fieldLabelStyle, fontSize: 10 }}>CODPE</span>
                  <div style={{ fontSize: 14 }}>
                    {selectedAtivo?.ATIVO_CODPE || '-'}
                  </div>
                </div>
                <div style={{ display: 'grid', gap: 3 }}>
                  <span style={{ ...fieldLabelStyle, fontSize: 10 }}>
                    Descritivo
                  </span>
                  <div style={{ fontSize: 14 }}>
                    {selectedAtivo?.ATIVO_DESCRITIVO_OS || '-'}
                  </div>
                </div>
              </div>
              {ativosError && (
                <div style={{ color: '#f87171', fontSize: 12 }}>
                  {ativosError}
                </div>
              )}
            </div>
            <div style={{ display: 'grid', gap: 6 }}>
              <label style={fieldLabelStyle}>Nome *</label>
              <input
                value={formState.COMP_NOME}
                onChange={event =>
                  handleFormChange('COMP_NOME', event.target.value)
                }
                style={{
                  padding: '10px 12px',
                  borderRadius: 10,
                  border: '1px solid #e2e8f0'
                }}
              />
            </div>
            <div style={{ display: 'grid', gap: 6 }}>
              <label style={fieldLabelStyle}>Modelo *</label>
              <input
                value={formState.COMP_MODELO}
                onChange={event =>
                  handleFormChange('COMP_MODELO', event.target.value)
                }
                style={{
                  padding: '10px 12px',
                  borderRadius: 10,
                  border: '1px solid #e2e8f0'
                }}
              />
            </div>
            <div style={{ display: 'grid', gap: 6 }}>
              <label style={fieldLabelStyle}>Serial</label>
              <input
                value={formState.COMP_SERIAL}
                onChange={event =>
                  handleFormChange('COMP_SERIAL', event.target.value)
                }
                style={{
                  padding: '10px 12px',
                  borderRadius: 10,
                  border: '1px solid #e2e8f0'
                }}
              />
            </div>
            <div style={{ display: 'grid', gap: 6 }}>
              <label style={fieldLabelStyle}>Data de instalação</label>
              <input
                type="date"
                value={formState.COMP_DATA}
                onChange={event =>
                  handleFormChange('COMP_DATA', event.target.value)
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
            <label style={fieldLabelStyle}>Descrição</label>
            <textarea
              value={formState.COMP_DESCRICAO}
              onChange={event =>
                handleFormChange('COMP_DESCRICAO', event.target.value)
              }
              style={{
                padding: '10px 12px',
                borderRadius: 10,
                border: '1px solid #e2e8f0',
                minHeight: 90,
                resize: 'vertical'
              }}
            />
          </div>
        </div>
      </Modal>
      <Modal
        title={
          detailComponent
            ? `Componentes #${detailComponent.IDCOMPONETE}`
            : 'Detalhe do componente'
        }
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
            {canEdit && detailComponent && !isEditing && (
              <button
                type="button"
                onClick={() => {
                  setIsEditing(true)
                  setEditErrors([])
                }}
                style={{
                  padding: '10px 16px',
                  borderRadius: 10,
                  border: '1px solid #e2e8f0',
                  background: '#ffffff',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Editar componente
              </button>
            )}
          </div>
        }
      >
        <Tabs
          tabs={[
            { id: 'cadastro', label: 'Cadastro' },
            { id: 'historico-manutencao', label: 'Histórico Manutenção' },
            { id: 'historico-alteracao', label: 'Histórico de alteração' }
          ]}
          activeId={detailTab}
          onChange={handleDetailTabChange}
        />
        {canEdit && detailComponent && isEditing && (
          <div
            style={{
              display: 'flex',
              gap: 10,
              alignItems: 'center',
              marginTop: 12,
              flexWrap: 'wrap'
            }}
          >
            <button
              type="button"
              onClick={handleSaveClick}
              disabled={pendingEditSave}
              style={{
                padding: '10px 16px',
                borderRadius: 10,
                border: 'none',
                background: '#059669',
                color: '#ffffff',
                fontWeight: 600,
                cursor: pendingEditSave ? 'not-allowed' : 'pointer'
              }}
            >
              {pendingEditSave ? 'Salvando...' : 'Salvar alterações'}
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
              Cancelar edição
            </button>
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
          <div style={{ color: '#64748b', fontSize: 13 }}>
            Carregando detalhes...
          </div>
        )}
        {detailError && (
          <div style={{ color: '#f87171', fontSize: 13 }}>{detailError}</div>
        )}
        {detailTab === 'cadastro' && detailComponent && (
          <div style={{ display: 'grid', gap: 16, marginTop: 12 }}>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: 12
              }}
            >
              <div style={{ display: 'grid', gap: 6 }}>
                <span style={fieldLabelStyle}>Componente</span>
                {isEditing ? (
                  <input
                    value={editForm.COMP_NOME}
                    onChange={event =>
                      handleEditFormChange('COMP_NOME', event.target.value)
                    }
                    style={{
                      padding: '10px 12px',
                      borderRadius: 10,
                      border: '1px solid #e2e8f0'
                    }}
                  />
                ) : (
                  <div>{detailComponent.COMP_NOME || '-'}</div>
                )}
              </div>
              <div style={{ display: 'grid', gap: 6 }}>
                <span style={fieldLabelStyle}>Modelo</span>
                {isEditing ? (
                  <input
                    value={editForm.COMP_MODELO}
                    onChange={event =>
                      handleEditFormChange('COMP_MODELO', event.target.value)
                    }
                    style={{
                      padding: '10px 12px',
                      borderRadius: 10,
                      border: '1px solid #e2e8f0'
                    }}
                  />
                ) : (
                  <div>{detailComponent.COMP_MODELO || '-'}</div>
                )}
              </div>
              <div style={{ display: 'grid', gap: 6 }}>
                <span style={fieldLabelStyle}>Serial</span>
                {isEditing ? (
                  <input
                    value={editForm.COMP_SERIAL}
                    onChange={event =>
                      handleEditFormChange('COMP_SERIAL', event.target.value)
                    }
                    style={{
                      padding: '10px 12px',
                      borderRadius: 10,
                      border: '1px solid #e2e8f0'
                    }}
                  />
                ) : (
                  <div>{detailComponent.COMP_SERIAL || '-'}</div>
                )}
              </div>
              <div style={{ display: 'grid', gap: 6 }}>
                <span style={fieldLabelStyle}>Instalação</span>
                {isEditing ? (
                  <input
                    type="date"
                    value={editForm.COMP_DATA}
                    onChange={event =>
                      handleEditFormChange('COMP_DATA', event.target.value)
                    }
                    style={{
                      padding: '10px 12px',
                      borderRadius: 10,
                      border: '1px solid #e2e8f0'
                    }}
                  />
                ) : (
                  <div>{formatDate(detailComponent.COMP_DATA)}</div>
                )}
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
                <span style={fieldLabelStyle}>Ativo (CODPE)</span>
                <div>{detailComponent.ATIVO_CODPE || '-'}</div>
              </div>
              <div style={{ display: 'grid', gap: 6 }}>
                <span style={fieldLabelStyle}>Ativo (Descritivo)</span>
                <div>{detailComponent.ATIVO_DESCRITIVO_OS || '-'}</div>
              </div>
              <div style={{ display: 'grid', gap: 6 }}>
                <span style={fieldLabelStyle}>Sigla</span>
                <div>{detailComponent.ATIVO_SIGLA || '-'}</div>
              </div>
              <div style={{ display: 'grid', gap: 6 }}>
                <span style={fieldLabelStyle}>Coordenação</span>
                <div>{detailComponent.ATIVO_COORDENACAO || '-'}</div>
              </div>
              <div style={{ display: 'grid', gap: 6 }}>
                <span style={fieldLabelStyle}>Equipe</span>
                <div>{detailComponent.ATIVO_EQUIPE || '-'}</div>
              </div>
            </div>
            <div style={{ display: 'grid', gap: 6 }}>
              <span style={fieldLabelStyle}>Descrição</span>
              {isEditing ? (
                <textarea
                  value={editForm.COMP_DESCRICAO}
                  onChange={event =>
                    handleEditFormChange('COMP_DESCRICAO', event.target.value)
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
                  {detailComponent.COMP_DESCRICAO || '-'}
                </div>
              )}
            </div>
          </div>
        )}

        {detailTab === 'historico-manutencao' && (
          <div style={{ marginTop: 12 }}>
            {detailLoading ? (
              <div style={{ color: '#64748b', fontSize: 13 }}>
                Carregando histórico de manutenção...
              </div>
            ) : maintenanceHistory.length === 0 ? (
              <div style={{ color: '#94a3b8' }}>
                Nenhum registro de manutenção encontrado.
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
                      <th style={{ padding: 12, textAlign: 'left' }}>
                        Data / Hora
                      </th>
                      <th style={{ textAlign: 'left' }}>OS</th>
                      <th style={{ textAlign: 'left' }}>Componente</th>
                    </tr>
                  </thead>
                  <tbody>
                    {maintenanceHistory.map(entry => (
                      <tr key={entry.id} style={{ borderTop: '1px solid #e2e8f0' }}>
                        <td style={{ padding: 12 }}>
                          {formatDateTime(entry.hist_manut_data_hora)}
                        </td>
                        <td style={{ padding: 12 }}>
                          {entry.hist_manut_id_os ? (
                            <button
                              type="button"
                              onClick={() => openOsDetail(entry.hist_manut_id_os!)}
                              style={{
                                border: 'none',
                                background: 'transparent',
                                color: '#1d4ed8',
                                fontWeight: 600,
                                cursor: 'pointer'
                              }}
                            >
                              {entry.hist_manut_id_os}
                            </button>
                          ) : (
                            '-'
                          )}
                        </td>
                        <td style={{ padding: 12 }}>
                          {entry.hist_manut_id_componente || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {detailTab === 'historico-alteracao' && (
          <div style={{ marginTop: 12 }}>
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
                      <tr key={entry.id} style={{ borderTop: '1px solid #e2e8f0' }}>
                        <td style={{ padding: 12 }}>{entry.usuario_id}</td>
                        <td style={{ padding: 12 }}>
                          {formatDateTime(entry.data_hora)}
                        </td>
                        <td
                          style={{
                            padding: 12,
                            maxWidth: 300,
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
      <Modal
        title="Confirmar alterações"
        isOpen={canEdit && confirmModalOpen}
        onClose={() => setConfirmModalOpen(false)}
        footer={
          <>
            <button
              type="button"
              onClick={() => setConfirmModalOpen(false)}
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
              onClick={handleConfirmSave}
              disabled={pendingEditSave}
              style={{
                padding: '10px 16px',
                borderRadius: 10,
                border: 'none',
                background: '#059669',
                color: '#ffffff',
                fontWeight: 600,
                cursor: pendingEditSave ? 'not-allowed' : 'pointer'
              }}
            >
              {pendingEditSave ? 'Salvando...' : 'Confirmar alterações'}
            </button>
          </>
        }
      >
        <div style={{ display: 'grid', gap: 10, marginTop: 8 }}>
          <p style={{ margin: 0, color: '#0f172a' }}>
            Deseja salvar as alterações realizadas no componente?
          </p>
          {editDiffSummary.length ? (
            editDiffSummary.map(diff => (
              <div key={diff.label} style={{ fontSize: 13 }}>
                <strong>{diff.label}:</strong> {diff.before || '-'} - {diff.after || '-'}
              </div>
            ))
          ) : (
            <div style={{ fontSize: 13, color: '#94a3b8' }}>
              Nenhuma alteração detectada.
            </div>
          )}
        </div>
      </Modal>
    </section>
  )
}
