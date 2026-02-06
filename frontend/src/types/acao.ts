export type AcaoStatus = 'Aberta' | 'Em andamento' | 'Concluída'

export type AcaoRecord = {
  id_company: string
  id_acao: number
  id_acao_raw: string
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
  incidente_codigo?: string
}
