import { useEffect, useMemo, useState } from 'react'
import {
  getStoredUser,
  subscribeToUserChanges,
  type User
} from '../services/auth'

type Material = {
  id: string
  codigo: string
  nome: string
  status: 'Ativo' | 'Inativo'
  categoria: string
  unidade: string
  descricao?: string
}

const defaultMaterials: Material[] = [
  {
    id: 'MAT-001',
    codigo: 'MAT-001',
    nome: 'Parafuso sextavado',
    status: 'Ativo',
    categoria: 'Fixação',
    unidade: 'UN',
    descricao: 'Parafuso em aço carbono com rosca padrão.'
  },
  {
    id: 'MAT-002',
    codigo: 'MAT-002',
    nome: 'Rolamento 6205',
    status: 'Ativo',
    categoria: 'Rolamentos',
    unidade: 'UN',
    descricao: 'Rolamento de esferas para eixo principal.'
  },
  {
    id: 'MAT-003',
    codigo: 'MAT-003',
    nome: 'Óleo sintético 5W40',
    status: 'Inativo',
    categoria: 'Lubrificantes',
    unidade: 'L',
    descricao: 'Lubrificante para motores elétricos de alto torque.'
  },
  {
    id: 'MAT-004',
    codigo: 'MAT-004',
    nome: 'Cabo de fibra óptica',
    status: 'Ativo',
    categoria: 'Cabeamento',
    unidade: 'M',
    descricao: 'Cabo multimodo para redes industriais.'
  }
]

const defaultFormValues = {
  codigo: '',
  nome: '',
  status: 'Ativo' as 'Ativo' | 'Inativo',
  categoria: '',
  unidade: '',
  descricao: ''
}

const STATUS_OPTIONS = ['Todos', 'Ativo', 'Inativo']

