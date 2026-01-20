import * as React from 'react'
import type { Dispatch, SetStateAction } from 'react'
import { Modal } from '../components/Modal'
import { API_URL } from '../services/api'
import {
  getStoredToken,
  logout,
  setPostLoginRedirect
} from '../services/auth'
import { toast } from 'sonner'

type EstruturaItem = {
  id: string
  coordenacao: string
  equipe: string
  status: string
  execucao?: string
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

type Props = {
  isOpen: boolean
  onClose: () => void
  estruturas: EstruturaItem[]
  ativos: AtivoItem[]
  setAtivos: Dispatch<SetStateAction<AtivoItem[]>>
  createForm: CreateFormState
  setCreateForm: Dispatch<SetStateAction<CreateFormState>>
  selectedAtivos: AtivoItem[]
  setSelectedAtivos: Dispatch<SetStateAction<AtivoItem[]>>
  onCreated: () => void
}

const fieldLabelStyle = { fontSize: 12, fontWeight: 600, color: '#475569' }
const tipoOptions: Array<'PDM' | 'EX' | 'RI'> = ['PDM', 'EX', 'RI']

export function OrdensServicoCreateModal({
  isOpen,
  onClose,
  estruturas,
  ativos,
  setAtivos,
  createForm,
  setCreateForm,
  selectedAtivos,
  setSelectedAtivos,
  onCreated
}: Props) {
  const [confirming, setConfirming] = React.useState(false)
  const [ativoSearch, setAtivoSearch] = React.useState('')
  const [formErrors, setFormErrors] = React.useState<string[]>([])

  const coordenacaoOptions = React.useMemo(() => {
    return Array.from(new Set(estruturas.map(item => item.coordenacao)))
  }, [estruturas])

  const equipeOptions = React.useMemo(() => {
    if (!createForm.coordenacao) return []
    return Array.from(
      new Set(
        estruturas
          .filter(item => item.coordenacao === createForm.coordenacao)
          .map(item => item.equipe)
      )
    )
  }, [estruturas, createForm.coordenacao])

  const selectedEstrutura = React.useMemo(() => {
    if (!createForm.coordenacao || !createForm.equipe) return null
    return estruturas.find(
      item =>
        item.coordenacao === createForm.coordenacao &&
        item.equipe === createForm.equipe
    )
  }, [estruturas, createForm.coordenacao, createForm.equipe])

  React.useEffect(() => {
    if (!isOpen) return
    setConfirming(false)
    setAtivoSearch('')
    setFormErrors([])
  }, [isOpen])

  React.useEffect(() => {
    setSelectedAtivos([])
  }, [createForm.equipe, setSelectedAtivos])

  React.useEffect(() => {
    if (!createForm.equipe) {
      setAtivos([])
      return
    }
    const token = getStoredToken()
    if (!token) return
    fetch(`${API_URL}/ativos?equipe=${encodeURIComponent(createForm.equipe)}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(response => {
        if (!response.ok) return null
        return response.json()
      })
      .then(data => {
        if (!data) return
        setAtivos(Array.isArray(data.ativos) ? data.ativos : [])
      })
      .catch(() => setAtivos([]))
  }, [createForm.equipe, setAtivos])

  const filteredAtivos = React.useMemo(() => {
    if (!ativoSearch) return ativos
    const term = ativoSearch.toLowerCase()
    return ativos.filter(item => {
      return (
        item.ATIVO_CODPE.toLowerCase().includes(term) ||
        item.ATIVO_DESCRITIVO_OS.toLowerCase().includes(term)
      )
    })
  }, [ativos, ativoSearch])

  const toggleSelection = (ativo: AtivoItem) => {
    setSelectedAtivos(prev => {
      const exists = prev.some(item => item.id === ativo.id)
      if (exists) {
        return prev.filter(item => item.id !== ativo.id)
      }
      return [...prev, ativo]
    })
  }

  const validateCreate = () => {
    const errors: string[] = []
    if (!createForm.anoMes) errors.push('Preencha Ano/Mês.')
    if (!createForm.coordenacao) errors.push('Selecione a Coordenação.')
    if (!createForm.equipe) errors.push('Selecione a Equipe.')
    if (!createForm.tipo) errors.push('Selecione o Tipo.')
    if (!selectedAtivos.length) errors.push('Selecione pelo menos um ativo.')
    if (!selectedEstrutura) errors.push('Estrutura invalida.')
    setFormErrors(errors)
    return errors.length === 0
  }

  const confirmCreate = () => {
    if (!validateCreate()) return
    setConfirming(true)
  }

  const handleCreate = async () => {
    const token = getStoredToken()
    if (!token) return
    if (!selectedEstrutura) {
      setFormErrors(['Estrutura invalida.'])
      setConfirming(false)
      return
    }
    const [anoValue, mesValue] = createForm.anoMes.split('-')
    const osAno = Number(anoValue)
    const osMes = Number(mesValue)
    if (!Number.isInteger(osAno) || !Number.isInteger(osMes)) {
      setFormErrors(['Ano/Mês inválido.'])
      setConfirming(false)
      return
    }

    const payload = {
      estrutura_id: selectedEstrutura.id,
      ativo_ids: selectedAtivos.map(item => item.id),
      os_tipo: createForm.tipo,
      os_pdm: Number(createForm.pdm),
      os_checklist: Number(createForm.checklist),
      os_capex: Number(createForm.capex),
      os_obs_pcm: createForm.obsPcm,
      os_ano: osAno,
      os_mes: osMes
    }

    try {
      const response = await fetch(`${API_URL}/os`, {
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
        window.location.assign('/')
        return
      }
      if (!response.ok) {
        const message = await response.text()
        throw new Error(message || 'Erro ao criar OS.')
      }
      toast.success('Registro criado com sucesso!')
      setConfirming(false)
      onCreated()
      onClose()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao criar OS.'
      setFormErrors([message])
      setConfirming(false)
    }
  }

  return (
    <Modal
      title="Criar OS"
      isOpen={isOpen}
      onClose={onClose}
      fullScreen
      footer={
        <>
          {confirming ? (
            <button
              type="button"
              onClick={() => setConfirming(false)}
              style={{
                padding: '10px 16px',
                borderRadius: 10,
                border: '1px solid #e2e8f0',
                background: '#ffffff',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Voltar
            </button>
          ) : (
            <button
              type="button"
              onClick={onClose}
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
          )}
          {confirming ? (
            <button
              type="button"
              onClick={handleCreate}
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
              Criar
            </button>
          ) : (
            <button
              type="button"
              onClick={confirmCreate}
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
              Continuar
            </button>
          )}
        </>
      }
    >
      <div style={{ display: 'grid', gap: 16 }}>
        {!confirming && (
          <>
            <div
              style={{
                display: 'flex',
                gap: 12,
                flexWrap: 'nowrap',
                overflowX: 'auto',
                paddingBottom: 8,
                alignItems: 'flex-end'
              }}
            >
              <div
                style={{
                  display: 'grid',
                  gap: 6,
                  minWidth: 160,
                  flex: '0 0 160px'
                }}
              >
                <label style={fieldLabelStyle}>Ano/Mês *</label>
                <input
                  type="month"
                  value={createForm.anoMes}
                  onChange={event =>
                    setCreateForm(prev => ({ ...prev, anoMes: event.target.value }))
                  }
                  style={{ padding: '10px 12px', borderRadius: 10, border: '1px solid #e2e8f0' }}
                />
              </div>
              <div style={{ width: 36 }} />
              <div
                style={{
                  display: 'grid',
                  gap: 6,
                  minWidth: 160,
                  flex: '0 0 160px'
                }}
              >
                <label style={fieldLabelStyle}>Coordenação *</label>
                <select
                  value={createForm.coordenacao}
                  onChange={event =>
                    setCreateForm(prev => ({
                      ...prev,
                      coordenacao: event.target.value,
                      equipe: ''
                    }))
                  }
                  style={{ padding: '10px 12px', borderRadius: 10, border: '1px solid #e2e8f0' }}
                >
                  <option value="">Selecione</option>
                  {coordenacaoOptions.map(option => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>
              <div
                style={{
                  display: 'grid',
                  gap: 6,
                  minWidth: 160,
                  flex: '0 0 160px'
                }}
              >
                <label style={fieldLabelStyle}>Equipe *</label>
                <select
                  value={createForm.equipe}
                  onChange={event =>
                    setCreateForm(prev => ({ ...prev, equipe: event.target.value }))
                  }
                  disabled={!createForm.coordenacao}
                  style={{ padding: '10px 12px', borderRadius: 10, border: '1px solid #e2e8f0' }}
                >
                  <option value="">Selecione</option>
                  {equipeOptions.map(option => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>
              <div
                style={{
                  display: 'grid',
                  gap: 6,
                  minWidth: 160,
                  flex: '0 0 160px'
                }}
              >
                <label style={fieldLabelStyle}>Tipo *</label>
                <select
                  value={createForm.tipo}
                  onChange={event =>
                    setCreateForm(prev => ({ ...prev, tipo: event.target.value as CreateFormState['tipo'] }))
                  }
                  style={{ padding: '10px 12px', borderRadius: 10, border: '1px solid #e2e8f0' }}
                >
                  <option value="">Selecione</option>
                  {tipoOptions.map(option => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>
              <div
                style={{
                  display: 'grid',
                  gap: 6,
                  minWidth: 160,
                  flex: '0 0 160px'
                }}
              >
                <label style={fieldLabelStyle}>PDM *</label>
                <select
                  value={createForm.pdm}
                  onChange={event =>
                    setCreateForm(prev => ({ ...prev, pdm: event.target.value as '0' | '1' }))
                  }
                  style={{ padding: '10px 12px', borderRadius: 10, border: '1px solid #e2e8f0' }}
                >
                  <option value="1">Sim</option>
                  <option value="0">Nao</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
              <div style={{ display: 'grid', gap: 6 }}>
                <label style={fieldLabelStyle}>Observação PCM</label>
                <input
                  value={createForm.obsPcm}
                  onChange={event =>
                    setCreateForm(prev => ({ ...prev, obsPcm: event.target.value }))
                  }
                  style={{ padding: '10px 12px', borderRadius: 10, border: '1px solid #e2e8f0' }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gap: 12 }}>
              <strong>Selecionar Ativos</strong>
              <input
                placeholder="Buscar ativo por CODPE ou Descritivo"
                value={ativoSearch}
                onChange={event => setAtivoSearch(event.target.value)}
                disabled={!createForm.equipe}
                style={{ padding: '10px 12px', borderRadius: 10, border: '1px solid #e2e8f0' }}
              />
              {!createForm.equipe && (
                <div style={{ color: '#94a3b8', fontSize: 12 }}>
                  Selecione a equipe para carregar os ativos.
                </div>
              )}
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12 }}>
                <div
                  style={{
                    borderRadius: 12,
                    border: '1px solid #e2e8f0',
                    padding: 12,
                    maxHeight: 220,
                    overflowY: 'auto'
                  }}
                >
                  {createForm.equipe &&
                    filteredAtivos.map(ativo => (
                      <div
                        key={ativo.id}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          padding: '6px 0',
                          borderBottom: '1px solid #f1f5f9'
                        }}
                      >
                        <span>
                          {ativo.ATIVO_CODPE} - {ativo.ATIVO_DESCRITIVO_OS}
                        </span>
                        <button
                          type="button"
                          onClick={() => toggleSelection(ativo)}
                          style={{
                            border: 'none',
                            background: 'transparent',
                            color: '#1d4ed8',
                            fontWeight: 600,
                            cursor: 'pointer'
                          }}
                        >
                          {selectedAtivos.some(item => item.id === ativo.id)
                            ? 'Remover'
                            : 'Adicionar'}
                        </button>
                      </div>
                    ))}
                  {createForm.equipe && !filteredAtivos.length && (
                    <div style={{ color: '#94a3b8' }}>
                      Nenhum ativo encontrado.
                    </div>
                  )}
                </div>
                <div
                  style={{
                    borderRadius: 12,
                    border: '1px solid #e2e8f0',
                    padding: 12
                  }}
                >
                  <strong>Selecionados</strong>
                  {selectedAtivos.map(ativo => (
                    <div key={ativo.id} style={{ marginTop: 6 }}>
                      {ativo.ATIVO_CODPE}
                    </div>
                  ))}
                  {!selectedAtivos.length && (
                    <div style={{ color: '#94a3b8', marginTop: 6 }}>
                      Nenhum ativo selecionado.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        )}

        {confirming && (
          <div style={{ display: 'grid', gap: 12 }}>
            <strong>Confirmar criacao</strong>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
              <div style={{ display: 'grid', gap: 6 }}>
                <label style={fieldLabelStyle}>Projeto (Capex)</label>
                <select
                  value={createForm.capex}
                  onChange={event =>
                    setCreateForm(prev => ({ ...prev, capex: event.target.value as '0' | '1' }))
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
                  value={createForm.checklist}
                  onChange={event =>
                    setCreateForm(prev => ({ ...prev, checklist: event.target.value as '0' | '1' }))
                  }
                  style={{ padding: '10px 12px', borderRadius: 10, border: '1px solid #e2e8f0' }}
                >
                  <option value="1">Sim</option>
                  <option value="0">Nao</option>
                </select>
              </div>
            </div>
            <div>Ativos selecionados: {selectedAtivos.length}</div>
            <div>
              {selectedAtivos.map(ativo => (
                <div key={ativo.id}>
                  {ativo.ATIVO_CODPE} - {ativo.ATIVO_DESCRITIVO_OS}
                </div>
              ))}
            </div>
          </div>
        )}

        {formErrors.length > 0 && (
          <div style={{ color: '#f87171', fontSize: 12 }}>
            {formErrors.map(error => (
              <div key={error}>{error}</div>
            ))}
          </div>
        )}
      </div>
    </Modal>
  )
}
