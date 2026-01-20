import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
  type FormEvent
} from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { getStoredUser } from '../services/auth'
import {
  PARAMETRO_TIPOS,
  createParametro,
  getParametros,
  updateParametro
} from '../services/api'
import type {
  ParametroCadastroAtivo,
  ParametroCadastroAtivoType
} from '../services/api'

const initialFormState = {
  tipo_parametro: PARAMETRO_TIPOS[0] as ParametroCadastroAtivoType,
  valor: '',
  ativo: true,
  ordem: '',
  observacao: ''
}

export function ConfiguracaoCadastroAtivos() {
  const [parametros, setParametros] = useState<ParametroCadastroAtivo[]>([])
  const [filterType, setFilterType] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [formState, setFormState] = useState(() => ({ ...initialFormState }))
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [busyRows, setBusyRows] = useState<Record<string, boolean>>({})
  const [editingParametroId, setEditingParametroId] = useState<string | null>(null)
  const companyId = useMemo(() => getStoredUser()?.empresaId ?? '', [])
  const [expanded, setExpanded] = useState(true)

  const loadParametros = useCallback(async () => {
    if (!companyId) {
      setParametros([])
      setErrorMessage('Empresa nao encontrada.')
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      const data = await getParametros({
        id_company: companyId,
        tipo_parametro: filterType
          ? (filterType as ParametroCadastroAtivoType)
          : undefined
      })
      setParametros(data)
      setErrorMessage(null)
    } catch (error) {
      console.error(error)
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Nao foi possivel carregar parametros.'
      )
    } finally {
      setLoading(false)
    }
  }, [companyId, filterType])

  useEffect(() => {
    void loadParametros()
  }, [loadParametros])

  const handleFormChange = (
    field: keyof typeof initialFormState,
    value: string | boolean
  ) => {
    setFormState(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleRowEdit = (parametro: ParametroCadastroAtivo) => {
    setEditingParametroId(parametro.id_parametro)
    setFormState({
      tipo_parametro: parametro.tipo_parametro,
      valor: parametro.valor,
      ativo: parametro.ativo,
      ordem:
        parametro.ordem === null || parametro.ordem === undefined
          ? ''
          : String(parametro.ordem),
      observacao: parametro.observacao ?? ''
    })
    setErrorMessage(null)
  }

  const handleCancelEdit = () => {
    setEditingParametroId(null)
    setFormState({ ...initialFormState })
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setErrorMessage(null)
    const trimmedValor = formState.valor.trim()
    if (!trimmedValor) {
      setErrorMessage('Valor e obrigatorio.')
      return
    }
    if (!companyId) {
      setErrorMessage('Empresa nao definida.')
      return
    }

    const payload = {
      tipo_parametro: formState.tipo_parametro,
      valor: trimmedValor,
      ativo: formState.ativo,
      ordem:
        formState.ordem.trim() === ''
          ? undefined
          : Number(formState.ordem.trim()),
      observacao:
        formState.observacao.trim() === ''
          ? null
          : formState.observacao.trim()
    }

    setSaving(true)
    try {
      if (editingParametroId) {
        await updateParametro(editingParametroId, payload)
      } else {
        await createParametro({
          id_company: companyId,
          ...payload
        })
      }
      setFormState({ ...initialFormState })
      setEditingParametroId(null)
      await loadParametros()
    } catch (error) {
      console.error(error)
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Nao foi possivel salvar o parametro.'
      )
    } finally {
      setSaving(false)
    }
  }

  const toggleActive = async (parametro: ParametroCadastroAtivo) => {
    setBusyRows(prev => ({ ...prev, [parametro.id_parametro]: true }))
    try {
      const updated = await updateParametro(parametro.id_parametro, {
        ativo: !parametro.ativo
      })
      setParametros(prev =>
        prev.map(item =>
          item.id_parametro === updated.id_parametro ? updated : item
        )
      )
      setErrorMessage(null)
    } catch (error) {
      console.error(error)
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Nao foi possivel atualizar o parametro.'
      )
    } finally {
      setBusyRows(prev => {
        const next = { ...prev }
        delete next[parametro.id_parametro]
        return next
      })
    }
  }

  const sortedParametros = useMemo(() => {
    return [...parametros].sort((a, b) => {
      const aOrd = a.ordem ?? Number.MAX_SAFE_INTEGER
      const bOrd = b.ordem ?? Number.MAX_SAFE_INTEGER
      if (aOrd !== bOrd) return aOrd - bOrd
      return a.valor.localeCompare(b.valor)
    })
  }, [parametros])

  return (
    <section style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 28 }}>
            Parametros do Cadastro de Ativos
          </h1>
          <p style={{ margin: '8px 0 0', color: '#475569' }}>
            Gerencie os parametros que alimentam os dropdowns utilizados no cadastro
            e nas telas de ativos.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setExpanded(prev => !prev)}
          style={{
            padding: '6px 12px',
            borderRadius: 10,
            border: '1px solid #cbd5f5',
            background: '#ffffff',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            fontWeight: 600
          }}
        >
          {expanded ? 'Recolher' : 'Expandir'}
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
      </header>

      {expanded && (
        <>
          <form
            onSubmit={handleSubmit}
            style={{
              padding: 20,
              borderRadius: 14,
              background: '#ffffff',
              boxShadow: '0 10px 25px rgba(15, 23, 42, 0.08)',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: 16
            }}
          >
            <label
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 6,
                fontWeight: 600,
                fontSize: 13
              }}
            >
              Tipo do parametro
              <select
                value={formState.tipo_parametro}
                onChange={event =>
                  handleFormChange(
                    'tipo_parametro',
                    event.target.value as ParametroCadastroAtivoType
                  )
                }
                style={{
                  padding: '10px 12px',
                  borderRadius: 10,
                  border: '1px solid #cbd5f5',
                  background: '#f8fafc'
                }}
              >
                {PARAMETRO_TIPOS.map(tipo => (
                  <option key={tipo} value={tipo}>
                    {tipo}
                  </option>
                ))}
              </select>
            </label>

            <label
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 6,
                fontWeight: 600,
                fontSize: 13
              }}
            >
              Valor
              <input
                value={formState.valor}
                onChange={event => handleFormChange('valor', event.target.value)}
                placeholder="Informe o valor"
                style={{
                  padding: '10px 12px',
                  borderRadius: 10,
                  border: '1px solid #cbd5f5',
                  background: '#f8fafc'
                }}
              />
            </label>

            <label
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 6,
                fontWeight: 600,
                fontSize: 13
              }}
            >
              Observacao (opcional)
              <textarea
                value={formState.observacao}
                onChange={event =>
                  handleFormChange('observacao', event.target.value)
                }
                rows={2}
                style={{
                  padding: '10px 12px',
                  borderRadius: 10,
                  border: '1px solid #cbd5f5',
                  background: '#f8fafc',
                  resize: 'vertical'
                }}
              />
            </label>

            <label
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 6,
                fontWeight: 600,
                fontSize: 13
              }}
            >
              Ordem (opcional)
              <input
                value={formState.ordem}
                onChange={event => handleFormChange('ordem', event.target.value)}
                placeholder="0"
                inputMode="numeric"
                style={{
                  padding: '10px 12px',
                  borderRadius: 10,
                  border: '1px solid #cbd5f5',
                  background: '#f8fafc'
                }}
              />
            </label>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                marginTop: 'auto'
              }}
            >
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  fontWeight: 600,
                  fontSize: 13
                }}
              >
                <input
                  type="checkbox"
                  checked={formState.ativo}
                  onChange={event => handleFormChange('ativo', event.target.checked)}
                />
                Ativo
              </label>

              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                {editingParametroId && (
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    style={{
                      padding: '10px 20px',
                      borderRadius: 10,
                      border: '1px solid #cbd5f5',
                      background: '#f8fafc',
                      color: '#0f172a',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    Cancelar
                  </button>
                )}
                <button
                  type="submit"
                  disabled={saving}
                  style={{
                    padding: '10px 20px',
                    borderRadius: 10,
                    border: 'none',
                    background: '#0f172a',
                    color: '#ffffff',
                    fontWeight: 700,
                    cursor: saving ? 'not-allowed' : 'pointer'
                  }}
                >
                  {saving ? 'Salvando...' : editingParametroId ? 'Salvar alteracoes' : 'Salvar parametro'}
                </button>
              </div>
            </div>
          </form>

          {errorMessage && (
            <p style={{ color: '#dc2626', margin: 0 }}>{errorMessage}</p>
          )}

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 16,
              flexWrap: 'wrap'
            }}
          >
            <h2 style={{ margin: '0', fontSize: 20 }}>Parametros cadastrados</h2>
            <label
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 6,
                fontWeight: 600,
                fontSize: 13
              }}
            >
              Filtrar por tipo
              <select
                value={filterType}
                onChange={event => setFilterType(event.target.value)}
                style={{
                  padding: '10px 12px',
                  borderRadius: 10,
                  border: '1px solid #cbd5f5',
                  background: '#f8fafc'
                }}
              >
                <option value="">Todas</option>
                {PARAMETRO_TIPOS.map(tipo => (
                  <option key={tipo} value={tipo}>
                    {tipo}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div
            style={{
              borderRadius: 16,
              background: '#ffffff',
              padding: 20,
              boxShadow: '0 10px 25px rgba(15, 23, 42, 0.08)'
            }}
          >
            {loading ? (
              <p style={{ margin: 0 }}>Carregando parametros...</p>
            ) : sortedParametros.length ? (
              <div style={{ overflowX: 'auto' }}>
                <table
                  style={{
                    width: '100%',
                    borderCollapse: 'collapse',
                    minWidth: 640
                  }}
                >
                  <thead>
                    <tr>
                      <th style={tableHeadStyle}>Tipo do parametro</th>
                      <th style={tableHeadStyle}>Valor</th>
                      <th style={tableHeadStyle}>Ordem</th>
                      <th style={tableHeadStyle}>Ativo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedParametros.map(parametro => (
                      <tr key={parametro.id_parametro}>
                        <td style={tableCellStyle}>{parametro.tipo_parametro}</td>
                        <td style={tableCellStyle}>
                          <div
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              gap: 12
                            }}
                          >
                            <span>{parametro.valor}</span>
                            <button
                              type="button"
                              onClick={() => handleRowEdit(parametro)}
                              style={{
                                padding: '4px 10px',
                                borderRadius: 8,
                                border: '1px solid #cbd5f5',
                                background: '#f8fafc',
                                color: '#0f172a',
                                fontWeight: 600,
                                cursor: 'pointer'
                              }}
                            >
                              Editar
                            </button>
                          </div>
                        </td>
                        <td style={tableCellStyle}>
                          {parametro.ordem ?? '-'}
                        </td>
                        <td style={tableCellStyle}>
                          <label
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 8,
                              fontWeight: 600,
                              color: parametro.ativo ? '#0f172a' : '#475569'
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={parametro.ativo}
                              onChange={() => toggleActive(parametro)}
                              disabled={Boolean(busyRows[parametro.id_parametro])}
                              style={{
                                width: 16,
                                height: 16,
                                accentColor: parametro.ativo ? '#22c55e' : '#cbd5f5'
                              }}
                            />
                            {parametro.ativo ? 'Ativo' : 'Inativo'}
                          </label>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p style={{ margin: 0 }}>Nenhum parametro encontrado.</p>
            )}
          </div>
        </>
      )}
    </section>
  )
}

const tableHeadStyle: CSSProperties = {
  textAlign: 'left',
  padding: '12px 10px',
  fontSize: 13,
  letterSpacing: 0.3,
  color: '#475569',
  borderBottom: '1px solid #e2e8f0'
}

const tableCellStyle: CSSProperties = {
  padding: '12px 10px',
  fontSize: 14,
  color: '#0f172a',
  borderBottom: '1px solid #e2e8f0'
}


