import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { Modal } from '../components/Modal'
import { Tabs } from '../components/Tabs'
import { ExportButton } from '../components/ExportButton'
import { toast } from 'sonner'
import {
  fetchPermissions,
  getStoredPermissions,
  getStoredToken,
  getStoredUser,
  logout,
  setPostLoginRedirect
} from '../services/auth'
import { API_URL, getParametros } from '../services/api'
import type {
  ParametroCadastroAtivo,
  ParametroCadastroAtivoType
} from '../services/api'
type AtivoListItem = {
  id: string
  ATIVO_CODPE: string
  ATIVO_DESCRITIVO_OS: string
  ATIVO_COORDENACAO: string
  ATIVO_EQUIPE: string
  ATIVO_CICLO: string
  ATIVO_SIGLA: string
  ATIVO_MONITORADOS: string
  ATIVO_ULTIMA_MANUT: string | null
  ATIVO_STATUS: string
}

type AtivoDetail = {
  id: string
  ATIVO_EMPRESA: string
  ATIVO_CODPE: string
  ATIVO_DESCRITIVO_OS: string
  ATIVO_STATUS: string
  ATIVO_COORDENACAO: string
  ATIVO_EQUIPE: string
  ATIVO_MONITORADOS: string
  ATIVO_SIGLA: string
  ATIVO_CICLO: string
  ATIVO_CONTADOR: number
  CONTADOR_CICLO: string
  ATIVO_TOLERANCIA: string
  ATIVO_CLASSE: string
  ATIVO_GRUPO: string
  ATIVO_OEA: string
  ATIVO_TMM: string
  ATIVO_LATITUDE: string | null
  ATIVO_LONGITUDE: string | null
  ATIVO_ULTIMA_MANUT: string | null
  ATIVO_MODELO_POSTE: string | null
  ATIVO_MODELO_RELE: string | null
  ATIVO_MODELO_DDS: string | null
  ATIVO_DDS_SERIAL: string | null
  ATIVO_DDS_DTQ: string | null
  ATIVO_MYTRAIN: string | null
  ATIVO_JAMPER1: string | null
  ATIVO_JAMPER2: string | null
  ATIVO_MODELO: string | null
  ATIVO_OBSERVACAO: string | null
}

