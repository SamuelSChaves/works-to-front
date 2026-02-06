import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type CSSProperties
} from 'react'
import { useNavigate } from 'react-router-dom'
import { API_URL } from '../services/api'
import {
  getStoredToken,
  logout,
  setPostLoginRedirect,
  getStoredUser,
  subscribeToUserChanges,
  type User
} from '../services/auth'
import type { AcaoRecord, AcaoStatus } from '../types/acao'
import { normalizeActionRow } from '../utils/actions'

const OS_STATUS_KEYS = ['CRIADO', 'PROGRAMADO', 'REALIZADO', 'CANCELADO'] as const
const DASHBOARD_STATUS_KEYS: OsStatus[] = OS_STATUS_KEYS.filter(
  status => status !== 'CANCELADO'
)
type OsStatus = (typeof OS_STATUS_KEYS)[number]

const OS_STATUS_LABELS: Record<OsStatus, string> = {
  CRIADO: 'Criadas',
  PROGRAMADO: 'Programadas',
  REALIZADO: 'Realizadas',
  CANCELADO: 'Canceladas'
}

const OS_STATUS_VISUALS: Record<OsStatus, { background: string; color: string }> = {
  CRIADO: { background: '#dbeafe', color: '#1d4ed8' },
  PROGRAMADO: { background: '#fef3c7', color: '#b45309' },
  REALIZADO: { background: '#dcfce7', color: '#15803d' },
  CANCELADO: { background: '#fee2e2', color: '#b91c1c' }
}

const INITIAL_STATUS_COUNTS = OS_STATUS_KEYS.reduce((acc, status) => {
  acc[status] = 0
  return acc
}, {} as Record<OsStatus, number>)

type OrderServiceListRow = {
  id: string
  os_numero: number
  ATIVO_DESCRITIVO_OS: string | null
  os_status: string
  os_programado1: string | null
  os_programado2: string | null
  os_programado3: string | null
  os_programado4: string | null
  os_programado5: string | null
  estrutura_equipe: string | null
  ATIVO_EQUIPE: string | null
  ATIVO_CODPE?: string | null
  os_ano?: number | null
  os_mes?: number | null
  coordenacao?: string | null
  coordenacao_nome?: string | null
  COORDENACAO?: string | null
  COORD?: string | null
}

type UpcomingOs = {
  id: string
  osNumber: number
  asset: string
  status: OsStatus
  nextDate: Date
}

type PlanningSnapshot = {
  id: string
  label: string
  scheduledHH: number
  realizedHH: number
  mpCount: number
  mpHH: number
  mcCount: number
  mcHH: number
}

const planningSnapshots: PlanningSnapshot[] = [
  {
    id: 'painel-norte',
    label: 'Coordenação Norte · Equipe Alfa',
    scheduledHH: 205,
    realizedHH: 195,
    mpCount: 18,
    mpHH: 132,
    mcCount: 7,
    mcHH: 78
  },
  {
    id: 'painel-sul',
    label: 'Coordenação Sul · Equipe Beta',
    scheduledHH: 188,
    realizedHH: 166,
    mpCount: 15,
    mpHH: 118,
    mcCount: 6,
    mcHH: 72
  },
  {
    id: 'painel-central',
    label: 'Coordenação Central · Equipe Gama',
    scheduledHH: 210,
    realizedHH: 188,
    mpCount: 20,
    mpHH: 145,
    mcCount: 8,
    mcHH: 88
  }
]

const DATE_FORMATTER = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: '2-digit'
})

function parseProgramDate(value: string | null) {
  const normalized = String(value ?? '').trim()
  if (!normalized) return null
  const date = new Date(normalized)
  return Number.isNaN(date.getTime()) ? null : date
}

function getNextProgramDate(row: OrderServiceListRow): Date | null {
  const candidates = [
    row.os_programado1,
    row.os_programado2,
    row.os_programado3,
    row.os_programado4,
    row.os_programado5
  ]
    .map(parseProgramDate)
    .filter((date): date is Date => Boolean(date))
  if (!candidates.length) return null
  return candidates.sort((a, b) => a.getTime() - b.getTime())[0]
}

function normalizeStatus(value: string): OsStatus | null {
  const normalized = String(value ?? '').trim()
  if (OS_STATUS_KEYS.includes(normalized as OsStatus)) {
    return normalized as OsStatus
  }
  return null
}

function buildStatusCounts(rows: OrderServiceListRow[]) {
  const counts = { ...INITIAL_STATUS_COUNTS }
  for (const row of rows) {
    const status = normalizeStatus(row.os_status)
    if (status) {
      counts[status] += 1
    }
  }
  return counts
}

function buildUpcomingRows(rows: OrderServiceListRow[]) {
  const upcoming = rows
    .map(row => {
      const nextDate = getNextProgramDate(row)
      const status = normalizeStatus(row.os_status)
      if (!nextDate || !status) {
        return null
      }
      return {
        id: row.id,
        osNumber: row.os_numero,
        asset: row.ATIVO_DESCRITIVO_OS || 'Ativo sem nome',
        status,
        nextDate
      }
    })
    .filter((item): item is UpcomingOs => Boolean(item))

  return upcoming
    .sort((a, b) => a.nextDate.getTime() - b.nextDate.getTime())
    .slice(0, 4)
}

function formatActionDate(value?: string) {
  if (!value) return '—'
  const [year, month, day] = value.split('-')
  if (!year || !month || !day) return value
  return `${day}/${month}/${year}`
}

function toText(value: unknown) {
  if (value === null || value === undefined) return ''
  return String(value)
}

function toNullableText(value: unknown) {
  if (value === null || value === undefined) return null
  const text = String(value).trim()
  return text ? text : null
}

function normalizePlanAssetRow(row: Record<string, unknown>): PlanAssetRow {
  return {
    id: toText(row.id ?? row.ID ?? row.codigo ?? ''),
    codpe: toText(
      row.codpe ?? row.cod_pe ?? row.ATIVO_CODPE ?? row.ativo_codpe ?? ''
    ),
    description: toText(
      row.description ??
        row.descricao ??
        row.ATIVO_DESCRITIVO_OS ??
        row.ativo_descritivo_os ??
        ''
    ),
    sigla: toText(row.sigla ?? row.ATIVO_SIGLA ?? row.sigla_ativo ?? ''),
    cycle: toText(row.cycle ?? row.ciclo ?? row.ATIVO_CICLO ?? ''),
    lastMaintenance: toNullableText(
      row.lastMaintenance ??
        row.ultimo ??
        row.ATIVO_ULTIMA_MANUT ??
        row.last_maintenance
    ),
    dueDate: toNullableText(
      row.dueDate ?? row.vencimento ?? row.due_date ?? row.data_vencimento
    )
  }
}

