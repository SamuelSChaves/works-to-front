import { type CSSProperties } from 'react'

const pageStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 18,
  width: '100%',
  minHeight: 400
}

const cardStyle: CSSProperties = {
  borderRadius: 18,
  border: '1px solid #e5e7eb',
  background: '#ffffff',
  padding: 24,
  boxShadow: '0 18px 30px rgba(15,23,42,0.06)'
}

const gridStyle: CSSProperties = {
  display: 'grid',
  gap: 12,
  gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))'
}

const metricStyle: CSSProperties = {
  borderRadius: 14,
  border: '1px solid #e5e7eb',
  padding: 16,
  display: 'flex',
  flexDirection: 'column',
  gap: 6,
  background: '#f8fafc'
}

export function ConfiguracaoDados() {
  return (
    <section style={pageStyle}>
      <header>
        <h1 style={{ margin: 0, fontSize: 28 }}>Dados</h1>
        <p style={{ margin: '8px 0 0', color: '#475569' }}>
          Centralize controles e indicadores relacionados aos dados mestres da
          sua empresa, garantindo visibilidade e monitoramento.
        </p>
      </header>

      <div style={cardStyle}>
        <p style={{ marginTop: 0, color: '#475569', fontSize: 14 }}>
          Essa nova aba ainda está em construção, mas já serve como ponto de
          partida para mostrar relatórios estratégicos ou integrações futuras.
        </p>

        <div style={gridStyle}>
          <div style={metricStyle}>
            <span style={{ fontSize: 12, color: '#687183', textTransform: 'uppercase', letterSpacing: 0.4 }}>
              Qualidade dos dados
            </span>
            <strong style={{ fontSize: 24, color: '#0f172a' }}>92%</strong>
            <span style={{ fontSize: 13, color: '#475569' }}>
              Integridade das tabelas mestras monitoradas semanalmente.
            </span>
          </div>
          <div style={metricStyle}>
            <span style={{ fontSize: 12, color: '#687183', textTransform: 'uppercase', letterSpacing: 0.4 }}>
              Fluxos críticos
            </span>
            <strong style={{ fontSize: 24, color: '#0f172a' }}>5 pendentes</strong>
            <span style={{ fontSize: 13, color: '#475569' }}>
              Processos ETL aguardando validação de regras da equipe.
            </span>
          </div>
          <div style={metricStyle}>
            <span style={{ fontSize: 12, color: '#687183', textTransform: 'uppercase', letterSpacing: 0.4 }}>
              Última sincronização
            </span>
            <strong style={{ fontSize: 24, color: '#0f172a' }}>Agora</strong>
            <span style={{ fontSize: 13, color: '#475569' }}>
              Dataset mestre atualizado há 6 minutos.
            </span>
          </div>
        </div>
      </div>
    </section>
  )
}
