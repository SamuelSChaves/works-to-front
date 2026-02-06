export type ScreenPermissionConfig = {
  id: string
  label: string
  leitura: boolean
  criacao: boolean
  edicao: boolean
  exclusao: boolean
}

export const SCREEN_PERMISSIONS: ScreenPermissionConfig[] = [
  {
    id: 'inicio',
    label: 'Inicio',
    leitura: true,
    criacao: false,
    edicao: false,
    exclusao: false
  },
  {
    id: 'planejamento',
    label: 'Planejamento',
    leitura: true,
    criacao: true,
    edicao: false,
    exclusao: false
  },
  {
    id: 'ativos',
    label: 'Ativos',
    leitura: true,
    criacao: false,
    edicao: false,
    exclusao: false
  },
  {
    id: 'componentes',
    label: 'Componentes',
    leitura: true,
    criacao: false,
    edicao: false,
    exclusao: false
  },
  {
    id: 'notas',
    label: 'Notas',
    leitura: true,
    criacao: true,
    edicao: true,
    exclusao: false
  },
  {
    id: 'tarefas',
    label: 'Tarefas',
    leitura: true,
    criacao: true,
    edicao: true,
    exclusao: false
  },
  {
    id: 'produtividade',
    label: 'Produtividade',
    leitura: true,
    criacao: false,
    edicao: false,
    exclusao: false
  },
  {
    id: 'produtividade-dashboard',
    label: 'DashBoard',
    leitura: true,
    criacao: false,
    edicao: false,
    exclusao: false
  },
  {
    id: 'produtividade-apontamentos',
    label: 'Apontamentos',
    leitura: true,
    criacao: false,
    edicao: false,
    exclusao: false
  },
  {
    id: 'os',
    label: 'Painel de OS',
    leitura: true,
    criacao: true,
    edicao: false,
    exclusao: false
  },
  {
    id: 'os-scheduler',
    label: 'Scheduler',
    leitura: true,
    criacao: true,
    edicao: true,
    exclusao: false
  },
  {
    id: 'produtividade-rotograma',
    label: 'Rotograma',
    leitura: true,
    criacao: false,
    edicao: false,
    exclusao: false
  },
  {
    id: 'acoes',
    label: 'Ações TO',
    leitura: true,
    criacao: false,
    edicao: false,
    exclusao: false
  },
  {
    id: 'incidentes',
    label: 'Incidentes TO',
    leitura: true,
    criacao: true,
    edicao: true,
    exclusao: false
  },
  {
    id: 'gestao-material',
    label: 'Gestão Material',
    leitura: true,
    criacao: false,
    edicao: false,
    exclusao: false
  },
  {
    id: 'material-cadastro',
    label: 'Cadastro de Material',
    leitura: true,
    criacao: true,
    edicao: true,
    exclusao: false
  },
  {
    id: 'material-kanban',
    label: 'Kanban',
    leitura: true,
    criacao: false,
    edicao: false,
    exclusao: false
  },
  {
    id: 'material-estoque',
    label: 'Estoque',
    leitura: true,
    criacao: false,
    edicao: false,
    exclusao: false
  },
  {
    id: 'material-consumo',
    label: 'Consumo',
    leitura: true,
    criacao: false,
    edicao: false,
    exclusao: false
  },
  {
    id: 'configuracao',
    label: 'Configurações',
    leitura: true,
    criacao: false,
    edicao: false,
    exclusao: false
  },
  {
    id: 'bulk-upload',
    label: 'Carga de dados',
    leitura: true,
    criacao: true,
    edicao: false,
    exclusao: false
  }
]