type AtivoHistoryItem = {
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

type AtivoComponentItem = {
  IDCOMPONETE: number
  COMP_NOME: string
  COMP_MODELO: string
  COMP_SERIAL: string
  COMP_DATA: string
  COMP_DESCRICAO: string
  ATIVO_CODPE: string
  ATIVO_DESCRITIVO_OS: string
  ATIVO_SIGLA: string
  ATIVO_COORDENACAO: string
  ATIVO_EQUIPE: string
}

type AtivoPendenciaItem = {
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

type StatusHistoryItem = {
  id: string
  ativoCodpe: string
  ativoDescritivo: string
  equipe: string
  status: string
  observacao: string
  dataAlteracao: string
  dataPrevisaoReparo: string | null
  changedByName: string | null
  createdAt: string
}

type StatusLogInfo = {
  observacao: string
  dataAlteracao: string
  dataPrevisao: string | null
}

type StatusChangeDraft = StatusLogInfo & {
  status: string
}

const initialStatusChangeDraft: StatusChangeDraft = {
  status: '',
  observacao: '',
  dataAlteracao: '',
  dataPrevisao: ''
}

type AtivoFormState = {
  id: string
  ATIVO_EMPRESA: string
  ATIVO_CODPE: string
  ATIVO_DESCRITIVO_OS: string
  ATIVO_STATUS: string
  ATIVO_COORDENACAO: string
  ATIVO_EQUIPE: string
  ATIVO_MONITORADOS: string
  ATIVO_SIGLA: string
  ATIVO_CICLO: string
  ATIVO_CONTADOR: string
  CONTADOR_CICLO: string
  ATIVO_TOLERANCIA: string
  ATIVO_CLASSE: string
  ATIVO_GRUPO: string
  ATIVO_OEA: string
  ATIVO_TMM: string
  ATIVO_LATITUDE: string
  ATIVO_LONGITUDE: string
  ATIVO_ULTIMA_MANUT: string
  ATIVO_MODELO_POSTE: string
  ATIVO_MODELO_RELE: string
  ATIVO_MODELO_DDS: string
  ATIVO_DDS_SERIAL: string
  ATIVO_DDS_DTQ: string
  ATIVO_MYTRAIN: string
  ATIVO_JAMPER1: string
  ATIVO_JAMPER2: string
  ATIVO_MODELO: string
  ATIVO_OBSERVACAO: string
}

type FieldDef = {
  key: keyof AtivoFormState
  label: string
  required?: boolean
}

type SortKey =
  | 'ATIVO_CODPE'
  | 'ATIVO_DESCRITIVO_OS'
  | 'ATIVO_EQUIPE'
  | 'ATIVO_CICLO'
  | 'ATIVO_SIGLA'
  | 'ATIVO_MONITORADOS'
  | 'ATIVO_ULTIMA_MANUT'

const fieldLabelStyle = { fontSize: 12, fontWeight: 600, color: '#475569' }

function toText(value: unknown) {
  if (value === null || value === undefined) return ''
  return String(value)
}

const requiredFields: FieldDef[] = [
  { key: 'ATIVO_EMPRESA', label: 'Empresa *', required: true },
  { key: 'ATIVO_CODPE', label: 'IDCOD *', required: true },
  { key: 'ATIVO_DESCRITIVO_OS', label: 'Descritivo Ativo *', required: true },
  { key: 'ATIVO_STATUS', label: 'Status *', required: true },
  { key: 'ATIVO_COORDENACAO', label: 'Coordenação *', required: true },
  { key: 'ATIVO_EQUIPE', label: 'Equipe *', required: true },
  { key: 'ATIVO_MONITORADOS', label: 'Monitorados *', required: true },
  { key: 'ATIVO_SIGLA', label: 'Sigla *', required: true },
  { key: 'ATIVO_CICLO', label: 'Ciclo *', required: true },
  { key: 'ATIVO_CONTADOR', label: 'Contador *', required: true },
  { key: 'CONTADOR_CICLO', label: 'Contador Ciclo *', required: true },
  { key: 'ATIVO_TOLERANCIA', label: 'Tolerância *', required: true },
  { key: 'ATIVO_CLASSE', label: 'Classe *', required: true },
  { key: 'ATIVO_GRUPO', label: 'Grupo *', required: true },
  { key: 'ATIVO_OEA', label: 'OEA *', required: true },
  { key: 'ATIVO_TMM', label: 'TMM *', required: true }
]

const principalFields: FieldDef[] = [
  { key: 'ATIVO_CODPE', label: 'IDCOD *', required: true },
  { key: 'ATIVO_DESCRITIVO_OS', label: 'Descritivo *', required: true },
  { key: 'ATIVO_STATUS', label: 'Status *', required: true },
  { key: 'ATIVO_EMPRESA', label: 'Empresa *', required: true },
  { key: 'ATIVO_COORDENACAO', label: 'Coordenação *', required: true },
  { key: 'ATIVO_EQUIPE', label: 'Equipe *', required: true }
]

const estruturaFields: FieldDef[] = [
  { key: 'ATIVO_MONITORADOS', label: 'Monitorado *', required: true },
  { key: 'ATIVO_SIGLA', label: 'Sub *', required: true },
  { key: 'ATIVO_CICLO', label: 'Ciclo *', required: true },
  { key: 'ATIVO_CONTADOR', label: 'Contador *', required: true },
  { key: 'CONTADOR_CICLO', label: 'Contador Ciclo *', required: true },
  { key: 'ATIVO_TOLERANCIA', label: 'Tolerância *', required: true },
  { key: 'ATIVO_CLASSE', label: 'Classe *', required: true },
  { key: 'ATIVO_GRUPO', label: 'Grupo *', required: true },
  { key: 'ATIVO_OEA', label: 'OEA *', required: true },
  { key: 'ATIVO_TMM', label: 'TMM *', required: true },
  { key: 'ATIVO_ULTIMA_MANUT', label: 'Última Manutenção' },
  { key: 'ATIVO_MODELO_POSTE', label: 'Modelo Poste' },
  { key: 'ATIVO_MODELO_RELE', label: 'Modelo Relé' },
  { key: 'ATIVO_JAMPER1', label: 'Jumper 1' },
  { key: 'ATIVO_JAMPER2', label: 'Jumper 2' },
  { key: 'ATIVO_MODELO', label: 'Modelo' }
]

const monitoramentoFields: FieldDef[] = [
  { key: 'ATIVO_MODELO_DDS', label: 'DDS' },
  { key: 'ATIVO_DDS_DTQ', label: 'DTQ' },
  { key: 'ATIVO_DDS_SERIAL', label: 'DDS Serial' },
  { key: 'ATIVO_MYTRAIN', label: 'MyTrain' }
]

const enderecoFields: FieldDef[] = [
  { key: 'ATIVO_LATITUDE', label: 'Latitude' },
  { key: 'ATIVO_LONGITUDE', label: 'Longitude' }
]

const obsFields: FieldDef[] = [
  { key: 'ATIVO_OBSERVACAO', label: 'Observação' }
]

const PARAMETER_FIELD_MAP: Partial<
  Record<keyof AtivoFormState, ParametroCadastroAtivoType>
> = {
  ATIVO_STATUS: 'Status_ativo',
  ATIVO_MONITORADOS: 'Monitorado',
  ATIVO_SIGLA: 'Sub',
  ATIVO_CICLO: 'Ciclo',
  ATIVO_TOLERANCIA: 'Tolerancia',
  ATIVO_CLASSE: 'Classe',
  ATIVO_GRUPO: 'Grupo',
  ATIVO_MODELO_POSTE: 'ModeloPoste',
  ATIVO_MODELO_RELE: 'ModeloRele',
  ATIVO_MODELO_DDS: 'DDSmodelo',
  ATIVO_MODELO: 'CaixaModelo'
}

const emptyAtivoForm = (): AtivoFormState => ({
  id: '',
  ATIVO_EMPRESA: '',
  ATIVO_CODPE: '',
  ATIVO_DESCRITIVO_OS: '',
  ATIVO_STATUS: '',
  ATIVO_COORDENACAO: '',
  ATIVO_EQUIPE: '',
  ATIVO_MONITORADOS: '',
  ATIVO_SIGLA: '',
  ATIVO_CICLO: '',
  ATIVO_CONTADOR: '1',
  CONTADOR_CICLO: '',
  ATIVO_TOLERANCIA: '',
  ATIVO_CLASSE: '',
  ATIVO_GRUPO: '',
  ATIVO_OEA: '',
  ATIVO_TMM: '',
  ATIVO_LATITUDE: '',
  ATIVO_LONGITUDE: '',
  ATIVO_ULTIMA_MANUT: '',
  ATIVO_MODELO_POSTE: '',
  ATIVO_MODELO_RELE: '',
  ATIVO_MODELO_DDS: '',
  ATIVO_DDS_SERIAL: '',
  ATIVO_DDS_DTQ: '',
  ATIVO_MYTRAIN: '',
  ATIVO_JAMPER1: '',
  ATIVO_JAMPER2: '',
  ATIVO_MODELO: '',
  ATIVO_OBSERVACAO: ''
})

function formatDate(value: string | null) {
  if (!value) return '-'
  const normalized =
    /\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/.test(value) &&
    !/Z$|[+-]\d{2}:\d{2}$/.test(value)
      ? `${value.replace(' ', 'T')}Z`
      : value
  const date = new Date(normalized)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' })
}

function formatComponentDate(value?: string | null) {
  if (!value) return '-'
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return value
  return parsed.toLocaleDateString('pt-BR')
}

function getCurrentLocalDateTime() {
  const now = new Date()
  const offset = now.getTimezoneOffset() * 60000
  return new Date(now.getTime() - offset).toISOString().slice(0, 16)
}

function normalizeAtivoComponentRow(
  row: Record<string, unknown>
): AtivoComponentItem {
  return {
    IDCOMPONETE: Number(row.IDCOMPONETE ?? row.id ?? 0),
    COMP_NOME: toText(row.COMP_NOME),
    COMP_MODELO: toText(row.COMP_MODELO),
    COMP_SERIAL: toText(row.COMP_SERIAL),
    COMP_DATA: toText(row.COMP_DATA),
    COMP_DESCRICAO: toText(row.COMP_DESCRICAO),
    ATIVO_CODPE: toText(row.ATIVO_CODPE),
    ATIVO_DESCRITIVO_OS: toText(row.ATIVO_DESCRITIVO_OS),
    ATIVO_SIGLA: toText(row.ATIVO_SIGLA),
    ATIVO_COORDENACAO: toText(row.ATIVO_COORDENACAO),
    ATIVO_EQUIPE: toText(row.ATIVO_EQUIPE)
  }
}

function normalizePendenciaRow(
  row: Record<string, unknown>
): AtivoPendenciaItem {
  const status = String(row.nota_status ?? '').trim()
  return {
    IDNOTA: Number(row.IDNOTA ?? row.id ?? 0),
    company_id: toText(row.company_id),
    id_ativo: toText(row.id_ativo),
    id_os: toText(row.id_os) || null,
    nota_pendencia: toText(row.nota_pendencia),
    nota_status: NOTA_STATUSES.includes(status as NotaStatus)
      ? (status as NotaStatus)
      : 'Criado',
    nota_data_criada: toText(row.nota_data_criada),
    nota_data_programada: toText(row.nota_data_programada) || null,
    nota_data_realizada: toText(row.nota_data_realizada) || null,
    nota_observacao_pcm: toText(row.nota_observacao_pcm) || null,
    nota_observacao_tecnico: toText(row.nota_observacao_tecnico) || null,
    ATIVO_CODPE: toText(row.ATIVO_CODPE),
    ATIVO_DESCRITIVO_OS: toText(row.ATIVO_DESCRITIVO_OS)
  }
}

function normalizeStatusHistoryRow(row: Record<string, unknown>): StatusHistoryItem {
  return {
    id: toText(row.id),
    ativoCodpe: toText(row.ativo_codpe),
    ativoDescritivo: toText(row.ativo_descritivo),
    equipe: toText(row.equipe),
    status: toText(row.status),
    observacao: toText(row.observacao),
    dataAlteracao: toText(row.data_alteracao),
    dataPrevisaoReparo: toText(row.data_previsao_reparo) || null,
    changedByName: toText(row.changed_by_name) || null,
    createdAt: toText(row.created_at)
  }
}

function parseHistoryData(value: string | null): Record<string, string> | null {
  if (!value) return null
  try {
    return JSON.parse(value) as Record<string, string>
  } catch {
    return null
  }
}

const historyFieldLabels: Record<string, string> = {
  ATIVO_STATUS: 'Status',
  ATIVO_EMPRESA: 'Empresa',
  ATIVO_CODPE: 'IDCOD',
  ATIVO_DESCRITIVO_OS: 'Descritivo',
  ATIVO_COORDENACAO: 'Coordenação',
  ATIVO_EQUIPE: 'Equipe',
  ATIVO_MONITORADOS: 'Monitorado',
  ATIVO_SIGLA: 'Sub',
  ATIVO_CICLO: 'Ciclo',
  ATIVO_CONTADOR: 'Contador',
  CONTADOR_CICLO: 'Contador Ciclo',
  ATIVO_TOLERANCIA: 'Tolerância',
  ATIVO_CLASSE: 'Classe',
  ATIVO_GRUPO: 'Grupo',
  ATIVO_OEA: 'OEA',
  ATIVO_TMM: 'TMM',
  ATIVO_LATITUDE: 'Latitude',
  ATIVO_LONGITUDE: 'Longitude',
  ATIVO_ULTIMA_MANUT: 'Última Manutenção',
  ATIVO_MODELO_POSTE: 'Modelo Poste',
  ATIVO_MODELO_RELE: 'Modelo Relé',
  ATIVO_MODELO_DDS: 'DDS',
  ATIVO_DDS_SERIAL: 'DDS Serial',
  ATIVO_DDS_DTQ: 'DTQ',
  ATIVO_MYTRAIN: 'MyTrain',
  ATIVO_JAMPER1: 'Jumper 1',
  ATIVO_JAMPER2: 'Jumper 2',
  ATIVO_MODELO: 'Modelo',
  ATIVO_OBSERVACAO: 'Observação'
}

function buildChanges(
  beforeData: Record<string, string> | null,
  afterData: Record<string, string> | null
) {
  if (!beforeData || !afterData) return []
  const keys = new Set([...Object.keys(beforeData), ...Object.keys(afterData)])
  const changes: Array<{ label: string; before: string; after: string }> = []
  keys.forEach(key => {
    const before = beforeData[key] ?? ''
    const after = afterData[key] ?? ''
    if (before !== after) {
      changes.push({
        label: historyFieldLabels[key] || key,
        before: before || '-',
        after: after || '-'
      })
    }
  })
  return changes
}

async function getApiErrorMessage(
  response: Response,
  fallback: string
): Promise<string> {
  if (response.status === 403) {
    return 'Código erro 403 - Seu perfil não tem permissão para essa operação.'
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
export function Ativos() {
  const navigate = useNavigate()

  const [permissions, setPermissions] = useState(() => getStoredPermissions())
  const [ativos, setAtivos] = useState<AtivoListItem[]>([])
  const [ativosLoading, setAtivosLoading] = useState(true)
  const [ativosError, setAtivosError] = useState<string | null>(null)
  const [filters, setFilters] = useState({
    search: '',
    coordenacao: '',
    equipe: '',
    ciclo: '',
    sigla: '',
    monitorados: '',
    status: ''
  })

  const resetFilters = () => {
    setFilters({
      search: '',
      coordenacao: '',
      equipe: '',
      ciclo: '',
      sigla: '',
      monitorados: '',
      status: ''
    })
  }

  const handleExport = async () => {
    if (exporting) return
    setExporting(true)
    try {
      const token = getStoredToken()
      if (!token) {
        throw new Error('Sessão expirada. Faça login novamente.')
      }
      const url = new URL(`${API_URL}/ativos/export`)
      const params = url.searchParams
      if (filters.coordenacao) params.set('coordenacao', filters.coordenacao)
      if (filters.equipe) params.set('equipe', filters.equipe)
      const response = await fetch(url.toString(), {
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
          'Erro ao exportar a planilha.'
        )
        throw new Error(message)
      }
      const blob = await response.blob()
      const filename = `ativos-${new Date().toISOString().slice(0, 10)}.xlsx`
      const objectUrl = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = objectUrl
      link.download = filename
      document.body.appendChild(link)
      link.click()
      link.remove()
      URL.revokeObjectURL(objectUrl)
      toast.success('Exportação iniciada.')
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Erro ao exportar ativos.'
      toast.error(message)
    } finally {
      setExporting(false)
    }
  }

  const [exporting, setExporting] = useState(false)

  const [estruturas, setEstruturas] = useState<EstruturaItem[]>([])
  const companyId = useMemo(() => getStoredUser()?.empresaId ?? '', [])
  const [parametros, setParametros] = useState<ParametroCadastroAtivo[]>([])

  const [modalOpen, setModalOpen] = useState(false)
  const closeMainModal = () => {
    setModalOpen(false)
    setStatusHistoryVisible(false)
  }
  const [activeTab, setActiveTab] = useState('cadastro')
  const [formErrors, setFormErrors] = useState<string[]>([])
  const [formState, setFormState] = useState<AtivoFormState>(emptyAtivoForm)
  const [isEditing, setIsEditing] = useState(false)
  const [historyItems, setHistoryItems] = useState<AtivoHistoryItem[]>([])
  const [historyLoading, setHistoryLoading] = useState(false)
  const [historyError, setHistoryError] = useState<string | null>(null)
  const [componentesAtivo, setComponentesAtivo] = useState<AtivoComponentItem[]>([])
  const [componentesAtivoLoading, setComponentesAtivoLoading] = useState(false)
  const [componentesAtivoError, setComponentesAtivoError] = useState<string | null>(null)
  const [detailModalOpen, setDetailModalOpen] = useState(false)
  const [detailComponent, setDetailComponent] = useState<AtivoComponentItem | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [detailError, setDetailError] = useState<string | null>(null)
  const [pendenciasAtivo, setPendenciasAtivo] = useState<AtivoPendenciaItem[]>([])
  const [pendenciasLoading, setPendenciasLoading] = useState(false)
  const [pendenciasError, setPendenciasError] = useState<string | null>(null)
  const [pendenciaModalOpen, setPendenciaModalOpen] = useState(false)
  const [pendenciaDetail, setPendenciaDetail] = useState<AtivoPendenciaItem | null>(null)
  const [pendenciaDetailLoading, setPendenciaDetailLoading] = useState(false)
  const [pendenciaDetailError, setPendenciaDetailError] = useState<string | null>(null)
  const [statusBeforeChange, setStatusBeforeChange] = useState('')
  const [statusChangeModalOpen, setStatusChangeModalOpen] = useState(false)
  const [statusChangeDraft, setStatusChangeDraft] =
    useState<StatusChangeDraft>(initialStatusChangeDraft)
  const [statusChangeError, setStatusChangeError] = useState<string | null>(null)
  const [statusLogInfo, setStatusLogInfo] = useState<StatusLogInfo | null>(null)
  const [statusHistoryVisible, setStatusHistoryVisible] = useState(false)
  const [statusHistory, setStatusHistory] = useState<StatusHistoryItem[]>([])
  const [statusHistoryLoading, setStatusHistoryLoading] = useState(false)
  const [statusHistoryError, setStatusHistoryError] = useState<string | null>(null)
  const canDeleteAtivos = permissions?.ativos?.exclusao === true
  const canReadComponentes = permissions?.componentes?.leitura === true
  const canReadNotas = permissions?.notas?.leitura === true
  const [sort, setSort] = useState<{ key: SortKey; dir: 'asc' | 'desc' }>({
    key: 'ATIVO_CODPE',
    dir: 'asc'
  })
  const [expandedSections, setExpandedSections] = useState({
    principal: true,
    estrutura: true,
    monitoramento: false,
    endereco: false,
    obs: false
  })
  const [pageSize, setPageSize] = useState(() => {
    try {
      const value = localStorage.getItem('tecrail:ativos:page-size')
      return value ? Number(value) : 50
    } catch {
      return 50
    }
  })
  const [page, setPage] = useState(1)

  const loadParametros = useCallback(async () => {
    if (!companyId) {
      setParametros([])
      return
    }
    try {
      const data = await getParametros({ id_company: companyId, ativo: true })
      setParametros(data)
    } catch (error) {
      console.error(error)
    }
  }, [companyId])

  useEffect(() => {
    const token = getStoredToken()
    if (!token) {
      setAtivosError('Sessão expirada. Faça login novamente.')
      setAtivosLoading(false)
      return
    }

    const loadAtivos = async () => {
      try {
        const response = await fetch(`${API_URL}/ativos`, {
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
            'Erro ao carregar ativos.'
          )
          throw new Error(message)
        }

        const data = await response.json()
        setAtivos(Array.isArray(data.ativos) ? data.ativos : [])
        setAtivosError(null)
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Erro ao carregar ativos.'
        setAtivosError(message)
      } finally {
        setAtivosLoading(false)
      }
    }

    loadAtivos()
  }, [navigate])

  useEffect(() => {
    void loadParametros()
  }, [loadParametros])

  useEffect(() => {
    const token = getStoredToken()
    if (!token) return
    fetchPermissions()
      .then(setPermissions)
      .catch(() => setPermissions(getStoredPermissions()))
  }, [])

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
        if (!response.ok) {
          return null
        }
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

  const filteredAtivos = useMemo(() => {
    const normalize = (value: string) => value.toLowerCase()
    const includes = (value: string | null, filter: string) => {
      if (!filter) return true
      return normalize(value || '').includes(normalize(filter))
    }
    const equals = (value: string | null, filter: string) => {
      if (!filter) return true
      return normalize(value || '') === normalize(filter)
    }

    const list = ativos.filter(item => {
      const searchMatch =
        !filters.search ||
        includes(item.ATIVO_CODPE, filters.search) ||
        includes(item.ATIVO_DESCRITIVO_OS, filters.search)
      return (
        searchMatch &&
        equals(item.ATIVO_COORDENACAO ?? '', filters.coordenacao) &&
        equals(item.ATIVO_EQUIPE, filters.equipe) &&
        equals(item.ATIVO_CICLO, filters.ciclo) &&
        equals(item.ATIVO_SIGLA, filters.sigla) &&
        equals(item.ATIVO_MONITORADOS, filters.monitorados) &&
        equals(item.ATIVO_STATUS, filters.status)
      )
    })
    const sorted = [...list]
    sorted.sort((a, b) => {
      const dir = sort.dir === 'asc' ? 1 : -1
      const key = sort.key
      const valA = a[key]
      const valB = b[key]
      if (valA == null && valB == null) return 0
      if (valA == null) return 1 * dir
      if (valB == null) return -1 * dir
      return String(valA).localeCompare(String(valB)) * dir
    })
    return sorted
  }, [ativos, filters, sort])

  const totalPages = Math.max(1, Math.ceil(filteredAtivos.length / pageSize))
  const pagedAtivos = useMemo(() => {
    const start = (page - 1) * pageSize
    return filteredAtivos.slice(start, start + pageSize)
  }, [filteredAtivos, page, pageSize])

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages)
    }
    if (page < 1) {
      setPage(1)
    }
  }, [page, totalPages])

  const coordenacoes = useMemo(() => {
    return Array.from(new Set(estruturas.map(item => item.coordenacao)))
  }, [estruturas])

  const equipesFiltro = useMemo(() => {
    if (!filters.coordenacao) {
      return Array.from(new Set(estruturas.map(item => item.equipe)))
    }
    return estruturas
      .filter(item => item.coordenacao === filters.coordenacao)
      .map(item => item.equipe)
  }, [estruturas, filters.coordenacao])

  const ciclos = useMemo(() => {
    return Array.from(new Set(ativos.map(item => item.ATIVO_CICLO).filter(Boolean)))
  }, [ativos])

  const siglas = useMemo(() => {
    return Array.from(new Set(ativos.map(item => item.ATIVO_SIGLA).filter(Boolean)))
  }, [ativos])

  const monitoradosOptions = useMemo(() => {
    return Array.from(
      new Set(ativos.map(item => item.ATIVO_MONITORADOS).filter(Boolean))
    )
  }, [ativos])


  const parameterOptions = useMemo(() => {
    const grouped: Partial<
      Record<ParametroCadastroAtivoType, ParametroCadastroAtivo[]>
    > = {}
    for (const parametro of parametros) {
      const list = grouped[parametro.tipo_parametro] ?? []
      list.push(parametro)
      grouped[parametro.tipo_parametro] = list
    }
    const getOrder = (item: ParametroCadastroAtivo) =>
      item.ordem ?? Number.MAX_SAFE_INTEGER
    ;(Object.keys(grouped) as ParametroCadastroAtivoType[]).forEach(tipo => {
      const list = grouped[tipo] ?? []
      grouped[tipo] = [...list].sort((a, b) => {
        const aOrd = getOrder(a)
        const bOrd = getOrder(b)
        if (aOrd !== bOrd) return aOrd - bOrd
        return a.valor.localeCompare(b.valor)
      })
    })
    return grouped
  }, [parametros])

  const statusOptions = useMemo(() => {
    return parameterOptions['Status_ativo'] ?? []
  }, [parameterOptions])

  const equipesDisponiveis = useMemo(() => {
    if (!formState.ATIVO_COORDENACAO) return []
    return estruturas
      .filter(item => item.coordenacao === formState.ATIVO_COORDENACAO)
      .map(item => item.equipe)
  }, [estruturas, formState.ATIVO_COORDENACAO])

  const openNewAtivo = () => {
    setIsEditing(false)
    setFormErrors([])
    setFormState(emptyAtivoForm())
    setActiveTab('cadastro')
    setHistoryItems([])
    setExpandedSections({
      principal: true,
      estrutura: true,
      monitoramento: false,
      endereco: false,
      obs: false
    })
    setModalOpen(true)
    setStatusHistoryVisible(false)
    setComponentesAtivo([])
    setComponentesAtivoError(null)
    setComponentesAtivoLoading(false)
    setPendenciasAtivo([])
    setPendenciasError(null)
    setPendenciasLoading(false)
    setPendenciaDetail(null)
    setPendenciaDetailError(null)
    setPendenciaDetailLoading(false)
    setPendenciaModalOpen(false)
    setStatusBeforeChange('')
    setStatusLogInfo(null)
    setStatusChangeDraft(initialStatusChangeDraft)
    setStatusChangeModalOpen(false)
    setStatusChangeError(null)
  }
 
  const fetchAtivoComponentes = useCallback(
    async (codpe: string) => {
      setComponentesAtivoLoading(true)
      setComponentesAtivoError(null)
      setComponentesAtivo([])
      try {
        if (!codpe) {
          return
        }
        if (!canReadComponentes) {
          setComponentesAtivoError(
            'Voce nao tem permissao para visualizar os componentes deste ativo.'
          )
          return
        }
        const token = getStoredToken()
        if (!token) {
          setComponentesAtivoError('Sessao expirada. Faça login novamente.')
          return
        }
        const response = await fetch(
          `${API_URL}/componentes?codpe=${encodeURIComponent(codpe)}`,
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
            'Erro ao carregar componentes do ativo.'
          )
          throw new Error(message)
        }
        const data = await response.json()
        const rawList = Array.isArray(data.componentes)
          ? data.componentes
          : Array.isArray(data)
            ? data
            : []
        setComponentesAtivo(
          (rawList as Record<string, unknown>[]).map(normalizeAtivoComponentRow)
        )
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : 'Erro ao carregar componentes do ativo.'
        setComponentesAtivoError(message)
        setComponentesAtivo([])
      } finally {
        setComponentesAtivoLoading(false)
      }
    },
    [canReadComponentes, navigate]
  )

  const fetchPendenciasAtivo = useCallback(
    async (ativoId: string, ativoCodpe: string) => {
      setPendenciasLoading(true)
      setPendenciasError(null)
      setPendenciasAtivo([])
      if (!ativoId || !ativoCodpe) {
        setPendenciasLoading(false)
        return
      }
      if (!canReadNotas) {
        setPendenciasError(
          'Você não tem permissão para visualizar as pendências deste ativo.'
        )
        setPendenciasLoading(false)
        return
      }
      const token = getStoredToken()
      if (!token) {
        setPendenciasError('Sessão expirada. Faça login novamente.')
        setPendenciasLoading(false)
        return
      }
      try {
        const response = await fetch(
          `${API_URL}/notas?search=${encodeURIComponent(ativoCodpe)}`,
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
            'Erro ao carregar pendências do ativo.'
          )
          throw new Error(message)
        }
        const data = await response.json()
        const rawList = Array.isArray(data.notas)
          ? data.notas
          : Array.isArray(data)
            ? data
            : []
        const normalized = (rawList as Record<string, unknown>[]).map(
          normalizePendenciaRow
        )
        const filtered = normalized.filter(item => item.id_ativo === ativoId)
        setPendenciasAtivo(filtered)
        setPendenciasError(null)
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : 'Erro ao carregar pendências do ativo.'
        setPendenciasError(message)
        setPendenciasAtivo([])
      } finally {
        setPendenciasLoading(false)
      }
    },
    [canReadNotas, navigate]
  )

  const fetchStatusHistory = useCallback(
    async (ativoId: string) => {
      if (!ativoId) return
      setStatusHistoryLoading(true)
      setStatusHistoryError(null)
      try {
        const token = getStoredToken()
        if (!token) {
          throw new Error('Sessão expirada. Faça login novamente.')
        }
        const response = await fetch(
          `${API_URL}/ativos/status-history?ativo_id=${encodeURIComponent(
            ativoId
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
            'Erro ao carregar o histórico de status.'
          )
          throw new Error(message)
        }
        const data = await response.json()
        const history = Array.isArray(data.history)
          ? data.history
          : Array.isArray(data)
            ? data
            : []
        setStatusHistory(
          (history as Record<string, unknown>[]).map(normalizeStatusHistoryRow)
        )
        setStatusHistoryError(null)
      } catch (err) {
        if (!(err instanceof Error)) {
          setStatusHistoryError('Erro ao carregar o histórico de status.')
          setStatusHistory([])
          return
        }
        setStatusHistoryError(err.message)
        setStatusHistory([])
      } finally {
        setStatusHistoryLoading(false)
      }
    },
    [navigate]
  )

  const fetchPendenciaDetail = useCallback(
    async (notaId: number) => {
      setPendenciaDetailLoading(true)
      setPendenciaDetailError(null)
      setPendenciaDetail(null)
      if (!canReadNotas) {
        setPendenciaDetailError('Você não tem permissão para ver esta pendência.')
        setPendenciaDetailLoading(false)
        return
      }
      const token = getStoredToken()
      if (!token) {
        setPendenciaDetailError('Sessão expirada. Faça login novamente.')
        setPendenciaDetailLoading(false)
        return
      }
      try {
        const response = await fetch(
          `${API_URL}/notas/detail?id=${notaId}`,
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
            'Erro ao carregar a pendência.'
          )
          throw new Error(message)
        }
        const data = await response.json()
        const normalized = normalizePendenciaRow(
          data.nota ?? (Array.isArray(data.notas) ? data.notas[0] ?? {} : data)
        )
        setPendenciaDetail(normalized)
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Erro ao carregar a pendência.'
        setPendenciaDetailError(message)
      } finally {
        setPendenciaDetailLoading(false)
      }
    },
    [canReadNotas, navigate]
  )

  const openPendenciaDetail = (notaId: number) => {
    setPendenciaModalOpen(true)
    setPendenciaDetail(null)
    void fetchPendenciaDetail(notaId)
  }

  const closePendenciaDetail = () => {
    setPendenciaModalOpen(false)
    setPendenciaDetail(null)
    setPendenciaDetailError(null)
    setPendenciaDetailLoading(false)
  }

  const openStatusHistory = () => {
    if (!formState.id) {
      return
    }
    setStatusHistoryVisible(true)
    setActiveTab('status_history')
    void fetchStatusHistory(formState.id)
  }

  const closeStatusHistory = () => {
    setStatusHistoryVisible(false)
    setActiveTab('cadastro')
  }

  const fetchComponentDetail = useCallback(
    async (componentId: number) => {
      setDetailLoading(true)
      setDetailError(null)
      setDetailComponent(null)
      try {
        const token = getStoredToken()
        if (!token) {
          setDetailError('Sessão expirada. Faça login novamente.')
          return
        }
        const response = await fetch(
          `${API_URL}/componentes/detail?id=${componentId}`,
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
            'Erro ao carregar os dados do componente.'
          )
          throw new Error(message)
        }
        const data = await response.json()
        const raw = data.componente ?? data
        setDetailComponent(normalizeAtivoComponentRow(raw))
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : 'Erro ao carregar os dados do componente.'
        setDetailError(message)
      } finally {
        setDetailLoading(false)
      }
    },
    [navigate]
  )

  const openComponentDetail = (componentId: number) => {
    setDetailModalOpen(true)
    void fetchComponentDetail(componentId)
  }

  const closeComponentDetail = () => {
    setDetailModalOpen(false)
    setDetailComponent(null)
    setDetailError(null)
    setDetailLoading(false)
  }

  const fetchAtivoDetail = async (codpe: string) => {
    const token = getStoredToken()
    if (!token) {
      setAtivosError('Sessão expirada. Faça login novamente.')
      return
    }
    try {
      const response = await fetch(
        `${API_URL}/ativos/detail?codpe=${encodeURIComponent(codpe)}`,
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
          'Erro ao carregar ativo.'
        )
        throw new Error(message)
      }

      const data = await response.json()
      const ativo = data.ativo as AtivoDetail
      setFormState({
        id: ativo.id,
        ATIVO_EMPRESA: ativo.ATIVO_EMPRESA,
        ATIVO_CODPE: ativo.ATIVO_CODPE,
        ATIVO_DESCRITIVO_OS: ativo.ATIVO_DESCRITIVO_OS,
        ATIVO_STATUS: ativo.ATIVO_STATUS,
        ATIVO_COORDENACAO: ativo.ATIVO_COORDENACAO,
        ATIVO_EQUIPE: ativo.ATIVO_EQUIPE,
        ATIVO_MONITORADOS: ativo.ATIVO_MONITORADOS,
        ATIVO_SIGLA: ativo.ATIVO_SIGLA,
        ATIVO_CICLO: ativo.ATIVO_CICLO,
        ATIVO_CONTADOR: String(ativo.ATIVO_CONTADOR || 1),
        CONTADOR_CICLO: ativo.CONTADOR_CICLO,
        ATIVO_TOLERANCIA: ativo.ATIVO_TOLERANCIA,
        ATIVO_CLASSE: ativo.ATIVO_CLASSE,
        ATIVO_GRUPO: ativo.ATIVO_GRUPO,
        ATIVO_OEA: ativo.ATIVO_OEA,
        ATIVO_TMM: ativo.ATIVO_TMM,
        ATIVO_LATITUDE: ativo.ATIVO_LATITUDE || '',
        ATIVO_LONGITUDE: ativo.ATIVO_LONGITUDE || '',
        ATIVO_ULTIMA_MANUT: ativo.ATIVO_ULTIMA_MANUT || '',
        ATIVO_MODELO_POSTE: ativo.ATIVO_MODELO_POSTE || '',
        ATIVO_MODELO_RELE: ativo.ATIVO_MODELO_RELE || '',
        ATIVO_MODELO_DDS: ativo.ATIVO_MODELO_DDS || '',
        ATIVO_DDS_SERIAL: ativo.ATIVO_DDS_SERIAL || '',
        ATIVO_DDS_DTQ: ativo.ATIVO_DDS_DTQ || '',
        ATIVO_MYTRAIN: ativo.ATIVO_MYTRAIN || '',
        ATIVO_JAMPER1: ativo.ATIVO_JAMPER1 || '',
        ATIVO_JAMPER2: ativo.ATIVO_JAMPER2 || '',
        ATIVO_MODELO: ativo.ATIVO_MODELO || '',
        ATIVO_OBSERVACAO: ativo.ATIVO_OBSERVACAO || ''
      })
      setStatusLogInfo(null)
      setStatusBeforeChange(ativo.ATIVO_STATUS || '')
      setStatusChangeDraft(initialStatusChangeDraft)
      setStatusChangeModalOpen(false)
      setStatusChangeError(null)
      await fetchAtivoComponentes(codpe)
      await fetchPendenciasAtivo(ativo.id, ativo.ATIVO_CODPE)
      void fetchStatusHistory(ativo.id)
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Erro ao carregar ativo.'
      setAtivosError(message)
    }
  }

  const fetchAtivoHistory = useCallback(
    async (ativoId: string) => {
      const token = getStoredToken()
      if (!token) return

      try {
        setHistoryLoading(true)
        const response = await fetch(
          `${API_URL}/ativos/history?ativo_id=${encodeURIComponent(ativoId)}`,
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
            'Erro ao carregar Histórico.'
          )
          throw new Error(message)
        }

        const data = await response.json()
        setHistoryItems(Array.isArray(data.history) ? data.history : [])
        setHistoryError(null)
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Erro ao carregar Histórico.'
        setHistoryError(message)
      } finally {
        setHistoryLoading(false)
      }
    },
    [navigate]
  )

  const openEditAtivo = async (codpe: string) => {
    setIsEditing(true)
    setFormErrors([])
    setActiveTab('cadastro')
    setExpandedSections({
      principal: true,
      estrutura: true,
      monitoramento: false,
      endereco: false,
      obs: false
    })
    setModalOpen(true)
    setStatusHistoryVisible(false)
    await fetchAtivoDetail(codpe)
  }

  useEffect(() => {
    if (modalOpen && isEditing && formState.id) {
      fetchAtivoHistory(formState.id)
    }
  }, [modalOpen, isEditing, formState.id, fetchAtivoHistory])

  const handleFormChange = (field: keyof AtivoFormState, value: string) => {
    setFormState(prev => ({ ...prev, [field]: value }))
  }

  const handleStatusFieldChange = (value: string) => {
    const previousStatus = formState.ATIVO_STATUS
    const normalized = value ? value.trim() : ''
    handleFormChange('ATIVO_STATUS', value)
    if (!normalized) {
      setStatusLogInfo(null)
      return
    }
    if (normalized.toLowerCase() === 'ok') {
      setStatusLogInfo(null)
      setStatusChangeModalOpen(false)
      setStatusChangeDraft(initialStatusChangeDraft)
      setStatusChangeError(null)
      return
    }
    setStatusBeforeChange(previousStatus)
    setStatusChangeDraft({
      status: normalized,
      observacao: '',
      dataAlteracao: getCurrentLocalDateTime(),
      dataPrevisao: ''
    })
    setStatusChangeError(null)
    setStatusLogInfo(null)
    setStatusChangeModalOpen(true)
  }

  const handleStatusModalSave = () => {
    if (!statusChangeDraft.observacao.trim()) {
      setStatusChangeError('Observação obrigatória.')
      return
    }
    if (!statusChangeDraft.dataAlteracao) {
      setStatusChangeError('Informe a data da alteração.')
      return
    }
    setStatusLogInfo({
      observacao: statusChangeDraft.observacao.trim(),
      dataAlteracao: statusChangeDraft.dataAlteracao,
      dataPrevisao: statusChangeDraft.dataPrevisao || null
    })
    setStatusChangeError(null)
    setStatusChangeDraft(initialStatusChangeDraft)
    setStatusChangeModalOpen(false)
  }

  const handleStatusModalCancel = () => {
    setStatusChangeModalOpen(false)
    handleFormChange('ATIVO_STATUS', statusBeforeChange)
    setStatusLogInfo(null)
    setStatusChangeDraft(initialStatusChangeDraft)
    setStatusChangeError(null)
    setStatusBeforeChange('')
  }

  const validateForm = () => {
    const errors: string[] = []
    const missingFields = requiredFields
      .map(field => ({
        label: field.label.replace(/\s*\*$/, ''),
        value: String(formState[field.key] ?? '').trim()
      }))
      .filter(item => item.value === '')
    if (missingFields.length > 0) {
      const labels = missingFields.map(item => item.label).join(', ')
      errors.push(`Preencha os campos obrigatorios: ${labels}`)
    }
    if (formState.ATIVO_COORDENACAO.length > 20) {
      errors.push('Coordenação deve ter no máximo 20 caracteres.')
    }
    if (formState.ATIVO_EQUIPE.length > 10) {
      errors.push('Equipe deve ter no máximo 10 caracteres.')
    }
    setFormErrors(errors)
    return errors.length === 0
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

  const toggleSection = (key: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const mapUrl =
    formState.ATIVO_LATITUDE && formState.ATIVO_LONGITUDE
      ? `https://www.google.com/maps?q=${encodeURIComponent(
          `${formState.ATIVO_LATITUDE},${formState.ATIVO_LONGITUDE}`
        )}`
      : ''

  const handleSave = async () => {
    if (!validateForm()) return
    const token = getStoredToken()
    if (!token) {
      setFormErrors(['Sessão expirada. Faça login novamente.'])
      return
    }

    const payload = {
      ATIVO_EMPRESA: formState.ATIVO_EMPRESA,
      ATIVO_CODPE: formState.ATIVO_CODPE,
      ATIVO_DESCRITIVO_OS: formState.ATIVO_DESCRITIVO_OS,
      ATIVO_STATUS: formState.ATIVO_STATUS,
      ATIVO_COORDENACAO: formState.ATIVO_COORDENACAO,
      ATIVO_EQUIPE: formState.ATIVO_EQUIPE,
      ATIVO_MONITORADOS: formState.ATIVO_MONITORADOS,
      ATIVO_SIGLA: formState.ATIVO_SIGLA,
      ATIVO_CICLO: formState.ATIVO_CICLO,
      ATIVO_CONTADOR: Number(formState.ATIVO_CONTADOR || 1),
      CONTADOR_CICLO: formState.CONTADOR_CICLO,
      ATIVO_TOLERANCIA: formState.ATIVO_TOLERANCIA,
      ATIVO_CLASSE: formState.ATIVO_CLASSE,
      ATIVO_GRUPO: formState.ATIVO_GRUPO,
      ATIVO_OEA: formState.ATIVO_OEA,
      ATIVO_TMM: formState.ATIVO_TMM,
      ATIVO_LATITUDE: formState.ATIVO_LATITUDE,
      ATIVO_LONGITUDE: formState.ATIVO_LONGITUDE,
      ATIVO_ULTIMA_MANUT: formState.ATIVO_ULTIMA_MANUT,
      ATIVO_MODELO_POSTE: formState.ATIVO_MODELO_POSTE,
      ATIVO_MODELO_RELE: formState.ATIVO_MODELO_RELE,
      ATIVO_MODELO_DDS: formState.ATIVO_MODELO_DDS,
      ATIVO_DDS_SERIAL: formState.ATIVO_DDS_SERIAL,
      ATIVO_DDS_DTQ: formState.ATIVO_DDS_DTQ,
      ATIVO_MYTRAIN: formState.ATIVO_MYTRAIN,
      ATIVO_JAMPER1: formState.ATIVO_JAMPER1,
      ATIVO_JAMPER2: formState.ATIVO_JAMPER2,
      ATIVO_MODELO: formState.ATIVO_MODELO,
      ATIVO_OBSERVACAO: formState.ATIVO_OBSERVACAO
    }

    const normalizedStatus = String(formState.ATIVO_STATUS || '').trim()
    const statusIsOk = normalizedStatus.toLowerCase() === 'ok'
    const statusChanged =
      statusBeforeChange && statusBeforeChange !== normalizedStatus
    const shouldAddStatusLog = !statusIsOk && statusChanged
    if (shouldAddStatusLog && !statusLogInfo) {
      setFormErrors([
        'Informe observação e data de alteração quando o status for diferente de OK.'
      ])
      setStatusChangeModalOpen(true)
      return
    }
    if (!shouldAddStatusLog) {
      setStatusLogInfo(null)
    }

    const payloadWithStatusLog =
      shouldAddStatusLog && statusLogInfo
        ? {
            ...payload,
            status_log: {
              observacao: statusLogInfo.observacao,
              data_alteracao: statusLogInfo.dataAlteracao,
              data_previsao_reparo: statusLogInfo.dataPrevisao
            }
          }
        : payload

    try {
      if (isEditing) {
        const response = await fetch(`${API_URL}/ativos`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ id: formState.id, ...payloadWithStatusLog })
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
            'Erro ao atualizar ativo.'
          )
          throw new Error(message)
        }

        const data = await response.json()
        const updated = data.ativo as AtivoDetail
        setAtivos(prev =>
          prev.map(item =>
            item.id === updated.id
              ? {
                  id: updated.id,
                  ATIVO_CODPE: updated.ATIVO_CODPE,
                  ATIVO_DESCRITIVO_OS: updated.ATIVO_DESCRITIVO_OS,
                  ATIVO_COORDENACAO: updated.ATIVO_COORDENACAO,
                  ATIVO_EQUIPE: updated.ATIVO_EQUIPE,
                  ATIVO_CICLO: updated.ATIVO_CICLO,
                  ATIVO_SIGLA: updated.ATIVO_SIGLA,
                  ATIVO_MONITORADOS: updated.ATIVO_MONITORADOS,
                  ATIVO_ULTIMA_MANUT: updated.ATIVO_ULTIMA_MANUT,
                  ATIVO_STATUS: updated.ATIVO_STATUS
                }
              : item
          )
        )
        toast.success('Registro modificado com sucesso!')
        await fetchAtivoHistory(updated.id)
      } else {
        const response = await fetch(`${API_URL}/ativos`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify(payload)
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
            'Erro ao criar ativo.'
          )
          throw new Error(message)
        }

        const data = await response.json()
        const created = data.ativo as AtivoDetail
        setAtivos(prev => [
          {
            id: created.id,
            ATIVO_CODPE: created.ATIVO_CODPE,
            ATIVO_DESCRITIVO_OS: created.ATIVO_DESCRITIVO_OS,
            ATIVO_COORDENACAO: created.ATIVO_COORDENACAO,
            ATIVO_EQUIPE: created.ATIVO_EQUIPE,
            ATIVO_CICLO: created.ATIVO_CICLO,
            ATIVO_SIGLA: created.ATIVO_SIGLA,
            ATIVO_MONITORADOS: created.ATIVO_MONITORADOS,
            ATIVO_ULTIMA_MANUT: created.ATIVO_ULTIMA_MANUT,
            ATIVO_STATUS: created.ATIVO_STATUS
          },
          ...prev
        ])
        toast.success('Registro criado com sucesso!')
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Erro ao salvar ativo.'
      setFormErrors([message])
      return
    }

    setStatusLogInfo(null)
    closeMainModal()
  }

  const handleDeleteAtivo = async (ativoId: string) => {
    if (!canDeleteAtivos) {
      toast.error('Seu perfil não tem permissão para excluir.')
      return
    }
    if (!window.confirm('Confirmar exclusão do ativo?')) {
      return
    }
    const token = getStoredToken()
    if (!token) {
      setAtivosError('Sessão expirada. Faça login novamente.')
      return
    }

    try {
      const response = await fetch(`${API_URL}/ativos`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ id: ativoId, ATIVO_STATUS: 'inativo' })
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
          'Erro ao excluir ativo.'
        )
        throw new Error(message)
      }

      const data = await response.json()
      const updated = data.ativo as AtivoDetail
      setAtivos(prev =>
        prev.map(item =>
          item.id === ativoId
            ? { ...item, ATIVO_STATUS: updated.ATIVO_STATUS }
            : item
        )
      )
      toast.success('Registro excluido com sucesso!')
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Erro ao excluir ativo.'
      setAtivosError(message)
    }
  }
  const renderField = (field: FieldDef) => {
    if (field.key === 'ATIVO_COORDENACAO') {
      return (
        <select
          value={formState.ATIVO_COORDENACAO}
          onChange={event => {
            const value = event.target.value
            handleFormChange('ATIVO_COORDENACAO', value)
            if (!equipesDisponiveis.includes(formState.ATIVO_EQUIPE)) {
              handleFormChange('ATIVO_EQUIPE', '')
            }
          }}
          style={{
            padding: '10px 12px',
            borderRadius: 10,
            border: '1px solid #e2e8f0'
          }}
        >
          <option value="">Selecione</option>
          {coordenacoes.map(value => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </select>
      )
    }

    if (field.key === 'ATIVO_EQUIPE') {
      return (
        <select
          value={formState.ATIVO_EQUIPE}
          onChange={event => handleFormChange('ATIVO_EQUIPE', event.target.value)}
          style={{
            padding: '10px 12px',
            borderRadius: 10,
            border: '1px solid #e2e8f0'
          }}
        >
          <option value="">Selecione</option>
          {equipesDisponiveis.map(value => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </select>
      )
    }

    const parametroType = PARAMETER_FIELD_MAP[field.key]
    if (parametroType) {
      const options = parameterOptions[parametroType] ?? []
      if (field.key === 'ATIVO_STATUS') {
        return (
          <select
            value={formState[field.key]}
            onChange={event => handleStatusFieldChange(event.target.value)}
            style={{
              padding: '10px 12px',
              borderRadius: 10,
              border: '1px solid #e2e8f0'
            }}
          >
            <option value="">Selecione</option>
            {options.map(parametro => (
              <option key={parametro.id_parametro} value={parametro.valor}>
                {parametro.valor}
              </option>
            ))}
          </select>
        )
      }
      return (
        <select
          value={formState[field.key]}
          onChange={event => handleFormChange(field.key, event.target.value)}
          style={{
            padding: '10px 12px',
            borderRadius: 10,
            border: '1px solid #e2e8f0'
          }}
        >
          <option value="">Selecione</option>
          {options.map(parametro => (
            <option key={parametro.id_parametro} value={parametro.valor}>
              {parametro.valor}
            </option>
          ))}
        </select>
      )
    }

    return (
      <input
        value={formState[field.key]}
        onChange={event => handleFormChange(field.key, event.target.value)}
        style={{
          padding: '10px 12px',
          borderRadius: 10,
          border: '1px solid #e2e8f0'
        }}
      />
    )
  }

  const renderFieldRows = (fields: FieldDef[]) => {
    const rows = []
    for (let i = 0; i < fields.length; i += 2) {
      const left = fields[i]
      const right = fields[i + 1]
      rows.push(
        <div
          key={`${left.key}-${right?.key ?? 'single'}`}
          style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}
        >
          <div style={{ display: 'grid', gap: 6 }}>
            <label style={fieldLabelStyle}>{left.label}</label>
            {renderField(left)}
          </div>
          {right ? (
            <div style={{ display: 'grid', gap: 6 }}>
              <label style={fieldLabelStyle}>{right.label}</label>
              {renderField(right)}
            </div>
          ) : (
            <div />
          )}
        </div>
      )
    }
    return rows
  }

  const renderSection = (
    id: keyof typeof expandedSections,
    title: string,
    fields: FieldDef[],
    extra?: ReactNode
  ) => (
    <div
      style={{
        border: '1px solid #e2e8f0',
        borderRadius: 12,
        padding: 12,
        background: '#ffffff',
        display: 'grid',
        gap: 10
      }}
    >
      <button
        type="button"
        onClick={() => toggleSection(id)}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'transparent',
          border: 'none',
          padding: 0,
          cursor: 'pointer',
          fontWeight: 700,
          color: '#0f172a'
        }}
      >
        {title}
        <span
          style={{
            display: 'inline-block',
            transform: expandedSections[id] ? 'rotate(90deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s',
            fontSize: 16
          }}
        >
          {'>'}
        </span>
      </button>
      {expandedSections[id] && (
        <div style={{ display: 'grid', gap: 12 }}>
          {renderFieldRows(fields)}
          {extra}
        </div>
      )}
    </div>
  )

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
          <h2 style={{ margin: 0, fontSize: 24 }}>Painel de Ativos</h2>
        </div>
        <p style={{ margin: 0, color: '#64748b' }}>
          Gestão e visualização da base de ativos.
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
        <div
          style={{
            display: 'flex',
            gap: 12,
            flexWrap: 'wrap',
            alignItems: 'flex-end',
            justifyContent: 'space-between'
          }}
        >
          <div
            style={{
              flex: '0 0 24%',
              minWidth: 160,
              display: 'grid',
              gap: 4
            }}
          >
            <span style={{ fontSize: 12, color: '#475569', fontWeight: 600 }}
            >
              Busca rápida
            </span>
            <div style={{ position: 'relative' }}
            >
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
                placeholder="Buscar por CODPE ou Descritivo..."
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
          <ExportButton
            onClick={handleExport}
            loading={exporting}
            style={{ marginLeft: 'auto' }}
          />
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: 12
          }}
        >
          <div style={{ display: 'grid', gap: 4 }}>
            <span style={{ fontSize: 12, color: '#475569', fontWeight: 600 }}>
              Coordenação
            </span>
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
              <option value="">Todos</option>
              {coordenacoes.map(value => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </div>
          <div style={{ display: 'grid', gap: 4 }}>
            <span style={{ fontSize: 12, color: '#475569', fontWeight: 600 }}>
              Equipe
            </span>
            <select
              value={filters.equipe}
              onChange={event =>
                setFilters(prev => ({ ...prev, equipe: event.target.value }))
              }
              style={{
                padding: '10px 12px',
                borderRadius: 10,
                border: '1px solid #e2e8f0'
              }}
            >
              <option value="">Todos</option>
              {equipesFiltro.map(value => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </div>
          <div style={{ display: 'grid', gap: 4 }}>
            <span style={{ fontSize: 12, color: '#475569', fontWeight: 600 }}>
              Ciclo
            </span>
            <select
              value={filters.ciclo}
              onChange={event =>
                setFilters(prev => ({ ...prev, ciclo: event.target.value }))
              }
              style={{
                padding: '10px 12px',
                borderRadius: 10,
                border: '1px solid #e2e8f0'
              }}
            >
              <option value="">Todos</option>
              {ciclos.map(value => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </div>
          <div style={{ display: 'grid', gap: 4 }}>
            <span style={{ fontSize: 12, color: '#475569', fontWeight: 600 }}>
              Sigla
            </span>
            <select
              value={filters.sigla}
              onChange={event =>
                setFilters(prev => ({ ...prev, sigla: event.target.value }))
              }
              style={{
                padding: '10px 12px',
                borderRadius: 10,
                border: '1px solid #e2e8f0'
              }}
            >
              <option value="">Todos</option>
              {siglas.map(value => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </div>
          <div style={{ display: 'grid', gap: 4 }}>
            <span style={{ fontSize: 12, color: '#475569', fontWeight: 600 }}>
              Monitorados
            </span>
            <select
              value={filters.monitorados}
              onChange={event =>
                setFilters(prev => ({ ...prev, monitorados: event.target.value }))
              }
              style={{
                padding: '10px 12px',
                borderRadius: 10,
                border: '1px solid #e2e8f0'
              }}
            >
              <option value="">Todos</option>
              {monitoradosOptions.map(value => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </div>
          <div style={{ display: 'grid', gap: 4 }}>
            <span style={{ fontSize: 12, color: '#475569', fontWeight: 600 }}>
              Status do ativo
            </span>
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
                <option key={option.id_parametro} value={option.valor}>
                  {option.valor}
                </option>
              ))}
            </select>
          </div>
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
            Total: <strong style={{ color: '#1e293b' }}>{filteredAtivos.length}</strong>{' '}
            ativos filtrados
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <button
              type="button"
              onClick={openNewAtivo}
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
              Novo Ativo
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
                cursor: 'pointer'
              }}
            >
              Limpar
            </button>
          </div>
        </div>
      </div>

      {ativosLoading && (
        <div style={{ color: '#64748b', fontSize: 13 }}>
          Carregando ativos...
        </div>
      )}
      {ativosError && (
        <div style={{ color: '#f87171', fontSize: 13 }}>{ativosError}</div>
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
              <th
                style={{ padding: 12, cursor: 'pointer' }}
                onClick={() => toggleSort('ATIVO_CODPE')}
              >
                IDCOD{sortIndicator('ATIVO_CODPE')}
              </th>
              <th style={{ cursor: 'pointer' }} onClick={() => toggleSort('ATIVO_DESCRITIVO_OS')}>
                Descritivo Ativo{sortIndicator('ATIVO_DESCRITIVO_OS')}
              </th>
              <th style={{ cursor: 'pointer' }} onClick={() => toggleSort('ATIVO_EQUIPE')}>
                Equipe{sortIndicator('ATIVO_EQUIPE')}
              </th>
              <th style={{ cursor: 'pointer' }} onClick={() => toggleSort('ATIVO_CICLO')}>
                Ciclo{sortIndicator('ATIVO_CICLO')}
              </th>
              <th style={{ cursor: 'pointer' }} onClick={() => toggleSort('ATIVO_SIGLA')}>
                Sub{sortIndicator('ATIVO_SIGLA')}
              </th>
              <th style={{ cursor: 'pointer' }} onClick={() => toggleSort('ATIVO_MONITORADOS')}>
                Monitorado{sortIndicator('ATIVO_MONITORADOS')}
              </th>
              <th style={{ cursor: 'pointer' }} onClick={() => toggleSort('ATIVO_ULTIMA_MANUT')}>
                Última Manutenção{sortIndicator('ATIVO_ULTIMA_MANUT')}
              </th>
              <th style={{ paddingRight: 12 }}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {pagedAtivos.map(item => (
              <tr key={item.id} style={{ borderTop: '1px solid #e2e8f0' }}>
                <td style={{ padding: 12 }}>
                  <button
                    type="button"
                    onClick={() => openEditAtivo(item.ATIVO_CODPE)}
                    style={{
                      border: 'none',
                      background: 'transparent',
                      color: '#1d4ed8',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    {item.ATIVO_CODPE}
                  </button>
                </td>
                <td>{item.ATIVO_DESCRITIVO_OS}</td>
                <td>{item.ATIVO_EQUIPE}</td>
                <td>{item.ATIVO_CICLO}</td>
                <td>{item.ATIVO_SIGLA}</td>
                <td>{item.ATIVO_MONITORADOS}</td>
                <td>{formatDate(item.ATIVO_ULTIMA_MANUT)}</td>
                <td style={{ paddingRight: 12 }}>
                  {canDeleteAtivos && (
                    <button
                      type="button"
                      onClick={() => handleDeleteAtivo(item.id)}
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
            {filteredAtivos.length === 0 && !ativosLoading && (
              <tr>
                <td colSpan={8} style={{ padding: 16, color: '#94a3b8' }}>
                  Nenhum ativo encontrado.
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
          Mostrando {filteredAtivos.length ? (page - 1) * pageSize + 1 : 0}-
          {Math.min(page * pageSize, filteredAtivos.length)} de {filteredAtivos.length}
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <label style={{ fontSize: 12, color: '#64748b' }}>Page size</label>
          <select
            value={pageSize}
            onChange={event => {
              const next = Number(event.target.value)
              setPageSize(next)
              try {
                localStorage.setItem('tecrail:ativos:page-size', String(next))
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

      <Modal
        title={isEditing ? 'Editar ativo' : 'Novo ativo'}
        isOpen={modalOpen}
        onClose={closeMainModal}
        fullScreen
        footer={
          <>
            <button
              type="button"
              onClick={closeMainModal}
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
              onClick={handleSave}
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
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 12
          }}
        >
          <Tabs
            tabs={[
              { id: 'cadastro', label: 'Cadastro' },
              { id: 'historico', label: 'Histórico' },
              { id: 'componentes', label: 'Componentes' },
              { id: 'materiais', label: 'Materiais' },
              { id: 'pendencias', label: 'Pendências' },
              { id: 'falhas', label: 'Falhas' },
              { id: 'documentacao', label: 'Documentação' },
              { id: 'modificacoes', label: 'Modificações' }
            ]}
            activeId={activeTab}
            onChange={setActiveTab}
          />
          <button
            type="button"
            onClick={openStatusHistory}
            disabled={!formState.id}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 10,
              padding: '10px 16px',
              borderRadius: 12,
              border: '1px solid #e2e8f0',
              background: '#ffffff',
              color: '#0f172a',
              fontWeight: 600,
              fontSize: 14,
              cursor: formState.id ? 'pointer' : 'not-allowed',
              opacity: formState.id ? 1 : 0.6
            }}
          >
            Hist. Status
          </button>
        </div>
        {statusHistoryVisible && (
          <div
            style={{
              marginTop: 16,
              borderRadius: 16,
              border: '1px solid #e2e8f0',
              background: '#ffffff',
              overflow: 'hidden'
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '12px 16px',
                borderBottom: '1px solid #e2e8f0',
                background: '#f8fafc'
              }}
            >
              <span style={{ fontWeight: 600, fontSize: 14, color: '#1f2937' }}>
                Histórico de Status
              </span>
              <button
                type="button"
                onClick={closeStatusHistory}
                style={{
                  padding: '6px 12px',
                  borderRadius: 10,
                  border: '1px solid #e2e8f0',
                  background: '#ffffff',
                  fontWeight: 600,
                  fontSize: 14,
                  cursor: 'pointer',
                  color: '#1d4ed8'
                }}
              >
                Fechar
              </button>
            </div>
            <div style={{ padding: 16, display: 'grid', gap: 10 }}>
              {statusHistoryLoading && (
                <div style={{ color: '#64748b', fontSize: 13 }}>
                  Carregando histórico de status...
                </div>
              )}
              {!statusHistoryLoading && statusHistoryError && (
                <div style={{ color: '#f87171', fontSize: 13 }}>
                  {statusHistoryError}
                </div>
              )}
              {!statusHistoryLoading &&
                !statusHistoryError &&
                (statusHistory.length === 0 ? (
                  <div style={{ color: '#94a3b8', fontSize: 13 }}>
                    Nenhum registro de histórico de status encontrado.
                  </div>
                ) : (
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
                      <thead>
                        <tr
                          style={{
                            borderBottom: '1px solid #e2e8f0',
                            background: '#ffffff'
                          }}
                        >
                          <th
                            style={{
                              padding: 12,
                              textAlign: 'left',
                              fontWeight: 600,
                              fontSize: 12,
                              color: '#475569'
                            }}
                          >
                            Data alteração
                          </th>
                          <th
                            style={{
                              padding: 12,
                              textAlign: 'left',
                              fontWeight: 600,
                              fontSize: 12,
                              color: '#475569'
                            }}
                          >
                            Status
                          </th>
                          <th
                            style={{
                              padding: 12,
                              textAlign: 'left',
                              fontWeight: 600,
                              fontSize: 12,
                              color: '#475569'
                            }}
                          >
                            Equipe
                          </th>
                          <th
                            style={{
                              padding: 12,
                              textAlign: 'left',
                              fontWeight: 600,
                              fontSize: 12,
                              color: '#475569'
                            }}
                          >
                            Usuário
                          </th>
                          <th
                            style={{
                              padding: 12,
                              textAlign: 'left',
                              fontWeight: 600,
                              fontSize: 12,
                              color: '#475569'
                            }}
                          >
                            Observação
                          </th>
                          <th
                            style={{
                              padding: 12,
                              textAlign: 'left',
                              fontWeight: 600,
                              fontSize: 12,
                              color: '#475569'
                            }}
                          >
                            Previsão de reparo
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {statusHistory.map(entry => (
                          <tr
                            key={entry.id}
                            style={{ borderTop: '1px solid #e2e8f0' }}
                          >
                            <td style={{ padding: 12 }}>
                              {formatDate(entry.dataAlteracao || null)}
                            </td>
                            <td style={{ padding: 12 }}>{entry.status}</td>
                            <td style={{ padding: 12 }}>{entry.equipe || '-'}</td>
                            <td style={{ padding: 12 }}>
                              {entry.changedByName || '-'}
                            </td>
                            <td
                              style={{
                                padding: 12,
                                maxWidth: 220,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap'
                              }}
                              title={entry.observacao}
                            >
                              {entry.observacao || '-'}
                            </td>
                            <td style={{ padding: 12 }}>
                              {formatDate(entry.dataPrevisaoReparo || null)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ))}
            </div>
          </div>
        )}
        {!statusHistoryVisible && activeTab === 'cadastro' && (
          <div style={{ display: 'grid', gap: 12 }}>
            {renderSection('principal', 'Principal', principalFields)}
            {renderSection('estrutura', 'Estrutura', estruturaFields)}
            {renderSection('monitoramento', 'Monitoramento', monitoramentoFields)}
            {renderSection(
              'endereco',
              'Endereço',
              enderecoFields,
              mapUrl ? (
                <button
                  type="button"
                  onClick={() => window.open(mapUrl, '_blank', 'noopener,noreferrer')}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '8px 12px',
                    borderRadius: 10,
                    border: '1px solid #e2e8f0',
                    background: '#ffffff',
                    cursor: 'pointer',
                    fontWeight: 600,
                    color: '#1d4ed8',
                    width: 'fit-content'
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
                    <path
                      d="M12 21s6-5.2 6-11a6 6 0 10-12 0c0 5.8 6 11 6 11z"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <circle cx="12" cy="10" r="2.5" fill="none" stroke="currentColor" strokeWidth="2" />
                  </svg>
                  Abrir no mapa
                </button>
              ) : (
                <div style={{ fontSize: 12, color: '#94a3b8' }}>
                  Informe latitude e longitude para abrir o mapa.
                </div>
              )
            )}
            {renderSection('obs', 'Obs', obsFields)}
            {formErrors.length > 0 && (
              <div style={{ color: '#f87171', fontSize: 12 }}>
                {formErrors.map(error => (
                  <div key={error}>{error}</div>
                ))}
              </div>
            )}
          </div>
        )}

        {!statusHistoryVisible && activeTab === 'historico' && (
          <div style={{ color: '#94a3b8', fontSize: 13 }}>
            Histórico de Manutenção será exibido aqui.
          </div>
        )}

        {!statusHistoryVisible && activeTab === 'modificacoes' && (
          <div style={{ display: 'grid', gap: 12 }}>
            {historyLoading && (
              <div style={{ color: '#64748b', fontSize: 12 }}>
                Carregando Histórico...
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
                    gap: 10,
                    maxHeight: 360,
                    overflowY: 'auto',
                    paddingRight: 4
                  }}
                >
                  {historyItems.map(item => {
                    const before = parseHistoryData(item.before_data)
                    const after = parseHistoryData(item.after_data)
                    const changes = buildChanges(before, after)
                    return (
                      <div
                        key={item.id}
                        style={{
                          padding: '10px 12px',
                          borderRadius: 10,
                          background: '#ffffff',
                          border: '1px solid #e2e8f0',
                          display: 'grid',
                          gap: 6
                        }}
                      >
                        <div style={{ fontWeight: 600 }}>
                          {item.action === 'criado'
                            ? 'Criado'
                            : 'Alterações'}
                        </div>
                        {changes.length ? (
                          <div style={{ display: 'grid', gap: 4, fontSize: 13 }}>
                            {changes.map(change => (
                              <div key={`${item.id}-${change.label}`}>
                                {change.label} ({change.before}) para {change.label} (
                                {change.after})
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div style={{ fontSize: 12, color: '#94a3b8' }}>
                            Sem alterações registradas.
                          </div>
                        )}
                        <div style={{ fontSize: 12, color: '#64748b' }}>
                          Usuário: {item.changed_by_name || 'Usuário'} |{' '}
                          {formatDate(item.created_at)}
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div style={{ color: '#94a3b8', fontSize: 12 }}>
                  Nenhum Histórico encontrado.
                </div>
              ))}
          </div>
        )}

        {!statusHistoryVisible && activeTab === 'componentes' && (
          <div style={{ display: 'grid', gap: 12 }}>
            {componentesAtivoLoading && (
              <div style={{ color: '#64748b', fontSize: 13 }}>
                Carregando componentes...
              </div>
            )}
            {!componentesAtivoLoading && componentesAtivoError && (
              <div style={{ color: '#f87171', fontSize: 13 }}>
                {componentesAtivoError}
              </div>
            )}
            {!componentesAtivoLoading && !componentesAtivoError && (
              <>
                {componentesAtivo.length === 0 ? (
                  <div style={{ color: '#94a3b8', fontSize: 13 }}>
                    Nenhum componente cadastrado para este ativo.
                  </div>
                ) : (
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
                      <thead>
                        <tr
                          style={{
                            borderBottom: '1px solid #e2e8f0',
                            background: '#ffffff'
                          }}
                        >
                          <th
                            style={{
                              padding: 12,
                              textAlign: 'left',
                              fontWeight: 600,
                              fontSize: 12,
                              color: '#475569'
                            }}
                          >
                            ID
                          </th>
                          <th
                            style={{
                              padding: 12,
                              textAlign: 'left',
                              fontWeight: 600,
                              fontSize: 12,
                              color: '#475569'
                            }}
                          >
                            Componente
                          </th>
                          <th
                            style={{
                              padding: 12,
                              textAlign: 'left',
                              fontWeight: 600,
                              fontSize: 12,
                              color: '#475569'
                            }}
                          >
                            Modelo
                          </th>
                          <th
                            style={{
                              padding: 12,
                              textAlign: 'left',
                              fontWeight: 600,
                              fontSize: 12,
                              color: '#475569'
                            }}
                          >
                            Serial
                          </th>
                          <th
                            style={{
                              padding: 12,
                              textAlign: 'left',
                              fontWeight: 600,
                              fontSize: 12,
                              color: '#475569'
                            }}
                          >
                            Instalação
                          </th>
                          <th
                            style={{
                              padding: 12,
                              textAlign: 'left',
                              fontWeight: 600,
                              fontSize: 12,
                              color: '#475569'
                            }}
                          >
                            Descrição
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {componentesAtivo.map(component => (
                          <tr
                            key={component.IDCOMPONETE}
                            style={{ borderTop: '1px solid #e2e8f0' }}
                          >
                            <td style={{ padding: 12 }}>
                              <button
                                type="button"
                                onClick={() => openComponentDetail(component.IDCOMPONETE)}
                                style={{
                                  border: 'none',
                                  background: 'transparent',
                                  color: '#1d4ed8',
                                  fontWeight: 600,
                                  cursor: 'pointer'
                                }}
                              >
                                {component.IDCOMPONETE}
                              </button>
                            </td>
                            <td style={{ padding: 12 }}>
                              {component.COMP_NOME || '-'}
                            </td>
                            <td style={{ padding: 12 }}>
                              {component.COMP_MODELO || '-'}
                            </td>
                            <td style={{ padding: 12 }}>
                              {component.COMP_SERIAL || '-'}
                            </td>
                            <td style={{ padding: 12 }}>
                              {formatComponentDate(component.COMP_DATA || undefined)}
                            </td>
                            <td
                              style={{
                                padding: 12,
                                maxWidth: 260,
                                textAlign: 'left',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap'
                              }}
                              title={component.COMP_DESCRICAO}
                            >
                              {component.COMP_DESCRICAO || '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {!statusHistoryVisible && activeTab === 'pendencias' && (
          <div style={{ display: 'grid', gap: 12 }}>
            {pendenciasLoading && (
              <div style={{ color: '#64748b', fontSize: 13 }}>
                Carregando pendências...
              </div>
            )}
            {!pendenciasLoading && pendenciasError && (
              <div style={{ color: '#f87171', fontSize: 13 }}>
                {pendenciasError}
              </div>
            )}
            {!pendenciasLoading && !pendenciasError && (
              <>
                {pendenciasAtivo.length === 0 ? (
                  <div style={{ color: '#94a3b8', fontSize: 13 }}>
                    Nenhuma pendência cadastrada para este ativo.
                  </div>
                ) : (
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
                      <thead>
                        <tr
                          style={{
                            borderBottom: '1px solid #e2e8f0',
                            background: '#ffffff'
                          }}
                        >
                          <th
                            style={{
                              padding: 12,
                              textAlign: 'left',
                              fontWeight: 600,
                              fontSize: 12,
                              color: '#475569'
                            }}
                          >
                            ID
                          </th>
                          <th
                            style={{
                              padding: 12,
                              textAlign: 'left',
                              fontWeight: 600,
                              fontSize: 12,
                              color: '#475569'
                            }}
                          >
                            Pendência
                          </th>
                          <th
                            style={{
                              padding: 12,
                              textAlign: 'left',
                              fontWeight: 600,
                              fontSize: 12,
                              color: '#475569'
                            }}
                          >
                            Status
                          </th>
                          <th
                            style={{
                              padding: 12,
                              textAlign: 'left',
                              fontWeight: 600,
                              fontSize: 12,
                              color: '#475569'
                            }}
                          >
                            Criada
                          </th>
                          <th
                            style={{
                              padding: 12,
                              textAlign: 'left',
                              fontWeight: 600,
                              fontSize: 12,
                              color: '#475569'
                            }}
                          >
                            Programada
                          </th>
                          <th
                            style={{
                              padding: 12,
                              textAlign: 'left',
                              fontWeight: 600,
                              fontSize: 12,
                              color: '#475569'
                            }}
                          >
                            Realizada
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {pendenciasAtivo.map(pendencia => (
                          <tr
                            key={pendencia.IDNOTA}
                            style={{ borderTop: '1px solid #e2e8f0' }}
                          >
                            <td style={{ padding: 12 }}>
                              <button
                                type="button"
                                onClick={() => openPendenciaDetail(pendencia.IDNOTA)}
                                style={{
                                  border: 'none',
                                  background: 'transparent',
                                  color: '#1d4ed8',
                                  fontWeight: 600,
                                  cursor: 'pointer'
                                }}
                              >
                                {pendencia.IDNOTA}
                              </button>
                            </td>
                            <td style={{ padding: 12 }}>
                              {pendencia.nota_pendencia || '-'}
                            </td>
                            <td style={{ padding: 12 }}>{pendencia.nota_status}</td>
                            <td style={{ padding: 12 }}>
                              {formatDate(pendencia.nota_data_criada)}
                            </td>
                            <td style={{ padding: 12 }}>
                              {formatDate(pendencia.nota_data_programada)}
                            </td>
                            <td style={{ padding: 12 }}>
                              {formatDate(pendencia.nota_data_realizada)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {!statusHistoryVisible &&
          activeTab !== 'cadastro' &&
          activeTab !== 'historico' &&
          activeTab !== 'modificacoes' &&
          activeTab !== 'componentes' &&
          activeTab !== 'pendencias' && (
          <div style={{ color: '#94a3b8', fontSize: 13 }}>
            Conteúdo em preparação para esta aba.
          </div>
        )}
      </Modal>
      <Modal
        title={
          statusChangeDraft.status
            ? `Alteração de status (${statusChangeDraft.status})`
            : 'Alteração de status'
        }
        isOpen={statusChangeModalOpen}
        onClose={handleStatusModalCancel}
        footer={
          <>
            <button
              type="button"
              onClick={handleStatusModalCancel}
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
              onClick={handleStatusModalSave}
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
          <div style={{ color: '#475569', fontSize: 14 }}>
            Informe os dados obrigatórios sempre que o status não for OK.
          </div>
          {statusChangeError && (
            <div style={{ color: '#f87171', fontSize: 13 }}>{statusChangeError}</div>
          )}
          <div style={{ display: 'grid', gap: 6 }}>
            <span style={fieldLabelStyle}>Observação *</span>
            <textarea
              value={statusChangeDraft.observacao}
              onChange={event =>
                setStatusChangeDraft(prev => ({
                  ...prev,
                  observacao: event.target.value
                }))
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
          <div style={{ display: 'grid', gap: 6 }}>
            <span style={fieldLabelStyle}>Data da alteração *</span>
            <input
              type="date"
              value={statusChangeDraft.dataAlteracao}
              onChange={event =>
                setStatusChangeDraft(prev => ({
                  ...prev,
                  dataAlteracao: event.target.value
                }))
              }
              style={{
                padding: '10px 12px',
                borderRadius: 10,
                border: '1px solid #e2e8f0'
              }}
            />
          </div>
          <div style={{ display: 'grid', gap: 6 }}>
            <span style={fieldLabelStyle}>Data previsão de reparo</span>
            <input
              type="date"
              value={statusChangeDraft.dataPrevisao ?? ''}
              onChange={event =>
                setStatusChangeDraft(prev => ({
                  ...prev,
                  dataPrevisao: event.target.value
                }))
              }
              style={{
                padding: '10px 12px',
                borderRadius: 10,
                border: '1px solid #e2e8f0'
              }}
            />
          </div>
        </div>

      </Modal>
      <Modal
        title={
          detailComponent
            ? `Componente #${detailComponent.IDCOMPONETE}`
            : 'Detalhe do componente'
        }
        isOpen={detailModalOpen}
        onClose={closeComponentDetail}
        fullScreen
        footer={
          <button
            type="button"
            onClick={closeComponentDetail}
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
        }
      >
        {detailLoading && (
          <div style={{ color: '#64748b', fontSize: 13 }}>
            Carregando detalhes do componente...
          </div>
        )}
        {!detailLoading && detailError && (
          <div style={{ color: '#f87171', fontSize: 13 }}>{detailError}</div>
        )}
        {!detailLoading && !detailError && detailComponent && (
          <div style={{ display: 'grid', gap: 16 }}>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: 12
              }}
            >
              <div style={{ display: 'grid', gap: 4 }}>
                <span style={fieldLabelStyle}>Componente</span>
                <div>{detailComponent.COMP_NOME || '-'}</div>
              </div>
              <div style={{ display: 'grid', gap: 4 }}>
                <span style={fieldLabelStyle}>Modelo</span>
                <div>{detailComponent.COMP_MODELO || '-'}</div>
              </div>
              <div style={{ display: 'grid', gap: 4 }}>
                <span style={fieldLabelStyle}>Serial</span>
                <div>{detailComponent.COMP_SERIAL || '-'}</div>
              </div>
              <div style={{ display: 'grid', gap: 4 }}>
                <span style={fieldLabelStyle}>Instalação</span>
                <div>{formatComponentDate(detailComponent.COMP_DATA || undefined)}</div>
              </div>
            </div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: 12
              }}
            >
              <div style={{ display: 'grid', gap: 4 }}>
                <span style={fieldLabelStyle}>CODPE</span>
                <div>{detailComponent.ATIVO_CODPE || '-'}</div>
              </div>
              <div style={{ display: 'grid', gap: 4 }}>
                <span style={fieldLabelStyle}>Descritor</span>
                <div>{detailComponent.ATIVO_DESCRITIVO_OS || '-'}</div>
              </div>
              <div style={{ display: 'grid', gap: 4 }}>
                <span style={fieldLabelStyle}>Sigla</span>
                <div>{detailComponent.ATIVO_SIGLA || '-'}</div>
              </div>
              <div style={{ display: 'grid', gap: 4 }}>
                <span style={fieldLabelStyle}>Coordenação</span>
                <div>{detailComponent.ATIVO_COORDENACAO || '-'}</div>
              </div>
              <div style={{ display: 'grid', gap: 4 }}>
                <span style={fieldLabelStyle}>Equipe</span>
                <div>{detailComponent.ATIVO_EQUIPE || '-'}</div>
              </div>
            </div>
            <div style={{ display: 'grid', gap: 4 }}>
              <span style={fieldLabelStyle}>Descrição</span>
              <div
                style={{
                  minHeight: 60,
                  border: '1px dashed #e2e8f0',
                  borderRadius: 10,
                  padding: 12,
                  background: '#f8fafc',
                  whiteSpace: 'pre-line'
                }}
              >
                {detailComponent.COMP_DESCRICAO || '-'}
              </div>
            </div>
          </div>
        )}
      </Modal>
      <Modal
        title={
          pendenciaDetail
            ? `Pendência #${pendenciaDetail.IDNOTA}`
            : 'Detalhe da pendência'
        }
        isOpen={pendenciaModalOpen}
        onClose={closePendenciaDetail}
        fullScreen
        footer={
          <button
            type="button"
            onClick={closePendenciaDetail}
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
        }
      >
        {pendenciaDetailLoading && (
          <div style={{ color: '#64748b', fontSize: 13 }}>
            Carregando pendência...
          </div>
        )}
        {!pendenciaDetailLoading && pendenciaDetailError && (
          <div style={{ color: '#f87171', fontSize: 13 }}>
            {pendenciaDetailError}
          </div>
        )}
        {!pendenciaDetailLoading && !pendenciaDetailError && pendenciaDetail && (
          <div style={{ display: 'grid', gap: 16 }}>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: 12
              }}
            >
              <div style={{ display: 'grid', gap: 4 }}>
                <span style={fieldLabelStyle}>Status</span>
                <div>{pendenciaDetail.nota_status}</div>
              </div>
              <div style={{ display: 'grid', gap: 4 }}>
                <span style={fieldLabelStyle}>Criada em</span>
                <div>{formatDate(pendenciaDetail.nota_data_criada)}</div>
              </div>
              <div style={{ display: 'grid', gap: 4 }}>
                <span style={fieldLabelStyle}>Programada para</span>
                <div>{formatDate(pendenciaDetail.nota_data_programada)}</div>
              </div>
              <div style={{ display: 'grid', gap: 4 }}>
                <span style={fieldLabelStyle}>Realizada em</span>
                <div>{formatDate(pendenciaDetail.nota_data_realizada)}</div>
              </div>
            </div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: 12
              }}
            >
              <div style={{ display: 'grid', gap: 4 }}>
                <span style={fieldLabelStyle}>Ativo</span>
                <div>{pendenciaDetail.ATIVO_CODPE || '-'}</div>
              </div>
              <div style={{ display: 'grid', gap: 4 }}>
                <span style={fieldLabelStyle}>Descritor</span>
                <div>{pendenciaDetail.ATIVO_DESCRITIVO_OS || '-'}</div>
              </div>
            </div>
            <div style={{ display: 'grid', gap: 4 }}>
              <span style={fieldLabelStyle}>Pendência</span>
              <div
                style={{
                  minHeight: 60,
                  border: '1px dashed #e2e8f0',
                  borderRadius: 10,
                  padding: 12,
                  background: '#f8fafc',
                  whiteSpace: 'pre-line'
                }}
              >
                {pendenciaDetail.nota_pendencia || '-'}
              </div>
            </div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: 12
              }}
            >
              <div style={{ display: 'grid', gap: 4 }}>
                <span style={fieldLabelStyle}>Observação PCM</span>
                <div>{pendenciaDetail.nota_observacao_pcm || '-'}</div>
              </div>
              <div style={{ display: 'grid', gap: 4 }}>
                <span style={fieldLabelStyle}>Observação técnico</span>
                <div>{pendenciaDetail.nota_observacao_tecnico || '-'}</div>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </section>
  )
}
