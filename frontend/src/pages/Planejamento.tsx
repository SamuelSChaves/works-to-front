import { type CSSProperties, useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Modal } from '../components/Modal'
import { API_URL } from '../services/api'
import { getStoredToken, logout, setPostLoginRedirect } from '../services/auth'

type Technician = {
  id: string
  name: string
  coordenacao: string
  equipe: string
}

type TechnicianRow = {
  id: string
  nome: string
  coordenacao: string
  equipe: string
}

type TechnicianState = {
  id: string
  name: string
  vacation: boolean
  vacationDays: number
  workingDays: number
  dailyHours: number
}

type ActivityType = 'Treinamento' | 'Reunião'

type Activity = {
  id: string
  type: ActivityType
  description: string
  hours: number
  mandatory: boolean
}

type OSSummary = {
  mpCount: number
  mpHH: number
  mcCount: number
  mcHH: number
}

type PlanDetail = {
  technicians: TechnicianState[]
  activities: Activity[]
  osSummary: OSSummary
}

type PlanAsset = {
  id: string
  codpe: string
  description: string
  sigla: string
  cycle: string
  lastMaintenance: string | null
  dueDate: string | null
}

type PlanSummary = {
  id: string
  yearMonth: string
  coordinator: string
  team: string
  scheduledHH: number
  realizedHH: number
  detail: PlanDetail
}

type PlanBlueprint = Omit<PlanSummary, 'detail'> & {
  osSummary: OSSummary
}

type CreatePlanDraft = {
  yearMonth: string
  coordinator: string
  team: string
  technicians: TechnicianState[]
  activities: Activity[]
  osSummary: OSSummary
  scheduledHH: number
  realizedHH: number
  selectedAssetIds: string[]
}

const monthSelectList = [
  { value: '01', label: 'Janeiro' },
  { value: '02', label: 'Fevereiro' },
  { value: '03', label: 'Março' },
  { value: '04', label: 'Abril' },
  { value: '05', label: 'Maio' },
  { value: '06', label: 'Junho' },
  { value: '07', label: 'Julho' },
  { value: '08', label: 'Agosto' },
  { value: '09', label: 'Setembro' },
  { value: '10', label: 'Outubro' },
  { value: '11', label: 'Novembro' },
  { value: '12', label: 'Dezembro' }
]

const defaultYearMonth = (() => {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
})()

function formatYearMonth(year: string, month: string) {
  return `${year}-${month.padStart(2, '0')}`
}

function parseYearMonth(value?: string) {
  const base = (value || defaultYearMonth).trim()
  const [yearPart, monthPart] = base.split('-')
  const year = yearPart || defaultYearMonth.slice(0, 4)
  const month = (monthPart || defaultYearMonth.slice(5, 7)).padStart(2, '0')
  return { year, month }
}

const technicianTemplates: Technician[] = [
  { id: 'tech-ana', name: 'Ana Lima', coordenacao: 'Coordenação Norte', equipe: 'Equipe Alfa' },
  { id: 'tech-bruno', name: 'Bruno Costa', coordenacao: 'Coordenação Norte', equipe: 'Equipe Alfa' },
  { id: 'tech-carol', name: 'Carol Silva', coordenacao: 'Coordenação Norte', equipe: 'Equipe Alfa' },
  { id: 'tech-diego', name: 'Diego Prado', coordenacao: 'Coordenação Sul', equipe: 'Equipe Beta' },
  { id: 'tech-elaine', name: 'Elaine Rocha', coordenacao: 'Coordenação Sul', equipe: 'Equipe Beta' },
  { id: 'tech-fabio', name: 'Fábio Lima', coordenacao: 'Coordenação Sul', equipe: 'Equipe Beta' },
  { id: 'tech-gustavo', name: 'Gustavo Melo', coordenacao: 'Coordenação Central', equipe: 'Equipe Gama' },
  { id: 'tech-henrique', name: 'Henrique Vaz', coordenacao: 'Coordenação Central', equipe: 'Equipe Gama' },
  { id: 'tech-iris', name: 'Íris Paiva', coordenacao: 'Coordenação Central', equipe: 'Equipe Gama' }
]

const planBlueprints: PlanBlueprint[] = [
  {
    id: 'plan-2025-01-alfa',
    yearMonth: '2025-01',
    coordinator: 'Coordenação Norte',
    team: 'Equipe Alfa',
    scheduledHH: 205,
    realizedHH: 195,
    osSummary: { mpCount: 18, mpHH: 132, mcCount: 7, mcHH: 78 }
  },
  {
    id: 'plan-2025-01-beta',
    yearMonth: '2025-01',
    coordinator: 'Coordenação Sul',
    team: 'Equipe Beta',
    scheduledHH: 188,
    realizedHH: 166,
    osSummary: { mpCount: 15, mpHH: 118, mcCount: 6, mcHH: 72 }
  },
  {
    id: 'plan-2025-02-gama',
    yearMonth: '2025-02',
    coordinator: 'Coordenação Central',
    team: 'Equipe Gama',
    scheduledHH: 210,
    realizedHH: 188,
    osSummary: { mpCount: 20, mpHH: 145, mcCount: 8, mcHH: 88 }
  }
]

function buildPlanDetail(blueprint: PlanBlueprint): PlanDetail {
  const technicians = technicianTemplates
    .filter(template => template.equipe === blueprint.team)
    .map(template => ({
      id: `${template.id}-${blueprint.id}`,
      name: template.name,
      vacation: false,
      vacationDays: 0,
      workingDays: 22,
      dailyHours: 8
    }))

  const activities: Activity[] = [
    {
      id: `${blueprint.id}-activity-1`,
      type: 'Treinamento',
      description: 'Integração PCM e indicadores',
      hours: 12,
      mandatory: true
    },
    {
      id: `${blueprint.id}-activity-2`,
      type: 'Reunião',
      description: 'Planejamento semanal',
      hours: 6,
      mandatory: true
    }
  ]

  return {
    technicians,
    activities,
    osSummary: blueprint.osSummary
  }
}

function generateInitialPlans(): PlanSummary[] {
  return planBlueprints.map(({ osSummary, ...planBase }) => ({
    ...planBase,
    detail: buildPlanDetail({ ...planBase, osSummary })
  }))
}

const tabLabels = [
  'Capacidade da Equipe',
  'Treinamentos e Reuniões',
  'Planejamento de OS',
  'Resultado'
]

const pageContainerStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 24,
  width: '100%',
  color: '#0f172a'
}

const pageHeaderStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 6
}

const cardStyle: CSSProperties = {
  borderRadius: 18,
  border: '1px solid #e5e7eb',
  background: '#ffffff',
  boxShadow: '0 20px 40px rgba(15, 23, 42, 0.08)'
}

const filterGridStyle: CSSProperties = {
  display: 'grid',
  gap: 16,
  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))'
}

const filterLabelStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 6
}

const filterLabelTextStyle: CSSProperties = {
  fontSize: 12,
  textTransform: 'uppercase',
  letterSpacing: 0.5,
  color: '#475569',
  fontWeight: 600
}

const inputFieldStyle: CSSProperties = {
  padding: '10px 12px',
  borderRadius: 10,
  border: '1px solid #cbd5f5',
  background: '#f8fafc',
  color: '#0f172a',
  fontSize: 14
}

const selectFieldStyle: CSSProperties = {
  ...inputFieldStyle,
  appearance: 'none',
  WebkitAppearance: 'none',
  MozAppearance: 'none'
}

const tableContainerStyle: CSSProperties = {
  width: '100%',
  overflowX: 'auto'
}

const tableStyle: CSSProperties = {
  width: '100%',
  borderCollapse: 'collapse'
}

const tableHeaderCellStyle: CSSProperties = {
  textAlign: 'left',
  padding: '14px 16px',
  fontSize: 12,
  letterSpacing: 0.5,
  textTransform: 'uppercase',
  color: '#475569'
}

const tableCellStyle: CSSProperties = {
  padding: '14px 16px',
  fontSize: 14,
  color: '#0f172a'
}

