import { useMemo, useState } from 'react'
import { getStoredUser } from '../services/auth'

type ApontamentoRecord = {
  id_company: string
  id_codigo: string
  id_ativo: string
  id_usuario: string
  data: string
  hr_inicio: string
  hr_fim: string
  duracao: string
  id_os: string
  criado_por: string
  criado_em: string
  tecnico: string
  ativo: string
  observacao: string
}

const sampleRecords: ApontamentoRecord[] = [
  {
    id_company: 'COMPANY-01',
    id_codigo: 'COD-100',
    id_ativo: 'ATV-0042',
    id_usuario: 'USR-9023',
    data: '2026-01-19',
    hr_inicio: '07:30',
    hr_fim: '10:12',
    duracao: '2h 42m',
    id_os: 'OS-221',
    criado_por: 'Ana Lucia',
    criado_em: '2026-01-19 07:20',
    tecnico: 'Ana Lucia',
    ativo: 'Transformador 12kV',
    observacao: 'InspeÃƒÂ§ÃƒÂ£o visual e limpeza leve.'
  },
  {
    id_company: 'COMPANY-01',
    id_codigo: 'COD-110',
    id_ativo: 'ATV-0110',
    id_usuario: 'USR-7145',
    data: '2026-01-18',
    hr_inicio: '13:05',
    hr_fim: '17:55',
    duracao: '4h 50m',
    id_os: 'OS-208',
    criado_por: 'Carlos Mendes',
    criado_em: '2026-01-18 12:55',
    tecnico: 'Carlos Mendes',
    ativo: 'SubestaÃƒÂ§ÃƒÂ£o Sul',
    observacao: 'Troca de componentes e testes de carga.'
  },
  {
    id_company: 'COMPANY-01',
    id_codigo: 'COD-200',
    id_ativo: 'ATV-0077',
    id_usuario: 'USR-3308',
    data: '2026-01-17',
    hr_inicio: '08:40',
    hr_fim: '10:15',
    duracao: '1h 35m',
    id_os: 'OS-205',
    criado_por: 'Fernanda Alves',
    criado_em: '2026-01-17 08:30',
    tecnico: 'Fernanda Alves',
    ativo: 'Elevador de Cargas',
    observacao: 'VerificaÃƒÂ§ÃƒÂ£o do painel elÃƒÂ©trico.'
  }
]

const filterTemplate = {
  data: '2026-01',
  codigo: '',
  tecnico: '',
  ativo: '',
  os: ''
}

const formatDateDisplay = (value: string) => {
  const [year, month, day] = value.split('-')
  if (!day || !month || !year) return value
  return `${day}/${month}/${year}`
}

const makeMonthKey = (value: string) => {
  const [year, month] = value.split('-')
  if (!year || !month) return ''
  return `${year}-${month}`
}

const uniqueValues = (key: keyof ApontamentoRecord) =>
  Array.from(new Set(sampleRecords.map(record => record[key])))