function normalizeAssetRow(row: Record<string, unknown>): AssetSummary {
  return {
    id: toText(row.id ?? row.IDATIVO ?? row.id_ativo ?? ''),
    ATIVO_CODPE: toText(row.ATIVO_CODPE ?? row.ativo_codpe ?? ''),
    ATIVO_DESCRITIVO_OS: toText(
      row.ATIVO_DESCRITIVO_OS ?? row.ativo_descritivo ?? ''
    ),
    ATIVO_ULTIMA_MANUT: toNullableText(
      row.ATIVO_ULTIMA_MANUT ?? row.ultima_manutencao ?? row.lastMaintenance
    ),
    ATIVO_CICLO: toNullableText(
      row.ATIVO_CICLO ?? row.ciclo ?? row.ATIVO_CICLO ?? row.cycle
    )
  }
}

function normalizeComponentRow(row: Record<string, unknown>): ComponentSummary {
  return {
    id: toText(row.IDCOMPONETE ?? row.id ?? ''),
    ATIVO_CODPE: toText(row.ATIVO_CODPE ?? row.ativo_codpe ?? ''),
    COMP_NOME: toText(row.COMP_NOME ?? row.comp_nome ?? ''),
    COMP_DESCRICAO: toNullableText(
      row.COMP_DESCRICAO ?? row.comp_descricao ?? row.descricao
    ),
    COMP_DATA: toNullableText(row.COMP_DATA ?? row.comp_data ?? row.data)
  }
}

function normalizeNotaRow(row: Record<string, unknown>): NotaSummary {
  const rawStatus = String(row.nota_status ?? row.notaStatus ?? row.status ?? '')
    .trim()
  const normalizedStatus = NOTA_STATUSES.includes(
    rawStatus as NotaStatus
  )
    ? (rawStatus as NotaStatus)
    : 'Criado'
  return {
    IDNOTA: Number(row.IDNOTA ?? row.id ?? 0),
    nota_status: normalizedStatus,
    ATIVO_CODPE: toText(row.ATIVO_CODPE ?? row.ativo_codpe ?? ''),
    nota_data_programada: toNullableText(
      row.nota_data_programada ??
        row.notaDataProgramada ??
        row.data_programada ??
        row.data
    )
  }
}

async function getApiErrorMessage(response: Response, fallback: string) {
  if (response.status === 403) {
    return 'Operação não autorizada para o seu perfil.'
  }
  const message = await response.text()
  return message || fallback
}

function parseNullableDate(value?: string | null) {
  if (!value) return null
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return null
  return parsed
}

function parseCycleToDays(value?: string | null) {
  if (!value) return null
  const normalized = value.trim().toLowerCase()
  const match = normalized.match(/(\d+(?:[.,]\d+)?)/)
  if (!match) return null
  const numeric = Number(match[1].replace(',', '.'))
  if (Number.isNaN(numeric)) return null
  if (normalized.includes('semana')) {
    return numeric * 7
  }
  if (normalized.includes('mes')) {
    return numeric * 30
  }
  if (normalized.includes('ano')) {
    return numeric * 365
  }
  if (normalized.includes('dia')) {
    return numeric
  }
  return numeric
}

function addDays(date: Date, days: number) {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000)
}


function isPendingActionStatus(value: string) {
  const normalized = String(value ?? '').trim().toLowerCase()
  return !['concluída', 'concluida'].includes(normalized)
}

function isActionAssignedToUser(action: AcaoRecord, user: User | null) {
  if (!user) return false
  const normalize = (value?: string) => value?.trim().toLowerCase() ?? ''
  const responsibleId = normalize(action.id_usuario_responsavel)
  const userId = normalize(user.id)
  if (responsibleId && userId && responsibleId === userId) {
    return true
  }
  return false
}

function getUserCoord(user: User | null) {
  if (!user) return ''
  return (user.coordenacao ?? user.coordenacaoId ?? '').toString().trim()
}

function getRowCoord(row: OrderServiceListRow) {
  return (
    (
      row.coordenacao ??
      row.coordenacao_nome ??
      row.COORDENACAO ??
      row.COORD ??
      ''
    )
      .toString()
      .trim()
  )
}

const pageStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 24,
  height: '100%'
}

const dashboardGrid: CSSProperties = {
  display: 'grid',
  gap: 20,
  gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
  maxHeight: '520px',
  overflowY: 'auto',
  paddingRight: 8
}

const cardStyle: CSSProperties = {
  borderRadius: 20,
  border: '1px solid #e5e7eb',
  background: '#ffffff',
  padding: 24,
  boxShadow: '0 20px 40px rgba(15,23,42,0.08)',
  color: '#0f172a',
  minHeight: 360,
  height: 360,
  display: 'flex',
  flexDirection: 'column'
}

const cardBodyStyle: CSSProperties = {
  flex: 1,
  overflowY: 'auto'
}

const statusGridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(90px, 1fr))',
  gap: 12,
  alignItems: 'stretch'
}

const statusCardInnerStyle: CSSProperties = {
  borderRadius: 14,
  border: '1px solid #e5e7eb',
  padding: '12px 10px',
  background: '#f8fafc',
  minHeight: 110,
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'space-between'
}

const upcomingListStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 12,
  marginTop: 12
}

const planningHighlightsStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
  gap: 12,
  marginBottom: 16
}

const highlightCardStyle: CSSProperties = {
  borderRadius: 16,
  border: '1px solid #e5e7eb',
  background: '#f8fafc',
  padding: 14
}

const progressTrackStyle: CSSProperties = {
  width: '100%',
  height: 8,
  borderRadius: 99,
  background: '#e5e7eb',
  overflow: 'hidden'
}

const detailRowStyle: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  gap: 12,
  alignItems: 'center'
}

