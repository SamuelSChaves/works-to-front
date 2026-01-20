import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type DragEvent,
  type MouseEvent as ReactMouseEvent
} from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { API_URL } from '../services/api'
import { getStoredToken, logout, setPostLoginRedirect } from '../services/auth'

type SchedulerOs = {
  id: string
  os_numero: number
  os_tipo: string
  os_status: string
  os_programado1: string | null
  os_programado2: string | null
  os_programado3: string | null
  os_programado4: string | null
  os_programado5: string | null
  os_realizado_em: string | null
  ATIVO_CODPE: string
  ATIVO_DESCRITIVO_OS: string
  ATIVO_EQUIPE: string
}

type EstruturaItem = {
  id: string
  coordenacao: string
  equipe: string
  cc: string
  execucao?: string
  status: string
}

type SchedulerSubTeamConfig = {
  coordenacao: string
  equipe_id: string
  sub_equipe: string
  escala: string
  status: string
  observacao: string | null
}

type SchedulerAssignmentRow = {
  os_id: string
  coordenacao: string
  equipe_id: string
  sub_equipe: string
}

type SchedulerHoliday = {
  id: string
  equipe_id: string
  feriado: string
  data: string
}

type WeekComments = Record<string, string[]>

type DragPayload = {
  osId: string
  source: 'backlog' | 'calendar'
  dateKey?: string
}

type CalendarDay = {
  date: Date
  dateKey: string
  week: number
  isPast: boolean
  isCurrentMonth: boolean
}

type CalendarEntry = {
  key: string
  os: SchedulerOs
  dateKey: string
  variant: 'planned' | 'realized'
  color: 'yellow' | 'green'
  isOverdueWeek1?: boolean
}

const programadoFields = [
  'os_programado1',
  'os_programado2',
  'os_programado3',
  'os_programado4',
  'os_programado5'
] as const

type ProgramadoField = (typeof programadoFields)[number]
const SCHEDULER_FILTERS_KEY = 'os_scheduler_filters'

type SchedulerFilters = {
  monthValue?: string
  selectedCoordenacao?: string
  selectedEquipeId?: string
  selectedEscala?: string
  selectedSubEquipe?: string
  backlogType?: string
  backlogSearch?: string
}

function loadSchedulerFilters(): SchedulerFilters | null {
  try {
    const raw = localStorage.getItem(SCHEDULER_FILTERS_KEY)
    if (!raw) return null
    return JSON.parse(raw) as SchedulerFilters
  } catch {
    return null
  }
}