export function MaterialCadastro() {
  const [materials, setMaterials] = useState<Material[]>(() => defaultMaterials)
  const [filters, setFilters] = useState({
    codigo: '',
    nome: '',
    status: 'Todos'
  })
  const [modalOpen, setModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create')
  const [formValues, setFormValues] = useState(defaultFormValues)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [user, setUser] = useState<User | null>(getStoredUser())

  useEffect(() => {
    const unsubscribe = subscribeToUserChanges(() => {
      setUser(getStoredUser())
    })
    return unsubscribe
  }, [])

  const role = user?.role?.toLowerCase() || 'leitura'
  const canManage = role === 'admin' || role === 'edicao'

  const filteredMaterials = useMemo(() => {
    const codigoFilter = filters.codigo.trim().toLowerCase()
    const nomeFilter = filters.nome.trim().toLowerCase()
    const statusFilter = filters.status
    return materials.filter(material => {
      const matchesCode =
        !codigoFilter ||
        material.codigo.toLowerCase().includes(codigoFilter) ||
        material.id.toLowerCase().includes(codigoFilter)
      const matchesName =
        !nomeFilter || material.nome.toLowerCase().includes(nomeFilter)
      const matchesStatus =
        statusFilter === 'Todos' || material.status === statusFilter
      return matchesCode && matchesName && matchesStatus
    })
  }, [filters, materials])

  const openCreateModal = () => {
    setModalMode('create')
    setFormValues(defaultFormValues)
    setEditingId(null)
    setModalOpen(true)
  }

  const openEditModal = (material: Material) => {
    setModalMode('edit')
    setFormValues({
      codigo: material.codigo,
      nome: material.nome,
      status: material.status,
      categoria: material.categoria,
      unidade: material.unidade,
      descricao: material.descricao ?? ''
    })
    setEditingId(material.id)
    setModalOpen(true)
  }

  const handleSave = () => {
    if (!formValues.codigo.trim() || !formValues.nome.trim()) {
      return
    }

    if (modalMode === 'create') {
      const nextId = formValues.codigo.trim()
      const payload: Material = {
        id: nextId || `MAT-${Date.now()}`,
        codigo: formValues.codigo.trim(),
        nome: formValues.nome.trim(),
        status: formValues.status,
        categoria: formValues.categoria.trim(),
        unidade: formValues.unidade.trim(),
        descricao: formValues.descricao.trim()
      }
      setMaterials(prev => [payload, ...prev])
    } else if (editingId) {
      setMaterials(prev =>
        prev.map(material =>
          material.id === editingId
            ? {
                ...material,
                codigo: formValues.codigo.trim(),
                nome: formValues.nome.trim(),
                status: formValues.status,
                categoria: formValues.categoria.trim(),
                unidade: formValues.unidade.trim(),
                descricao: formValues.descricao.trim()
              }
            : material
        )
      )
    }

    setModalOpen(false)
  }

  const handleCancel = () => {
    setModalOpen(false)
  }

  const isFormValid =
    Boolean(formValues.codigo.trim() && formValues.nome.trim()) &&
    Boolean(formValues.categoria.trim())

  return (
    <main
      style={{
        padding: 24,
        display: 'flex',
        flexDirection: 'column',
        gap: 20,
        minHeight: '100%'
      }}
    >
      <header
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: 12
        }}
      >
        <div>
          <h1 style={{ margin: 0, fontSize: 28 }}>Cadastro de Material</h1>
          <p style={{ margin: '6px 0 0', color: '#64748b' }}>
            Filtre, identifique e mantenha o estoque de materiais do seu
            estoque oficial.
          </p>
        </div>
        {canManage && (
          <button
            type="button"
            onClick={openCreateModal}
            style={{
              borderRadius: 12,
              border: 'none',
              padding: '10px 18px',
              background:
                'linear-gradient(90deg, #2563eb 0%, #312e81 100%)',
              color: '#fff',
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: '0 10px 25px rgba(37, 99, 235, 0.35)'
            }}
          >
            Novo Material
          </button>
        )}
      </header>

      <section
        style={{
          background: '#0b1220',
          borderRadius: 16,
          padding: 20,
          border: '1px solid #1f2937',
          display: 'flex',
          flexDirection: 'column',
          gap: 16
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: 16
          }}
        >
          <label
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 6,
              fontSize: 12,
              color: '#94a3b8'
            }}
          >
            Código do material
            <input
              type="text"
              value={filters.codigo}
              onChange={event =>
                setFilters(prev => ({ ...prev, codigo: event.target.value }))
              }
              placeholder="Ex: MAT-001"
              style={{
                borderRadius: 10,
                border: '1px solid #1f2937',
                padding: '10px 12px',
                background: '#0f172a',
                color: '#f8fafc'
              }}
            />
          </label>
          <label
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 6,
              fontSize: 12,
              color: '#94a3b8'
            }}
          >
            Nome do material
            <input
              type="text"
              value={filters.nome}
              onChange={event =>
                setFilters(prev => ({ ...prev, nome: event.target.value }))
              }
              placeholder="Buscar por palavra-chave"
              style={{
                borderRadius: 10,
                border: '1px solid #1f2937',
                padding: '10px 12px',
                background: '#0f172a',
                color: '#f8fafc'
              }}
            />
          </label>
          <label
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 6,
              fontSize: 12,
              color: '#94a3b8'
            }}
          >
            Status
            <select
              value={filters.status}
              onChange={event =>
                setFilters(prev => ({ ...prev, status: event.target.value }))
              }
              style={{
                borderRadius: 10,
                border: '1px solid #1f2937',
                padding: '10px 12px',
                background: '#0f172a',
                color: '#f8fafc'
              }}
            >
              {STATUS_OPTIONS.map(option => (
                <option
                  value={option}
                  key={option}
                  style={{ background: '#0f172a' }}
                >
                  {option}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            color: '#94a3b8',
            fontSize: 13
          }}
        >
          <span>
            {filteredMaterials.length} materiais encontrados de{' '}
            {materials.length} cadastrados
          </span>
          {!canManage && (
            <span style={{ fontStyle: 'italic' }}>Modo leitura</span>
          )}
        </div>
      </section>

      <section
        style={{
          borderRadius: 18,
          border: '1px solid #1f2937',
          background: '#0c1326',
          padding: 20,
          overflowX: 'hidden'
        }}
      >
        <div
          style={{
            overflowX: 'auto'
          }}
        >
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              minWidth: 700
            }}
          >
            <thead>
              <tr>
                {[
                  'Código',
                  'Material',
                  'Categoria',
                  'Unidade',
                  'Status',
                  'Ações'
                ].map(header => (
                  <th
                    key={header}
                    style={{
                      textAlign: 'left',
                      padding: '12px 8px',
                      fontSize: 12,
                      letterSpacing: 0.5,
                      textTransform: 'uppercase',
                      color: '#94a3b8'
                    }}
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredMaterials.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    style={{
                      padding: 20,
                      color: '#94a3b8',
                      textAlign: 'center'
                    }}
                  >
                    Nenhum material corresponde aos filtros aplicados.
                  </td>
                </tr>
              )}
              {filteredMaterials.map(material => (
                <tr
                  key={material.id}
                  style={{
                    background: '#0c1326',
                    borderTop: '1px solid #1f2937'
                  }}
                >
                  <td
                    style={{
                      padding: '14px 8px',
                      fontWeight: 600,
                      color: '#e2e8f0'
                    }}
                  >
                    {material.codigo}
                  </td>
                  <td
                    style={{
                      padding: '14px 8px',
                      color: '#cbd5f5'
                    }}
                  >
                    {material.nome}
                    {material.descricao && (
                      <div
                        style={{
                          fontSize: 12,
                          color: '#94a3b8',
                          marginTop: 4
                        }}
                      >
                        {material.descricao}
                      </div>
                    )}
                  </td>
                  <td
                    style={{
                      padding: '14px 8px',
                      color: '#cbd5f5'
                    }}
                  >
                    {material.categoria || '-'}
                  </td>
                  <td
                    style={{
                      padding: '14px 8px',
                      color: '#cbd5f5'
                    }}
                  >
                    {material.unidade || '-'}
                  </td>
                  <td style={{ padding: '14px 8px' }}>
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '6px 14px',
                        borderRadius: 999,
                        background:
                          material.status === 'Ativo'
                            ? 'rgba(34,197,94,0.15)'
                            : 'rgba(248,113,113,0.15)',
                        color:
                          material.status === 'Ativo'
                            ? '#4ade80'
                            : '#f87171',
                        fontSize: 12,
                        fontWeight: 600,
                        border:
                          material.status === 'Ativo'
                            ? '1px solid rgba(34,197,94,0.4)'
                            : '1px solid rgba(248,113,113,0.4)'
                      }}
                    >
                      {material.status}
                    </span>
                  </td>
                  <td style={{ padding: '14px 8px' }}>
                    {canManage ? (
                      <button
                        type="button"
                        onClick={() => openEditModal(material)}
                        style={{
                          border: '1px solid #94a3b8',
                          background: 'transparent',
                          color: '#f8fafc',
                          padding: '8px 14px',
                          borderRadius: 10,
                          cursor: 'pointer',
                          fontWeight: 600
                        }}
                      >
                        Editar
                      </button>
                    ) : (
                      <span
                        style={{
                          fontSize: 12,
                          color: '#64748b',
                          fontStyle: 'italic'
                        }}
                      >
                        apenas leitura
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {modalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(3,7,18,0.6)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 30,
            padding: 24
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            style={{
              width: '100%',
              maxWidth: 520,
              borderRadius: 18,
              background: '#0b1220',
              border: '1px solid #1f2937',
              padding: 24,
              boxShadow: '0 30px 60px rgba(7,11,27,0.6)'
            }}
          >
            <header
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 6
              }}
            >
              <strong
                style={{
                  fontSize: 20,
                  color: '#f8fafc'
                }}
              >
                {modalMode === 'create' ? 'Novo material' : 'Editar material'}
              </strong>
              <p style={{ color: '#94a3b8', margin: 0 }}>
                {modalMode === 'create'
                  ? 'configure as informações básicas do material'
                  : 'atualize os campos relevantes'}
              </p>
            </header>

            <div
              style={{
                marginTop: 16,
                display: 'flex',
                flexDirection: 'column',
                gap: 16
              }}
            >
              <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <span style={{ color: '#94a3b8', fontSize: 12 }}>
                  Código
                </span>
                <input
                  value={formValues.codigo}
                  onChange={event =>
                    setFormValues(prev => ({
                      ...prev,
                      codigo: event.target.value
                    }))
                  }
                  placeholder="Informe o código do material"
                  style={{
                    borderRadius: 12,
                    border: '1px solid #1f2937',
                    background: '#0f172a',
                    color: '#f8fafc',
                    padding: '10px 12px'
                  }}
                />
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <span style={{ color: '#94a3b8', fontSize: 12 }}>
                  Nome
                </span>
                <input
                  value={formValues.nome}
                  onChange={event =>
                    setFormValues(prev => ({
                      ...prev,
                      nome: event.target.value
                    }))
                  }
                  placeholder="Digite o nome do material"
                  style={{
                    borderRadius: 12,
                    border: '1px solid #1f2937',
                    background: '#0f172a',
                    color: '#f8fafc',
                    padding: '10px 12px'
                  }}
                />
              </label>
              <div
                style={{
                  display: 'grid',
                  gap: 16,
                  gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))'
                }}
              >
                <label
                  style={{ display: 'flex', flexDirection: 'column', gap: 6 }}
                >
                  <span style={{ color: '#94a3b8', fontSize: 12 }}>Status</span>
                  <select
                    value={formValues.status}
                    onChange={event =>
                      setFormValues(prev => ({
                        ...prev,
                        status: event.target.value as 'Ativo' | 'Inativo'
                      }))
                    }
                    style={{
                      borderRadius: 12,
                      border: '1px solid #1f2937',
                      background: '#0f172a',
                      color: '#f8fafc',
                      padding: '10px 12px'
                    }}
                  >
                    <option value="Ativo">Ativo</option>
                    <option value="Inativo">Inativo</option>
                  </select>
                </label>
                <label
                  style={{ display: 'flex', flexDirection: 'column', gap: 6 }}
                >
                  <span style={{ color: '#94a3b8', fontSize: 12 }}>
                    Categoria
                  </span>
                  <input
                    value={formValues.categoria}
                    onChange={event =>
                      setFormValues(prev => ({
                        ...prev,
                        categoria: event.target.value
                      }))
                    }
                    placeholder="Ex: Lubrificantes"
                    style={{
                      borderRadius: 12,
                      border: '1px solid #1f2937',
                      background: '#0f172a',
                      color: '#f8fafc',
                      padding: '10px 12px'
                    }}
                  />
                </label>
                <label
                  style={{ display: 'flex', flexDirection: 'column', gap: 6 }}
                >
                  <span style={{ color: '#94a3b8', fontSize: 12 }}>
                    Unidade
                  </span>
                  <input
                    value={formValues.unidade}
                    onChange={event =>
                      setFormValues(prev => ({
                        ...prev,
                        unidade: event.target.value
                      }))
                    }
                    placeholder="UN / KG / M"
                    style={{
                      borderRadius: 12,
                      border: '1px solid #1f2937',
                      background: '#0f172a',
                      color: '#f8fafc',
                      padding: '10px 12px'
                    }}
                  />
                </label>
              </div>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <span style={{ color: '#94a3b8', fontSize: 12 }}>
                  Descrição
                </span>
                <textarea
                  value={formValues.descricao}
                  onChange={event =>
                    setFormValues(prev => ({
                      ...prev,
                      descricao: event.target.value
                    }))
                  }
                  rows={3}
                  placeholder="Breve registro sobre o uso ou características"
                  style={{
                    borderRadius: 12,
                    border: '1px solid #1f2937',
                    background: '#0f172a',
                    color: '#f8fafc',
                    padding: '10px 12px',
                    resize: 'vertical'
                  }}
                />
              </label>
            </div>

            <div
              style={{
                marginTop: 24,
                display: 'flex',
                justifyContent: 'flex-end',
                gap: 12
              }}
            >
              <button
                type="button"
                onClick={handleCancel}
                style={{
                  borderRadius: 10,
                  border: '1px solid #6b7280',
                  background: 'transparent',
                  color: '#cbd5f5',
                  padding: '10px 16px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={!isFormValid}
                style={{
                  borderRadius: 10,
                  border: 'none',
                  padding: '10px 16px',
                  fontWeight: 600,
                  cursor: isFormValid ? 'pointer' : 'not-allowed',
                  background: isFormValid
                    ? 'linear-gradient(90deg, #10b981 0%, #0f9d58 100%)'
                    : 'rgba(16,185,129,0.3)',
                  color: '#ffffff'
                }}
              >
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