const farolValueStyle: CSSProperties = {
  fontSize: 32,
  fontWeight: 700,
  color: '#0f172a'
}

const farolDescriptionStyle: CSSProperties = {
  fontSize: 13,
  color: '#475569'
}

const farolStatusStyle: CSSProperties = {
  fontSize: 12,
  fontWeight: 600,
  letterSpacing: 0.4,
  textTransform: 'uppercase'
}

const ACTION_STATUS_STYLES: Record<AcaoStatus, { background: string; color: string }> = {
  Aberta: { background: 'rgba(59, 130, 246, 0.15)', color: '#2563eb' },
  'Em andamento': { background: 'rgba(234, 179, 8, 0.15)', color: '#f59e0b' },
  Concluída: { background: 'rgba(16, 185, 129, 0.15)', color: '#10b981' }
}

const MONTH_NAMES = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro'
]

type PlanAssetRow = {
  id: string
  codpe: string
  description: string
  sigla: string
  cycle: string
  lastMaintenance: string | null
  dueDate: string | null
}

type AssetSummary = {
  id: string
  ATIVO_CODPE: string
  ATIVO_DESCRITIVO_OS: string
  ATIVO_ULTIMA_MANUT: string | null
  ATIVO_CICLO: string | null
}

type ComponentSummary = {
  id: string
  ATIVO_CODPE: string
  COMP_NOME: string
  COMP_DATA: string | null
  COMP_DESCRICAO: string | null
}

type NotaStatus =
  | 'Criado'
  | 'Novo'
  | 'Programado'
  | 'Ag. Material'
  | 'Ag'
  | 'Plano'
  | 'Cancelado'

const NOTA_STATUSES: NotaStatus[] = [
  'Criado',
  'Novo',
  'Programado',
  'Ag. Material',
  'Ag',
  'Plano',
  'Cancelado'
]

type NotaSummary = {
  IDNOTA: number
  nota_status: NotaStatus
  ATIVO_CODPE: string
  nota_data_programada: string | null
}

