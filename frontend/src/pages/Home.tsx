import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type CSSProperties
} from 'react'
import { useNavigate } from 'react-router-dom'
import { API_URL } from '../services/api'
import { getStoredToken, logout, setPostLoginRedirect } from '../services/auth'

const OS_STATUS_KEYS = ['CRIADO', 'PROGRAMADO', 'REALIZADO', 'CANCELADO'] as const
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

const pageStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 24,
  height: '100%'
}

const dashboardGrid: CSSProperties = {
  display: 'grid',
  gap: 20,
  gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))'
}

const cardStyle: CSSProperties = {
  borderRadius: 20,
  border: '1px solid #e5e7eb',
  background: '#ffffff',
  padding: 24,
  boxShadow: '0 20px 40px rgba(15,23,42,0.08)',
  color: '#0f172a'
}

const statusGridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
  gap: 12
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

export function Home() {
  const navigate = useNavigate()
  const [orderServiceRows, setOrderServiceRows] = useState<OrderServiceListRow[]>([])
  const [selectedTeam, setSelectedTeam] = useState('')
  const [osLoading, setOsLoading] = useState(true)
  const [osError, setOsError] = useState<string | null>(null)

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

  useEffect(() => {
    if (selectedTeam && !teamOptions.includes(selectedTeam)) {
      setSelectedTeam('')
    }
  }, [selectedTeam, teamOptions])

  const filteredRows = useMemo(() => {
    if (!selectedTeam) {
      return orderServiceRows
    }
    return orderServiceRows.filter(row => {
      const team = (row.estrutura_equipe ?? row.ATIVO_EQUIPE ?? '').trim()
      return team === selectedTeam
    })
  }, [orderServiceRows, selectedTeam])

  const statusCounts = useMemo(
    () => buildStatusCounts(filteredRows),
    [filteredRows]
  )
  const upcomingItems = useMemo(
    () => buildUpcomingRows(filteredRows),
    [filteredRows]
  )
  const totalOs = filteredRows.length
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
            alignItems: 'center',
            flexWrap: 'wrap'
          }}
        >
          <label
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 4,
              fontSize: 12,
              color: '#64748b'
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
                color: '#0f172a',
                minWidth: 180
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

          <button
            type="button"
            onClick={() => navigate('/app/ordens-servico')}
            style={{
              padding: '10px 16px',
              borderRadius: 10,
              border: '1px solid #1d4ed8',
              background: '#1d4ed8',
              color: '#ffffff',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Ir para Ordens de Serviço
          </button>
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
            <span
              style={{
                padding: '4px 12px',
                borderRadius: 999,
                fontSize: 12,
                color: '#0f172a',
                background: '#e2e8f0'
              }}
            >
              Atualizado agora
            </span>
          </div>

          <div style={statusGridStyle}>
            {OS_STATUS_KEYS.map(statusKey => (
              <div
                key={statusKey}
                style={{
                  borderRadius: 14,
                  border: '1px solid #e5e7eb',
                  padding: '14px 12px',
                  background: '#f8fafc'
                }}
              >
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
            <button
              type="button"
              onClick={() => navigate('/app/planejamento/manutencao')}
              style={{
                border: '1px solid #1d4ed8',
                borderRadius: 10,
                padding: '6px 12px',
                background: '#ffffff',
                color: '#1d4ed8',
                fontWeight: 600,
                cursor: 'pointer',
                fontSize: 12
              }}
            >
              Ver planejamento
            </button>
          </div>

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
        </article>
      </div>

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
