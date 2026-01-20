export type GrupoAcao = {
  id: string
  nome: string
  descricao: string
  status: 'Ativo' | 'Inativo'
}

export const GRUPOS_ACOES_DEFAULT: GrupoAcao[] = [
  {
    id: 'GRP-01',
    nome: 'Infraestrutura Crítica',
    descricao: 'Manutenções em sistemas essenciais e painéis principais.',
    status: 'Ativo'
  },
  {
    id: 'GRP-02',
    nome: 'Operação Corretiva',
    descricao: 'Ações emergenciais solicitadas pela operação.',
    status: 'Ativo'
  },
  {
    id: 'GRP-03',
    nome: 'Segurança e Procedimentos',
    descricao: 'Atualizações de protocolos e treinamentos.',
    status: 'Inativo'
  }
]