export function Home() {
  const navigate = useNavigate()
  const [orderServiceRows, setOrderServiceRows] = useState<OrderServiceListRow[]>([])
  const [selectedTeam, setSelectedTeam] = useState('')
  const [osLoading, setOsLoading] = useState(true)
  const [osError, setOsError] = useState<string | null>(null)
  const [currentUser, setCurrentUser] = useState<User | null>(() => getStoredUser())
  const [actions, setActions] = useState<AcaoRecord[]>([])
  const [actionsLoading, setActionsLoading] = useState(true)
  const [actionsError, setActionsError] = useState<string | null>(null)
  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth()
  const [selectedYear, setSelectedYear] = useState<number>(currentYear)
  const [selectedMonth, setSelectedMonth] = useState<number>(currentMonth + 1)
  const [selectedCoord, setSelectedCoord] = useState<string>(
    () => getUserCoord(currentUser)
  )
  const [planAssets, setPlanAssets] = useState<PlanAssetRow[]>([])
  const [planAssetsLoading, setPlanAssetsLoading] = useState(true)
  const [planAssetsError, setPlanAssetsError] = useState<string | null>(null)
  const [assetSummaries, setAssetSummaries] = useState<AssetSummary[]>([])
  const [assetsLoading, setAssetsLoading] = useState(true)
  const [assetsError, setAssetsError] = useState<string | null>(null)
  const [componentSummaries, setComponentSummaries] = useState<ComponentSummary[]>([])
  const [componentsLoading, setComponentsLoading] = useState(true)
  const [componentsError, setComponentsError] = useState<string | null>(null)
  const [notes, setNotes] = useState<NotaSummary[]>([])
  const [notesLoading, setNotesLoading] = useState(true)
  const [notesError, setNotesError] = useState<string | null>(null)
  const planYearMonth = useMemo(
    () => `${selectedYear}-${String(selectedMonth).padStart(2, '0')}`,
    [selectedMonth, selectedYear]
  )
  const dashboardSnapshotDate = useMemo(() => new Date(), [])

  const redirectToLogin = useCallback(() => {
    setPostLoginRedirect(window.location.pathname + window.location.search)
    logout()
    navigate('/')
  }, [navigate])

  useEffect(() => {
    let cancelled = false

    const token = getStoredToken()
    if (!token) {
      setOrderServiceRows([])
      setOsError('Sessão expirada. Faça login novamente.')
      setOsLoading(false)
      return
    }

    const loadOs = async () => {
      setOsLoading(true)
      setOsError(null)
      try {
        const response = await fetch(`${API_URL}/os`, {
          headers: { Authorization: `Bearer ${token}` }
        })

        if (response.status === 401) {
          setOrderServiceRows([])
          redirectToLogin()
          return
        }

        if (!response.ok) {
          const message = await response.text()
          throw new Error(message || 'Erro ao carregar ordens de serviço.')
        }

        const data = await response.json()
        if (cancelled) return

        const rows = Array.isArray(data?.os) ? data.os : []
        setOrderServiceRows(rows)
      } catch (error) {
        if (!cancelled) {
          setOrderServiceRows([])
          setOsError(
            error instanceof Error
              ? error.message
              : 'Erro ao carregar ordens de serviço.'
          )
        }
      } finally {
        if (!cancelled) {
          setOsLoading(false)
        }
      }
    }

    loadOs()

    return () => {
      cancelled = true
    }
  }, [redirectToLogin])

  useEffect(() => {
    const unsubscribe = subscribeToUserChanges(() => {
      setCurrentUser(getStoredUser())
    })
    return unsubscribe
  }, [])

  useEffect(() => {
    setSelectedCoord(getUserCoord(currentUser))
  }, [currentUser])

  useEffect(() => {
    let cancelled = false
    setActionsLoading(true)
    setActionsError(null)

    const token = getStoredToken()
    if (!token) {
      setActions([])
      setActionsLoading(false)
      setActionsError('Sessão expirada. Faça login novamente para ver as ações pendentes.')
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

        const payload = await response.json()
        if (cancelled) return

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
        if (!cancelled) {
          setActions([])
          setActionsError(
            error instanceof Error ? error.message : 'Erro ao carregar ações pendentes.'
          )
        }
      } finally {
        if (!cancelled) {
          setActionsLoading(false)
        }
      }
    }

    loadActions()

    return () => {
      cancelled = true
    }
  }, [currentUser])

  useEffect(() => {
    let cancelled = false
    setPlanAssetsLoading(true)
    setPlanAssetsError(null)

    const token = getStoredToken()
    if (!token) {
      setPlanAssets([])
      setPlanAssetsLoading(false)
      setPlanAssetsError('Sessão expirada. Faça login novamente.')
      return
    }

    const loadPlanAssets = async () => {
      try {
        const url = new URL(`${API_URL}/planejamento/ativos`)
        url.searchParams.set('year_month', planYearMonth)
        if (selectedCoord) {
          url.searchParams.set('coordenacao', selectedCoord)
        }
        if (selectedTeam) {
          url.searchParams.set('equipe', selectedTeam)
        }
        const response = await fetch(url.toString(), {
          headers: { Authorization: `Bearer ${token}` }
        })

        if (response.status === 401) {
          redirectToLogin()
          return
        }

        if (!response.ok) {
          const message = await response.text()
          throw new Error(
            message || 'Erro ao carregar os ativos do planejamento.'
          )
        }

        const data = await response.json()
        if (cancelled) return

        const rows = Array.isArray(data?.ativos) ? data.ativos : []
        setPlanAssets(rows.map((row: Record<string, unknown>) => normalizePlanAssetRow(row)))
      } catch (error) {
        if (!cancelled) {
          setPlanAssets([])
          setPlanAssetsError(
            error instanceof Error
              ? error.message
              : 'Erro ao carregar os ativos do planejamento.'
          )
        }
      } finally {
        if (!cancelled) {
          setPlanAssetsLoading(false)
        }
      }
    }

    loadPlanAssets()

    return () => {
      cancelled = true
    }
  }, [planYearMonth, selectedCoord, selectedTeam, redirectToLogin])

  useEffect(() => {
    let cancelled = false
    setAssetsLoading(true)
    setAssetsError(null)

    const token = getStoredToken()
    if (!token) {
      setAssetSummaries([])
      setAssetsLoading(false)
      setAssetsError('Sessão expirada. Faça login novamente.')
      return
    }

    const loadAssets = async () => {
      try {
        const response = await fetch(`${API_URL}/ativos`, {
          headers: { Authorization: `Bearer ${token}` }
        })

        if (response.status === 401) {
          redirectToLogin()
          return
        }

        if (!response.ok) {
          const message = await getApiErrorMessage(
            response,
            'Erro ao carregar ativos.'
          )
          throw new Error(message)
        }

        const data = await response.json()
        if (cancelled) return

        const rows = Array.isArray(data?.ativos) ? data.ativos : []
        setAssetSummaries(rows.map((row: Record<string, unknown>) => normalizeAssetRow(row)))
      } catch (error) {
        if (!cancelled) {
          setAssetSummaries([])
          setAssetsError(
            error instanceof Error ? error.message : 'Erro ao carregar ativos.'
          )
        }
      } finally {
        if (!cancelled) {
          setAssetsLoading(false)
        }
      }
    }

    loadAssets()

    return () => {
      cancelled = true
    }
  }, [redirectToLogin])

  useEffect(() => {
    let cancelled = false
    setComponentsLoading(true)
    setComponentsError(null)

    const token = getStoredToken()
    if (!token) {
      setComponentSummaries([])
      setComponentsLoading(false)
      setComponentsError('Sessão expirada. Faça login novamente.')
      return
    }

    const loadComponents = async () => {
      try {
        const response = await fetch(`${API_URL}/componentes`, {
          headers: { Authorization: `Bearer ${token}` }
        })

        if (response.status === 401) {
          redirectToLogin()
          return
        }

        if (!response.ok) {
          const message = await getApiErrorMessage(
            response,
            'Erro ao carregar componentes.'
          )
          throw new Error(message)
        }

        const data = await response.json()
        if (cancelled) return

        const list = Array.isArray(data.componentes)
          ? data.componentes
          : Array.isArray(data)
            ? data
            : []
        setComponentSummaries(
          list.map((row: Record<string, unknown>) => normalizeComponentRow(row))
        )
      } catch (error) {
        if (!cancelled) {
          setComponentSummaries([])
          setComponentsError(
            error instanceof Error
              ? error.message
              : 'Erro ao carregar componentes.'
          )
        }
      } finally {
        if (!cancelled) {
          setComponentsLoading(false)
        }
      }
    }

    loadComponents()

    return () => {
      cancelled = true
    }
  }, [redirectToLogin])

  useEffect(() => {
    let cancelled = false
    setNotesLoading(true)
    setNotesError(null)

    const token = getStoredToken()
    if (!token) {
      setNotes([])
      setNotesLoading(false)
      setNotesError('Sessão expirada. Faça login novamente.')
      return
    }

    const loadNotes = async () => {
      try {
        const response = await fetch(`${API_URL}/notas`, {
          headers: { Authorization: `Bearer ${token}` }
        })

        if (response.status === 401) {
          redirectToLogin()
          return
        }

        if (!response.ok) {
          const message = await getApiErrorMessage(
            response,
            'Erro ao carregar notas.'
          )
          throw new Error(message)
        }

        const data = await response.json()
        if (cancelled) return

        const rows = Array.isArray(data.notas) ? data.notas : []
        setNotes(rows.map((row: Record<string, unknown>) => normalizeNotaRow(row)))
      } catch (error) {
        if (!cancelled) {
          setNotes([])
          setNotesError(
            error instanceof Error ? error.message : 'Erro ao carregar notas.'
          )
        }
      } finally {
        if (!cancelled) {
          setNotesLoading(false)
        }
      }
    }

    loadNotes()

    return () => {
      cancelled = true
    }
  }, [redirectToLogin])

  const teamOptions = useMemo(() => {
    const values = new Set<string>()
    orderServiceRows.forEach(row => {
      const team = (row.estrutura_equipe ?? row.ATIVO_EQUIPE ?? '').trim()
      if (team) {
        values.add(team)
      }
    })
    return Array.from(values).sort((a, b) =>
      a.localeCompare(b, 'pt-BR', { sensitivity: 'base' })
    )
  }, [orderServiceRows])

  const userRoleText = useMemo(
    () => (currentUser?.cargo ?? currentUser?.role ?? '').toLowerCase(),
    [currentUser]
  )
  const canViewAllActions = useMemo(
    () =>
      userRoleText.includes('coordenador') ||
      userRoleText.includes('gerente'),
    [userRoleText]
  )

  const programDateOptions = useMemo(() => {
    const set = new Set<string>()
    orderServiceRows.forEach(row => {
      const date = getNextProgramDate(row)
      if (date) {
        set.add(`${date.getFullYear()}-${date.getMonth() + 1}`)
      }
    })
    return Array.from(set)
      .map(value => {
        const [year, month] = value.split('-').map(Number)
        return { year, month }
      })
      .sort((a, b) => (a.year === b.year ? a.month - b.month : a.year - b.year))
  }, [orderServiceRows])

  const yearOptions = useMemo(() => {
    const years = new Set<number>()
    programDateOptions.forEach(item => years.add(item.year))
    years.add(currentYear)
    return Array.from(years).sort((a, b) => b - a)
  }, [programDateOptions, currentYear])

  const monthOptions = useMemo(() => {
    const months = new Set<number>()
    programDateOptions.forEach(item => months.add(item.month))
    months.add(currentMonth + 1)
    return Array.from(months)
      .sort((a, b) => a - b)
      .filter(Boolean)
  }, [programDateOptions, currentMonth])

  const coordOptions = useMemo(() => {
    const values = new Set<string>()
    orderServiceRows.forEach(row => {
      const coord = getRowCoord(row)
      if (coord) {
        values.add(coord)
      }
    })
    return Array.from(values).sort((a, b) =>
      a.localeCompare(b, 'pt-BR', { sensitivity: 'base' })
    )
  }, [orderServiceRows])

  useEffect(() => {
    if (selectedTeam && !teamOptions.includes(selectedTeam)) {
      setSelectedTeam('')
    }
  }, [selectedTeam, teamOptions])

  const filteredRows = useMemo(() => {
    return orderServiceRows.filter(row => {
      const team = (row.estrutura_equipe ?? row.ATIVO_EQUIPE ?? '').trim()
      if (selectedTeam && team !== selectedTeam) {
        return false
      }
      if (selectedCoord) {
        const coord = getRowCoord(row)
        if (coord.toLowerCase() !== selectedCoord.toLowerCase()) {
          return false
        }
      }
      const date = getNextProgramDate(row)
      if (date) {
        if (selectedYear && date.getFullYear() !== selectedYear) {
          return false
        }
        if (selectedMonth && date.getMonth() + 1 !== selectedMonth) {
          return false
        }
      }
      return true
    })
  }, [
    orderServiceRows,
    selectedTeam,
    selectedCoord,
    selectedYear,
    selectedMonth
  ])

  const rowsWithoutCancelled = useMemo(
    () =>
      filteredRows.filter(
        row => normalizeStatus(row.os_status) !== 'CANCELADO'
      ),
    [filteredRows]
  )

  const statusByTeam = useMemo(() => {
    const map = new Map<string, { planeja: number; programada: number; realizada: number }>()
    rowsWithoutCancelled.forEach(row => {
      const team = (row.estrutura_equipe ?? row.ATIVO_EQUIPE ?? '').trim() || 'Sem equipe'
      const status = normalizeStatus(row.os_status)
      if (!map.has(team)) {
        map.set(team, { planeja: 0, programada: 0, realizada: 0 })
      }
      const entry = map.get(team)!
      if (status === 'CRIADO') {
        entry.planeja += 1
      } else if (status === 'PROGRAMADO') {
        entry.programada += 1
      } else if (status === 'REALIZADO') {
        entry.realizada += 1
      }
    })
    return Array.from(map.entries()).map(([team, stats]) => ({ team, ...stats }))
  }, [rowsWithoutCancelled])

  const pendingActions = useMemo(() => {
    const pending = actions.filter(action => isPendingActionStatus(action.status))
    if (canViewAllActions || !currentUser) {
      return pending
    }
    return pending.filter(action => isActionAssignedToUser(action, currentUser))
  }, [actions, canViewAllActions, currentUser])

  const statusCounts = useMemo(
    () => buildStatusCounts(rowsWithoutCancelled),
    [rowsWithoutCancelled]
  )
  const upcomingItems = useMemo(
    () => buildUpcomingRows(filteredRows),
    [filteredRows]
  )
  const totalOs = rowsWithoutCancelled.length
  const pendingOs = statusCounts.CRIADO + statusCounts.PROGRAMADO

  const totalPlannedHH = planningSnapshots.reduce(
    (sum, plan) => sum + plan.scheduledHH,
    0
  )
  const totalRealizedHH = planningSnapshots.reduce(
    (sum, plan) => sum + plan.realizedHH,
    0
  )
  const averageAdherence =
    totalPlannedHH > 0 ? totalRealizedHH / totalPlannedHH : 0
  const adherenceBase =
    totalPlannedHH > 0 ? totalRealizedHH / totalPlannedHH : 0
  const weeklyAdherence = useMemo(() => {
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate()
    const weeks = Math.ceil(daysInMonth / 7)
    return Array.from({ length: weeks }, (_, index) => {
      const decay = Math.min(0.05 * index, 0.3)
      const value = Math.max(0, Math.min(1, adherenceBase - decay))
      return { week: index + 1, value }
    })
  }, [adherenceBase, currentYear, currentMonth])

  const planningHighlights = [
    {
      label: 'Horas programadas',
      value: `${totalPlannedHH.toLocaleString('pt-BR')} h`,
      description: 'Meta consolidada das equipes'
    },
    {
      label: 'Horas realizadas',
      value: `${totalRealizedHH.toLocaleString('pt-BR')} h`,
      description: 'Execução registrada'
    },
    {
      label: 'Aderência média',
      value: `${(averageAdherence * 100).toFixed(1)}%`,
      description: 'Objetivo ≥ 90%'
    }
  ]
  const assetsMissingOsCount = useMemo(() => {
    const selectedYearNumber = Number(selectedYear)
    const selectedMonthNumber = Number(selectedMonth)
    const createdCodpes = new Set<string>()
    orderServiceRows.forEach(row => {
      const codpe = (row.ATIVO_CODPE ?? '').trim()
      const rowYear = Number(row.os_ano)
      const rowMonth = Number(row.os_mes)
      if (
        codpe &&
        Number.isFinite(rowYear) &&
        Number.isFinite(rowMonth) &&
        rowYear === selectedYearNumber &&
        rowMonth === selectedMonthNumber
      ) {
        createdCodpes.add(codpe)
      }
    })
    return planAssets.reduce((count, asset) => {
      const codpe = asset.codpe.trim()
      if (!codpe || createdCodpes.has(codpe)) {
        return count
      }
      return count + 1
    }, 0)
  }, [orderServiceRows, planAssets, selectedMonth, selectedYear])

  const backlogAssetsCount = useMemo(() => {
    return assetSummaries.reduce((count, asset) => {
      const last = parseNullableDate(asset.ATIVO_ULTIMA_MANUT ?? '')
      const cycleDays = parseCycleToDays(asset.ATIVO_CICLO ?? null)
      if (!last || cycleDays === null) {
        return count
      }
      const nextDue = addDays(last, cycleDays)
      if (nextDue < dashboardSnapshotDate) {
        return count + 1
      }
      return count
    }, 0)
  }, [assetSummaries, dashboardSnapshotDate])

  const expiredBatteriesCount = useMemo(() => {
    return componentSummaries.reduce((count, component) => {
      const targetText = `${component.COMP_NOME} ${component.COMP_DESCRICAO ?? ''}`.toLowerCase()
      if (!targetText.includes('bateria')) {
        return count
      }
      const installed = parseNullableDate(component.COMP_DATA ?? '')
      if (!installed) {
        return count
      }
      const expiry = new Date(installed)
      expiry.setFullYear(expiry.getFullYear() + 4)
      if (expiry <= dashboardSnapshotDate) {
        return count + 1
      }
      return count
    }, 0)
  }, [componentSummaries, dashboardSnapshotDate])

  const upcomingOsCodpes = useMemo(() => {
    const threshold = new Date(dashboardSnapshotDate)
    threshold.setDate(threshold.getDate() + 10)
    const set = new Set<string>()
    orderServiceRows.forEach(row => {
      const nextDate = getNextProgramDate(row)
      if (!nextDate) return
      if (nextDate < dashboardSnapshotDate || nextDate > threshold) return
      const codpe = (row.ATIVO_CODPE ?? '').trim()
      if (codpe) {
        set.add(codpe)
      }
    })
    return set
  }, [orderServiceRows, dashboardSnapshotDate])

  const scheduledNotasCount = useMemo(() => {
    return notes.reduce((count, nota) => {
      const codpe = nota.ATIVO_CODPE.trim()
      if (nota.nota_status === 'Programado' && codpe && upcomingOsCodpes.has(codpe)) {
        return count + 1
      }
      return count
    }, 0)
  }, [notes, upcomingOsCodpes])

  const farolError =
    planAssetsError || assetsError || componentsError || notesError

  const farolItems = [
    {
      id: 'planned-missing-os',
      title: 'Ativos sem OS criadas',
      description: 'Ativos com datas de vencimento para o mes atual sem OS criadas.',
      count: assetsMissingOsCount,
      loading: planAssetsLoading || osLoading,
      statusLabel:
        assetsMissingOsCount > 0 ? 'Atenção necessária' : 'Planejamento em dia',
      warning: assetsMissingOsCount > 0
    },
    {
      id: 'backlog-assets',
      title: 'Ativos em backlog',
      description: 'Última manutenção + ciclo já excedido.',
      count: backlogAssetsCount,
      loading: assetsLoading,
      statusLabel: backlogAssetsCount > 0 ? 'Backlog em aberto' : 'Sem backlog',
      warning: backlogAssetsCount > 0
    },
    {
      id: 'battery-expired',
      title: 'Baterias vencidas',
      description: 'Componentes tipo bateria com >4 anos de vida útil.',
      count: expiredBatteriesCount,
      loading: componentsLoading,
      statusLabel:
        expiredBatteriesCount > 0 ? 'Substituição urgente' : 'Vida útil ok',
      warning: expiredBatteriesCount > 0
    },
    {
      id: 'scheduled-notas',
      title: 'Notas programadas',
      description:
        'Notas com status Programado para ativos com OS nos próximos 10 dias.',
      count: scheduledNotasCount,
      loading: notesLoading || osLoading,
      statusLabel:
        scheduledNotasCount > 0 ? 'Notas críticas' : 'Nada pendente',
      warning: scheduledNotasCount > 0
    }
  ]

  return (
    <section style={pageStyle}>
      <header
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          gap: 12,
          flexWrap: 'wrap'
        }}
      >
        <div>
          <p style={{ margin: 0, fontSize: 13, color: '#64748b' }}>
            Bem-vindo de volta
          </p>
          <h1 style={{ margin: '6px 0', fontSize: 32 }}>Painel de Operações</h1>
        </div>

        <div
          style={{
            display: 'flex',
            gap: 12,
            alignItems: 'flex-end',
            flexWrap: 'wrap'
          }}
        >
          <label
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 4,
              fontSize: 12,
              color: '#64748b',
              minWidth: 180
            }}
          >
            Equipe
            <select
              value={selectedTeam}
              onChange={event => setSelectedTeam(event.target.value)}
              style={{
                borderRadius: 10,
                border: '1px solid #e5e7eb',
                padding: '8px 12px',
                background: '#ffffff',
                color: '#0f172a'
              }}
            >
              <option value="">Todas as equipes</option>
              {teamOptions.map(option => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>

          <label
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 4,
              fontSize: 12,
              color: '#64748b'
            }}
          >
            Coordenação
            <select
              value={selectedCoord}
              onChange={event => setSelectedCoord(event.target.value)}
              style={{
                borderRadius: 10,
                border: '1px solid #e5e7eb',
                padding: '8px 12px',
                background: '#ffffff',
                color: '#0f172a',
                minWidth: 180
              }}
            >
              <option value="">Todas as coordenações</option>
              {coordOptions.map(option => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>

          <label
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 4,
              fontSize: 12,
              color: '#64748b'
            }}
          >
            Ano
            <select
              value={selectedYear}
              onChange={event => setSelectedYear(Number(event.target.value))}
              style={{
                borderRadius: 10,
                border: '1px solid #e5e7eb',
                padding: '8px 12px',
                background: '#ffffff',
                color: '#0f172a'
              }}
            >
              {yearOptions.map(year => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </label>

          <label
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 4,
              fontSize: 12,
              color: '#64748b'
            }}
          >
            Mês
            <select
              value={selectedMonth}
              onChange={event => setSelectedMonth(Number(event.target.value))}
              style={{
                borderRadius: 10,
                border: '1px solid #e5e7eb',
                padding: '8px 12px',
                background: '#ffffff',
                color: '#0f172a'
              }}
            >
              {monthOptions.map(month => (
                <option key={month} value={month}>
                  {MONTH_NAMES[month - 1] ?? month}
                </option>
              ))}
            </select>
          </label>

        </div>
      </header>

      <div style={dashboardGrid}>
        <article style={cardStyle}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 16
            }}
          >
            <div>
              <h2 style={{ margin: 0, fontSize: 20 }}>Ordens de Serviço</h2>
              <p style={{ margin: '6px 0 0', color: '#475569', fontSize: 13 }}>
                Total aberto: {totalOs.toLocaleString('pt-BR')} | Pendentes:{' '}
                {pendingOs.toLocaleString('pt-BR')}
              </p>
            </div>
          </div>
          <div style={cardBodyStyle}>
            <div style={statusGridStyle}>
              {DASHBOARD_STATUS_KEYS.map(statusKey => (
                <div key={statusKey} style={statusCardInnerStyle}>
                  <div
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      letterSpacing: 0.4,
                      color: '#475569',
                      marginBottom: 6
                    }}
                  >
                    {OS_STATUS_LABELS[statusKey]}
                  </div>
                  <div style={{ fontSize: 24, fontWeight: 700 }}>
                    {osLoading ? '...' : statusCounts[statusKey].toLocaleString('pt-BR')}
                  </div>
                  <div
                    style={{
                      marginTop: 6,
                      ...OS_STATUS_VISUALS[statusKey],
                      display: 'inline-flex',
                      padding: '2px 10px',
                      borderRadius: 999,
                      fontSize: 12,
                      fontWeight: 600
                    }}
                  >
                    {statusKey}
                  </div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 16 }}>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 0.9fr 0.9fr 0.9fr',
                  gap: 12,
                  fontSize: 12,
                  fontWeight: 600,
                  color: '#475569',
                  marginBottom: 6
                }}
              >
                <span>Equipe</span>
                <span>Plano</span>
                <span>Programada</span>
                <span>Realizada</span>
              </div>
              {statusByTeam.length ? (
                statusByTeam.map(entry => (
                  <div
                    key={entry.team}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 0.9fr 0.9fr 0.9fr',
                      gap: 12,
                      padding: '6px 0',
                      fontSize: 12,
                      color: '#0f172a',
                      borderTop: '1px solid #f1f5f9'
                    }}
                  >
                    <span>{entry.team}</span>
                    <span>{entry.planeja}</span>
                    <span>{entry.programada}</span>
                    <span>{entry.realizada}</span>
                  </div>
                ))
              ) : (
                <p style={{ margin: 0, color: '#94a3b8', fontSize: 12 }}>
                  Nenhuma equipe com OS pendente encontrada.
                </p>
              )}
            </div>
          </div>
        </article>

        <article style={cardStyle}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 12
            }}
          >
            <div>
              <h2 style={{ margin: 0, fontSize: 20 }}>Aderência semanal do mês atual</h2>
              <p style={{ margin: '6px 0 0', color: '#475569', fontSize: 13 }}>
                Baseado nas horas programadas e realizadas do mês selecionado ({MONTH_NAMES[selectedMonth - 1] ?? selectedMonth}/{selectedYear}).
              </p>
            </div>
          </div>
          <div style={cardBodyStyle}>
            <div style={{ display: 'grid', gap: 6 }}>
              {weeklyAdherence.length ? (
                weeklyAdherence.map(item => (
                  <div
                    key={item.week}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: 13,
                      color: '#0f172a',
                      padding: '6px 10px',
                      borderRadius: 10,
                      border: '1px dashed #e5e7eb',
                      background: '#fdfdfd'
                    }}
                  >
                    <span>Semana {item.week}</span>
                    <span>{(item.value * 100).toFixed(0)}%</span>
                  </div>
                ))
              ) : (
                <p style={{ margin: 0, color: '#94a3b8', fontSize: 13 }}>
                  Nenhum dado de aderência disponível para este mês.
                </p>
              )}
            </div>
          </div>
        </article>

        <article style={cardStyle}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 12
            }}
          >
            <div>
              <h2 style={{ margin: 0, fontSize: 20 }}>Próximas OS programadas</h2>
              <p style={{ margin: '6px 0 0', color: '#475569', fontSize: 13 }}>
                Filtramos as próximas datas já programadas para sua equipe.
              </p>
            </div>
          </div>
          <div style={cardBodyStyle}>
            {osLoading ? (
              <p style={{ margin: 0, color: '#94a3b8' }}>Carregando...</p>
            ) : osError ? (
              <p style={{ margin: 0, color: '#dc2626' }}>{osError}</p>
            ) : upcomingItems.length ? (
              <div style={upcomingListStyle}>
                {upcomingItems.map(item => (
                  <div key={item.id} style={detailRowStyle}>
                    <div>
                      <strong style={{ fontSize: 16 }}>
                        #{item.osNumber.toLocaleString('pt-BR')}
                      </strong>{' '}
                      – {item.asset}
                    </div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <span
                        style={{
                          padding: '4px 10px',
                          borderRadius: 999,
                          fontSize: 12,
                          fontWeight: 600,
                          ...OS_STATUS_VISUALS[item.status]
                        }}
                      >
                        {item.status}
                      </span>
                      <span style={{ fontSize: 12, color: '#475569' }}>
                        {DATE_FORMATTER.format(item.nextDate)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ margin: 0, color: '#94a3b8' }}>
                Nenhuma ordem com data programada foi encontrada.
              </p>
            )}
          </div>
        </article>

        <article style={cardStyle}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 12
            }}
          >
            <div>
              <h2 style={{ margin: 0, fontSize: 20 }}>Ações pendentes</h2>
              <p style={{ margin: '6px 0 0', color: '#475569', fontSize: 13 }}>
                {canViewAllActions
                  ? 'Exibindo todas as ações pendentes'
                  : currentUser?.nome
                  ? `Ações atribuídas a ${currentUser.nome}`
                  : 'Ações vinculadas ao seu usuário'}
              </p>
            </div>
          </div>
          <div style={cardBodyStyle}>
            {actionsLoading ? (
              <p style={{ margin: 0, color: '#94a3b8' }}>Carregando...</p>
            ) : (
              <>
                {actionsError && (
                  <p style={{ margin: 0, color: '#dc2626', fontSize: 13 }}>
                    {actionsError}
                  </p>
                )}
                {pendingActions.length ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 8 }}>
                    {pendingActions.slice(0, 4).map(action => (
                      <div
                        key={action.id_acao}
                        style={{
                          borderRadius: 12,
                          border: '1px solid #e5e7eb',
                          padding: 12,
                          background: '#f8fafc'
                        }}
                      >
                        <div
                          style={{
                            fontWeight: 600,
                            marginBottom: 6,
                            color: '#0f172a'
                          }}
                        >
                          #{action.id_acao.toLocaleString('pt-BR')} –{' '}
                          {action.texto_acao || 'Sem descrição'}
                        </div>
                        <div
                          style={{
                            display: 'flex',
                            gap: 12,
                            flexWrap: 'wrap',
                            fontSize: 12,
                            color: '#475569'
                          }}
                        >
                          <span>Grupo: {action.grupo_acao || '—'}</span>
                          <span>Origem: {action.origem_acao || '—'}</span>
                        </div>
                        <div
                          style={{
                            display: 'flex',
                            gap: 12,
                            alignItems: 'center',
                            marginTop: 8,
                            flexWrap: 'wrap'
                          }}
                        >
                          <span
                            style={{
                              padding: '4px 10px',
                              borderRadius: 999,
                              fontSize: 12,
                              fontWeight: 600,
                              ...ACTION_STATUS_STYLES[action.status]
                            }}
                          >
                            {action.status}
                          </span>
                          <span
                            style={{
                              fontSize: 12,
                              fontWeight: 600,
                              color: '#475569'
                            }}
                          >
                            Vencimento: {formatActionDate(action.data_vencimento)}
                          </span>
                          <span style={{ fontSize: 12, color: '#475569' }}>
                            Responsável: {action.id_usuario_responsavel || '—'}
                          </span>
                        </div>
                      </div>
                    ))}
                    {pendingActions.length > 4 && (
                      <p style={{ margin: 0, fontSize: 12, color: '#64748b' }}>
                        {pendingActions.length - 4} outras ações pendentes não estão listadas acima.
                      </p>
                    )}
                  </div>
                ) : (
                  <p style={{ margin: 0, color: '#94a3b8' }}>Nenhuma ação pendente encontrada.</p>
                )}
              </>
            )}
          </div>
        </article>
      </div>

      <div style={dashboardGrid}>
        {farolItems.map(card => (
          <article key={card.id} style={cardStyle}>
            <div style={{ marginBottom: 12 }}>
              <h2 style={{ margin: 0, fontSize: 20 }}>{card.title}</h2>
            </div>
            <div style={cardBodyStyle}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <strong style={farolValueStyle}>
                  {card.loading
                    ? '...'
                    : card.count.toLocaleString('pt-BR')}
                </strong>
                <span style={farolDescriptionStyle}>{card.description}</span>
                <span
                  style={{
                    ...farolStatusStyle,
                    color: card.warning ? '#b45309' : '#16a34a'
                  }}
                >
                  {card.statusLabel}
                </span>
              </div>
            </div>
          </article>
        ))}
      </div>
      {farolError && (
        <p style={{ marginTop: 12, color: '#dc2626', fontSize: 13 }}>
          {farolError}
        </p>
      )}

      <article style={cardStyle}>
        <h2 style={{ marginTop: 0, fontSize: 20 }}>Planejamento</h2>
        <p style={{ marginTop: 6, marginBottom: 18, color: '#475569', fontSize: 13 }}>
          Entenda se a equipe está alinhada com as metas de horas e atividade.
        </p>

        <div style={planningHighlightsStyle}>
          {planningHighlights.map(highlight => (
            <div key={highlight.label} style={highlightCardStyle}>
              <div style={{ fontSize: 12, color: '#475569', marginBottom: 4 }}>
                {highlight.label}
              </div>
              <div style={{ fontSize: 22, fontWeight: 700 }}>{highlight.value}</div>
              <div style={{ fontSize: 12, color: '#64748b', marginTop: 6 }}>
                {highlight.description}
              </div>
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gap: 16 }}>
          {planningSnapshots.map(plan => {
            const adherence = plan.scheduledHH
              ? Math.min(plan.realizedHH / plan.scheduledHH, 1)
              : 0
            return (
              <div
                key={plan.id}
                style={{
                  borderRadius: 16,
                  border: '1px solid #e5e7eb',
                  padding: 16
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'baseline',
                    marginBottom: 10
                  }}
                >
                  <strong>{plan.label}</strong>
                  <span style={{ fontSize: 12, color: '#475569' }}>
                    {Math.round(adherence * 100)}% de aderência
                  </span>
                </div>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
                    gap: 12,
                    marginBottom: 12
                  }}
                >
                  <div>
                    <div style={{ fontSize: 12, color: '#475569' }}>Horas programadas</div>
                    <div style={{ fontWeight: 700 }}>
                      {plan.scheduledHH.toLocaleString('pt-BR')} h
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 12, color: '#475569' }}>Horas realizadas</div>
                    <div style={{ fontWeight: 700 }}>
                      {plan.realizedHH.toLocaleString('pt-BR')} h
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 12, color: '#475569' }}>MPs</div>
                    <div style={{ fontWeight: 700 }}>
                      {plan.mpCount} · {plan.mpHH.toLocaleString('pt-BR')} h
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 12, color: '#475569' }}>MCs</div>
                    <div style={{ fontWeight: 700 }}>
                      {plan.mcCount} · {plan.mcHH.toLocaleString('pt-BR')} h
                    </div>
                  </div>
                </div>
                <div style={progressTrackStyle}>
                  <div
                    style={{
                      width: `${Math.round(adherence * 100)}%`,
                      height: '100%',
                      background: adherence >= 0.9 ? '#16a34a' : '#f97316'
                    }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </article>

    </section>
  )
}