const detailTableStyle: CSSProperties = {
  width: '100%',
  borderCollapse: 'collapse'
}

const detailHeaderCellStyle: CSSProperties = {
  padding: '10px 12px',
  borderBottom: '1px solid #e5e7eb',
  textAlign: 'left',
  fontSize: 12,
  textTransform: 'uppercase',
  letterSpacing: 0.5,
  color: '#475569'
}

const detailCellStyle: CSSProperties = {
  padding: '10px 12px',
  borderBottom: '1px solid #f1f5f9',
  color: '#0f172a',
  fontSize: 14
}

const inlineInputStyle: CSSProperties = {
  padding: '6px 8px',
  borderRadius: 8,
  border: '1px solid #e2e8f0',
  width: 80,
  fontSize: 14,
  color: '#0f172a'
}

const assetListStyle: CSSProperties = {
  border: '1px solid #e5e7eb',
  borderRadius: 14,
  padding: 12,
  background: '#f8fafc',
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
  minHeight: 160,
  maxHeight: 260,
  overflowY: 'auto'
}

const assetListItemStyle: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  gap: 12,
  alignItems: 'center',
  width: '100%',
  borderRadius: 12,
  border: '1px solid transparent',
  padding: '10px 12px',
  background: '#ffffff',
  cursor: 'pointer',
  textAlign: 'left'
}

const assetBadgeStyle: CSSProperties = {
  borderRadius: 999,
  background: '#e0f2fe',
  color: '#0f172a',
  padding: '2px 10px',
  fontSize: 12,
  fontWeight: 600
}

const assetListEmptyStyle: CSSProperties = {
  margin: 0,
  color: '#64748b',
  fontSize: 13,
  textAlign: 'center'
}

const assetActionButtonStyle: CSSProperties = {
  padding: '10px 16px',
  borderRadius: 10,
  border: '1px solid #2563eb',
  background: '#2563eb',
  color: '#ffffff',
  fontWeight: 600,
  cursor: 'pointer'
}

const metricCardStyle: CSSProperties = {
  borderRadius: 14,
  border: '1px solid #e5e7eb',
  padding: 16,
  background: '#f8fafc'
}

const progressTrackStyle: CSSProperties = {
  width: '100%',
  height: 12,
  borderRadius: 6,
  background: '#e5e7eb',
  overflow: 'hidden'
}

const progressBarStyle = (value: number): CSSProperties => ({
  width: `${Math.min(100, value * 100)}%`,
  height: '100%',
  background: value >= 0.9 ? '#22c55e' : '#f87171',
  borderRadius: 6
})

const modalTabButtonStyle: CSSProperties = {
  padding: '8px 16px',
  borderRadius: 999,
  border: '1px solid #e5e7eb',
  background: '#f8fafc',
  color: '#1e293b',
  fontWeight: 600,
  cursor: 'pointer'
}

const modalTabContentStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 16,
  marginTop: 16
}

const modalTabHeaderStyle: CSSProperties = {
  display: 'flex',
  gap: 8,
  flexWrap: 'wrap'
}

