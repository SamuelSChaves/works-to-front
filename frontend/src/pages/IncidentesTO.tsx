import { type ChangeEvent, type CSSProperties, useCallback, useEffect, useMemo, useState } from 'react'
import { Eye } from 'lucide-react'
import { Modal } from '../components/Modal'
import { getStoredPermissions, getStoredUser } from '../services/auth'
import { createIncident, listIncidents, updateIncident } from '../services/api'

import {
  getStoredIncidents,
  setStoredIncidents,
  subscribeToIncidents
} from '../data/incidentStore'
import { type IncidenteRecord } from '../types/incidents'
import {
  getStoredActions,
  subscribeToActions
} from '../data/actionStore'
import type { AcaoRecord, AcaoStatus } from '../types/acao'

const severityOptions = ['Baixa', 'Média', 'Alta', 'Crítica'] as const
const statusOptions = ['Aberto', 'Em andamento', 'Concluído'] as const
const formatDate = (value?: string) => {
  if (!value) return '—'
  const [year, month, day] = value.split('-')
  if (!year || !month || !day) return value
  return `${day}/${month}/${year}`
}
type IncidentFilters = {
  status: string
  severity: string
  responsavel: string
}

const incidentStatusChips: Record<string, CSSProperties> = {
  Aberto: {
    background: 'rgba(59, 130, 246, 0.15)',
    color: '#2563eb',
    borderRadius: 999,
    padding: '4px 10px',
    fontSize: 12,
    fontWeight: 600,
    display: 'inline-block'
  },
  'Em andamento': {
    background: 'rgba(234, 179, 8, 0.15)',
    color: '#b45309',
    borderRadius: 999,
    padding: '4px 10px',
    fontSize: 12,
    fontWeight: 600,
    display: 'inline-block'
  },
  Concluído: {
    background: 'rgba(16, 185, 129, 0.15)',
    color: '#059669',
    borderRadius: 999,
    padding: '4px 10px',
    fontSize: 12,
    fontWeight: 600,
    display: 'inline-block'
  }
}

type IncidentFormState = {
  titulo: string
  severity: typeof severityOptions[number]
  status: typeof statusOptions[number]
  responsavel: string
  descricao: string
  plano_acao: string
}

const defaultFormState: IncidentFormState = {
  titulo: '',
  severity: severityOptions[1],
  status: statusOptions[0],
  responsavel: '',
  descricao: '',
  plano_acao: ''
}