function getLocalDateString(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function getMonthValue(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

function normalizeDateValue(value: string | null) {
  if (!value) return null
  const trimmed = String(value).trim()
  if (!trimmed) return null
  const datePart = trimmed.split('T')[0].split(' ')[0]
  return datePart || null
}

function buildProgramadoUpdate(week: number, date: string) {
  const update: Record<ProgramadoField, string | null> = {
    os_programado1: null,
    os_programado2: null,
    os_programado3: null,
    os_programado4: null,
    os_programado5: null
  }

  if (week >= 1 && week <= 5) {
    update[programadoFields[week - 1]] = date
  }

  return update
}

function clearProgramadoUpdate() {
  return {
    os_programado1: null,
    os_programado2: null,
    os_programado3: null,
    os_programado4: null,
    os_programado5: null
  }
}

function getProgramadoDates(os: SchedulerOs) {
  return programadoFields
    .map((field, index) => ({
      date: normalizeDateValue(os[field]),
      week: index + 1
    }))
    .filter(item => item.date) as Array<{ date: string; week: number }>
}

function buildProgramadoUpdateForOs(
  os: SchedulerOs,
  week: number,
  date: string,
  todayKey: string
) {
  if (!isWeek1Overdue(os, todayKey)) {
    return buildProgramadoUpdate(week, date)
  }

  const update: Partial<Record<ProgramadoField, string | null>> = {
    os_programado2: null,
    os_programado3: null,
    os_programado4: null,
    os_programado5: null
  }

  if (week >= 2 && week <= 5) {
    update[programadoFields[week - 1]] = date
  }

  return update
}

function buildResetUpdate(os: SchedulerOs, todayKey: string) {
  if (!isWeek1Overdue(os, todayKey)) {
    return {
      os_status: 'CRIADO',
      ...clearProgramadoUpdate()
    }
  }

  return {
    os_programado2: null,
    os_programado3: null,
    os_programado4: null,
    os_programado5: null
  }
}

function buildCalendarDays(monthValue: string, todayKey: string): CalendarDay[] {
  const [yearValue, monthValueRaw] = monthValue.split('-')
  const year = Number(yearValue)
  const monthIndex = Number(monthValueRaw) - 1
  const firstOfMonth = new Date(year, monthIndex, 1)
  const dayOfWeek = firstOfMonth.getDay()
  const offset = (dayOfWeek + 6) % 7
  const start = new Date(year, monthIndex, 1 - offset)
  const days: CalendarDay[] = []

  for (let i = 0; i < 35; i += 1) {
    const date = new Date(start)
    date.setDate(start.getDate() + i)
    const dateKey = getLocalDateString(date)
    const isCurrentMonth = date.getMonth() === monthIndex
    days.push({
      date,
      dateKey,
      week: Math.floor(i / 7) + 1,
      isPast: isCurrentMonth && dateKey < todayKey,
      isCurrentMonth
    })
  }

  return days
}

async function getApiErrorMessage(response: Response, fallback: string) {
  if (response.status === 403) {
    return 'Codigo erro 403 - Seu perfil nao tem permissao para essa operacao.'
  }
  const message = await response.text()
  return message || fallback
}

function formatShortDate(value: string) {
  const [year, month, day] = value.split('-')
  if (!year || !month || !day) return value
  return `${day}/${month}`
}

function formatLongDate(value: string) {
  const [year, month, day] = value.split('-')
  if (!year || !month || !day) return value
  return `${day}/${month}/${year}`
}

function getLockKey(osId: string, dateKey: string) {
  return `${osId}::${dateKey}`
}

function isWeek1Overdue(os: SchedulerOs, todayKey: string) {
  const planned = normalizeDateValue(os.os_programado1)
  if (!planned) return false
  if (os.os_status !== 'PROGRAMADO') return false
  if (os.os_realizado_em) return false
  return planned < todayKey
}

export function OrdensServicoScheduler() {
  const navigate = useNavigate()
  const initialFilters = useMemo(() => loadSchedulerFilters(), [])
  const [items, setItems] = useState<SchedulerOs[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [monthValue, setMonthValue] = useState(
    () => initialFilters?.monthValue || getMonthValue(new Date())
  )
  const [estruturas, setEstruturas] = useState<EstruturaItem[]>([])
  const [subTeamConfigs, setSubTeamConfigs] = useState<SchedulerSubTeamConfig[]>([])
  const [selectedCoordenacao, setSelectedCoordenacao] = useState(
    () => initialFilters?.selectedCoordenacao || ''
  )
  const [selectedEquipeId, setSelectedEquipeId] = useState(
    () => initialFilters?.selectedEquipeId || ''
  )
  const [selectedEscala, setSelectedEscala] = useState(
    () => initialFilters?.selectedEscala || ''
  )
  const [selectedSubEquipe, setSelectedSubEquipe] = useState(
    () => initialFilters?.selectedSubEquipe || ''
  )
  const [assignmentMap, setAssignmentMap] = useState<
    Record<string, SchedulerAssignmentRow>
  >({})
  const [holidays, setHolidays] = useState<SchedulerHoliday[]>([])
  const [contextMenu, setContextMenu] = useState<{
    x: number
    y: number
    osId: string
    dateKey: string
  } | null>(null)
  const [colorMap, setColorMap] = useState<Record<string, string>>({})
  const [lockMap, setLockMap] = useState<Record<string, boolean>>({})
  const [noteMap, setNoteMap] = useState<Record<string, string>>({})
  const [weekComments, setWeekComments] = useState<WeekComments>({})
  const [weekModal, setWeekModal] = useState<{ week: number } | null>(null)
  const [weekCommentInput, setWeekCommentInput] = useState('')
  const [weekCommentTarget, setWeekCommentTarget] = useState('')
  const [noteModal, setNoteModal] = useState<{
    osId: string
    dateKey: string
    value: string
  } | null>(null)
  const [expandedOsId, setExpandedOsId] = useState<string | null>(null)
  const [backlogType, setBacklogType] = useState(
    () => initialFilters?.backlogType || ''
  )
  const [backlogSearch, setBacklogSearch] = useState(
    () => initialFilters?.backlogSearch || ''
  )
  const contextMenuRef = useRef<HTMLDivElement | null>(null)
  const configLoadedRef = useRef(false)

  const todayKey = useMemo(() => getLocalDateString(new Date()), [])

  useEffect(() => {
    const token = getStoredToken()
    if (!token) {
      setError('Sessao expirada. Faca login novamente.')
      setLoading(false)
      return
    }

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
        const ativos = list.filter(
          (item: EstruturaItem) =>
            item.status === 'ativo' && item.execucao === 'sim'
        )
        setEstruturas(ativos)
      })
      .catch(() => {
        setEstruturas([])
      })
  }, [navigate])

  useEffect(() => {
    if (!selectedCoordenacao) {
      setSubTeamConfigs([])
      return
    }
    const token = getStoredToken()
    if (!token) return

    const params = new URLSearchParams({ coordenacao: selectedCoordenacao })
    fetch(`${API_URL}/os/scheduler-sub-team?${params.toString()}`, {
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
        const list = Array.isArray(data.configs) ? data.configs : []
        setSubTeamConfigs(list)
      })
      .catch(() => {
        setSubTeamConfigs([])
      })
  }, [selectedCoordenacao, navigate])

  useEffect(() => {
    if (!selectedCoordenacao || !selectedEquipeId) {
      setAssignmentMap({})
      return
    }
    const token = getStoredToken()
    if (!token) return

    const params = new URLSearchParams({
      coordenacao: selectedCoordenacao,
      equipe_id: selectedEquipeId
    })
    fetch(`${API_URL}/os/scheduler-assignment?${params.toString()}`, {
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
        const list = Array.isArray(data.assignments) ? data.assignments : []
        const map: Record<string, SchedulerAssignmentRow> = {}
        list.forEach((item: SchedulerAssignmentRow) => {
          map[item.os_id] = item
        })
        setAssignmentMap(map)
      })
      .catch(() => {
        setAssignmentMap({})
      })
  }, [selectedCoordenacao, selectedEquipeId, navigate])

  useEffect(() => {
    if (!selectedEquipeId) {
      setHolidays([])
      return
    }
    const token = getStoredToken()
    if (!token) return

    const params = new URLSearchParams({ equipe_id: selectedEquipeId })
    fetch(`${API_URL}/os/scheduler-holiday?${params.toString()}`, {
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
        const list = Array.isArray(data.holidays) ? data.holidays : []
        setHolidays(list)
      })
      .catch(() => {
        setHolidays([])
      })
  }, [selectedEquipeId, navigate])

  const coordenacaoOptions = useMemo(() => {
    return Array.from(new Set(estruturas.map(item => item.coordenacao)))
  }, [estruturas])

  const equipeOptions = useMemo(() => {
    if (!selectedCoordenacao) return []
    const list = subTeamConfigs.filter(
      item =>
        item.coordenacao === selectedCoordenacao && item.status === 'ativo'
    )
    if (!list.length) return []
    const ids = Array.from(new Set(list.map(item => item.equipe_id)))
    return ids
      .map(id => ({
        id,
        label: estruturas.find(item => item.id === id)?.equipe || id
      }))
      .sort((a, b) => a.label.localeCompare(b.label))
  }, [selectedCoordenacao, subTeamConfigs, estruturas])

  const escalaOptions = useMemo(() => {
    if (!selectedCoordenacao || !selectedEquipeId) return []
    const list = subTeamConfigs.filter(
      item =>
        item.coordenacao === selectedCoordenacao &&
        item.equipe_id === selectedEquipeId &&
        item.status === 'ativo'
    )
    return Array.from(new Set(list.map(item => item.escala)))
  }, [selectedCoordenacao, selectedEquipeId, subTeamConfigs])

  const subEquipeOptions = useMemo(() => {
    if (!selectedCoordenacao || !selectedEquipeId) return []
    const list = subTeamConfigs.filter(
      item =>
        item.coordenacao === selectedCoordenacao &&
        item.equipe_id === selectedEquipeId &&
        item.status === 'ativo'
    )
    const filtered = selectedEscala
      ? list.filter(item => item.escala === selectedEscala)
      : list
    return Array.from(new Set(filtered.map(item => item.sub_equipe)))
  }, [selectedCoordenacao, selectedEquipeId, selectedEscala, subTeamConfigs])

  const selectedEquipeName = useMemo(() => {
    if (!selectedEquipeId) return ''
    return estruturas.find(item => item.id === selectedEquipeId)?.equipe || ''
  }, [estruturas, selectedEquipeId])

  useEffect(() => {
    if (!coordenacaoOptions.length) {
      if (selectedCoordenacao) setSelectedCoordenacao('')
      return
    }
    if (selectedCoordenacao && !coordenacaoOptions.includes(selectedCoordenacao)) {
      setSelectedCoordenacao('')
    }
  }, [coordenacaoOptions, selectedCoordenacao])

  useEffect(() => {
    if (!equipeOptions.length) {
      if (selectedEquipeId) setSelectedEquipeId('')
      return
    }
    const ids = equipeOptions.map(option => option.id)
    if (selectedEquipeId && !ids.includes(selectedEquipeId)) {
      setSelectedEquipeId('')
    }
  }, [equipeOptions, selectedEquipeId])

  useEffect(() => {
    if (!selectedCoordenacao) return
    if (!escalaOptions.length) {
      setSelectedEscala('')
      return
    }
    if (!selectedEscala) {
      setSelectedEscala(escalaOptions[0])
    } else if (!escalaOptions.includes(selectedEscala)) {
      setSelectedEscala(escalaOptions[0])
    }
  }, [escalaOptions, selectedCoordenacao, selectedEscala])

  useEffect(() => {
    if (!selectedCoordenacao || !selectedEquipeId) {
      if (selectedSubEquipe) setSelectedSubEquipe('')
      return
    }
    if (!subEquipeOptions.length) {
      if (selectedSubEquipe) setSelectedSubEquipe('')
      return
    }
    if (!selectedSubEquipe) {
      setSelectedSubEquipe(subEquipeOptions[0])
    } else if (!subEquipeOptions.includes(selectedSubEquipe)) {
      setSelectedSubEquipe(subEquipeOptions[0])
    }
  }, [
    subEquipeOptions,
    selectedCoordenacao,
    selectedEquipeId,
    selectedSubEquipe
  ])

  useEffect(() => {
    const token = getStoredToken()
    if (!token) return

    const load = async () => {
      if (!selectedEquipeId) {
        setItems([])
        setLoading(false)
        setError(null)
        return
      }
      try {
        setLoading(true)
        const params = new URLSearchParams()
        params.set('status', 'CRIADO,PROGRAMADO,REALIZADO')
        if (monthValue) {
          const [ano, mes] = monthValue.split('-')
          if (ano) params.set('ano', ano)
          if (mes) params.set('mes', mes)
        }
        if (selectedEquipeName) params.set('equipe', selectedEquipeName)

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
        const list = Array.isArray(data.os) ? data.os : []
        const filtered = selectedEquipeName
          ? list.filter((item: SchedulerOs) => item.ATIVO_EQUIPE === selectedEquipeName)
          : list
        setItems(filtered)
        setError(null)
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Erro ao carregar OS.'
        setError(message)
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [
    monthValue,
    selectedCoordenacao,
    selectedEquipeName,
    selectedEquipeId,
    navigate
  ])

  useEffect(() => {
    if (!contextMenu) return

    const handleOutside = (event: MouseEvent) => {
      const target = event.target as Node | null
      if (contextMenuRef.current && target) {
        if (!contextMenuRef.current.contains(target)) {
          setContextMenu(null)
        }
      } else {
        setContextMenu(null)
      }
    }

    window.addEventListener('mousedown', handleOutside)
    return () => window.removeEventListener('mousedown', handleOutside)
  }, [contextMenu])

  const loadSchedulerConfig = useCallback(
    async (
      mes: string,
      coordenacao: string,
      equipeId: string,
      subEquipe: string
    ) => {
      const token = getStoredToken()
      if (!token) return

      try {
        const params = new URLSearchParams({
          mes,
          coordenacao,
          equipe_id: equipeId,
          sub_equipe: subEquipe
        })
        const response = await fetch(
          `${API_URL}/os/scheduler-config?${params.toString()}`,
          { headers: { Authorization: `Bearer ${token}` } }
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
            'Erro ao carregar configuracoes.'
          )
          throw new Error(message)
        }

        const data = await response.json()
        const config = data?.config || null
        setColorMap((config?.colorMap as Record<string, string>) || {})
        setLockMap((config?.lockMap as Record<string, boolean>) || {})
        setNoteMap((config?.noteMap as Record<string, string>) || {})
        setWeekComments((config?.weekComments as WeekComments) || {})
        configLoadedRef.current = true
      } catch (err) {
        configLoadedRef.current = true
        const message =
          err instanceof Error ? err.message : 'Erro ao carregar configuracoes.'
        toast.error(message)
      }
    },
    [navigate]
  )

  const saveSchedulerConfig = useCallback(
    async (
      mes: string,
      coordenacao: string,
      equipeId: string,
      subEquipe: string,
      config: {
        colorMap: Record<string, string>
        lockMap: Record<string, boolean>
        noteMap: Record<string, string>
        weekComments: WeekComments
      }
    ) => {
      const token = getStoredToken()
      if (!token) return

      const response = await fetch(`${API_URL}/os/scheduler-config`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          mes,
          coordenacao,
          equipe_id: equipeId,
          sub_equipe: subEquipe,
          config
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
          'Erro ao salvar configuracoes.'
        )
        toast.error(message)
      }
    },
    [navigate]
  )

  useEffect(() => {
    if (!monthValue || !selectedCoordenacao || !selectedEquipeId || !selectedSubEquipe) return
    configLoadedRef.current = false
    setColorMap({})
    setLockMap({})
    setNoteMap({})
    setWeekComments({})
    loadSchedulerConfig(
      monthValue,
      selectedCoordenacao,
      selectedEquipeId,
      selectedSubEquipe
    )
  }, [
    monthValue,
    selectedCoordenacao,
    selectedEquipeId,
    selectedSubEquipe,
    loadSchedulerConfig
  ])

  useEffect(() => {
    if (!selectedSubEquipe) {
      setColorMap({})
      setLockMap({})
      setNoteMap({})
    }
  }, [selectedSubEquipe])

  useEffect(() => {
    const payload: SchedulerFilters = {
      monthValue,
      selectedCoordenacao,
      selectedEquipeId,
      selectedEscala,
      selectedSubEquipe,
      backlogType,
      backlogSearch
    }
    try {
      localStorage.setItem(SCHEDULER_FILTERS_KEY, JSON.stringify(payload))
    } catch {
      // ignore storage errors
    }
  }, [
    monthValue,
    selectedCoordenacao,
    selectedEquipeId,
    selectedEscala,
    selectedSubEquipe,
    backlogType,
    backlogSearch
  ])

  useEffect(() => {
    if (!configLoadedRef.current) return
    if (!monthValue || !selectedCoordenacao || !selectedEquipeId || !selectedSubEquipe) return
    const timer = window.setTimeout(() => {
      saveSchedulerConfig(
        monthValue,
        selectedCoordenacao,
        selectedEquipeId,
        selectedSubEquipe,
        {
          colorMap,
          lockMap,
          noteMap,
          weekComments
        }
      )
    }, 600)
    return () => window.clearTimeout(timer)
  }, [
    colorMap,
    lockMap,
    noteMap,
    weekComments,
    monthValue,
    selectedCoordenacao,
    selectedEquipeId,
    selectedSubEquipe,
    saveSchedulerConfig
  ])

  const baseBacklogItems = useMemo(() => {
    return items.filter(item => {
      const assignment = assignmentMap[item.id]
      const assignedToCurrent =
        assignment && assignment.sub_equipe === selectedSubEquipe
      if (item.os_status === 'CRIADO') {
        return !assignment || assignedToCurrent
      }
      if (isWeek1Overdue(item, todayKey)) {
        const scheduledDates = getProgramadoDates(item)
        const hasReprogrammedWeek = scheduledDates.some(
          scheduled => scheduled.week !== 1
        )
        return !hasReprogrammedWeek
      }
      return false
    })
  }, [items, todayKey, assignmentMap, selectedSubEquipe])

  const backlogTypeOptions = useMemo(() => {
    const types = new Set<string>()
    baseBacklogItems.forEach(item => {
      if (item.os_tipo) types.add(item.os_tipo)
    })
    return Array.from(types)
  }, [baseBacklogItems])

  const backlogItems = useMemo(() => {
    const search = backlogSearch.trim().toLowerCase()
    return baseBacklogItems.filter(item => {
      if (backlogType && item.os_tipo !== backlogType) return false
      if (!search) return true
      const haystack = [
        String(item.os_numero),
        item.ATIVO_CODPE,
        item.ATIVO_DESCRITIVO_OS
      ]
        .join(' ')
        .toLowerCase()
      return haystack.includes(search)
    })
  }, [baseBacklogItems, backlogType, backlogSearch])

  const calendarEntries = useMemo<CalendarEntry[]>(() => {
    const entries: CalendarEntry[] = []

    items.forEach(os => {
      if (os.os_status === 'CANCELADO') return

      const scheduledDates = getProgramadoDates(os)
      const realizedDate = normalizeDateValue(os.os_realizado_em)

      const assignment = assignmentMap[os.id]
      if (assignment && assignment.sub_equipe !== selectedSubEquipe) {
        return
      }

      if (os.os_status === 'PROGRAMADO') {
        const overdueWeek1 = isWeek1Overdue(os, todayKey)
        scheduledDates.forEach(item => {
          entries.push({
            key: `${os.id}-planned-${item.date}`,
            os,
            dateKey: item.date,
            variant: 'planned',
            color: 'yellow',
            isOverdueWeek1: overdueWeek1 && item.week === 1
          })
        })
        return
      }

      if (os.os_status === 'REALIZADO') {
        if (realizedDate) {
          scheduledDates.forEach(item => {
            if (item.date === realizedDate) return
            entries.push({
              key: `${os.id}-planned-${item.date}`,
              os,
              dateKey: item.date,
              variant: 'planned',
              color: 'yellow'
            })
          })
          entries.push({
            key: `${os.id}-realized-${realizedDate}`,
            os,
            dateKey: realizedDate,
            variant: 'realized',
            color: 'green'
          })
        } else if (scheduledDates.length) {
          const primary = scheduledDates[0]
          entries.push({
            key: `${os.id}-realized-${primary.date}`,
            os,
            dateKey: primary.date,
            variant: 'realized',
            color: 'green'
          })
          scheduledDates.slice(1).forEach(item => {
            entries.push({
              key: `${os.id}-planned-${item.date}`,
              os,
              dateKey: item.date,
              variant: 'planned',
              color: 'yellow'
            })
          })
        }
      }
    })

    return entries
  }, [items, assignmentMap, selectedSubEquipe, todayKey])

  const entriesByDate = useMemo(() => {
    const map = new Map<string, CalendarEntry[]>()
    calendarEntries.forEach(entry => {
      const list = map.get(entry.dateKey) || []
      list.push(entry)
      map.set(entry.dateKey, list)
    })
    return map
  }, [calendarEntries])

  const calendarDays = useMemo(
    () => buildCalendarDays(monthValue, todayKey),
    [monthValue, todayKey]
  )

  const dateWeekMap = useMemo(() => {
    const map = new Map<string, number>()
    calendarDays.forEach(day => {
      map.set(day.dateKey, day.week)
    })
    return map
  }, [calendarDays])

  const holidayByDate = useMemo(() => {
    const map = new Map<string, SchedulerHoliday[]>()
    holidays.forEach(holiday => {
      const dateKey = normalizeDateValue(holiday.data)
      if (!dateKey) return
      const list = map.get(dateKey) || []
      list.push(holiday)
      map.set(dateKey, list)
    })
    return map
  }, [holidays])

  const weekTargets = useMemo(() => {
    if (!weekModal) return []
    const week = weekModal.week
    const seen = new Set<string>()
    const list: Array<{ key: string; os: SchedulerOs; dateKey: string }> = []
    calendarEntries.forEach(entry => {
      const entryWeek = dateWeekMap.get(entry.dateKey)
      if (entryWeek !== week) return
      const key = getLockKey(entry.os.id, entry.dateKey)
      if (seen.has(key)) return
      seen.add(key)
      list.push({ key, os: entry.os, dateKey: entry.dateKey })
    })
    return list
  }, [calendarEntries, dateWeekMap, weekModal])

  const weekNoteRows = useMemo(() => {
    if (!weekModal) return []
    const week = weekModal.week
    const rows: Array<{
      key: string
      os: SchedulerOs
      dateKey: string
      note: string
    }> = []
    Object.entries(noteMap).forEach(([key, note]) => {
      if (!note) return
      const [osId, dateKey] = key.split('::')
      if (!osId || !dateKey) return
      const entryWeek = dateWeekMap.get(dateKey)
      if (entryWeek !== week) return
      const os = items.find(item => item.id === osId)
      if (!os) return
      rows.push({ key, os, dateKey, note })
    })
    rows.sort((a, b) => a.dateKey.localeCompare(b.dateKey))
    return rows
  }, [noteMap, weekModal, dateWeekMap, items])

  const handleDragStart =
    (payload: DragPayload) => (event: DragEvent<HTMLDivElement>) => {
      event.dataTransfer.effectAllowed = 'move'
      event.dataTransfer.setData('application/json', JSON.stringify(payload))
    }

  const parseDragPayload = (event: DragEvent) => {
    const raw = event.dataTransfer.getData('application/json')
    if (!raw) return null
    try {
      return JSON.parse(raw) as DragPayload
    } catch {
      return null
    }
  }

  const updateOs = async (payload: Record<string, unknown>) => {
    const token = getStoredToken()
    if (!token) {
      toast.error('Sessao expirada. Faca login novamente.')
      return false
    }

    const response = await fetch(`${API_URL}/os`, {
      method: 'PATCH',
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
      return false
    }

    if (!response.ok) {
      const message = await getApiErrorMessage(response, 'Erro ao atualizar OS.')
      toast.error(message)
      return false
    }

    return true
  }

  const updateSchedulerAssignment = async (osId: string) => {
    const token = getStoredToken()
    if (!token) {
      toast.error('Sessao expirada. Faca login novamente.')
      return false
    }
    if (!selectedCoordenacao || !selectedEquipeId || !selectedSubEquipe) {
      toast.error('Selecione coordenacao, equipe e sub-equipe.')
      return false
    }

    const response = await fetch(`${API_URL}/os/scheduler-assignment`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        os_id: osId,
        coordenacao: selectedCoordenacao,
        equipe_id: selectedEquipeId,
        sub_equipe: selectedSubEquipe
      })
    })

    if (response.status === 401) {
      setPostLoginRedirect(window.location.pathname + window.location.search)
      logout()
      navigate('/')
      return false
    }

    if (response.status === 409) {
      let message = ''
      try {
        const data = await response.json()
        message = data?.error || ''
      } catch {
        message = await response.text()
      }
      toast.error(message || 'OS ja alocada em outra equipe.')
      return false
    }

    if (!response.ok) {
      const message = await getApiErrorMessage(
        response,
        'Erro ao alocar OS.'
      )
      toast.error(message)
      return false
    }

    setAssignmentMap(prev => ({
      ...prev,
      [osId]: {
        os_id: osId,
        coordenacao: selectedCoordenacao,
        equipe_id: selectedEquipeId,
        sub_equipe: selectedSubEquipe
      }
    }))

    return true
  }

  const clearSchedulerAssignment = async (osId: string) => {
    const token = getStoredToken()
    if (!token) return
    const params = new URLSearchParams({ os_id: osId })
    const response = await fetch(
      `${API_URL}/os/scheduler-assignment?${params.toString()}`,
      {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      }
    )
    if (response.ok) {
      setAssignmentMap(prev => {
        const next = { ...prev }
        delete next[osId]
        return next
      })
    }
  }

  const persistColorMap = (next: Record<string, string>) => {
    setColorMap(next)
  }

  const persistLockMap = (next: Record<string, boolean>) => {
    setLockMap(next)
  }

  const persistNoteMap = (next: Record<string, string>) => {
    setNoteMap(next)
  }

  const handleContextMenu =
    (entry: CalendarEntry) => (event: ReactMouseEvent<HTMLDivElement>) => {
      event.preventDefault()
      if (entry.os.os_status === 'REALIZADO') {
        return
      }
      if (entry.isOverdueWeek1) {
        return
      }
      setContextMenu({
        x: event.clientX,
        y: event.clientY,
        osId: entry.os.id,
        dateKey: entry.dateKey
      })
    }

  const handleEditOs = (osId: string) => {
    setContextMenu(null)
    navigate('/app/ordens-servico', {
      state: { editId: osId, returnTo: '/app/ordens-servico/scheduler' }
    })
  }

  const handleResetOs = async (os: SchedulerOs, isBlocked: boolean) => {
    if (os.os_status !== 'PROGRAMADO') {
      toast.error('Apenas OS programada pode ser resetada.')
      return
    }
    if (isBlocked) {
      toast.error('OS com semana 1 nao realizada nao pode ser alterada.')
      return
    }
    const update = buildResetUpdate(os, todayKey)
    const ok = await updateOs({
      id: os.id,
      ...update
    })

    if (!ok) return

    if (!isWeek1Overdue(os, todayKey)) {
      await clearSchedulerAssignment(os.id)
    }

    setItems(prev =>
      prev.map(item =>
        item.id === os.id
          ? {
              ...item,
              ...update
            }
          : item
      )
    )
    setContextMenu(null)
  }

  const handleColorChange = (osId: string, color: string) => {
    const next = { ...colorMap, [osId]: color }
    persistColorMap(next)
    setContextMenu(null)
  }

  const toggleDayLock = (osId: string, dateKey: string) => {
    const lockKey = getLockKey(osId, dateKey)
    const next = { ...lockMap, [lockKey]: !lockMap[lockKey] }
    persistLockMap(next)
    setContextMenu(null)
  }

  const openNoteModal = (osId: string, dateKey: string) => {
    const noteKey = getLockKey(osId, dateKey)
    setNoteModal({ osId, dateKey, value: noteMap[noteKey] || '' })
    setContextMenu(null)
  }

  const saveNote = () => {
    if (!noteModal) return
    const noteKey = getLockKey(noteModal.osId, noteModal.dateKey)
    const next = { ...noteMap, [noteKey]: noteModal.value.trim() }
    persistNoteMap(next)
    setNoteModal(null)
  }

  const openWeekModal = (week: number) => {
    setWeekModal({ week })
    setWeekCommentInput('')
    setWeekCommentTarget('')
  }

  const addWeekComment = () => {
    if (!weekModal) return
    const text = weekCommentInput.trim()
    if (!text) return
    if (!weekCommentTarget) {
      toast.error('Selecione uma OS da semana.')
      return
    }
    const existing = noteMap[weekCommentTarget] || ''
    const nextValue = existing ? `${existing} | ${text}` : text
    const next = { ...noteMap, [weekCommentTarget]: nextValue }
    persistNoteMap(next)
    setWeekCommentInput('')
  }

  const openExpandedView = (osId: string) => {
    setExpandedOsId(osId)
    setContextMenu(null)
  }

  const handleDropToDay = async (
    day: CalendarDay,
    event: DragEvent<HTMLDivElement>
  ) => {
    event.preventDefault()
    const payload = parseDragPayload(event)
    if (!payload) return

    if (day.isPast) {
      toast.error('Nao e permitido programar em data passada.')
      return
    }
    const dayHolidays = holidayByDate.get(day.dateKey) || []
    if (dayHolidays.length > 0) {
      toast.error('Nao e permitido programar em dia de feriado.')
      return
    }

    const os = items.find(item => item.id === payload.osId)
    if (!os) return

    if (os.os_status === 'REALIZADO') {
      toast.error('OS realizada nao pode ser alterada.')
      return
    }
    const isOverdueWeek1 = isWeek1Overdue(os, todayKey)
    if (isOverdueWeek1 && payload.source === 'calendar' && payload.dateKey) {
      const overdueDate = normalizeDateValue(os.os_programado1)
      if (overdueDate && overdueDate === payload.dateKey) {
        toast.error('OS com semana 1 nao realizada nao pode ser alterada.')
        return
      }
    }
    if (isOverdueWeek1 && payload.source === 'calendar' && !payload.dateKey) {
      toast.error('OS com semana 1 nao realizada nao pode ser alterada.')
      return
    }
    if (isOverdueWeek1 && day.week === 1) {
      toast.error('Semana 1 nao realizada nao pode ser alterada.')
      return
    }

    const assignOk = await updateSchedulerAssignment(os.id)
    if (!assignOk) return

    const update = buildProgramadoUpdateForOs(os, day.week, day.dateKey, todayKey)
    const ok = await updateOs({
      id: os.id,
      os_status: 'PROGRAMADO',
      ...update
    })

    if (!ok) return

    setItems(prev =>
      prev.map(item =>
        item.id === os.id
          ? {
              ...item,
              os_status: 'PROGRAMADO',
              ...update
            }
          : item
      )
    )
  }

  const handleDropToBacklog = async (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    const payload = parseDragPayload(event)
    if (!payload) return

    const os = items.find(item => item.id === payload.osId)
    if (!os) return

    if (os.os_status === 'REALIZADO') {
      toast.error('OS realizada nao pode voltar para o backlog.')
      return
    }

    const update = buildResetUpdate(os, todayKey)
    const ok = await updateOs({
      id: os.id,
      ...update
    })

    if (!ok) return

    if (!isWeek1Overdue(os, todayKey)) {
      await clearSchedulerAssignment(os.id)
    }

    setItems(prev =>
      prev.map(item =>
        item.id === os.id
          ? {
              ...item,
              ...update
            }
          : item
      )
    )
  }

  const allowDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
  }

  const weekRows = useMemo(() => {
    const rows: CalendarDay[][] = []
    for (let i = 0; i < 5; i += 1) {
      rows.push(calendarDays.slice(i * 7, i * 7 + 7))
    }
    return rows
  }, [calendarDays])

  if (loading) {
    return (
      <section style={{ padding: 16, color: '#64748b' }}>
        Carregando scheduler...
      </section>
    )
  }

  if (error) {
    return (
      <section style={{ padding: 16, color: '#f87171' }}>{error}</section>
    )
  }

  const menuOs = contextMenu
    ? items.find(item => item.id === contextMenu.osId) || null
    : null
  const menuLockKey =
    contextMenu && menuOs ? getLockKey(menuOs.id, contextMenu.dateKey) : null
  const isMenuDayLocked = menuLockKey ? Boolean(lockMap[menuLockKey]) : false
  const menuOverdueDate = menuOs
    ? normalizeDateValue(menuOs.os_programado1)
    : null
  const isMenuOverdueWeek1Entry = Boolean(
    menuOs &&
      contextMenu &&
      menuOverdueDate &&
      menuOverdueDate === contextMenu.dateKey &&
      isWeek1Overdue(menuOs, todayKey)
  )

  return (
    <section style={{ display: 'grid', gap: 16 }}>
      <header style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <h2 style={{ margin: 0, fontSize: 24 }}>Scheduler de OS</h2>
        <p style={{ margin: 0, color: '#64748b' }}>
          Arraste OS do backlog para o calendario e defina o planejamento.
        </p>
      </header>

      <div
        style={{
          display: 'grid',
          gap: 16,
          gridTemplateColumns: 'minmax(180px, 224px) 1fr',
          alignItems: 'start'
        }}
      >
        <aside
          style={{
            borderRadius: 16,
                        border: '1px solid #94a3b8',
            background: '#ffffff',
            padding: 16,
            display: 'grid',
            gap: 12,
            boxShadow: '0 10px 20px rgba(15, 23, 42, 0.06)'
          }}
          onDragOver={selectedEquipeId ? allowDrop : undefined}
          onDrop={selectedEquipeId ? handleDropToBacklog : undefined}
        >
          {!selectedEquipeId ? (
            <div
              style={{
                border: '1px dashed #cbd5f5',
                borderRadius: 12,
                padding: 24,
                color: '#64748b',
                textAlign: 'center'
              }}
            >
              Selecione uma equipe para visualizar o backlog.
            </div>
          ) : (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <strong>Backlog</strong>
                <span style={{ fontSize: 12, color: '#94a3b8' }}>
                  {backlogItems.length} OS
                </span>
              </div>
              <div style={{ fontSize: 12, color: '#94a3b8' }}>
                Solte aqui para voltar ao backlog.
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {backlogTypeOptions.map(option => {
                  const label = option === 'PDM' ? 'MP' : option
                  const isActive = backlogType === option
                  return (
                    <button
                      key={option}
                      type="button"
                      onClick={() =>
                        setBacklogType(current =>
                          current === option ? '' : option
                        )
                      }
                      title={label}
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 999,
                        border: `1px solid ${isActive ? '#1d4ed8' : '#cbd5e1'}`,
                        background: isActive ? '#dbeafe' : '#ffffff',
                        color: isActive ? '#1d4ed8' : '#0f172a',
                        fontSize: 11,
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'grid',
                        placeItems: 'center'
                      }}
                    >
                      {label}
                    </button>
                  )
                })}
              </div>
              <input
                placeholder="Os, Ativo..."
                value={backlogSearch}
                onChange={event => setBacklogSearch(event.target.value)}
                style={{
                  padding: '8px 10px',
                  borderRadius: 10,
                  border: '1px solid #e2e8f0'
                }}
              />
              <div
                style={{
                  display: 'grid',
                  gap: 10,
                  maxHeight: 520,
                  overflowY: 'auto',
                  paddingRight: 4
                }}
              >
                {backlogItems.length === 0 && (
                  <div style={{ fontSize: 12, color: '#94a3b8' }}>
                    Nenhuma OS criada no momento.
                  </div>
                )}
                {backlogItems.map(os => (
                  (() => {
                    const isOverdue = isWeek1Overdue(os, todayKey)
                    const isDraggable = os.os_status === 'CRIADO' || isOverdue
                    return (
                      <div
                        key={os.id}
                        draggable={isDraggable}
                        onDragStart={
                          isDraggable
                            ? handleDragStart({ osId: os.id, source: 'backlog' })
                            : undefined
                        }
                        style={{
                          padding: 12,
                          borderRadius: 12,
                          border: '1px solid #e2e8f0',
                          background: isOverdue ? '#fee2e2' : '#f8fafc',
                          color: isOverdue ? '#b91c1c' : '#0f172a',
                          cursor: isDraggable ? 'grab' : 'default',
                          display: 'grid',
                          gap: 4,
                          opacity: isOverdue ? 0.85 : 1
                        }}
                      >
                        <strong>OS #{os.os_numero}</strong>
                        <span style={{ fontSize: 12, color: '#475569' }}>
                          {os.ATIVO_CODPE}
                        </span>
                        <span style={{ fontSize: 12, color: '#94a3b8' }}>
                          {os.ATIVO_DESCRITIVO_OS}
                        </span>
                        {isOverdue && (
                          <span style={{ fontSize: 11 }}>
                            Semana 1 nao realizada
                          </span>
                        )}
                      </div>
                    )
                  })()
                ))}
              </div>
            </>
          )}
        </aside>

        <div
          style={{
            borderRadius: 16,
            border: '1px solid #e2e8f0',
            background: '#ffffff',
            padding: 16,
            display: 'grid',
            gap: 12,
            boxShadow: '0 10px 20px rgba(15, 23, 42, 0.06)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <strong>Calendario</strong>
            <input
              type="month"
              value={monthValue}
              onChange={event => {
                const value = event.target.value
                setMonthValue(value || getMonthValue(new Date()))
              }}
              style={{
                padding: '6px 10px',
                borderRadius: 8,
                border: '1px solid #e2e8f0'
              }}
            />
            <select
              value={selectedCoordenacao}
              onChange={event => setSelectedCoordenacao(event.target.value)}
              style={{
                padding: '6px 10px',
                borderRadius: 8,
                border: '1px solid #e2e8f0',
                minWidth: 160
              }}
            >
              <option value="">Selecione</option>
              {coordenacaoOptions.length === 0 && (
                <option value="">Sem coordenacao</option>
              )}
              {coordenacaoOptions.map(option => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            <select
              value={selectedEquipeId}
              onChange={event => setSelectedEquipeId(event.target.value)}
              style={{
                padding: '6px 10px',
                borderRadius: 8,
                border: '1px solid #e2e8f0',
                minWidth: 120
              }}
            >
              <option value="">Selecione</option>
              {equipeOptions.length === 0 && <option value="">Sem equipe</option>}
              {equipeOptions.map(option => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
            <select
              value={selectedEscala}
              onChange={event => setSelectedEscala(event.target.value)}
              style={{
                padding: '6px 10px',
                borderRadius: 8,
                border: '1px solid #e2e8f0',
                minWidth: 120
              }}
            >
              {escalaOptions.length === 0 && <option value="">Sem escala</option>}
              {escalaOptions.map(option => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            <select
              value={selectedSubEquipe}
              onChange={event => setSelectedSubEquipe(event.target.value)}
              style={{
                padding: '6px 10px',
                borderRadius: 8,
                border: '1px solid #e2e8f0',
                minWidth: 140
              }}
            >
              {subEquipeOptions.length === 0 && (
                <option value="">Sem sub-equipe</option>
              )}
              {subEquipeOptions.map(option => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          {!selectedEquipeId ? (
            <div
              style={{
                border: '1px dashed #cbd5f5',
                borderRadius: 12,
                padding: 24,
                color: '#64748b',
                textAlign: 'center'
              }}
            >
              Selecione uma equipe para visualizar o calendario.
            </div>
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '45px repeat(7, minmax(160px, 1fr))',
                gap: 8,
                overflowX: 'auto',
                minWidth: 1180
              }}
            >
              <div />
              {['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab', 'Dom'].map(label => (
                <div
                  key={label}
                  style={{ fontSize: 12, color: '#94a3b8', textAlign: 'center' }}
                >
                  {label}
                </div>
              ))}

              {weekRows.map((week, index) => (
                <div
                  key={`week-${index + 1}`}
                  style={{
                    display: 'contents'
                  }}
                >
                  <div
                    style={{
                      fontSize: 12,
                      color: '#475569',
                      paddingTop: 8
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => openWeekModal(index + 1)}
                      style={{
                        border: 'none',
                        background: 'transparent',
                        color: '#475569',
                        padding: 0,
                        cursor: 'pointer',
                        fontSize: 12,
                        fontWeight: 600
                      }}
                    >
                      S{index + 1}
                    </button>
                  </div>
                  {week.map(day => {
                    const dayEntries = entriesByDate.get(day.dateKey) || []
                    const dayHolidays = holidayByDate.get(day.dateKey) || []
                    const canDrop = !day.isPast && dayHolidays.length === 0
                    return (
                      <div
                        key={day.dateKey}
                        onDragOver={canDrop ? allowDrop : undefined}
                        onDrop={
                          canDrop ? event => handleDropToDay(day, event) : undefined
                        }
                        style={{
                          minHeight: 120,
                          borderRadius: 12,
                          border: '1px solid #e2e8f0',
                          padding: 8,
                        background: day.isPast
                          ? 'rgba(59, 130, 246, 0.1)'
                          : !day.isCurrentMonth
                            ? '#cbd5e1'
                            : '#ffffff',
                          opacity: day.isPast ? 0.6 : 1,
                          display: 'grid',
                          gap: 6
                        }}
                      >
                        <div
                          style={{
                            fontSize: 11,
                            color: day.isCurrentMonth ? '#475569' : '#94a3b8',
                            display: 'flex',
                            justifyContent: 'space-between'
                          }}
                        >
                          <span>{day.date.getDate()}</span>
                          {day.isPast && <span>Bloqueado</span>}
                        </div>
                        {dayHolidays.length > 0 && (
                          <div style={{ display: 'grid', gap: 4 }}>
                            {dayHolidays.map(holiday => (
                              <div
                                key={holiday.id}
                                style={{
                                  fontSize: 10,
                                  fontWeight: 700,
                                  color: '#b91c1c',
                                  background: '#fee2e2',
                                  border: '1px solid #fecaca',
                                  borderRadius: 8,
                                  padding: '2px 6px',
                                  whiteSpace: 'nowrap',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis'
                                }}
                              >
                                Feriado: {holiday.feriado}
                              </div>
                            ))}
                          </div>
                        )}
                        <div
                          style={{
                            display: 'grid',
                            gap: 6,
                            gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))'
                          }}
                        >
                          {dayEntries.map(entry => {
                            const lockKey = getLockKey(entry.os.id, entry.dateKey)
                            const isDayLocked = Boolean(lockMap[lockKey])
                            const isOverdueWeek1 = Boolean(entry.isOverdueWeek1)
                            const isLocked =
                              entry.os.os_status === 'REALIZADO' ||
                              isDayLocked ||
                              isOverdueWeek1
                            const customColor =
                              entry.os.os_status !== 'REALIZADO' &&
                              !isOverdueWeek1
                                ? colorMap[entry.os.id]
                                : null
                            const colorStyle = isOverdueWeek1
                              ? {
                                  background: '#fee2e2',
                                  borderColor: '#fecaca',
                                  color: '#b91c1c'
                                }
                              : entry.color === 'yellow'
                                ? {
                                    background: '#fef3c7',
                                    borderColor: '#fcd34d',
                                    color: '#92400e'
                                  }
                                : {
                                    background: '#dcfce7',
                                    borderColor: '#86efac',
                                    color: '#166534'
                                  }

                            return (
                              <div
                                key={entry.key}
                                draggable={!isLocked && entry.variant === 'planned'}
                                onContextMenu={handleContextMenu(entry)}
                                onDragStart={
                                  !isLocked && entry.variant === 'planned'
                                    ? handleDragStart({
                                        osId: entry.os.id,
                                        source: 'calendar',
                                        dateKey: entry.dateKey
                                      })
                                    : undefined
                                }
                                style={{
                                  borderRadius: 10,
                                  border: `1px solid ${colorStyle.borderColor}`,
                                  background: colorStyle.background,
                                  color: colorStyle.color,
                                  padding: '2px 4px',
                                  display: 'grid',
                                  gap: 0,
                                  borderLeft: customColor
                                    ? `4px solid ${customColor}`
                                    : `1px solid ${colorStyle.borderColor}`,
                                  paddingLeft: customColor ? 6 : 6,
                                  cursor:
                                    !isLocked && entry.variant === 'planned'
                                      ? 'grab'
                                      : 'default',
                                  opacity: isLocked ? 0.8 : 1
                                }}
                              >
                                <div
                                  style={{
                                    fontSize: 10,
                                    lineHeight: 1,
                                    color: '#334155',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap'
                                  }}
                                >
                                  {entry.os.ATIVO_DESCRITIVO_OS}
                                </div>
                                <div
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 6,
                                    fontSize: 10,
                                    lineHeight: 1
                                  }}
                                >
                                  <span style={{ whiteSpace: 'nowrap' }}>
                                    OS #{entry.os.os_numero}
                                  </span>
                                  <span style={{ whiteSpace: 'nowrap' }}>
                                    {entry.os.os_status}
                                  </span>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )
                  })}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      {contextMenu && menuOs && (
        <div
          ref={contextMenuRef}
          style={{
            position: 'fixed',
            top: contextMenu.y,
            left: contextMenu.x,
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: 10,
            boxShadow: '0 12px 24px rgba(15, 23, 42, 0.12)',
            padding: 8,
            display: 'grid',
            gap: 6,
            minWidth: 200,
            zIndex: 20
          }}
        >
          <button
            type="button"
            onClick={() => handleEditOs(menuOs.id)}
            disabled={isMenuDayLocked || isMenuOverdueWeek1Entry}
            style={{
              padding: '8px 10px',
              borderRadius: 8,
              border: 'none',
              background: '#f1f5f9',
              cursor:
                isMenuDayLocked || isMenuOverdueWeek1Entry ? 'not-allowed' : 'pointer',
              textAlign: 'left',
              opacity: isMenuDayLocked || isMenuOverdueWeek1Entry ? 0.6 : 1
            }}
          >
            Editar OS
          </button>
          <button
            type="button"
            onClick={() => handleResetOs(menuOs, isMenuOverdueWeek1Entry)}
            disabled={
              menuOs.os_status !== 'PROGRAMADO' ||
              isMenuDayLocked ||
              isMenuOverdueWeek1Entry
            }
            style={{
              padding: '8px 10px',
              borderRadius: 8,
              border: 'none',
              background: '#f1f5f9',
              cursor:
                menuOs.os_status === 'PROGRAMADO' &&
                !isMenuDayLocked &&
                !isMenuOverdueWeek1Entry
                  ? 'pointer'
                  : 'not-allowed',
              textAlign: 'left',
              opacity:
                menuOs.os_status === 'PROGRAMADO' &&
                !isMenuDayLocked &&
                !isMenuOverdueWeek1Entry
                  ? 1
                  : 0.6
            }}
          >
            Resetar OS
          </button>
          <button
            type="button"
            onClick={() =>
              contextMenu && toggleDayLock(menuOs.id, contextMenu.dateKey)
            }
            style={{
              padding: '8px 10px',
              borderRadius: 8,
              border: 'none',
              background: '#f1f5f9',
              cursor: 'pointer',
              textAlign: 'left'
            }}
          >
            {isMenuDayLocked ? 'Desbloquear edicao do dia' : 'Bloquear edicao do dia'}
          </button>
          <button
            type="button"
            onClick={() =>
              contextMenu && openNoteModal(menuOs.id, contextMenu.dateKey)
            }
            style={{
              padding: '8px 10px',
              borderRadius: 8,
              border: 'none',
              background: '#f1f5f9',
              cursor: 'pointer',
              textAlign: 'left'
            }}
          >
            Observacao
          </button>
          <button
            type="button"
            onClick={() => openExpandedView(menuOs.id)}
            style={{
              padding: '8px 10px',
              borderRadius: 8,
              border: 'none',
              background: '#f1f5f9',
              cursor: 'pointer',
              textAlign: 'left'
            }}
          >
            Expandir visualizacao
          </button>
          <label
            htmlFor={`os-color-${menuOs.id}`}
            style={{
              padding: '8px 10px',
              borderRadius: 8,
              background: '#f1f5f9',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              cursor:
                isMenuDayLocked || isMenuOverdueWeek1Entry ? 'not-allowed' : 'pointer',
              opacity: isMenuDayLocked || isMenuOverdueWeek1Entry ? 0.6 : 1
            }}
          >
            Alterar cor da OS
            <input
              id={`os-color-${menuOs.id}`}
              type="color"
              value={colorMap[menuOs.id] || '#fef3c7'}
              disabled={isMenuDayLocked || isMenuOverdueWeek1Entry}
              onChange={event => handleColorChange(menuOs.id, event.target.value)}
              style={{ width: 28, height: 24, border: 'none', padding: 0 }}
            />
          </label>
        </div>
      )}
      {noteModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.4)',
            display: 'grid',
            placeItems: 'center',
            zIndex: 30
          }}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: 12,
              padding: 16,
              minWidth: 320,
              boxShadow: '0 12px 24px rgba(15, 23, 42, 0.2)',
              display: 'grid',
              gap: 12
            }}
          >
            <strong>Observacao da OS</strong>
            <textarea
              value={noteModal.value}
              onChange={event =>
                setNoteModal(prev =>
                  prev ? { ...prev, value: event.target.value } : prev
                )
              }
              rows={4}
              style={{
                borderRadius: 8,
                border: '1px solid #e2e8f0',
                padding: 10
              }}
            />
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setNoteModal(null)}
                style={{
                  padding: '8px 12px',
                  borderRadius: 8,
                  border: '1px solid #e2e8f0',
                  background: '#ffffff',
                  cursor: 'pointer'
                }}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={saveNote}
                style={{
                  padding: '8px 12px',
                  borderRadius: 8,
                  border: 'none',
                  background: '#1d4ed8',
                  color: '#ffffff',
                  cursor: 'pointer'
                }}
              >
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}
      {expandedOsId && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.4)',
            display: 'grid',
            placeItems: 'center',
            zIndex: 30
          }}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: 12,
              padding: 16,
              minWidth: 360,
              boxShadow: '0 12px 24px rgba(15, 23, 42, 0.2)',
              display: 'grid',
              gap: 8
            }}
          >
            {(() => {
              const os = items.find(item => item.id === expandedOsId)
              if (!os) return null
              const scheduledDates = getProgramadoDates(os)
              const scheduledLabel = scheduledDates.length
                ? scheduledDates
                    .map(item => formatShortDate(item.date))
                    .join(', ')
                : '-'
              const notes = Object.entries(noteMap)
                .filter(([key, value]) => key.startsWith(`${os.id}::`) && value)
                .map(([key, value]) => ({
                  dateKey: key.split('::')[1] || '',
                  value
                }))
              return (
                <>
                  <strong>OS #{os.os_numero}</strong>
                  <div style={{ fontSize: 12, color: '#475569' }}>
                    {os.ATIVO_CODPE}
                  </div>
                  <div style={{ fontSize: 12, color: '#64748b' }}>
                    {os.ATIVO_DESCRITIVO_OS}
                  </div>
                  <div style={{ fontSize: 12 }}>Status: {os.os_status}</div>
                  <div style={{ fontSize: 12 }}>
                    Programado:{' '}
                    {scheduledLabel}
                  </div>
                  <div style={{ fontSize: 12 }}>
                    Realizado:{' '}
                    {os.os_realizado_em
                      ? formatShortDate(normalizeDateValue(os.os_realizado_em) || '')
                      : '-'}
                  </div>
                  {notes.length > 0 && (
                    <div style={{ display: 'grid', gap: 4 }}>
                      <div style={{ fontSize: 12, fontWeight: 600 }}>
                        Observacoes
                      </div>
                      {notes.map(note => (
                        <div key={note.dateKey} style={{ fontSize: 12 }}>
                          {note.dateKey ? `${formatShortDate(note.dateKey)} - ` : ''}
                          {note.value}
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )
            })()}
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setExpandedOsId(null)}
                style={{
                  padding: '8px 12px',
                  borderRadius: 8,
                  border: '1px solid #e2e8f0',
                  background: '#ffffff',
                  cursor: 'pointer'
                }}
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
      {weekModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.4)',
            display: 'grid',
            placeItems: 'center',
            zIndex: 30
          }}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: 12,
              padding: 16,
              width: 'min(90vw, 1080px)',
              minWidth: 720,
              boxShadow: '0 12px 24px rgba(15, 23, 42, 0.2)',
              display: 'grid',
              gap: 12
            }}
          >
            <strong>Comentarios da semana S{weekModal.week}</strong>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '200px 120px 1fr 2fr',
                gap: 8,
                fontSize: 12,
                color: '#94a3b8'
              }}
            >
              <div>Usuario/Data e horario</div>
              <div>OS</div>
              <div>Ativo</div>
              <div>Observacao</div>
            </div>
            <div style={{ display: 'grid', gap: 6, maxHeight: 320, overflowY: 'auto' }}>
              {weekNoteRows.length === 0 && (
                <div style={{ fontSize: 12, color: '#94a3b8' }}>
                  Nenhum comentario cadastrado.
                </div>
              )}
              {weekNoteRows.map(row => (
                <div
                  key={row.key}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '200px 120px 1fr 2fr',
                    gap: 8,
                    padding: '8px 10px',
                    borderRadius: 10,
                    border: '1px solid #e2e8f0',
                    background: '#ffffff',
                    alignItems: 'center',
                    fontSize: 12,
                    color: '#475569'
                  }}
                >
                  <div>
                    Sistema - {formatLongDate(row.dateKey)} --:--
                  </div>
                  <div>OS #{row.os.os_numero}</div>
                  <div>{row.os.ATIVO_DESCRITIVO_OS}</div>
                  <div>{row.note}</div>
                </div>
              ))}
            </div>
            <div style={{ display: 'grid', gap: 6 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#475569' }}>
                OS da semana
              </label>
              <select
                value={weekCommentTarget}
                onChange={event => setWeekCommentTarget(event.target.value)}
                style={{
                  padding: '8px 10px',
                  borderRadius: 8,
                  border: '1px solid #e2e8f0'
                }}
              >
                <option value="">Selecione</option>
                {weekTargets.map(target => (
                  <option key={target.key} value={target.key}>
                    {formatLongDate(target.dateKey)} - OS #{target.os.os_numero} -{' '}
                    {target.os.ATIVO_DESCRITIVO_OS}
                  </option>
                ))}
              </select>
            </div>
            <div style={{ display: 'grid', gap: 6 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#475569' }}>
                Novo comentario
              </label>
              <textarea
                value={weekCommentInput}
                onChange={event => setWeekCommentInput(event.target.value)}
                rows={3}
                style={{
                  borderRadius: 8,
                  border: '1px solid #e2e8f0',
                  padding: 10
                }}
              />
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setWeekModal(null)}
                style={{
                  padding: '8px 12px',
                  borderRadius: 8,
                  border: '1px solid #e2e8f0',
                  background: '#ffffff',
                  cursor: 'pointer'
                }}
              >
                Fechar
              </button>
              <button
                type="button"
                onClick={addWeekComment}
                style={{
                  padding: '8px 12px',
                  borderRadius: 8,
                  border: 'none',
                  background: '#1d4ed8',
                  color: '#ffffff',
                  cursor: 'pointer'
                }}
              >
                Adicionar
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