async function getApiErrorMessage(response: Response, fallback: string) {
  if (response.status === 403) {
    return 'Você não tem permissão para executar esta operação.'
  }
  const message = await response.text()
  return message || fallback
}
export function Planejamento() {
  const navigate = useNavigate()
  const [plans, setPlans] = useState<PlanSummary[]>(() => generateInitialPlans())
  const [selectedPlanId, setSelectedPlanId] = useState(plans[0]?.id ?? '')
  const [detailActiveTab, setDetailActiveTab] = useState(0)
  const [filters, setFilters] = useState({
    yearMonth: plans[0]?.yearMonth ?? '',
    coordinator: '',
    team: ''
  })
  const [filtersError, setFiltersError] = useState<string | null>(null)
  const [coordenacoes, setCoordenacoes] = useState<string[]>([])
  const [equipesByCoord, setEquipesByCoord] = useState<Record<string, string[]>>({})
  const [detailActivityDraft, setDetailActivityDraft] = useState({
    type: 'Treinamento' as ActivityType,
    description: '',
    hours: 1,
    mandatory: true
  })
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [createPlanDraft, setCreatePlanDraft] = useState<CreatePlanDraft>({
    yearMonth: '',
    coordinator: '',
    team: '',
    technicians: [],
    activities: [],
    osSummary: { mpCount: 0, mpHH: 0, mcCount: 0, mcHH: 0 },
    scheduledHH: 0,
    realizedHH: 0,
    selectedAssetIds: []
  })
  const [createActivityDraft, setCreateActivityDraft] = useState({
    type: 'Treinamento' as ActivityType,
    description: '',
    hours: 1,
    mandatory: true
  })
  const [createActiveTab, setCreateActiveTab] = useState(0)
  const [isTeamTechniciansLoading, setIsTeamTechniciansLoading] = useState(false)
  const [teamTechniciansError, setTeamTechniciansError] = useState<string | null>(null)
  const [availablePlanAssets, setAvailablePlanAssets] = useState<PlanAsset[]>([])
  const [isPlanAssetsLoading, setIsPlanAssetsLoading] = useState(false)
  const [planAssetsError, setPlanAssetsError] = useState<string | null>(null)
  const [planAssetSearch, setPlanAssetSearch] = useState('')

  const redirectToLogin = useCallback(() => {
    setPostLoginRedirect(window.location.pathname + window.location.search)
    logout()
    navigate('/')
  }, [navigate])

  const handleOpenDetailModal = (planId: string) => {
    setSelectedPlanId(planId)
    setDetailActiveTab(0)
    setIsDetailModalOpen(true)
  }

  const handleCloseDetailModal = () => {
    setIsDetailModalOpen(false)
  }

  const fetchWithAuth = useCallback(
    async (url: string, fallback: string, init?: RequestInit) => {
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

  const loadTeamTechnicians = useCallback(
    async (coordinator: string, team: string) => {
      if (!coordinator || !team) {
        setCreatePlanDraft(prev => ({ ...prev, technicians: [] }))
        return
      }

      setTeamTechniciansError(null)
      setIsTeamTechniciansLoading(true)
      try {
        const url = new URL(`${API_URL}/planejamento/technicians`)
        url.searchParams.set('coordenacao', coordinator)
        url.searchParams.set('equipe', team)
        const response = await fetchWithAuth(
          url.toString(),
          'Erro ao carregar os técnicos da equipe.'
        )
        const data = await response.json()
        const rows = Array.isArray(data?.technicians) ? data.technicians : []
        const technicians = rows.map((row: TechnicianRow, index: number) => ({
          id: `${row.id}-${team}-${index}`,
          name: row.nome || row.id,
          vacation: false,
          vacationDays: 0,
          workingDays: 22,
          dailyHours: 8
        }))
        setCreatePlanDraft(prev => ({ ...prev, technicians }))
      } catch (error) {
        setTeamTechniciansError(
          error instanceof Error
            ? error.message
            : 'Erro ao carregar os técnicos da equipe.'
        )
        setCreatePlanDraft(prev => ({ ...prev, technicians: [] }))
      } finally {
        setIsTeamTechniciansLoading(false)
      }
    },
    [fetchWithAuth]
  )

  const loadPlanAssets = useCallback(
    async (coordinator: string, team: string, yearMonth: string) => {
      if (!coordinator || !team || !yearMonth) {
        setAvailablePlanAssets([])
        return
      }
      setPlanAssetsError(null)
      setIsPlanAssetsLoading(true)
      try {
        const url = new URL(`${API_URL}/planejamento/ativos`)
        url.searchParams.set('coordenacao', coordinator)
        url.searchParams.set('equipe', team)
        url.searchParams.set('year_month', yearMonth)
        const response = await fetchWithAuth(
          url.toString(),
          'Erro ao carregar os ativos do plano de manutenção.'
        )
        const data = await response.json()
        const rows = (Array.isArray(data?.ativos) ? data.ativos : []) as PlanAsset[]
        setAvailablePlanAssets(rows)
        setCreatePlanDraft(prev => {
          const nextSelected = prev.selectedAssetIds.filter(id =>
            rows.some(asset => asset.id === id)
          )
          if (nextSelected.length === prev.selectedAssetIds.length) {
            return prev
          }
          return { ...prev, selectedAssetIds: nextSelected }
        })
      } catch (error) {
        setPlanAssetsError(
          error instanceof Error
            ? error.message
            : 'Erro ao carregar os ativos do plano de manutenção.'
        )
        setAvailablePlanAssets([])
        setCreatePlanDraft(prev =>
          prev.selectedAssetIds.length ? { ...prev, selectedAssetIds: [] } : prev
        )
      } finally {
        setIsPlanAssetsLoading(false)
      }
    },
    [fetchWithAuth]
  )

  useEffect(() => {
    let cancelled = false
    const loadFilters = async () => {
      setFiltersError(null)
      try {
        const response = await fetchWithAuth(
          `${API_URL}/planejamento/filters`,
          'Erro ao carregar os filtros de planejamento.'
        )
        if (cancelled) return
        const data = await response.json()
        if (cancelled) return
        const nextCoordenacoes = Array.isArray(data?.coordenacoes)
          ? data.coordenacoes
              .filter((coord: unknown): coord is string => Boolean(coord && typeof coord === 'string'))
              .map((coord: string) => coord.trim())
              .filter(Boolean)
          : []

        setCoordenacoes(Array.from(new Set(nextCoordenacoes)))

        const rawMap = (data?.equipes_by_coordenacao ?? {}) as Record<string, unknown>
        const normalized: Record<string, string[]> = {}
        for (const [coord, value] of Object.entries(rawMap)) {
          if (!coord || !Array.isArray(value)) continue
          const teams = value
            .map((team: unknown) =>
              typeof team === 'string' ? team.trim() : ''
            )
            .filter(Boolean)
          if (teams.length) {
            normalized[coord] = Array.from(new Set(teams)).sort()
          }
        }
        setEquipesByCoord(normalized)
      } catch (error) {
        if (!cancelled) {
          const message =
            error instanceof Error
              ? error.message
              : 'Erro ao carregar os filtros de planejamento.'
          setFiltersError(message)
        }
      }
    }

    loadFilters()
    return () => {
      cancelled = true
    }
  }, [fetchWithAuth])

  const coordOptions = useMemo<string[]>(() => coordenacoes, [coordenacoes])
  const teamOptions = useMemo<string[]>(() => {
    if (!filters.coordinator) return []
    return equipesByCoord[filters.coordinator] ?? []
  }, [equipesByCoord, filters.coordinator])

  const safeCoordinatorFilter = coordOptions.includes(filters.coordinator)
    ? filters.coordinator
    : ''
  const safeTeamFilter = teamOptions.includes(filters.team) ? filters.team : ''
  const createTeamOptions = createPlanDraft.coordinator
    ? equipesByCoord[createPlanDraft.coordinator] ?? []
    : []

  const filteredPlans = plans.filter(plan => {
    const matchesMonth = !filters.yearMonth || plan.yearMonth === filters.yearMonth
    const matchesCoordinator =
      !safeCoordinatorFilter || plan.coordinator === safeCoordinatorFilter
    const matchesTeam = !safeTeamFilter || plan.team === safeTeamFilter
    return matchesMonth && matchesCoordinator && matchesTeam
  })

  const safeSelectedPlanId = (() => {
    if (!filteredPlans.length) return ''
    if (!selectedPlanId) return filteredPlans[0].id
    if (filteredPlans.every(plan => plan.id !== selectedPlanId)) {
      return filteredPlans[0].id
    }
    return selectedPlanId
  })()

  const monthOptions = useMemo(() => {
    const set = new Set(plans.map(plan => plan.yearMonth))
    return Array.from(set).sort()
  }, [plans])

  const buildDefaultCreateDraft = useCallback(() => {
    const defaultYearMonthValue = filters.yearMonth || monthOptions[0] || defaultYearMonth
    const defaultCoordinator = filters.coordinator || coordOptions[0] || ''
    const availableTeams = defaultCoordinator
      ? equipesByCoord[defaultCoordinator] ?? []
      : []
    const defaultTeam = filters.team || availableTeams[0] || ''
    return {
      yearMonth: defaultYearMonthValue,
      coordinator: defaultCoordinator,
      team: defaultTeam,
      technicians: [],
      activities: [],
      osSummary: { mpCount: 0, mpHH: 0, mcCount: 0, mcHH: 0 },
      scheduledHH: 0,
      realizedHH: 0,
      selectedAssetIds: []
    }
  }, [filters, coordOptions, equipesByCoord, monthOptions])

  const handleOpenCreateModal = () => {
    const nextDraft = buildDefaultCreateDraft()
    setCreatePlanDraft(nextDraft)
    setPlanAssetSearch('')
    setPlanAssetsError(null)
    void loadTeamTechnicians(nextDraft.coordinator, nextDraft.team)
    setCreateActivityDraft({
      type: 'Treinamento',
      description: '',
      hours: 1,
      mandatory: true
    })
    setCreateActiveTab(0)
    setIsCreateModalOpen(true)
  }

  const handleCloseCreateModal = () => {
    setIsCreateModalOpen(false)
  }

  const handleCreateCoordinatorChange = (value: string) => {
    const teams = value ? equipesByCoord[value] ?? [] : []
    const nextTeam = teams[0] ?? ''
    setCreatePlanDraft(prev => ({
      ...prev,
      coordinator: value,
      team: nextTeam,
      technicians: [],
      activities: [],
      osSummary: { mpCount: 0, mpHH: 0, mcCount: 0, mcHH: 0 },
      scheduledHH: 0,
      realizedHH: 0,
      selectedAssetIds: []
    }))
    setPlanAssetSearch('')
    setPlanAssetsError(null)
    void loadTeamTechnicians(value, nextTeam)
  }

  const handleCreateTeamChange = (value: string) => {
    setCreatePlanDraft(prev => ({
      ...prev,
      team: value,
      technicians: [],
      activities: [],
      osSummary: { mpCount: 0, mpHH: 0, mcCount: 0, mcHH: 0 },
      scheduledHH: 0,
      realizedHH: 0,
      selectedAssetIds: []
    }))
    setPlanAssetSearch('')
    setPlanAssetsError(null)
    void loadTeamTechnicians(createPlanDraft.coordinator, value)
  }

  const handleCreateYearChange = (value: string) => {
    const { month } = parseYearMonth(createPlanDraft.yearMonth)
    setCreatePlanDraft(prev => ({
      ...prev,
      yearMonth: formatYearMonth(value, month),
      selectedAssetIds: []
    }))
    setPlanAssetSearch('')
    setPlanAssetsError(null)
  }

  const handleCreateMonthChange = (value: string) => {
    const { year } = parseYearMonth(createPlanDraft.yearMonth)
    setCreatePlanDraft(prev => ({
      ...prev,
      yearMonth: formatYearMonth(year, value),
      selectedAssetIds: []
    }))
    setPlanAssetSearch('')
    setPlanAssetsError(null)
  }

  const handleCreateTechnicianUpdate = (
    techId: string,
    changes: Partial<Pick<TechnicianState, 'vacation' | 'vacationDays' | 'workingDays' | 'dailyHours'>>
  ) => {
    setCreatePlanDraft(prev => ({
      ...prev,
      technicians: prev.technicians.map(tech =>
        tech.id === techId ? { ...tech, ...changes } : tech
      )
    }))
  }

  const handleAddCreateActivity = () => {
    if (!createActivityDraft.description.trim() || createActivityDraft.hours <= 0) {
      return
    }
    setCreatePlanDraft(prev => ({
      ...prev,
      activities: [
        ...prev.activities,
        {
          id: `create-${Date.now()}`,
          type: createActivityDraft.type,
          description: createActivityDraft.description.trim(),
          hours: createActivityDraft.hours,
          mandatory: createActivityDraft.mandatory
        }
      ]
    }))
    setCreateActivityDraft(prev => ({ ...prev, description: '', hours: 1 }))
  }

  const handleCreateOSSummaryChange = (field: keyof OSSummary, value: number) => {
    setCreatePlanDraft(prev => ({
      ...prev,
      osSummary: {
        ...prev.osSummary,
        [field]: Math.max(0, value)
      }
    }))
  }

  const handleCreatePlanValueChange = (
    field: 'scheduledHH' | 'realizedHH',
    value: number
  ) => {
    setCreatePlanDraft(prev => ({
      ...prev,
      [field]: Math.max(0, value)
    }))
  }

  const createYearMonthParts = useMemo(
    () => parseYearMonth(createPlanDraft.yearMonth || defaultYearMonth),
    [createPlanDraft.yearMonth]
  )

  const calendarYearOptions = useMemo(() => {
    const now = new Date()
    const baseYear = Number(createYearMonthParts.year) || now.getFullYear()
    const years = new Set<number>()
    for (let offset = -2; offset <= 2; offset++) {
      years.add(now.getFullYear() + offset)
    }
    years.add(baseYear)
    return Array.from(years)
      .sort((a, b) => a - b)
      .map(year => year.toString())
  }, [createYearMonthParts.year])

  const planAssetYearMonth = createPlanDraft.yearMonth || defaultYearMonth
  const createMonthLabel =
    monthSelectList.find(item => item.value === createYearMonthParts.month)?.label ??
    createYearMonthParts.month

  useEffect(() => {
    if (!createPlanDraft.coordinator || !createPlanDraft.team) {
      setAvailablePlanAssets([])
      return
    }
    void loadPlanAssets(
      createPlanDraft.coordinator,
      createPlanDraft.team,
      planAssetYearMonth
    )
  }, [createPlanDraft.coordinator, createPlanDraft.team, planAssetYearMonth, loadPlanAssets])

  const selectedPlan = plans.find(plan => plan.id === safeSelectedPlanId)
  const selectedDetail = selectedPlan?.detail

  const updateSelectedPlanDetail = (updater: (detail: PlanDetail) => PlanDetail) => {
    if (!selectedPlanId) return
    setPlans(prev =>
      prev.map(plan =>
        plan.id === selectedPlanId
          ? { ...plan, detail: updater(plan.detail) }
          : plan
      )
    )
  }

  const handleTechnicianUpdate = (
    techId: string,
    changes: Partial<Pick<TechnicianState, 'vacation' | 'vacationDays' | 'workingDays' | 'dailyHours'>>
  ) => {
    updateSelectedPlanDetail(detail => ({
      ...detail,
      technicians: detail.technicians.map(tech =>
        tech.id === techId
          ? { ...tech, ...changes }
          : tech
      )
    }))
  }

  const handleAddDetailActivity = () => {
    if (!detailActivityDraft.description.trim() || detailActivityDraft.hours <= 0) {
      return
    }
    updateSelectedPlanDetail(detail => ({
      ...detail,
      activities: [
        ...detail.activities,
        {
          id: `${selectedPlanId}-${Date.now()}`,
          type: detailActivityDraft.type,
          description: detailActivityDraft.description.trim(),
          hours: detailActivityDraft.hours,
          mandatory: detailActivityDraft.mandatory
        }
      ]
    }))
    setDetailActivityDraft(prev => ({ ...prev, description: '', hours: 1 }))
  }

  const scheduledLabel = (value: number) => `${value.toLocaleString('pt-BR')} h`
  const formatDate = (value?: string | null) => {
    if (!value) return '-'
    const parsed = new Date(value)
    if (Number.isNaN(parsed.getTime())) {
      return value
    }
    return parsed.toLocaleDateString('pt-BR')
  }

  const computeTechnicianHH = (tech: TechnicianState) => {
    const vacationDays = tech.vacation ? tech.vacationDays : 0
    const cleanedVacationDays = Math.min(Math.max(vacationDays, 0), tech.workingDays)
    const availableDays = Math.max(0, tech.workingDays - cleanedVacationDays)
    return availableDays * tech.dailyHours
  }

  const totalTeamHH = selectedDetail
    ? selectedDetail.technicians.reduce(
        (sum, tech) => sum + computeTechnicianHH(tech),
        0
      )
    : 0

  const totalActivityHH = selectedDetail
    ? selectedDetail.activities.reduce((sum, activity) => sum + activity.hours, 0)
    : 0

  const osSummary = selectedDetail?.osSummary
  const totalPlannedHH = osSummary ? osSummary.mpHH + osSummary.mcHH : 0
  const hhCommittedOS = osSummary ? osSummary.mpHH + osSummary.mcHH : 0
  const hhCommitted = hhCommittedOS + totalActivityHH
  const hhAvailableAfterActivities = Math.max(0, totalTeamHH - totalActivityHH)
  const hhFree = Math.max(0, hhAvailableAfterActivities - hhCommittedOS)

  const adherenceValue = selectedPlan
    ? selectedPlan.realizedHH && totalPlannedHH
      ? selectedPlan.realizedHH / totalPlannedHH
      : 0
    : 0

  const createTotalTeamHH = createPlanDraft.technicians.reduce(
    (sum, tech) => sum + computeTechnicianHH(tech),
    0
  )
  const createTotalActivityHH = createPlanDraft.activities.reduce(
    (sum, activity) => sum + activity.hours,
    0
  )
  const createOsSummary = createPlanDraft.osSummary
  const createTotalPlannedHH = createOsSummary.mpHH + createOsSummary.mcHH
  const filteredPlanAssets = useMemo(() => {
    const term = planAssetSearch.trim().toLowerCase()
    if (!term) return availablePlanAssets
    return availablePlanAssets.filter(asset => {
      const codpeMatches = asset.codpe.toLowerCase().includes(term)
      const descriptionMatches = asset.description.toLowerCase().includes(term)
      return codpeMatches || descriptionMatches
    })
  }, [availablePlanAssets, planAssetSearch])
  const allFilteredAssetsSelected =
    filteredPlanAssets.length > 0 &&
    filteredPlanAssets.every(asset =>
      createPlanDraft.selectedAssetIds.includes(asset.id)
    )
  const handlePlanAssetToggle = (assetId: string) => {
    setCreatePlanDraft(prev => {
      const selected = prev.selectedAssetIds.includes(assetId)
      const nextSelected = selected
        ? prev.selectedAssetIds.filter(id => id !== assetId)
        : [...prev.selectedAssetIds, assetId]
      return { ...prev, selectedAssetIds: nextSelected }
    })
  }
  const handleToggleSelectAllVisible = () => {
    if (!filteredPlanAssets.length) return
    setCreatePlanDraft(prev => {
      const visibleIds = filteredPlanAssets.map(asset => asset.id)
      const allSelected = visibleIds.every(id => prev.selectedAssetIds.includes(id))
      const nextSelected = allSelected
        ? prev.selectedAssetIds.filter(id => !visibleIds.includes(id))
        : Array.from(new Set([...prev.selectedAssetIds, ...visibleIds]))
      return { ...prev, selectedAssetIds: nextSelected }
    })
  }
  const createHhCommittedOS = createTotalPlannedHH
  const createHhCommitted = createHhCommittedOS + createTotalActivityHH
  const createHhAvailableAfterActivities = Math.max(0, createTotalTeamHH - createTotalActivityHH)
  const createHhFree = Math.max(0, createHhAvailableAfterActivities - createHhCommittedOS)
  const createAdherenceValue =
    createPlanDraft.realizedHH && createTotalPlannedHH
      ? createPlanDraft.realizedHH / createTotalPlannedHH
      : 0

  const renderTechnicianTable = (
    technicians: TechnicianState[],
    onUpdate: (
      techId: string,
      changes: Partial<
        Pick<TechnicianState, 'vacation' | 'vacationDays' | 'workingDays' | 'dailyHours'>
      >
    ) => void
  ) => {
    if (!technicians.length) {
      return (
        <p style={{ color: '#64748b', margin: 0 }}>
          Nenhum técnico cadastrado para essa equipe.
        </p>
      )
    }

    return (
      <div style={{ overflowX: 'auto' }}>
        <table style={detailTableStyle}>
          <thead>
            <tr>
              {[
                'Técnico',
                'Dias trabalhados',
                'Carga diária (h)',
                'HH total',
                'Férias?',
                'Dias de férias'
              ].map(header => (
                <th key={header} style={detailHeaderCellStyle}>
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {technicians.map(tech => (
              <tr key={tech.id}>
                <td style={detailCellStyle}>{tech.name}</td>
                <td style={detailCellStyle}>
                  <input
                    type="number"
                    min={0}
                    value={tech.workingDays}
                    onChange={event =>
                      onUpdate(tech.id, {
                        workingDays: Math.max(0, Number(event.currentTarget.value) || 0)
                      })
                    }
                    style={inlineInputStyle}
                  />
                </td>
                <td style={detailCellStyle}>
                  <input
                    type="number"
                    min={0}
                    value={tech.dailyHours}
                    onChange={event =>
                      onUpdate(tech.id, {
                        dailyHours: Math.max(0, Number(event.currentTarget.value) || 0)
                      })
                    }
                    style={inlineInputStyle}
                  />
                </td>
                <td style={detailCellStyle}>
                  {computeTechnicianHH(tech).toLocaleString('pt-BR')} h
                </td>
                <td style={detailCellStyle}>
                  <label
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      cursor: 'pointer'
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={tech.vacation}
                      onChange={event =>
                        onUpdate(tech.id, {
                          vacation: event.currentTarget.checked,
                          vacationDays: event.currentTarget.checked ? tech.vacationDays : 0
                        })
                      }
                    />
                    <span style={{ fontSize: 12, color: '#475569' }}>Férias</span>
                  </label>
                </td>
                <td style={detailCellStyle}>
                  <input
                    type="number"
                    min={0}
                    max={tech.workingDays}
                    value={tech.vacationDays}
                    disabled={!tech.vacation}
                    onChange={event =>
                      onUpdate(tech.id, {
                        vacationDays: Math.min(
                          tech.workingDays,
                          Math.max(0, Number(event.currentTarget.value) || 0)
                        )
                      })
                    }
                    style={{
                      ...inlineInputStyle,
                      opacity: tech.vacation ? 1 : 0.5,
                      cursor: tech.vacation ? 'text' : 'not-allowed'
                    }}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  const renderActivitiesTable = (activities: Activity[]) => {
    if (!activities.length) {
      return (
        <p style={{ color: '#64748b', margin: 0 }}>
          Nenhuma atividade cadastrada ainda.
        </p>
      )
    }

    return (
      <div style={{ overflowX: 'auto' }}>
        <table style={detailTableStyle}>
          <thead>
            <tr>
              {['Tipo', 'Descrição', 'HH', 'Obrigatória?'].map(header => (
                <th key={header} style={detailHeaderCellStyle}>
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {activities.map(activity => (
              <tr key={activity.id}>
                <td style={detailCellStyle}>{activity.type}</td>
                <td style={detailCellStyle}>{activity.description}</td>
                <td style={detailCellStyle}>{activity.hours}</td>
                <td style={detailCellStyle}>{activity.mandatory ? 'Sim' : 'Não'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  const detailModalTitle = selectedPlan
    ? `${selectedPlan.yearMonth} • ${selectedPlan.team}`
    : 'Detalhe do plano'

  const renderDetailTabContent = () => {
    if (!selectedDetail) {
      return (
        <p style={{ color: '#64748b', margin: 0 }}>
          Selecione um plano para visualizar os detalhes.
        </p>
      )
    }

    switch (detailActiveTab) {
      case 0:
        return (
          <>
            <div
              style={{
                display: 'grid',
                gap: 12,
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))'
              }}
            >
              <div style={metricCardStyle}>
                <div style={{ fontSize: 12, color: '#475569' }}>HH total disponível</div>
                <strong>{totalTeamHH.toLocaleString('pt-BR')} h</strong>
                <div style={{ marginTop: 6, fontSize: 12, color: '#475569' }}>
                  {selectedDetail.technicians.length} técnicos
                </div>
              </div>
              <div style={metricCardStyle}>
                <div style={{ fontSize: 12, color: '#475569' }}>HH comprometida (atividades)</div>
                <strong>{totalActivityHH.toLocaleString('pt-BR')} h</strong>
              </div>
              <div style={metricCardStyle}>
                <div style={{ fontSize: 12, color: '#475569' }}>HH livre</div>
                <strong>{hhFree.toLocaleString('pt-BR')} h</strong>
              </div>
            </div>
            {renderTechnicianTable(selectedDetail.technicians, handleTechnicianUpdate)}
          </>
        )
      case 1:
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div
              style={{
                display: 'grid',
                gap: 12,
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))'
              }}
            >
                  <label style={filterLabelStyle}>
                    <span style={filterLabelTextStyle}>Tipo</span>
                    <select
                      value={detailActivityDraft.type}
                      onChange={event =>
                        setDetailActivityDraft(prev => ({
                          ...prev,
                          type: event.target.value as ActivityType
                        }))
                      }
                      style={selectFieldStyle}
                    >
                      <option value="Treinamento">Treinamento</option>
                      <option value="ReuniÇœo">ReuniÇœo</option>
                    </select>
                  </label>
                  <label style={filterLabelStyle}>
                    <span style={filterLabelTextStyle}>DescriÇõÇœo</span>
                    <input
                      type="text"
                      value={detailActivityDraft.description}
                      onChange={event =>
                        setDetailActivityDraft(prev => ({ ...prev, description: event.target.value }))
                      }
                      style={inputFieldStyle}
                    />
                  </label>
                  <label style={filterLabelStyle}>
                    <span style={filterLabelTextStyle}>HH consumida</span>
                    <input
                      type="number"
                      min={1}
                      value={detailActivityDraft.hours}
                      onChange={event =>
                        setDetailActivityDraft(prev => ({
                          ...prev,
                          hours: Math.max(1, Number(event.target.value) || 1)
                        }))
                      }
                      style={inlineInputStyle}
                    />
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <input
                      type="checkbox"
                      checked={detailActivityDraft.mandatory}
                      onChange={event =>
                        setDetailActivityDraft(prev => ({ ...prev, mandatory: event.target.checked }))
                      }
                    />
                    <span style={{ fontSize: 12, color: '#475569' }}>Obrigatória</span>
                  </div>
            </div>
            <button
              type="button"
              onClick={handleAddDetailActivity}
              style={{
                alignSelf: 'flex-start',
                padding: '8px 16px',
                borderRadius: 8,
                border: '1px solid #2563eb',
                background: '#2563eb',
                color: '#ffffff',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Adicionar atividade
            </button>
            {renderActivitiesTable(selectedDetail.activities)}
            <p style={{ margin: 0, color: '#475569' }}>
              HH total comprometida: {totalActivityHH.toLocaleString('pt-BR')} h
            </p>
          </div>
        )
      case 2:
        if (!osSummary) {
          return (
            <p style={{ color: '#64748b', margin: 0 }}>
              Nenhum resumo de OS disponível para este plano.
            </p>
          )
        }
        return (
          <div style={{ display: 'grid', gap: 12 }}>
            <div
              style={{
                display: 'grid',
                gap: 12,
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))'
              }}
            >
              <div style={metricCardStyle}>
                <div style={{ fontSize: 12, color: '#475569' }}>MPs (flag_pdm)</div>
                <strong>{osSummary.mpCount} OS</strong>
                <p style={{ margin: 0 }}>{osSummary.mpHH.toLocaleString('pt-BR')} h</p>
              </div>
              <div style={metricCardStyle}>
                <div style={{ fontSize: 12, color: '#475569' }}>MCs (tipo EX)</div>
                <strong>{osSummary.mcCount} OS</strong>
                <p style={{ margin: 0 }}>{osSummary.mcHH.toLocaleString('pt-BR')} h</p>
              </div>
              <div style={metricCardStyle}>
                <div style={{ fontSize: 12, color: '#475569' }}>Planejado (MP + MC)</div>
                <strong>{totalPlannedHH.toLocaleString('pt-BR')} h</strong>
              </div>
            </div>
          </div>
        )
      case 3:
        return (
          <div
            style={{
              display: 'grid',
              gap: 12,
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))'
            }}
          >
            <div style={metricCardStyle}>
              <div style={{ fontSize: 12, color: '#475569' }}>HH disponível (base)</div>
              <strong>{totalTeamHH.toLocaleString('pt-BR')} h</strong>
            </div>
            <div style={metricCardStyle}>
              <div style={{ fontSize: 12, color: '#475569' }}>HH comprometida</div>
              <strong>{hhCommitted.toLocaleString('pt-BR')} h</strong>
            </div>
            <div style={metricCardStyle}>
              <div style={{ fontSize: 12, color: '#475569' }}>HH livre</div>
              <strong>{hhFree.toLocaleString('pt-BR')} h</strong>
            </div>
            <div style={metricCardStyle}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'baseline'
                }}
              >
                <span style={{ fontSize: 12, color: '#475569' }}>Aderência</span>
                <strong style={{ color: adherenceValue < 0.9 ? '#dc2626' : '#16a34a' }}>
                  {(adherenceValue * 100).toFixed(1)}%
                </strong>
              </div>
              <div style={progressTrackStyle}>
                <div style={progressBarStyle(adherenceValue)} />
              </div>
              <p style={{ margin: '8px 0 0', color: '#475569', fontSize: 13 }}>
                Planejado: {scheduledLabel(totalPlannedHH)}
              </p>
              <p style={{ margin: 0, color: '#475569', fontSize: 13 }}>
                Realizado: {scheduledLabel(selectedPlan?.realizedHH ?? 0)}
              </p>
            </div>
          </div>
        )
      default:
        return null
    }
  }

  const createModalTitle = 'Novo plano de manutenção'

  const renderCreateTabContent = () => {
    switch (createActiveTab) {
      case 0:
        return (
          <>
            <div
              style={{
                display: 'grid',
                gap: 12,
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))'
              }}
            >
              <div style={metricCardStyle}>
                <div style={{ fontSize: 12, color: '#475569' }}>HH total disponível</div>
                <strong>{createTotalTeamHH.toLocaleString('pt-BR')} h</strong>
                <div style={{ marginTop: 6, fontSize: 12, color: '#475569' }}>
                  {createPlanDraft.technicians.length} técnicos
                </div>
              </div>
              <div style={metricCardStyle}>
                <div style={{ fontSize: 12, color: '#475569' }}>HH comprometida (atividades)</div>
                <strong>{createTotalActivityHH.toLocaleString('pt-BR')} h</strong>
              </div>
              <div style={metricCardStyle}>
                <div style={{ fontSize: 12, color: '#475569' }}>HH livre</div>
                <strong>{createHhFree.toLocaleString('pt-BR')} h</strong>
              </div>
            </div>
            {isTeamTechniciansLoading ? (
              <p style={{ color: '#64748b', margin: 0 }}>Carregando técnicos...</p>
            ) : (
              renderTechnicianTable(createPlanDraft.technicians, handleCreateTechnicianUpdate)
            )}
            {teamTechniciansError && (
              <div style={{ color: '#f87171', fontSize: 12, marginTop: 6 }}>
                {teamTechniciansError}
              </div>
            )}
          </>
        )
      case 1:
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div
              style={{
                display: 'grid',
                gap: 12,
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))'
              }}
            >
              <label style={filterLabelStyle}>
                <span style={filterLabelTextStyle}>Tipo</span>
                <select
                  value={createActivityDraft.type}
                  onChange={event =>
                    setCreateActivityDraft(prev => ({
                      ...prev,
                      type: event.target.value as ActivityType
                    }))
                  }
                  style={selectFieldStyle}
                >
                  <option value="Treinamento">Treinamento</option>
                  <option value="Reunião">Reunião</option>
                </select>
              </label>
              <label style={filterLabelStyle}>
                <span style={filterLabelTextStyle}>Descrição</span>
                <input
                  type="text"
                  value={createActivityDraft.description}
                  onChange={event =>
                    setCreateActivityDraft(prev => ({ ...prev, description: event.target.value }))
                  }
                  style={inputFieldStyle}
                />
              </label>
              <label style={filterLabelStyle}>
                <span style={filterLabelTextStyle}>HH consumida</span>
                <input
                  type="number"
                  min={1}
                  value={createActivityDraft.hours}
                  onChange={event =>
                    setCreateActivityDraft(prev => ({
                      ...prev,
                      hours: Math.max(1, Number(event.currentTarget.value) || 1)
                    }))
                  }
                  style={inlineInputStyle}
                />
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <input
                  type="checkbox"
                  checked={createActivityDraft.mandatory}
                  onChange={event =>
                    setCreateActivityDraft(prev => ({ ...prev, mandatory: event.target.checked }))
                  }
                />
                <span style={{ fontSize: 12, color: '#475569' }}>Obrigatória</span>
              </div>
            </div>
            <button
              type="button"
              onClick={handleAddCreateActivity}
              style={{
                alignSelf: 'flex-start',
                padding: '8px 16px',
                borderRadius: 8,
                border: '1px solid #2563eb',
                background: '#2563eb',
                color: '#ffffff',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Adicionar atividade
            </button>
            {renderActivitiesTable(createPlanDraft.activities)}
            <p style={{ margin: 0, color: '#475569' }}>
              HH total comprometida: {createTotalActivityHH.toLocaleString('pt-BR')} h
            </p>
          </div>
        )
      case 2:
        return (
          <div style={{ display: 'grid', gap: 16 }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
              <label
                style={{
                  ...filterLabelStyle,
                  flex: '1 1 280px'
                }}
              >
                <span style={filterLabelTextStyle}>Buscar ativos</span>
                <input
                  type="search"
                  placeholder="Filtrar por CODPE ou Descritivo"
                  value={planAssetSearch}
                  onChange={event => setPlanAssetSearch(event.currentTarget.value)}
                  style={inputFieldStyle}
                />
              </label>
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'flex-end',
                  gap: 6
                }}
              >
                <button
                  type="button"
                  onClick={handleToggleSelectAllVisible}
                  disabled={!filteredPlanAssets.length}
                  style={{
                    ...assetActionButtonStyle,
                    opacity: filteredPlanAssets.length ? 1 : 0.5,
                    cursor: filteredPlanAssets.length ? 'pointer' : 'not-allowed'
                  }}
                >
                  {allFilteredAssetsSelected
                    ? 'Desmarcar ativos visíveis'
                    : 'Selecionar todos os ativos visíveis'}
                </button>
                <span style={{ fontSize: 12, color: '#475569' }}>
                  {filteredPlanAssets.length} ativo(s) vencendo em {createMonthLabel}{' '}
                  {createYearMonthParts.year}
                </span>
              </div>
            </div>
            <div style={assetListStyle}>
              {isPlanAssetsLoading ? (
                <p style={assetListEmptyStyle}>Carregando ativos...</p>
              ) : filteredPlanAssets.length ? (
                filteredPlanAssets.map(asset => {
                  const isSelected = createPlanDraft.selectedAssetIds.includes(asset.id)
                  return (
                    <button
                      key={asset.id}
                      type="button"
                      onClick={() => handlePlanAssetToggle(asset.id)}
                      style={{
                        ...assetListItemStyle,
                        borderColor: isSelected ? '#16a34a' : '#e5e7eb',
                        background: isSelected ? '#ecfdf5' : '#ffffff'
                      }}
                    >
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        <strong style={{ fontSize: 14 }}>{asset.codpe}</strong>
                        <span style={{ fontSize: 13, color: '#475569' }}>
                          {asset.description}
                        </span>
                        <span style={{ fontSize: 12, color: '#94a3b8' }}>
                          {asset.sigla} • {asset.cycle}
                        </span>
                      </div>
                      <div
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'flex-end',
                          gap: 4
                        }}
                      >
                        <span style={assetBadgeStyle}>
                          {asset.dueDate ? `Vence em ${formatDate(asset.dueDate)}` : 'Sem previsão'}
                        </span>
                        {isSelected && (
                          <span style={{ fontSize: 12, color: '#16a34a' }}>Selecionado</span>
                        )}
                      </div>
                    </button>
                  )
                })
              ) : (
                <p style={assetListEmptyStyle}>
                  Nenhum ativo vencendo neste mês para a coordenação/equipe selecionadas.
                </p>
              )}
            </div>
            {planAssetsError && (
              <div style={{ color: '#dc2626', fontSize: 13 }}>{planAssetsError}</div>
            )}
            <p style={{ margin: 0, color: '#475569', fontSize: 13 }}>
              Ativos selecionados: <strong>{createPlanDraft.selectedAssetIds.length}</strong>
            </p>
            <div
              style={{
                display: 'grid',
                gap: 12,
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))'
              }}
            >
              <label style={filterLabelStyle}>
                <span style={filterLabelTextStyle}>MPs (flag_pdm)</span>
                <input
                  type="number"
                  min={0}
                  value={createOsSummary.mpCount}
                  onChange={event =>
                    handleCreateOSSummaryChange(
                      'mpCount',
                      Number(event.currentTarget.value) || 0
                    )
                  }
                  style={inlineInputStyle}
                />
              </label>
              <label style={filterLabelStyle}>
                <span style={filterLabelTextStyle}>HH MPs</span>
                <input
                  type="number"
                  min={0}
                  value={createOsSummary.mpHH}
                  onChange={event =>
                    handleCreateOSSummaryChange('mpHH', Number(event.currentTarget.value) || 0)
                  }
                  style={inlineInputStyle}
                />
              </label>
              <label style={filterLabelStyle}>
                <span style={filterLabelTextStyle}>MCs (tipo EX)</span>
                <input
                  type="number"
                  min={0}
                  value={createOsSummary.mcCount}
                  onChange={event =>
                    handleCreateOSSummaryChange('mcCount', Number(event.currentTarget.value) || 0)
                  }
                  style={inlineInputStyle}
                />
              </label>
              <label style={filterLabelStyle}>
                <span style={filterLabelTextStyle}>HH MCs</span>
                <input
                  type="number"
                  min={0}
                  value={createOsSummary.mcHH}
                  onChange={event =>
                    handleCreateOSSummaryChange('mcHH', Number(event.currentTarget.value) || 0)
                  }
                  style={inlineInputStyle}
                />
              </label>
            </div>
            <p style={{ margin: 0, color: '#475569' }}>
              Planejado: {scheduledLabel(createTotalPlannedHH)}
            </p>
          </div>
        )
      case 3:
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div
              style={{
                display: 'grid',
                gap: 12,
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))'
              }}
            >
              <label style={filterLabelStyle}>
                <span style={filterLabelTextStyle}>Programado (HH)</span>
                <input
                  type="number"
                  min={0}
                  value={createPlanDraft.scheduledHH}
                  onChange={event =>
                    handleCreatePlanValueChange('scheduledHH', Number(event.currentTarget.value) || 0)
                  }
                  style={inlineInputStyle}
                />
              </label>
              <label style={filterLabelStyle}>
                <span style={filterLabelTextStyle}>Realizado (HH)</span>
                <input
                  type="number"
                  min={0}
                  value={createPlanDraft.realizedHH}
                  onChange={event =>
                    handleCreatePlanValueChange('realizedHH', Number(event.currentTarget.value) || 0)
                  }
                  style={inlineInputStyle}
                />
              </label>
            </div>
            <div
              style={{
                display: 'grid',
                gap: 12,
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))'
              }}
            >
              <div style={metricCardStyle}>
                <div style={{ fontSize: 12, color: '#475569' }}>HH disponível (base)</div>
                <strong>{createTotalTeamHH.toLocaleString('pt-BR')} h</strong>
              </div>
              <div style={metricCardStyle}>
                <div style={{ fontSize: 12, color: '#475569' }}>HH comprometida</div>
                <strong>{createHhCommitted.toLocaleString('pt-BR')} h</strong>
              </div>
              <div style={metricCardStyle}>
                <div style={{ fontSize: 12, color: '#475569' }}>HH livre</div>
                <strong>{createHhFree.toLocaleString('pt-BR')} h</strong>
              </div>
              <div style={metricCardStyle}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'baseline'
                  }}
                >
                  <span style={{ fontSize: 12, color: '#475569' }}>Aderência</span>
                  <strong style={{ color: createAdherenceValue < 0.9 ? '#dc2626' : '#16a34a' }}>
                    {(createAdherenceValue * 100).toFixed(1)}%
                  </strong>
                </div>
                <div style={progressTrackStyle}>
                  <div style={progressBarStyle(createAdherenceValue)} />
                </div>
                <p style={{ margin: '8px 0 0', color: '#475569', fontSize: 13 }}>
                  Planejado: {scheduledLabel(createTotalPlannedHH)}
                </p>
                <p style={{ margin: 0, color: '#475569', fontSize: 13 }}>
                  Programado: {scheduledLabel(createPlanDraft.scheduledHH)}
                </p>
                <p style={{ margin: 0, color: '#475569', fontSize: 13 }}>
                  Realizado: {scheduledLabel(createPlanDraft.realizedHH)}
                </p>
              </div>
            </div>
          </div>
        )
      default:
        return null
    }
  }

  return (
    <div style={pageContainerStyle}>
      <header style={pageHeaderStyle}>
        <h1 style={{ margin: 0, fontSize: 32 }}>Plano de Manutenção</h1>
        <p style={{ margin: 0, color: '#475569' }}>
          Construa o plano mensal, entenda a capacidade real e justifique metas com base em dados reais.
        </p>
      </header>

      <section style={{ ...cardStyle, padding: 16, maxHeight: 220 }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 12
          }}
        >
          <div style={{ fontWeight: 700, color: '#0f172a' }}>Filtros</div>
          <button
            type="button"
            onClick={handleOpenCreateModal}
            disabled={!coordOptions.length}
            style={{
              padding: '8px 14px',
              borderRadius: 10,
              border: '1px solid #2563eb',
              background: coordOptions.length ? '#2563eb' : '#94a3b8',
              color: '#ffffff',
              fontWeight: 600,
              cursor: coordOptions.length ? 'pointer' : 'not-allowed'
            }}
            title={
              coordOptions.length
                ? 'Criar novo plano'
                : 'Carregando coordenadorias da empresa...'
            }
          >
            Criar Plano
          </button>
        </div>
        <div style={filterGridStyle}>
          <label style={filterLabelStyle}>
            <span style={filterLabelTextStyle}>Ano / Mês</span>
            <input
              type="month"
              value={filters.yearMonth}
              onChange={event => {
                const nextYearMonth = event.target.value
                setFilters(prev => ({ ...prev, yearMonth: nextYearMonth }))
              }}
              max={monthOptions[monthOptions.length - 1] || undefined}
              style={inputFieldStyle}
            />
          </label>
          <label style={filterLabelStyle}>
            <span style={filterLabelTextStyle}>Coordenação</span>
            <select
              value={filters.coordinator}
              onChange={event => {
                const nextCoordinator = event.target.value
                setFilters(prev => ({
                  ...prev,
                  coordinator: nextCoordinator,
                  team: ''
                }))
              }}
              style={selectFieldStyle}
            >
              <option value="">Selecione a coordenação</option>
              {coordOptions.map((coord: string) => (
                <option key={coord} value={coord}>
                  {coord}
                </option>
              ))}
            </select>
          </label>
          <label style={filterLabelStyle}>
            <span style={filterLabelTextStyle}>Equipe</span>
            <select
              value={filters.team}
              disabled={!filters.coordinator || !teamOptions.length}
              onChange={event => {
                const nextTeam = event.target.value
                setFilters(prev => ({ ...prev, team: nextTeam }))
              }}
              style={{
                ...selectFieldStyle,
                opacity:
                  !filters.coordinator || !teamOptions.length ? 0.65 : 1,
                cursor:
                  !filters.coordinator || !teamOptions.length
                    ? 'not-allowed'
                    : 'pointer'
              }}
            >
              <option value="">
                {filters.coordinator
                  ? 'Selecione a equipe'
                  : 'Selecione uma coordenação primeiro'}
              </option>
              {teamOptions.map((team: string) => (
                <option key={team} value={team}>
                  {team}
                </option>
              ))}
            </select>
          </label>
        </div>
        {filtersError && (
          <div style={{ marginTop: 16, color: '#dc2626', fontSize: 13 }}>
            {filtersError}
          </div>
        )}
      </section>


      <section
        style={{
          ...cardStyle,
          padding: 0,
          flex: 1,
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        <div style={{ padding: 24, paddingBottom: 12 }}>
          <div style={{ fontSize: 14, color: '#475569' }}>Planos cadastrados</div>
        </div>
        <div style={{ ...tableContainerStyle, flex: 1, padding: '0 24px 24px' }}>
          <table style={tableStyle}>
            <thead>
              <tr>
                {[
                  'ID',
                  'Ano/Mês',
                  'Equipe',
                  'MP',
                  'MC',
                  'Planejado',
                  'Programado',
                  'Realizado',
                  'Aderência (%)'
                ].map(header => (
                  <th key={header} style={tableHeaderCellStyle}>
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredPlans.map(plan => {
                const planPlanned =
                  plan.detail.osSummary.mpHH + plan.detail.osSummary.mcHH
                const adherence =
                  plan.realizedHH && planPlanned ? plan.realizedHH / planPlanned : 0
                const isLowAdherence = adherence < 0.9
                const isSelected = plan.id === selectedPlanId
                return (
                  <tr
                    key={plan.id}
                    onClick={() => handleOpenDetailModal(plan.id)}
                    style={{
                      cursor: 'pointer',
                      background: isSelected ? '#e0f2fe' : '#ffffff',
                      borderBottom: '1px solid #e5e7eb'
                    }}
                  >
                    <td style={tableCellStyle}>{plan.id}</td>
                    <td style={tableCellStyle}>{plan.yearMonth}</td>
                    <td style={tableCellStyle}>{plan.team}</td>
                    <td style={tableCellStyle}>
                      {`${plan.detail.osSummary.mpHH.toLocaleString('pt-BR')} h`}
                    </td>
                    <td style={tableCellStyle}>
                      {`${plan.detail.osSummary.mcHH.toLocaleString('pt-BR')} h`}
                    </td>
                    <td style={tableCellStyle}>
                      {`${planPlanned.toLocaleString('pt-BR')} h`}
                    </td>
                    <td style={tableCellStyle}>{scheduledLabel(plan.scheduledHH)}</td>
                    <td style={tableCellStyle}>{scheduledLabel(plan.realizedHH)}</td>
                    <td
                      style={{
                        ...tableCellStyle,
                        fontWeight: 700,
                        color: isLowAdherence ? '#dc2626' : '#16a34a'
                      }}
                    >
                      {(adherence * 100).toFixed(1)}%
                    </td>
                  </tr>
                )
              })}
              {!filteredPlans.length && (
                <tr>
                  <td
                    colSpan={9}
                    style={{
                      padding: '24px',
                      textAlign: 'center',
                      color: '#64748b'
                    }}
                  >
                    Nenhum plano disponível para os filtros selecionados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <Modal
        title={detailModalTitle}
        isOpen={isDetailModalOpen}
        onClose={handleCloseDetailModal}
        fullScreen
        footer={
          <button
            type="button"
            onClick={handleCloseDetailModal}
            style={{
              padding: '8px 16px',
              borderRadius: 8,
              border: '1px solid #e5e7eb',
              background: '#ffffff',
              cursor: 'pointer'
            }}
          >
            Fechar
          </button>
        }
      >
        <div>
          <div style={modalTabHeaderStyle}>
            {tabLabels.map((label, index) => (
              <button
                key={label}
                type="button"
                onClick={() => setDetailActiveTab(index)}
                style={{
                  ...modalTabButtonStyle,
                  ...(detailActiveTab === index
                    ? { background: '#16a34a', color: '#ffffff', borderColor: '#16a34a' }
                    : {})
                }}
              >
                {label}
              </button>
            ))}
          </div>
          <div style={modalTabContentStyle}>{renderDetailTabContent()}</div>
        </div>
      </Modal>
      <Modal
        title={createModalTitle}
        isOpen={isCreateModalOpen}
        onClose={handleCloseCreateModal}
        fullScreen
        footer={
          <button
            type="button"
            onClick={handleCloseCreateModal}
            style={{
              padding: '8px 16px',
              borderRadius: 8,
              border: '1px solid #e5e7eb',
              background: '#ffffff',
              cursor: 'pointer'
            }}
          >
            Fechar
          </button>
        }
      >
        <div>
          <div
            style={{
              display: 'grid',
              gap: 12,
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              marginBottom: 16
            }}
          >
            <label style={filterLabelStyle}>
              <span style={filterLabelTextStyle}>Ano</span>
              <select
                value={createYearMonthParts.year}
                onChange={event => handleCreateYearChange(event.currentTarget.value)}
                style={selectFieldStyle}
              >
                {calendarYearOptions.map(year => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </label>
            <label style={filterLabelStyle}>
              <span style={filterLabelTextStyle}>Mês</span>
              <select
                value={createYearMonthParts.month}
                onChange={event => handleCreateMonthChange(event.currentTarget.value)}
                style={selectFieldStyle}
              >
                {monthSelectList.map(month => (
                  <option key={month.value} value={month.value}>
                    {month.label}
                  </option>
                ))}
              </select>
            </label>
            <label style={filterLabelStyle}>
              <span style={filterLabelTextStyle}>Coordenação</span>
              <select
                value={createPlanDraft.coordinator}
                onChange={event => handleCreateCoordinatorChange(event.currentTarget.value)}
                style={selectFieldStyle}
              >
                <option value="">Selecione a coordenação</option>
                {coordOptions.map(coord => (
                  <option key={coord} value={coord}>
                    {coord}
                  </option>
                ))}
              </select>
            </label>
            <label style={filterLabelStyle}>
              <span style={filterLabelTextStyle}>Equipe</span>
              <select
                value={createPlanDraft.team}
                disabled={!createPlanDraft.coordinator || !createTeamOptions.length}
                onChange={event => handleCreateTeamChange(event.currentTarget.value)}
                style={{
                  ...selectFieldStyle,
                  opacity:
                    !createPlanDraft.coordinator || !createTeamOptions.length ? 0.65 : 1,
                  cursor:
                    !createPlanDraft.coordinator || !createTeamOptions.length
                      ? 'not-allowed'
                      : 'pointer'
                }}
              >
                <option value="">
                  {createPlanDraft.coordinator
                    ? 'Selecione a equipe'
                    : 'Selecione uma coordenação primeiro'}
                </option>
                {createTeamOptions.map(team => (
                  <option key={team} value={team}>
                    {team}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div style={modalTabHeaderStyle}>
            {tabLabels.map((label, index) => (
              <button
                key={label}
                type="button"
                onClick={() => setCreateActiveTab(index)}
                style={{
                  ...modalTabButtonStyle,
                  ...(createActiveTab === index
                    ? { background: '#16a34a', color: '#ffffff', borderColor: '#16a34a' }
                    : {})
                }}
              >
                {label}
              </button>
            ))}
          </div>
          <div style={modalTabContentStyle}>{renderCreateTabContent()}</div>
        </div>
      </Modal>
    </div>
  )
}
