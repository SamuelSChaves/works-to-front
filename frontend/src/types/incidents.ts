export type IncidentStatus = 'Aberto' | 'Em andamento' | 'Concluído'
export type IncidentSeverity = 'Baixa' | 'Média' | 'Alta' | 'Crítica'

export type IncidenteRecord = {
  id: string
  company_id: string
  codigo: string
  titulo: string
  status: IncidentStatus
  severity: IncidentSeverity
  responsavel: string
  relator: string
  criado_em: string
  descricao: string
  plano_acao: string
  anexos: string[]
}