export function ProdutividadeApontamentos() {
  const userCompany = useMemo(() => getStoredUser()?.empresaId || 'COMPANY-01', [])
  const [filters, setFilters] = useState(filterTemplate)
  const filteredRecords = useMemo(() => {
    return sampleRecords.filter(record => {
      const matchesDate =
        !filters.data || makeMonthKey(record.data) === filters.data
      const matchesCodigo = !filters.codigo || record.id_codigo.includes(filters.codigo)
      const matchesTecnico =
        !filters.tecnico || record.tecnico.toLowerCase().includes(filters.tecnico.toLowerCase())
      const matchesAtivo =
        !filters.ativo || record.ativo.toLowerCase().includes(filters.ativo.toLowerCase())
      const matchesOs =
        !filters.os || record.id_os.toLowerCase().includes(filters.os.toLowerCase())
      return matchesDate && matchesCodigo && matchesTecnico && matchesAtivo && matchesOs
    })
  }, [filters])

  const handleFilterChange = (field: keyof typeof filterTemplate, value: string) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }))
  }

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
      <header>
        <h1 style={{ margin: 0 }}>Apontamentos</h1>
        <p style={{ margin: '6px 0 0', color: '#64748b' }}>
          Acompanhe as marcaÃƒÂ§ÃƒÂµes feitas pelos tÃƒÂ©cnicos no turno.
        </p>
      </header>

      <section
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 12,
          background: '#ffffff',
          padding: 16,
          borderRadius: 14,
          border: '1px solid #e2e8f0'
        }}
      >
        <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span style={{ fontSize: 12, color: '#94a3b8' }}>Data</span>
          <input
            type="month"
            value={filters.data}
            onChange={event => handleFilterChange('data', event.target.value)}
            style={{
              borderRadius: 10,
              border: '1px solid #e2e8f0',
              padding: '10px 12px',
              background: '#f8fafc',
              color: '#0f172a'
            }}
          />
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span style={{ fontSize: 12, color: '#94a3b8' }}>CÃ³digo</span>
          <select
            value={filters.codigo}
            onChange={event => handleFilterChange('codigo', event.target.value)}
            style={{
              borderRadius: 10,
              border: '1px solid #e2e8f0',
              padding: '10px 12px',
              background: '#f8fafc',
              color: '#0f172a'
            }}
          >
            <option value="">Todos</option>
            {uniqueValues('id_codigo').map(option => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span style={{ fontSize: 12, color: '#94a3b8' }}>TÃ©cnico</span>
          <input
            list="tecnicoOptions"
            value={filters.tecnico}
            onChange={event => handleFilterChange('tecnico', event.target.value)}
            placeholder="Nome do tÃ©cnico"
            style={{
              borderRadius: 10,
              border: '1px solid #e2e8f0',
              padding: '10px 12px',
              background: '#f8fafc',
              color: '#0f172a'
            }}
          />
          <datalist id="tecnicoOptions">
            {uniqueValues('tecnico').map(option => (
              <option key={option} value={option} />
            ))}
          </datalist>
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span style={{ fontSize: 12, color: '#94a3b8' }}>Ativo</span>
          <input
            list="ativoOptions"
            value={filters.ativo}
            onChange={event => handleFilterChange('ativo', event.target.value)}
            placeholder="Nome do ativo"
            style={{
              borderRadius: 10,
              border: '1px solid #e2e8f0',
              padding: '10px 12px',
              background: '#f8fafc',
              color: '#0f172a'
            }}
          />
          <datalist id="ativoOptions">
            {uniqueValues('ativo').map(option => (
              <option key={option} value={option} />
            ))}
          </datalist>
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span style={{ fontSize: 12, color: '#94a3b8' }}>OS</span>
          <input
            list="osOptions"
            value={filters.os}
            onChange={event => handleFilterChange('os', event.target.value)}
            placeholder="Ex: OS-221"
            style={{
              borderRadius: 10,
              border: '1px solid #e2e8f0',
              padding: '10px 12px',
              background: '#f8fafc',
              color: '#0f172a'
            }}
          />
          <datalist id="osOptions">
            {uniqueValues('id_os').map(option => (
              <option key={option} value={option} />
            ))}
          </datalist>
        </label>
      </section>

      <div
        style={{
          padding: '14px 16px',
          borderRadius: 12,
          border: '1px solid #e2e8f0',
          background: '#ffffff',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          color: '#475569',
          fontSize: 12
        }}
      >
        <div>
          <strong>ID Company: </strong>
          {userCompany}
        </div>
        <div>
          <strong>Registros: </strong>
          {filteredRecords.length}
        </div>
      </div>

      <section
        style={{
          borderRadius: 18,
          border: '1px solid #e2e8f0',
          background: '#ffffff',
          padding: 16,
          overflowX: 'auto'
        }}
      >
        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            minWidth: 1300,
            color: '#0f172a'
          }}
        >
          <thead>
            <tr
              style={{
                textAlign: 'center',
                textTransform: 'uppercase',
                fontSize: 11,
                letterSpacing: 0.5,
                color: '#475569'
              }}
            >
              <th style={{ padding: '10px 8px' }}>Data</th>
              <th style={{ padding: '10px 8px' }}>Código Apontamento</th>
              <th style={{ padding: '10px 8px' }}>Hr Início</th>
              <th style={{ padding: '10px 8px' }}>Hr Fim</th>
              <th style={{ padding: '10px 8px' }}>Duração</th>
              <th style={{ padding: '10px 8px' }}>Técnico</th>
              <th style={{ padding: '10px 8px' }}>Ativo</th>
              <th style={{ padding: '10px 8px' }}>ID Ativo</th>
              <th style={{ padding: '10px 8px' }}>OS</th>
              <th style={{ padding: '10px 8px' }}>Observação</th>
              <th style={{ padding: '10px 8px' }}>ID Company</th>
              <th style={{ padding: '10px 8px' }}>ID Usuário</th>
              <th style={{ padding: '10px 8px' }}>Criado por</th>
              <th style={{ padding: '10px 8px' }}>Criado em</th>
            </tr>
          </thead>
          <tbody>
            {filteredRecords.length === 0 && (
              <tr>
                <td
                  colSpan={14}
                  style={{
                    padding: 20,
                    textAlign: 'center',
                    color: '#94a3b8'
                  }}
                >
                  Nenhum apontamento encontrado.
                </td>
              </tr>
            )}
            {filteredRecords.map(record => (
              <tr
                key={`${record.data}-${record.id_codigo}-${record.id_os}`}
                style={{
                  borderTop: '1px solid #e2e8f0',
                  background: '#f8fafc'
                }}
              >
                <td style={{ padding: '14px 8px', fontWeight: 600 }}>
                  {formatDateDisplay(record.data)}
                </td>
                <td style={{ padding: '14px 8px', textAlign: 'center' }}>
                  {record.id_codigo}
                </td>
                <td style={{ padding: '14px 8px', textAlign: 'center' }}>
                  {record.hr_inicio}
                </td>
                <td style={{ padding: '14px 8px', textAlign: 'center' }}>
                  {record.hr_fim}
                </td>
                <td style={{ padding: '14px 8px', textAlign: 'center' }}>
                  {record.duracao}
                </td>
                <td style={{ padding: '14px 8px', textAlign: 'center' }}>
                  {record.tecnico}
                </td>
                <td style={{ padding: '14px 8px', textAlign: 'center' }}>
                  {record.ativo}
                </td>
                <td style={{ padding: '14px 8px', textAlign: 'center' }}>
                  {record.id_ativo}
                </td>
                <td style={{ padding: '14px 8px', textAlign: 'center' }}>
                  {record.id_os}
                </td>
                <td
                  style={{
                    padding: '14px 8px',
                    textAlign: 'left',
                    color: '#475569',
                    fontSize: 12
                  }}
                >
                  {record.observacao}
                </td>
                <td style={{ padding: '14px 8px', textAlign: 'center' }}>
                  {record.id_company}
                </td>
                <td style={{ padding: '14px 8px', textAlign: 'center' }}>
                  {record.id_usuario}
                </td>
                <td style={{ padding: '14px 8px', textAlign: 'center' }}>
                  {record.criado_por}
                </td>
                <td style={{ padding: '14px 8px', textAlign: 'center' }}>
                  {record.criado_em}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </main>
  )
}