export function IncidentesTO() {
  const permissions = getStoredPermissions()
  const currentUser = getStoredUser()
  const userRole = (currentUser?.role ?? currentUser?.cargo ?? '')
    .trim()
    .toLowerCase()

  const incidentPermissions = permissions?.incidentes
  const canCreateIncidente =
    incidentPermissions?.criacao ?? (userRole === 'admin' || userRole === 'edicao')
  const canEditIncidente =
    incidentPermissions?.edicao ?? userRole === 'admin'

  const [incidents, setIncidents] = useState<IncidenteRecord[]>(() => [
    ...getStoredIncidents()
  ])
  const [filters, setFilters] = useState<IncidentFilters>({
    status: '',
    severity: '',
    responsavel: ''
  })
  const [incidentsLoading, setIncidentsLoading] = useState(false)
  const [incidentsError, setIncidentsError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [actionToView, setActionToView] = useState<AcaoRecord | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'view'>('create')
  const [selectedIncidentId, setSelectedIncidentId] = useState<string | null>(null)
  const [formState, setFormState] = useState<IncidentFormState>(defaultFormState)
  const [modalAttachments, setModalAttachments] = useState<string[]>([])
  const [saveError, setSaveError] = useState<string | null>(null)
  const [linkedActions, setLinkedActions] = useState<AcaoRecord[]>(() => [
    ...getStoredActions()
  ])

  useEffect(() => {
    const unsubscribe = subscribeToIncidents(current => {
      setIncidents([...current])
    })
    return unsubscribe
  }, [])

  useEffect(() => {
    const unsubscribe = subscribeToActions(current => {
      setLinkedActions([...current])
    })
    return unsubscribe
  }, [])

  const loadIncidents = useCallback(async () => {
    setIncidentsLoading(true)
    setIncidentsError(null)
    try {
      const rows = await listIncidents()
      setIncidents(rows)
      setStoredIncidents(rows)
    } catch (error) {
      setIncidents([])
      setStoredIncidents([])
      setIncidentsError(
        error instanceof Error ? error.message : 'Erro ao carregar incidentes.'
      )
    } finally {
      setIncidentsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadIncidents()
  }, [loadIncidents, currentUser?.id])

  const updateFilter = (field: keyof IncidentFilters, value: string) => {
    setFilters(prev => ({ ...prev, [field]: value }))
    setPage(1)
  }

  const filteredIncidents = useMemo(() => {
    return incidents.filter(incident => {
      const matchesStatus = !filters.status || incident.status === filters.status
      const matchesSeverity =
        !filters.severity || incident.severity === filters.severity
      const matchesResponsavel =
        !filters.responsavel ||
        incident.responsavel.toLowerCase().includes(filters.responsavel.toLowerCase())
      return matchesStatus && matchesSeverity && matchesResponsavel
    })
  }, [incidents, filters])

  const stats = useMemo(() => {
    const counts = { aberto: 0, andamento: 0, concluidos: 0 }
    incidents.forEach(incident => {
      if (incident.status === 'Aberto') counts.aberto += 1
      if (incident.status === 'Em andamento') counts.andamento += 1
      if (incident.status === 'Concluído') counts.concluidos += 1
    })
    return counts
  }, [incidents])
  const totalPages = Math.max(1, Math.ceil(filteredIncidents.length / pageSize))
  const pagedIncidents = useMemo(() => {
    const start = (page - 1) * pageSize
    return filteredIncidents.slice(start, start + pageSize)
  }, [filteredIncidents, page, pageSize])
  const pageStart = filteredIncidents.length ? (page - 1) * pageSize + 1 : 0
  const pageEnd = Math.min(page * pageSize, filteredIncidents.length)

  const openCreateModal = () => {
    setModalMode('create')
    setSelectedIncidentId(null)
    setFormState(defaultFormState)
    setModalAttachments([])
    setIsModalOpen(true)
    setSaveError(null)
  }

  const openEditModal = (incident: IncidenteRecord) => {
    if (!canEditIncidente || incident.status === 'Concluído') return
    setModalMode('edit')
    setSelectedIncidentId(incident.id)
    setFormState({
      titulo: incident.titulo,
      severity: incident.severity,
      status: incident.status,
      responsavel: incident.responsavel,
      descricao: incident.descricao,
      plano_acao: incident.plano_acao
    })
    setModalAttachments([...incident.anexos])
    setIsModalOpen(true)
    setSaveError(null)
  }

  const openViewModal = (incident: IncidenteRecord) => {
    setModalMode('view')
    setSelectedIncidentId(incident.id)
    setFormState({
      titulo: incident.titulo,
      severity: incident.severity,
      status: incident.status,
      responsavel: incident.responsavel,
      descricao: incident.descricao,
      plano_acao: incident.plano_acao
    })
    setModalAttachments([...incident.anexos])
    setIsModalOpen(true)
    setSaveError(null)
  }

  const openActionView = (action: AcaoRecord) => {
    setActionToView(action)
  }

  const closeActionView = () => {
    setActionToView(null)
  }

  const handleSave = async () => {
    if (!formState.titulo.trim() || !formState.descricao.trim()) return

    const currentLinkedActions = selectedIncident
      ? linkedActions.filter(action => action.incidente_codigo === selectedIncident.codigo)
      : []

    if (modalMode === 'create') {
      try {
        await createIncident({
          titulo: formState.titulo.trim(),
          severity: formState.severity,
          status: formState.status,
          responsavel: formState.responsavel || currentUser?.nome || '—',
          descricao: formState.descricao.trim(),
          plano_acao: formState.plano_acao.trim()
        })
        setSaveError(null)
        setIsModalOpen(false)
        await loadIncidents()
        return
      } catch (error) {
        setSaveError(
          error instanceof Error ? error.message : 'Erro ao criar incidente.'
        )
        return
      }
    }

    if (selectedIncidentId !== null) {
      if (formState.status === 'Concluído') {
        const hasIncomplete = currentLinkedActions.some(action => action.status !== 'Concluída')
        if (hasIncomplete) {
          setSaveError('Só é possível concluir o incidente depois que todas as ações vinculadas estiverem concluídas.')
          return
        }
      }

      try {
        await updateIncident(selectedIncidentId, {
          titulo: formState.titulo.trim(),
          severity: formState.severity,
          status: formState.status,
          responsavel:
            formState.responsavel || selectedIncident?.responsavel || '',
          descricao: formState.descricao.trim(),
          plano_acao: formState.plano_acao.trim()
        })
        setSaveError(null)
        setIsModalOpen(false)
        await loadIncidents()
      } catch (error) {
        setSaveError(
          error instanceof Error ? error.message : 'Erro ao atualizar incidente.'
        )
      }
    }
  }

  const handleAttachmentChange = (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files?.length) return
    setModalAttachments(prev => [
      ...prev,
      ...Array.from(files).map(file => file.name)
    ])
    event.target.value = ''
  }

  const selectedIncident = incidents.find(incident => incident.id === selectedIncidentId) || null
  const isViewMode = modalMode === 'view'

  const modalTitle =
    modalMode === 'create'
      ? 'Abrir novo incidente'
      : selectedIncident
      ? `Editar ${selectedIncident.codigo}`
      : 'Editar incidente'

  const linkedActionsForIncident = selectedIncident
    ? linkedActions.filter(action => action.incidente_codigo === selectedIncident.codigo)
    : []

  const modalFooter = isViewMode ? (
    <button
      type="button"
      onClick={() => setIsModalOpen(false)}
      style={primaryButtonStyle}
    >
      Fechar
    </button>
  ) : (
    <>
      <button
        type="button"
        onClick={() => setIsModalOpen(false)}
        style={{
          padding: '8px 14px',
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
          padding: '8px 14px',
          borderRadius: 10,
          border: 'none',
          background: 'linear-gradient(90deg, #2563eb, #1d4ed8)',
          color: '#ffffff',
          fontWeight: 600,
          cursor: 'pointer'
        }}
      >
        Salvar
      </button>
    </>
  )

  return (
    <main
      style={{
        padding: 24,
        minHeight: '100%',
        background: '#f4f6fb',
        display: 'flex',
        flexDirection: 'column',
        gap: 20
      }}
    >
      <header>
        <h1 style={{ margin: 0 }}>Incidentes TO</h1>
        <p style={{ margin: '6px 0 0', color: '#64748b' }}>
          Registre ocorrências críticas, acompanhe anexos e documente planos de ação na mesma central.
        </p>
      </header>

      <section
        style={{
          display: 'flex',
          gap: 12,
          flexWrap: 'wrap',
          alignItems: 'stretch'
        }}
      >
        <article
          style={{
            flex: 1,
            minWidth: 180,
            borderRadius: 14,
            border: '1px solid #e2e8f0',
            padding: 16,
            background: '#ffffff',
            textAlign: 'center'
          }}
        >
          <p style={{ margin: 0, fontSize: 12, color: '#2563eb' }}>Abertos</p>
          <strong style={{ fontSize: 28 }}>{stats.aberto}</strong>
        </article>
        <article
          style={{
            flex: 1,
            minWidth: 180,
            borderRadius: 14,
            border: '1px solid #e2e8f0',
            padding: 16,
            background: '#ffffff',
            textAlign: 'center'
          }}
        >
          <p style={{ margin: 0, fontSize: 12, color: '#f59e0b' }}>Em andamento</p>
          <strong style={{ fontSize: 28 }}>{stats.andamento}</strong>
        </article>
        <article
          style={{
            flex: 1,
            minWidth: 180,
            borderRadius: 14,
            border: '1px solid #e2e8f0',
            padding: 16,
            background: '#ffffff',
            textAlign: 'center'
          }}
        >
          <p style={{ margin: 0, fontSize: 12, color: '#10b981' }}>Concluídos</p>
          <strong style={{ fontSize: 28 }}>{stats.concluidos}</strong>
        </article>
        {canCreateIncidente && (
          <button
            type="button"
            onClick={openCreateModal}
            style={{
              ...primaryButtonStyle,
              marginLeft: 'auto'
            }}
          >
            Abrir incidente
          </button>
        )}
      </section>

      <section
        style={{
          borderRadius: 18,
          border: '1px solid #e2e8f0',
          background: '#ffffff',
          padding: 20,
          boxShadow: '0 10px 25px rgba(15, 23, 42, 0.08)'
        }}
      >
        <div
          style={{
            marginBottom: 12,
            display: 'flex',
            flexWrap: 'wrap',
            gap: 16,
            alignItems: 'flex-end'
          }}
        >
          <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ fontSize: 12, color: '#94a3b8' }}>Status</span>
              <select
              value={filters.status}
              onChange={event => updateFilter('status', event.target.value)}
              style={{
                borderRadius: 10,
                border: '1px solid #e2e8f0',
                padding: '10px 12px',
                background: '#f8fafc'
              }}
            >
              <option value="">Todos</option>
              {statusOptions.map(option => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ fontSize: 12, color: '#94a3b8' }}>Criticidade</span>
            <select
              value={filters.severity}
              onChange={event => updateFilter('severity', event.target.value)}
              style={{
                borderRadius: 10,
                border: '1px solid #e2e8f0',
                padding: '10px 12px',
                background: '#f8fafc'
              }}
            >
              <option value="">Todas</option>
              {severityOptions.map(option => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ fontSize: 12, color: '#94a3b8' }}>Responsável</span>
            <input
              value={filters.responsavel}
              onChange={event => updateFilter('responsavel', event.target.value)}
              placeholder="Buscar nome"
              style={{
                borderRadius: 10,
                border: '1px solid #e2e8f0',
                padding: '10px 12px',
                background: '#f8fafc'
              }}
            />
          </label>
        </div>

        {incidentsLoading && (
          <div style={{ padding: '14px 0', color: '#475569', fontSize: 13 }}>
            Carregando incidentes...
          </div>
        )}
        {incidentsError && (
          <div style={{ padding: '14px 0', color: '#dc2626', fontSize: 13 }}>
            {incidentsError}
          </div>
        )}
        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            minWidth: 760,
            fontSize: 13,
            color: '#0f172a'
          }}
        >
          <thead>
            <tr
              style={{
                textTransform: 'uppercase',
                fontSize: 11,
                letterSpacing: 0.5,
                color: '#475569'
              }}
            >
              <th style={{ padding: '10px 8px', textAlign: 'left' }}>Código</th>
              <th style={{ padding: '10px 8px', textAlign: 'left' }}>Título</th>
              <th style={{ padding: '10px 8px', textAlign: 'center' }}>Status</th>
              <th style={{ padding: '10px 8px', textAlign: 'center' }}>Criticidade</th>
              <th style={{ padding: '10px 8px', textAlign: 'left' }}>Responsável</th>
              <th style={{ padding: '10px 8px', textAlign: 'left' }}>Relator</th>
              <th style={{ padding: '10px 8px', textAlign: 'left' }}>Criado em</th>
              <th style={{ padding: '10px 8px', textAlign: 'center' }}>Visualizar</th>
            </tr>
          </thead>
          <tbody>
            {pagedIncidents.map(incident => (
              <tr key={incident.id} style={{ borderTop: '1px solid #f2f4f7' }}>
                <td style={{ padding: '14px 8px', fontWeight: 600 }}>
                  {canEditIncidente && incident.status !== 'Concluído' ? (
                    <button
                      type="button"
                      onClick={() => openEditModal(incident)}
                      style={{
                        background: 'none',
                        border: 'none',
                        padding: 0,
                        font: 'inherit',
                        color: '#2563eb',
                        cursor: 'pointer'
                      }}
                    >
                      {incident.codigo}
                    </button>
                  ) : (
                    <span>{incident.codigo}</span>
                  )}
                </td>
                <td style={{ padding: '14px 8px' }}>{incident.titulo}</td>
                <td style={{ padding: '14px 8px', textAlign: 'center' }}>
                        <span style={incidentStatusChips[incident.status] ?? incidentStatusChips.Aberto}>
                    {incident.status}
                  </span>
                </td>
                <td style={{ padding: '14px 8px', textAlign: 'center' }}>{incident.severity}</td>
                <td style={{ padding: '14px 8px' }}>{incident.responsavel}</td>
                <td style={{ padding: '14px 8px' }}>{incident.relator}</td>
                <td style={{ padding: '14px 8px' }}>
                  {new Date(incident.criado_em).toLocaleDateString('pt-BR')}
                </td>
                <td style={{ padding: '14px 8px', textAlign: 'center' }}>
                  <button
                    type="button"
                    onClick={() => openViewModal(incident)}
                    style={visualButtonStyle}
                  >
                    <Eye size={16} />
                  </button>
                </td>
              </tr>
            ))}
            {filteredIncidents.length === 0 && (
            <tr>
              <td
                colSpan={8}
                style={{
                  padding: 20,
                  textAlign: 'center',
                  color: '#94a3b8'
                }}
              >
                Nenhum incidente encontrado.
              </td>
            </tr>
            )}
          </tbody>
        </table>
        {filteredIncidents.length > 0 && (
          <div style={paginationRowStyle}>
            <span style={{ fontSize: 13, color: '#475569' }}>
              Mostrando {pageStart}-{pageEnd} de {filteredIncidents.length}
            </span>
            <div style={paginationControlsStyle}>
              <button
                type="button"
                onClick={() => setPage(prev => Math.max(1, prev - 1))}
                style={paginationButtonStyle}
                disabled={page <= 1}
              >
                Anterior
              </button>
              <button
                type="button"
                onClick={() => setPage(prev => Math.min(totalPages, prev + 1))}
                style={paginationButtonStyle}
                disabled={page >= totalPages}
              >
                Próxima
              </button>
              <label
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 4,
                  fontSize: 12,
                  color: '#475569'
                }}
              >
                Mostrar
                <select
                  value={pageSize}
                  onChange={event => {
                    setPageSize(Number(event.target.value))
                    setPage(1)
                  }}
                  style={{
                    borderRadius: 8,
                    border: '1px solid #e2e8f0',
                    padding: '6px 10px'
                  }}
                >
                  {[10, 20, 30, 40, 50].map(size => (
                    <option key={size} value={size}>
                      {size}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>
        )}
      </section>

      <Modal
        title={modalTitle}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        footer={modalFooter}
      >
        <div style={{ display: 'grid', gap: 16 }}>
          {saveError && (
            <div style={{ color: '#dc2626', fontSize: 12, padding: '8px 12px', borderRadius: 8, background: 'rgba(220, 38, 38, 0.1)' }}>
              {saveError}
            </div>
          )}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: 16
            }}
          >
            <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span style={{ fontSize: 12, color: '#64748b' }}>Título do incidente</span>
              <input
                value={formState.titulo}
                onChange={event => setFormState(prev => ({ ...prev, titulo: event.target.value }))}
                disabled={isViewMode}
                style={{
                  borderRadius: 10,
                  border: '1px solid #e2e8f0',
                  padding: '10px 12px',
                  background: '#ffffff'
                }}
              />
            </label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span style={{ fontSize: 12, color: '#64748b' }}>Responsável</span>
              <input
                value={formState.responsavel}
                onChange={event =>
                  setFormState(prev => ({ ...prev, responsavel: event.target.value }))
                }
                placeholder="Nome do responsável"
                disabled={isViewMode}
                style={{
                  borderRadius: 10,
                  border: '1px solid #e2e8f0',
                  padding: '10px 12px',
                  background: '#ffffff'
                }}
              />
            </label>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: 16
            }}
          >
            <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span style={{ fontSize: 12, color: '#64748b' }}>Status</span>
              <select
                value={formState.status}
                onChange={event =>
                  setFormState(prev => ({
                    ...prev,
                    status: event.target.value as typeof statusOptions[number]
                  }))
                }
                disabled={isViewMode}
                style={{
                  borderRadius: 10,
                  border: '1px solid #e2e8f0',
                  padding: '10px 12px',
                  background: '#ffffff'
                }}
              >
                {statusOptions.map(option => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span style={{ fontSize: 12, color: '#64748b' }}>Criticidade</span>
              <select
                value={formState.severity}
                onChange={event =>
                  setFormState(prev => ({
                    ...prev,
                    severity: event.target.value as typeof severityOptions[number]
                  }))
                }
                disabled={isViewMode}
                style={{
                  borderRadius: 10,
                  border: '1px solid #e2e8f0',
                  padding: '10px 12px',
                  background: '#ffffff'
                }}
              >
                {severityOptions.map(option => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ fontSize: 12, color: '#64748b' }}>Descrição</span>
            <textarea
              rows={4}
              value={formState.descricao}
              onChange={event => setFormState(prev => ({ ...prev, descricao: event.target.value }))}
              disabled={isViewMode}
              style={{
                borderRadius: 10,
                border: '1px solid #e2e8f0',
                padding: '10px 12px',
                background: '#ffffff',
                resize: 'vertical'
              }}
            />
          </label>

          <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ fontSize: 12, color: '#64748b' }}>Plano de ação</span>
            <textarea
              rows={3}
              value={formState.plano_acao}
              onChange={event => setFormState(prev => ({ ...prev, plano_acao: event.target.value }))}
              disabled={isViewMode}
              style={{
                borderRadius: 10,
                border: '1px solid #e2e8f0',
                padding: '10px 12px',
                background: '#ffffff',
                resize: 'vertical'
              }}
            />
          </label>

          <div
            style={{
              borderRadius: 12,
              border: '1px dashed #cbd5f5',
              padding: 12,
              background: '#f8fafc',
              display: 'flex',
              flexDirection: 'column',
              gap: 8
            }}
          >
            <strong style={{ margin: 0 }}>Anexos</strong>
            {!isViewMode && (
              <label
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '6px 12px',
                  borderRadius: 10,
                  border: '1px solid #cbd5f5',
                  background: '#ffffff',
                  color: '#0f172a',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Escolher arquivos
                <input
                  type="file"
                  multiple
                  onChange={handleAttachmentChange}
                  style={{ display: 'none' }}
                />
              </label>
            )}
            {modalAttachments.length === 0 ? (
              <span style={{ fontSize: 12, color: '#64748b' }}>Nenhum arquivo selecionado.</span>
            ) : (
              <ul style={{ margin: 0, paddingLeft: 18 }}>
                {modalAttachments.map(name => (
                  <li key={name} style={{ fontSize: 12, color: '#0f172a' }}>
                    {name}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {selectedIncident && modalMode !== 'create' && (
            <section
              style={{
                borderRadius: 12,
                border: '1px solid #e2e8f0',
                padding: 12,
                background: '#f8fafc',
                display: 'flex',
                flexDirection: 'column',
                gap: 12
              }}
            >
              <strong style={{ margin: 0 }}>Ações vinculadas</strong>
              {linkedActionsForIncident.length === 0 ? (
                <span style={{ fontSize: 12, color: '#64748b' }}>
                  Nenhuma ação vinculada a este incidente.
                </span>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {linkedActionsForIncident.map(action => (
                    <div
                      key={action.id_acao}
                      style={{
                        borderRadius: 10,
                        border: '1px solid #dbeafe',
                        padding: '10px 12px',
                        background: '#ffffff',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 6
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}
                      >
                        <div>
                          <strong>
                            #{action.id_acao} {action.texto_acao}
                          </strong>
                          <div style={{ marginTop: 4, fontSize: 12, color: '#475569' }}>
                            Responsável: {action.id_usuario_responsavel}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => openActionView(action)}
                          style={visualButtonStyle}
                        >
                          <Eye size={16} />
                        </button>
                      </div>
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          gap: 12
                        }}
                      >
                        <span style={{ fontSize: 12, color: '#475569' }}>
                          Previsão: {formatDate(action.data_vencimento)}
                        </span>
                        <span style={acaoStatusStyles[action.status]}>
                          {action.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}
        </div>
          </Modal>
      {actionToView && (
        <Modal
          title={`Ação #${actionToView.id_acao}`}
          isOpen
          onClose={closeActionView}
          footer={
            <button
              type="button"
              onClick={closeActionView}
              style={{ ...primaryButtonStyle, width: '100%' }}
            >
              Fechar
            </button>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: 12
              }}
            >
              <span style={{ fontSize: 12, color: '#475569' }}>
                Previsão: {formatDate(actionToView.data_vencimento)}
              </span>
              <span style={acaoStatusStyles[actionToView.status]}>
                {actionToView.status}
              </span>
            </div>
            <p style={{ margin: 0, fontWeight: 600 }}>{actionToView.texto_acao}</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span style={{ fontSize: 12, color: '#475569' }}>
                Grupo: {actionToView.grupo_acao || '—'}
              </span>
              <span style={{ fontSize: 12, color: '#475569' }}>
                Origem: {actionToView.origem_acao || '—'}
              </span>
              <span style={{ fontSize: 12, color: '#475569' }}>
                Responsável: {actionToView.id_usuario_responsavel}
              </span>
            </div>
            <div style={{ borderTop: '1px dashed #e2e8f0', paddingTop: 8 }}>
              <p style={{ margin: 0, fontSize: 12, color: '#475569' }}>Texto encerramento</p>
              <p style={{ margin: '4px 0', fontSize: 13 }}>{actionToView.texto_enerramento}</p>
              <p style={{ margin: 0, fontSize: 12, color: '#475569' }}>Devolutiva</p>
              <p style={{ margin: '4px 0', fontSize: 13 }}>{actionToView.texto_devolutiva}</p>
            </div>
          </div>
        </Modal>
      )}
    </main>
  )
}

const primaryButtonStyle: CSSProperties = {
  padding: '10px 18px',
  borderRadius: 12,
  border: 'none',
  background: 'linear-gradient(90deg, #2563eb, #312e81)',
  color: '#ffffff',
  fontWeight: 600,
  cursor: 'pointer'
}

const acaoStatusStyles: Record<AcaoStatus, CSSProperties> = {
  Aberta: {
    background: 'rgba(59, 130, 246, 0.15)',
    color: '#2563eb',
    borderRadius: 999,
    padding: '4px 10px',
    fontSize: 12,
    fontWeight: 600,
    display: 'inline-block'
  },
  'Em andamento': {
    background: 'rgba(234, 179, 8, 0.15)',
    color: '#b45309',
    borderRadius: 999,
    padding: '4px 10px',
    fontSize: 12,
    fontWeight: 600,
    display: 'inline-block'
  },
  Concluída: {
    background: 'rgba(16, 185, 129, 0.15)',
    color: '#059669',
    borderRadius: 999,
    padding: '4px 10px',
    fontSize: 12,
    fontWeight: 600,
    display: 'inline-block'
  }
}

const visualButtonStyle: CSSProperties = {
  padding: 6,
  borderRadius: '50%',
  border: '1px solid #c7d2fe',
  background: '#eff6ff',
  color: '#2563eb',
  cursor: 'pointer',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center'
}

const paginationRowStyle: CSSProperties = {
  padding: '16px 0',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  flexWrap: 'wrap',
  gap: 12
}

const paginationControlsStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 12
}

const paginationButtonStyle: CSSProperties = {
  padding: '6px 12px',
  borderRadius: 8,
  border: '1px solid #cbd5f5',
  background: '#ffffff',
  color: '#0f172a',
  cursor: 'pointer',
  fontSize: 13,
  fontWeight: 600
}
