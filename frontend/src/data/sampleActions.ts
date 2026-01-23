export type AcaoStatus = 'Aberta' | 'Em andamento' | 'Concluída'

export type AcaoRecord = {
  id_company: string
  id_acao: number
  id_usuario_solicitante: string
  id_usuario_responsavel: string
  data_criado: string
  data_vencimento: string
  status: AcaoStatus
  grupo_acao: string
  origem_acao: string
  equipe: string
  criticidade: string
  texto_acao: string
  texto_enerramento: string
  texto_devolutiva: string
}

export const sampleActions: AcaoRecord[] = [
  {
    id_company: 'COMPANY-01',
    id_acao: 1,
    id_usuario_solicitante: 'usr_tec_001',
    id_usuario_responsavel: 'usr_tec_001',
    data_criado: '2026-01-15',
    data_vencimento: '2026-01-22',
    status: 'Aberta',
    grupo_acao: 'Infraestrutura',
    origem_acao: 'Operação',
    equipe: 'Equipe Campo',
    criticidade: 'Alta',
    texto_acao: 'Revisar atuadores do painel mestre.',
    texto_enerramento: 'Em revisão',
    texto_devolutiva: 'Repassar para o setor AC.'
  },
  {
    id_company: 'COMPANY-01',
    id_acao: 2,
    id_usuario_solicitante: 'usr_urb_001',
    id_usuario_responsavel: 'usr_tec_001',
    data_criado: '2026-01-12',
    data_vencimento: '2026-01-20',
    status: 'Em andamento',
    grupo_acao: 'Operação',
    origem_acao: 'Planejamento',
    equipe: 'Equipe Campo',
    criticidade: 'Média',
    texto_acao: 'Testar comunicação entre séries.',
    texto_enerramento: 'Aguardando resposta.',
    texto_devolutiva: 'OK após testes.'
  },
  {
    id_company: 'COMPANY-01',
    id_acao: 3,
    id_usuario_solicitante: 'usr_urb_001',
    id_usuario_responsavel: 'usr_urb_001',
    data_criado: '2026-01-10',
    data_vencimento: '2026-01-18',
    status: 'Concluída',
    grupo_acao: 'Segurança',
    origem_acao: 'Auditoria',
    equipe: 'Equipe Campo',
    criticidade: 'Baixa',
    texto_acao: 'Atualizar procedimentos de emergência.',
    texto_enerramento: 'Finalizado',
    texto_devolutiva: 'Documento publicado.'
  }
]
