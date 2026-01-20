export const API_URL = 'http://localhost:8787'

const originalFetch = window.fetch.bind(window)

const patchedFetch: typeof window.fetch = async (input, init) => {
  const isURLInstance = input instanceof URL
  const requestUrl =
    typeof input === 'string'
      ? input
      : isURLInstance
        ? input.toString()
        : input.url
  const normalizedInit = init ? { ...init } : {}
  if (typeof requestUrl === 'string' && requestUrl.startsWith(API_URL)) {
    if (normalizedInit.credentials === undefined) {
      normalizedInit.credentials = 'include'
    }
  }
  return originalFetch(input, normalizedInit)
}

window.fetch = patchedFetch

export const PARAMETRO_TIPOS = [
  'Status_ativo',
  'Monitorado',
  'Sub',
  'Ciclo',
  'Tolerancia',
  'Classe',
  'Grupo',
  'ModeloPoste',
  'ModeloRele',
  'DDSmodelo',
  'CaixaModelo'
] as const

export type ParametroCadastroAtivoType = (typeof PARAMETRO_TIPOS)[number]

export interface ParametroCadastroAtivo {
  id_parametro: string
  id_company: string
  tipo_parametro: ParametroCadastroAtivoType
  valor: string
  ativo: boolean
  ordem?: number | null
  observacao?: string | null
  created_at: string
  updated_at?: string
}

export async function healthCheck(): Promise<Record<string, unknown>> {
  const res = await fetch(`${API_URL}/health`)
  return res.json()
}

export async function getParametros(options: {
  id_company: string
  tipo_parametro?: ParametroCadastroAtivoType
  ativo?: boolean
}): Promise<ParametroCadastroAtivo[]> {
  const url = new URL(`${API_URL}/parametros`)
  url.searchParams.set('id_company', options.id_company)
  if (options.tipo_parametro) {
    url.searchParams.set('tipo_parametro', options.tipo_parametro)
  }
  if (options.ativo !== undefined) {
    url.searchParams.set('ativo', options.ativo ? '1' : '0')
  }
  const response = await fetch(url.toString(), { credentials: 'include' })
  if (!response.ok) {
    const message = await response.text()
    throw new Error(message || 'Erro ao listar parametros')
  }
  const payload = (await response.json()) as {
    parametros?: Record<string, unknown>[]
  }
  if (!payload.parametros) return []
  return payload.parametros.map(normalizeParametroRow)
}

export async function createParametro(data: {
  id_company: string
  tipo_parametro: ParametroCadastroAtivoType
  valor: string
  ativo?: boolean
  ordem?: number | null
  observacao?: string | null
}): Promise<ParametroCadastroAtivo> {
  const response = await fetch(`${API_URL}/parametros`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      id_company: data.id_company,
      tipo_parametro: data.tipo_parametro,
      valor: data.valor,
      ativo: data.ativo,
      ordem: data.ordem,
      observacao: data.observacao
    })
  })

  if (!response.ok) {
    const message = await response.text()
    throw new Error(message || 'Erro ao criar parametro')
  }

  const payload = await response.json()
  return normalizeParametroRow(
    payload.parametro as Record<string, unknown>
  )
}

export async function updateParametro(
  id_parametro: string,
  data: {
    tipo_parametro?: ParametroCadastroAtivoType
    valor?: string
    ativo?: boolean
    ordem?: number | null
    observacao?: string | null
  }
): Promise<ParametroCadastroAtivo> {
  const response = await fetch(`${API_URL}/parametros`, {
    method: 'PATCH',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      id_parametro,
      valor: data.valor,
      ativo: data.ativo,
      ordem: data.ordem,
      observacao: data.observacao
    })
  })

  if (!response.ok) {
    const message = await response.text()
    throw new Error(message || 'Erro ao atualizar parametro')
  }

  const payload = await response.json()
  return normalizeParametroRow(
    payload.parametro as Record<string, unknown>
  )
}

function normalizeParametroRow(
  row: Record<string, unknown>
): ParametroCadastroAtivo {
  const rawTipo = String(row.tipo_parametro ?? '')
  const tipo =
    PARAMETRO_TIPOS.includes(rawTipo as ParametroCadastroAtivoType) &&
    rawTipo !== ''
      ? (rawTipo as ParametroCadastroAtivoType)
      : PARAMETRO_TIPOS[0]
  const ordemRaw = row.ordem
  const ordem =
    ordemRaw === null || ordemRaw === undefined ? null : Number(ordemRaw)
  const rawCompany =
    row.id_company ?? row.company_id ?? row.companyId ?? row.companyid ?? null
  return {
    id_parametro: String(row.id_parametro ?? ''),
    id_company: rawCompany ? String(rawCompany) : '',
    tipo_parametro: tipo,
    valor: String(row.valor ?? ''),
    ativo: Boolean(row.ativo),
    ordem,
    observacao:
      row.observacao === null || row.observacao === undefined
        ? null
        : String(row.observacao),
    created_at: String(row.created_at ?? ''),
    updated_at:
      row.updated_at === null || row.updated_at === undefined
        ? undefined
        : String(row.updated_at)
  }
}
