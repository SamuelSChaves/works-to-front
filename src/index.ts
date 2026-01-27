import bcrypt from 'bcryptjs'

export interface Env {
  DB: D1Database
  JWT_SECRET: string
  JWT_EXP_MINUTES?: string
  AUTH_MAX_ATTEMPTS?: string
  AUTH_LOCK_MINUTES?: string
  CORS_ORIGIN?: string
  PASSWORD_RESET_FRONTEND_URL?: string
  PASSWORD_RESET_TOKEN_EXP_MINUTES?: string
  PASSWORD_RESET_EMAIL_API_URL?: string
  PASSWORD_RESET_EMAIL_API_KEY?: string
  PASSWORD_RESET_EMAIL_FROM?: string
  PASSWORD_RESET_EMAIL_SUBJECT?: string
  SECURITY_CODE_EXP_MINUTES?: string
  SECURITY_CODE_EMAIL_SUBJECT?: string
  ATTACHMENTS: R2Bucket
}

type AuthPayload = {
  user_id: string
  company_id: string
  nome: string
  cargo: string | null
  equipe: string | null
  session_id: string
  exp: number
}

type PermissionAction = 'leitura' | 'criacao' | 'edicao' | 'exclusao'

type CompanyRow = {
  id: string
  nome: string
  status: string
}

type UserRow = {
  id: string
  company_id: string
  nome: string
  cs: string
  email: string
  escala?: string
  profile_id?: string | null
  profile_name?: string | null
  cargo: string | null
  coordenacao: string | null
  equipe: string | null
  equipe_aditiva?: string | null
  status: string
  created_at?: string
  updated_at?: string
  security_validated_at?: string | null
}

type UserWithCompanyRow = UserRow & {
  company_status: string | null
}

type UserAuthRow = {
  user_id: string
  password_hash: string
  last_login_at: string | null
  failed_attempts: number
  locked_until: string | null
}

type SecurityValidationRow = {
  id: string
  company_id: string
  user_id: string
  cs: string
  code_hash: string
  expires_at: string
  status: 'pending' | 'used' | 'revoked'
  attempts: number
  created_at: string
  used_at: string | null
}

type UserHistoryRow = {
  id: string
  company_id: string
  user_id: string
  changed_by_user_id: string | null
  changed_by_name: string | null
  changes: string
  created_at: string
}

type UserSessionRow = {
  id: string
  company_id: string
  user_id: string
  ip: string | null
  created_at: string
  revoked_at: string | null
}

type ProfileRow = {
  id: string
  company_id: string
  name: string
  status: string
  created_at: string
  updated_at: string
}

type ProfilePermissionRow = {
  profile_id: string
  screen_id: string
  leitura: number
  criacao: number
  edicao: number
  exclusao: number
}

type PermissionRow = {
  screen_id: string
  leitura: number
  criacao: number
  edicao: number
  exclusao: number
}

type PermissionCheckRow = {
  profile_status: string | null
  leitura: number | null
  criacao: number | null
  edicao: number | null
  exclusao: number | null
}

type AtivoRow = {
  id: string
  company_id: string
  ATIVO_EMPRESA: string
  ATIVO_CODPE: string
  ATIVO_DESCRITIVO_OS: string
  ATIVO_STATUS: string
  ATIVO_COORDENACAO: string
  ATIVO_EQUIPE: string
  ATIVO_MONITORADOS: string
  ATIVO_SIGLA: string
  ATIVO_CICLO: string
  ATIVO_CONTADOR: number
  CONTADOR_CICLO: string
  ATIVO_TOLERANCIA: string
  ATIVO_CLASSE: string
  ATIVO_GRUPO: string
  ATIVO_OEA: string
  ATIVO_TMM: string
  ATIVO_LATITUDE: string | null
  ATIVO_LONGITUDE: string | null
  ATIVO_ULTIMA_MANUT: string | null
  ATIVO_MODELO_POSTE: string | null
  ATIVO_MODELO_RELE: string | null
  ATIVO_MODELO_DDS: string | null
  ATIVO_DDS_SERIAL: string | null
  ATIVO_DDS_DTQ: string | null
  ATIVO_MYTRAIN: string | null
  ATIVO_JAMPER1: string | null
  ATIVO_JAMPER2: string | null
  ATIVO_MODELO: string | null
  ATIVO_OBSERVACAO: string | null
}

type PlanejamentoAssetRow = {
  id: string
  ATIVO_CODPE: string
  ATIVO_DESCRITIVO_OS: string
  ATIVO_SIGLA: string
  ATIVO_CICLO: string
  ATIVO_ULTIMA_MANUT: string | null
  proxima_manut: string | null
}

type AtivoHistoryRow = {
  id: string
  company_id: string
  ativo_id: string
  action: string
  before_data: string | null
  after_data: string
  changed_by_user_id: string | null
  changed_by_name: string | null
  created_at: string
}

type AtivoStatusLogRow = {
  id: string
  company_id: string
  ativo_id: string
  ativo_codpe: string
  ativo_descritivo: string
  equipe: string
  status: string
  observacao: string
  data_alteracao: string
  data_previsao_reparo: string | null
  changed_by_user_id: string | null
  changed_by_name: string | null
  created_at: string
}

type ComponenteRow = {
  IDCOMPONETE: number
  company_id: string
  IDATIVO: string
  COMP_NOME: string
  COMP_SERIAL: string | null
  COMP_DATA: string | null
  COMP_MODELO: string | null
  COMP_DESCRICAO: string | null
}

type ComponenteListRow = ComponenteRow & {
  ATIVO_CODPE: string | null
  ATIVO_DESCRITIVO_OS: string | null
  ATIVO_SIGLA: string | null
  ATIVO_COORDENACAO: string | null
  ATIVO_EQUIPE: string | null
}

type ComponenteMaintenanceRow = {
  id: number
  company_id: string
  hist_manut_id_componente: number
  hist_manut_data_hora: string
  hist_manut_id_os: string | null
  created_at: string
}

type ComponenteChangeRow = {
  id: number
  company_id: string
  IDCOMPONETE: number
  usuario_id: string
  data_hora: string
  campos_alterados: string
  created_at: string
}

type NotaStatus =
  | 'Criado'
  | 'Novo'
  | 'Programado'
  | 'Ag. Material'
  | 'Ag'
  | 'Plano'
  | 'Cancelado'

type NotaRow = {
  IDNOTA: number
  company_id: string
  id_ativo: string
  id_os: string | null
  nota_pendencia: string
  nota_status: NotaStatus
  nota_data_criada: string
  nota_data_programada: string | null
  nota_data_realizada: string | null
  nota_observacao_pcm: string | null
  nota_observacao_tecnico: string | null
}

type NotaListRow = NotaRow & {
  ATIVO_CODPE: string | null
  ATIVO_DESCRITIVO_OS: string | null
}

type NotaChangeRow = {
  id: number
  company_id: string
  IDNOTA: number
  usuario_id: string
  data_hora: string
  campos_alterados: string
  created_at: string
}

type AcaoStatus = 'Aberta' | 'Em andamento' | 'Concluída'

type AcaoRow = {
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

type AcaoRowRecord = {
  id_acao: string
  company_id: string
  id_usuario_solicitante: string | null
  id_usuario_responsavel: string | null
  data_criado: string | null
  data_vencimento: string | null
  status: string | null
  grupo_acao: string | null
  origem_acao: string | null
  equipe: string | null
  criticidade: string | null
  texto_acao: string | null
  texto_enerramento: string | null
  texto_devolutiva: string | null
}

function normalizeActionStatusValue(value?: string | null): AcaoStatus {
  const normalized = String(value ?? '').trim().toLowerCase()
  if (normalized.includes('conclu')) {
    return 'Concluída'
  }
  if (normalized.includes('andamento')) {
    return 'Em andamento'
  }
  return 'Aberta'
}

function mapActionRow(record: AcaoRowRecord): AcaoRow {
  const toText = (value?: string | null) => (value ? value : '')
  const toNumber = Number(String(record.id_acao).replace(/\D/g, ''))
  return {
    id_company: record.company_id,
    id_acao: Number.isNaN(toNumber) ? 0 : toNumber,
    id_usuario_solicitante: toText(record.id_usuario_solicitante),
    id_usuario_responsavel: toText(record.id_usuario_responsavel),
    data_criado: toText(record.data_criado),
    data_vencimento: toText(record.data_vencimento),
    status: normalizeActionStatusValue(record.status),
    grupo_acao: toText(record.grupo_acao),
    origem_acao: toText(record.origem_acao),
    equipe: toText(record.equipe),
    criticidade: toText(record.criticidade),
    texto_acao: toText(record.texto_acao),
    texto_enerramento: toText(record.texto_enerramento),
    texto_devolutiva: toText(record.texto_devolutiva)
  }
}

type ActionAttachmentRow = {
  id: string
  acao_id: string
  company_id: string
  filename: string
  r2_key: string
  content_type: string | null
  size: number | null
  created_at: string
  created_by: string | null
}

type ActionAttachment = {
  id: string
  acao_id: string
  filename: string
  content_type: string | null
  size: number | null
  created_at: string
  created_by: string | null
}

function normalizeActionAttachmentRow(
  row: ActionAttachmentRow
): ActionAttachment {
  return {
    id: row.id,
    acao_id: row.acao_id,
    filename: row.filename,
    content_type: row.content_type ?? null,
    size: row.size === null || row.size === undefined ? null : Number(row.size),
    created_at: row.created_at,
    created_by: row.created_by
  }
}

type TarefaRow = {
  id: string
  company_id: string
  id_sigla: string
  sigla: string
  tarefa: string
  medicao: 0 | 1
  criticidade: 0 | 1
  periodicidade: number
  sub_sistema: string | null
  sistema: string | null
  codigo: string
  active: 0 | 1
  created_at: string
  updated_at: string
  created_by: string | null
  updated_by: string | null
}

const NOTA_STATUSES: NotaStatus[] = [
  'Criado',
  'Novo',
  'Programado',
  'Ag. Material',
  'Ag',
  'Plano',
  'Cancelado'
]

type BulkSchema = {
  name: string
  table: string
  columns: string[]
  description: string
}

const BULK_UPLOAD_SCHEMAS: Record<string, BulkSchema> = {
  ativos: {
    name: 'ativos',
    table: 'tb_ativo',
    columns: [
      'company_id',
      'ATIVO_CODPE',
      'ATIVO_DESCRITIVO_OS',
      'ATIVO_STATUS',
      'ATIVO_COORDENACAO',
      'ATIVO_EQUIPE',
      'ATIVO_CICLO',
      'ATIVO_ULTIMA_MANUT'
    ],
    description: 'Cadastro de ativos com atributos básicos'
  },
  componentes: {
    name: 'componentes',
    table: 'tb_componente',
    columns: ['company_id', 'IDATIVO', 'COMP_NOME', 'COMP_MODELO', 'COMP_DATA'],
    description: 'Componentes ligados aos ativos'
  },
  notas: {
    name: 'notas',
    table: 'tb_nota',
    columns: ['company_id', 'nota_pendencia', 'nota_status', 'nota_data_programada'],
    description: 'Notas de pendência'
  },
  ordens_servico: {
    name: 'ordens_servico',
    table: 'tb_order_service',
    columns: ['company_id', 'os_numero', 'os_status', 'os_pdm', 'os_tipo'],
    description: 'Ordens de serviço básicas'
  }
}

function normalizeNotaStatus(value: unknown): NotaStatus | null {
  const normalized = String(value ?? '').trim()
  if (NOTA_STATUSES.includes(normalized as NotaStatus)) {
    return normalized as NotaStatus
  }
  return null
}

type OrderServiceRow = {
  id: string
  company_id: string
  os_numero: number
  estrutura_id: string
  ativo_id: string
  os_tipo: string
  os_pdm: number
  os_status: string
  os_checklist: number
  os_capex: number
  os_realizado_em: string | null
  os_programado1: string | null
  os_programado2: string | null
  os_programado3: string | null
  os_programado4: string | null
  os_programado5: string | null
  os_obs_pcm: string | null
  os_obs_tecnico: string | null
  os_ano: number
  os_mes: number
  created_at?: string
  created_by?: string
  updated_at?: string | null
  updated_by?: string | null
}

type OrderServiceListRow = {
  id: string
  os_numero: number
  os_status: string
  os_pdm: number
  os_tipo: string
  os_checklist: number
  os_capex: number
  os_programado1: string | null
  os_programado2: string | null
  os_programado3: string | null
  os_programado4: string | null
  os_programado5: string | null
  os_realizado_em: string | null
  os_obs_pcm: string | null
  ATIVO_CODPE: string
  ATIVO_DESCRITIVO_OS: string
  ATIVO_EQUIPE: string
}

type OrderServiceHistoryRow = {
  id: string
  company_id: string
  order_service_id: string
  action: string
  before_data: string | null
  after_data: string
  changed_by_user_id: string | null
  changed_by_name: string | null
  created_at: string
}

type SchedulerConfigRow = {
  id: string
  company_id: string
  coordenacao: string
  equipe: string
  mes: string
  data_json: string
  created_at?: string
  updated_at?: string
}

type SchedulerTeamConfigRow = {
  id: string
  company_id: string
  coordenacao: string
  equipe: string
  escala: string
  observacao: string | null
  created_at?: string
  updated_at?: string
}

type SchedulerSubTeamConfigRow = {
  id: string
  company_id: string
  coordenacao: string
  equipe_id: string
  sub_equipe: string
  escala: string
  status: string
  observacao: string | null
  created_at?: string
  updated_at?: string
}

type SchedulerAssignmentRow = {
  id: string
  company_id: string
  os_id: string
  coordenacao: string
  equipe_id: string
  sub_equipe: string
  created_at?: string
  updated_at?: string
}

type SchedulerHolidayRow = {
  id: string
  company_id: string
  equipe_id: string
  feriado: string
  data: string
  created_at?: string
  updated_at?: string
}

type ProfileHistoryRow = {
  id: string
  company_id: string
  profile_id: string
  changed_by_user_id: string | null
  changed_by_name: string | null
  changes: string
  created_at: string
}

type EstruturaRow = {
  id: string
  company_id: string
  coordenacao: string
  equipe: string
  cc: string
  execucao: string
  status: string
  created_at: string
}

type EstruturaHistoryRow = {
  id: string
  company_id: string
  estrutura_id: string
  action: string
  before_data: string | null
  after_data: string
  changed_by_user_id: string | null
  changed_by_name: string | null
  created_at: string
}

type ParametroCadastroAtivoType =
  | 'Status_ativo'
  | 'Monitorado'
  | 'Sub'
  | 'Ciclo'
  | 'Tolerancia'
  | 'Classe'
  | 'Grupo'
  | 'ModeloPoste'
  | 'ModeloRele'
  | 'DDSmodelo'
  | 'CaixaModelo'

const PARAMETRO_TIPOS: ParametroCadastroAtivoType[] = [
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
]

let parametrosTableEnsured = false

async function ensureParametrosTable(env: Env): Promise<void> {
  if (parametrosTableEnsured) return
  await env.DB.prepare(
    `CREATE TABLE IF NOT EXISTS tb_parametro (
       id_parametro TEXT PRIMARY KEY,
       company_id TEXT NOT NULL,
       tipo_parametro TEXT NOT NULL,
       valor TEXT NOT NULL,
       ativo INTEGER NOT NULL DEFAULT 1,
       ordem INTEGER,
       observacao TEXT,
       created_at TEXT NOT NULL,
       updated_at TEXT NOT NULL
     )`
  ).run()
  await env.DB.prepare(
    `CREATE INDEX IF NOT EXISTS idx_parametro_company
     ON tb_parametro (company_id, tipo_parametro)`
  ).run()
  parametrosTableEnsured = true
}

type ParametroCadastroAtivoRow = {
  id_parametro: string
  company_id: string
  tipo_parametro: ParametroCadastroAtivoType
  valor: string
  ativo: 0 | 1
  ordem: number | null
  observacao: string | null
  created_at: string
  updated_at: string
}

const DEFAULT_JWT_EXP_MINUTES = 30
const DEFAULT_MAX_ATTEMPTS = 5
const DEFAULT_LOCK_MINUTES = 15
const SESSION_COOKIE_NAME = 'tecrail_session'
const SESSION_REFRESH_THRESHOLD_MINUTES = 5
const PASSWORD_RESET_PAGE_PATH = '/recuperar-senha'
const PASSWORD_RESET_ID_QUERY = 'token_id'
const PASSWORD_RESET_TOKEN_QUERY = 'token'
const DEFAULT_PASSWORD_RESET_EXP_MINUTES = 30
const DEFAULT_PASSWORD_RESET_EMAIL_SUBJECT = 'TO Works · Redefinição de senha'
const DEFAULT_SECURITY_CODE_EXP_MINUTES = 15
const DEFAULT_SECURITY_VALIDATION_INTERVAL_DAYS = 30
const DEFAULT_SECURITY_CODE_EMAIL_SUBJECT = 'TO Works · Código de segurança'

type PendingSessionRefresh = {
  token: string
  maxAgeSeconds: number
}

const pendingSessionRefresh = new WeakMap<Request, PendingSessionRefresh>()

function scheduleSessionRefresh(
  request: Request,
  token: string,
  maxAgeSeconds: number
): void {
  pendingSessionRefresh.set(request, { token, maxAgeSeconds })
}

// Local execution: `wrangler dev` uses the local D1 database (mirror of remote).
// Remote execution: `wrangler deploy` uses the remote D1 database.
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
  const respond = (response: Response, _env?: Env) => {
    const refreshMeta = pendingSessionRefresh.get(request)
    if (refreshMeta) {
      response.headers.append(
        'Set-Cookie',
        buildSessionCookie(refreshMeta.token, request, refreshMeta.maxAgeSeconds)
      )
      pendingSessionRefresh.delete(request)
    }
    return withCors(response, env, request)
  }
    try {
      if (request.method === 'OPTIONS') {
        return respond(new Response(null, { status: 204 }))
      }

      const url = new URL(request.url)
      const routeKey = `${request.method.toUpperCase()} ${url.pathname}`

      switch (routeKey) {
        case 'GET /':
          return respond(
            Response.json({
              status: 'ok',
              routes: [
                '/health',
                '/db/health',
                '/auth/login',
                '/auth/me',
                '/auth/permissions',
                '/admin/users',
                '/admin/profiles',
                '/admin/profiles/history',
                '/estrutura',
                '/estrutura/history',
                '/ativos',
                '/ativos/detail',
                '/ativos/history',
                '/componentes',
                '/componentes/detail',
                '/componentes/historico/manutencao',
                '/componentes/historico/alteracao',
                '/notas',
                '/notas/detail',
                '/notas/historico/alteracao',
                '/acoes',
                '/os',
                '/os/detail',
                '/os/history',
                '/os/scheduler-config',
                '/os/scheduler-team-config',
                '/os/scheduler-sub-team',
                '/os/scheduler-assignment',
                '/os/scheduler-holiday'
              ]
          }),
          env
        )
        case 'GET /health':
          return respond(
            Response.json({ status: 'ok', service: 'tecrail-worker' }),
            env
          )
        case 'GET /db/health':
          return respond(await handleDbHealth(env), env)
        case 'POST /auth/login':
          return respond(await handleLogin(request, env), env)
        case 'GET /auth/me':
          return respond(await handleAuthMe(request, env), env)
        case 'GET /auth/permissions':
          return respond(await handleAuthPermissions(request, env), env)
        case 'POST /auth/logout':
          return respond(await handleLogout(request, env), env)
        case 'POST /auth/password-reset':
          return respond(await handlePasswordResetRequest(request, env), env)
        case 'POST /auth/password-reset/confirm':
          return respond(await handlePasswordResetConfirm(request, env), env)
        case 'POST /auth/security-code/confirm':
          return respond(await handleSecurityCodeConfirm(request, env), env)
        case 'POST /auth/security-code/resend':
          return respond(await handleSecurityCodeResend(request, env), env)
        case 'POST /admin/users':
          return respond(await handleCreateUser(request, env), env)
        case 'GET /admin/users':
          return respond(await handleListUsers(request, env), env)
        case 'PATCH /admin/users':
          return respond(await handleUpdateUser(request, env), env)
        case 'GET /admin/users/history':
          return respond(await handleUserHistory(request, env), env)
        case 'GET /admin/profiles':
          return respond(await handleListProfiles(request, env), env)
        case 'POST /admin/profiles':
          return respond(await handleCreateProfile(request, env), env)
        case 'PATCH /admin/profiles':
          return respond(await handleUpdateProfile(request, env), env)
        case 'GET /admin/profiles/history':
          return respond(await handleProfileHistory(request, env), env)
        case 'GET /estrutura':
          return respond(await handleListEstrutura(request, env), env)
        case 'POST /estrutura':
          return respond(await handleCreateEstrutura(request, env), env)
        case 'PATCH /estrutura':
          return respond(await handleUpdateEstrutura(request, env), env)
        case 'GET /estrutura/history':
          return respond(await handleEstruturaHistory(request, env), env)
        case 'GET /parametros':
          return respond(await handleListParametros(request, env), env)
        case 'POST /parametros':
          return respond(await handleCreateParametro(request, env), env)
        case 'PATCH /parametros':
          return respond(await handleUpdateParametro(request, env), env)
        case 'GET /ativos':
          return respond(await handleListAtivos(request, env), env)
        case 'GET /ativos/detail':
          return respond(await handleGetAtivo(request, env), env)
        case 'POST /ativos':
          return respond(await handleCreateAtivo(request, env), env)
        case 'PATCH /ativos':
          return respond(await handleUpdateAtivo(request, env), env)
        case 'GET /ativos/status-history':
          return respond(await handleAtivoStatusHistory(request, env), env)
        case 'GET /ativos/history':
          return respond(await handleAtivoHistory(request, env), env)
        case 'GET /componentes':
          return respond(await handleListComponentes(request, env), env)
        case 'GET /componentes/detail':
          return respond(await handleGetComponenteDetail(request, env), env)
        case 'GET /componentes/historico/manutencao':
          return respond(
            await handleComponentesMaintenanceHistory(request, env),
            env
          )
        case 'GET /componentes/historico/alteracao':
          return respond(
            await handleComponentesChangeHistory(request, env),
            env
          )
        case 'POST /componentes':
          return respond(await handleCreateComponente(request, env), env)
        case 'PATCH /componentes':
          return respond(await handleUpdateComponente(request, env), env)
        case 'GET /notas':
          return respond(await handleListNotas(request, env), env)
        case 'GET /notas/detail':
          return respond(await handleGetNotaDetail(request, env), env)
        case 'GET /notas/historico/alteracao':
          return respond(await handleNotaChangeHistory(request, env), env)
        case 'POST /notas':
          return respond(await handleCreateNotas(request, env), env)
        case 'PATCH /notas':
          return respond(await handleUpdateNota(request, env), env)
        case 'GET /tarefas':
          return respond(await handleListTarefas(request, env), env)
        case 'GET /planejamento/filters':
          return respond(await handlePlanejamentoFilters(request, env), env)
        case 'GET /planejamento/technicians':
          return respond(await handlePlanejamentoTechnicians(request, env), env)
        case 'GET /planejamento/ativos':
          return respond(await handlePlanejamentoAssets(request, env), env)
        case 'GET /acoes':
          return respond(await handleListActions(request, env), env)
        case 'GET /acoes/anexos':
          return respond(await handleListActionAttachments(request, env), env)
        case 'POST /acoes/anexos':
          return respond(await handleUploadActionAttachment(request, env), env)
        case 'GET /acoes/anexos/download':
          return respond(await handleDownloadActionAttachment(request, env), env)
        case 'POST /tarefas':
          return respond(await handleCreateTarefa(request, env), env)
        case 'PATCH /tarefas':
          return respond(await handleUpdateTarefa(request, env), env)
        case 'GET /bulk-upload/tables':
          return respond(await handleBulkUploadTables(request, env), env)
        case 'POST /bulk-upload':
          return respond(await handleBulkUpload(request, env), env)
        case 'GET /os':
          return respond(await handleListOrderService(request, env), env)
        case 'GET /os/detail':
          return respond(await handleGetOrderService(request, env), env)
        case 'POST /os':
          return respond(await handleCreateOrderService(request, env), env)
        case 'PATCH /os':
          return respond(await handleUpdateOrderService(request, env), env)
        case 'GET /os/history':
          return respond(await handleOrderServiceHistory(request, env), env)
        case 'PATCH /os/bulk':
          return respond(await handleBulkUpdateOrderService(request, env), env)
        case 'GET /os/scheduler-config':
          return respond(await handleGetSchedulerConfig(request, env), env)
        case 'PATCH /os/scheduler-config':
          return respond(await handleUpsertSchedulerConfig(request, env), env)
        case 'GET /os/scheduler-team-config':
          return respond(await handleGetSchedulerTeamConfig(request, env), env)
        case 'PATCH /os/scheduler-team-config':
          return respond(await handleUpsertSchedulerTeamConfig(request, env), env)
        case 'GET /os/scheduler-sub-team':
          return respond(await handleGetSchedulerSubTeamConfig(request, env), env)
        case 'PATCH /os/scheduler-sub-team':
          return respond(await handleUpsertSchedulerSubTeamConfig(request, env), env)
        case 'DELETE /os/scheduler-sub-team':
          return respond(await handleDeleteSchedulerSubTeamConfig(request, env), env)
        case 'GET /os/scheduler-assignment':
          return respond(await handleGetSchedulerAssignments(request, env), env)
        case 'PATCH /os/scheduler-assignment':
          return respond(await handleUpsertSchedulerAssignment(request, env), env)
        case 'DELETE /os/scheduler-assignment':
          return respond(await handleDeleteSchedulerAssignment(request, env), env)
        case 'GET /os/scheduler-holiday':
          return respond(await handleGetSchedulerHolidays(request, env), env)
        case 'PATCH /os/scheduler-holiday':
          return respond(await handleUpsertSchedulerHoliday(request, env), env)
        default:
          if (routeKey.startsWith('DELETE /componentes/')) {
            return respond(await handleDeleteComponente(request, env), env)
          }
          return respond(new Response('Not Found', { status: 404 }), env)
      }
    } catch (error) {
      console.error('Unhandled worker error', error)
      return respond(
        Response.json({ error: 'Erro interno.' }, { status: 500 }),
        env
      )
    }
  }
}

async function handleDbHealth(env: Env): Promise<Response> {
  // Minimal query to validate the D1 binding without relying on real data.
  const result = await env.DB.prepare('SELECT 1 AS ok').first<{ ok: number }>()
  return Response.json({ ok: result?.ok === 1 })
}

async function handleLogin(request: Request, env: Env): Promise<Response> {
  assertJwtSecret(env)

  const payload = await readJson(request)
  const clientIp = getClientIp(request)
  if (!payload) {
    await logLoginAttempt(env, {
      success: 0,
      reason: 'invalid_payload',
      ip: clientIp,
      userAgent: request.headers.get('user-agent')
    })
    return Response.json({ error: 'Dados invalidos.' }, { status: 400 })
  }

  const cs = String(payload.cs || '').trim()
  const senha = String(payload.senha || '')

  if (!cs || !senha) {
    await logLoginAttempt(env, {
      success: 0,
      reason: 'missing_fields',
      ip: clientIp,
      userAgent: request.headers.get('user-agent')
    })
    return Response.json({ error: 'Empresa, CS e senha sao obrigatorios.' }, { status: 400 })
  }

  const user = await env.DB
    .prepare(
      `SELECT u.*, c.status AS company_status, p.name AS profile_name
       FROM tb_user u
       LEFT JOIN tb_company c ON c.id = u.company_id
       LEFT JOIN tb_profile p ON p.id = u.profile_id
       WHERE u.cs = ?`
    )
    .bind(cs)
    .first<UserWithCompanyRow>()

  if (!user) {
    await logLoginAttempt(env, {
      success: 0,
      reason: 'user_not_found',
      companyId: null,
      userId: null,
      cs,
      ip: clientIp,
      userAgent: request.headers.get('user-agent')
    })
    return Response.json({ error: 'Credenciais invalidas.' }, { status: 401 })
  }

  const companyId = user.company_id

  if (user.company_status !== 'ativo') {
    await logLoginAttempt(env, {
      success: 0,
      reason: 'company_inactive',
      companyId: user.company_id,
      userId: user.id,
      cs,
      ip: clientIp,
      userAgent: request.headers.get('user-agent')
    })
    return Response.json({ error: 'Credenciais invalidas.' }, { status: 401 })
  }

  if (user.status !== 'ativo') {
    await logLoginAttempt(env, {
      success: 0,
      reason: 'user_inactive',
      companyId: user.company_id,
      userId: user.id,
      cs,
      email: user.email,
      ip: clientIp,
      userAgent: request.headers.get('user-agent')
    })
    return Response.json({ error: 'Credenciais invalidas.' }, { status: 401 })
  }

  const auth = await env.DB
    .prepare(
      'SELECT user_id, password_hash, last_login_at, failed_attempts, locked_until FROM tb_user_auth WHERE user_id = ?'
    )
    .bind(user.id)
    .first<UserAuthRow>()

  if (!auth) {
    await logLoginAttempt(env, {
      success: 0,
      reason: 'auth_missing',
      companyId,
      userId: user.id,
      cs,
      email: user.email,
      ip: clientIp,
      userAgent: request.headers.get('user-agent')
    })
    return Response.json({ error: 'Credenciais invalidas.' }, { status: 401 })
  }

  const now = new Date()
  const lockedUntil = auth.locked_until ? new Date(auth.locked_until) : null
  if (lockedUntil && lockedUntil.getTime() > now.getTime()) {
    await logLoginAttempt(env, {
      success: 0,
      reason: 'account_locked',
      companyId,
      userId: user.id,
      cs,
      email: user.email,
      ip: clientIp,
      userAgent: request.headers.get('user-agent')
    })
    return Response.json({ error: 'Conta bloqueada temporariamente.' }, { status: 423 })
  }

  const passwordOk = await bcrypt.compare(senha, auth.password_hash)
  if (!passwordOk) {
    const maxAttempts = parseInt(env.AUTH_MAX_ATTEMPTS || '', 10) || DEFAULT_MAX_ATTEMPTS
    const lockMinutes = parseInt(env.AUTH_LOCK_MINUTES || '', 10) || DEFAULT_LOCK_MINUTES
    const failedAttempts = (auth.failed_attempts || 0) + 1
    const shouldLock = failedAttempts >= maxAttempts
    const newLockedUntil = shouldLock
      ? new Date(now.getTime() + lockMinutes * 60 * 1000).toISOString()
      : null

    await env.DB
      .prepare('UPDATE tb_user_auth SET failed_attempts = ?, locked_until = ? WHERE user_id = ?')
      .bind(failedAttempts, newLockedUntil, user.id)
      .run()

    await logLoginAttempt(env, {
      success: 0,
      reason: shouldLock ? 'account_locked' : 'invalid_password',
      companyId,
      userId: user.id,
      cs,
      email: user.email,
      ip: clientIp,
      userAgent: request.headers.get('user-agent')
    })

    return Response.json({ error: 'Credenciais invalidas.' }, { status: 401 })
  }

  await env.DB
    .prepare('UPDATE tb_user_auth SET failed_attempts = 0, locked_until = NULL WHERE user_id = ?')
    .bind(user.id)
    .run()

  if (shouldRequireSecurityValidation(user.security_validated_at)) {
    await logLoginAttempt(env, {
      success: 0,
      reason: 'security_validation_required',
      companyId,
      userId: user.id,
      cs,
      email: user.email,
      ip: clientIp,
      userAgent: request.headers.get('user-agent')
    })
    try {
      const challenge = await createSecurityValidationChallenge(env, user)
      return Response.json(
        {
          error: 'security_validation_required',
          security_validation: challenge
        },
        { status: 428 }
      )
    } catch (error) {
      console.error('Erro ao criar desafio de segurança:', error)
      return Response.json(
        { error: 'Não foi possível enviar o código de segurança.' },
        { status: 500 }
      )
    }
  }

  return finalizeLogin(request, env, user, clientIp, cs)
}

async function finalizeLogin(
  request: Request,
  env: Env,
  user: UserRow,
  clientIp: string | null,
  cs: string
): Promise<Response> {
  const now = new Date()
  const nowIso = now.toISOString()
  await env.DB
    .prepare(
      'UPDATE tb_user_auth SET failed_attempts = 0, locked_until = NULL, last_login_at = ? WHERE user_id = ?'
    )
    .bind(nowIso, user.id)
    .run()

  await revokeActiveSessionsForUser(env, user.id, user.company_id)
  const sessionId = await createUserSession(env, user.company_id, user.id, clientIp)

  await logLoginAttempt(env, {
    success: 1,
    reason: 'login_success',
    companyId: user.company_id,
    userId: user.id,
    cs,
    email: user.email,
    ip: clientIp,
    userAgent: request.headers.get('user-agent')
  })

  const expMinutes = parseInt(env.JWT_EXP_MINUTES || '', 10) || DEFAULT_JWT_EXP_MINUTES
  const token = await signJwt(
    {
      user_id: user.id,
      company_id: user.company_id,
      nome: user.nome,
      cargo: user.cargo,
      equipe: user.equipe,
      session_id: sessionId
    },
    env.JWT_SECRET,
    expMinutes
  )

  const cookie = buildSessionCookie(token, request, expMinutes * 60)
  const response = Response.json({
    token,
    user: {
      id: user.id,
      company_id: user.company_id,
      nome: user.nome,
      email: user.email,
      cargo: user.cargo,
      equipe: user.equipe,
      profile_id: user.profile_id,
      profile_name: user.profile_name
    }
  })
  response.headers.set('Set-Cookie', cookie)
  return response
}

async function handleSecurityCodeConfirm(
  request: Request,
  env: Env
): Promise<Response> {
  const payload = await readJson(request)
  const challengeId = String(payload?.challenge_id || '').trim()
  const code = String(payload?.code || '').trim()
  const clientIp = getClientIp(request)

  if (!challengeId || !code) {
    return Response.json({ error: 'Dados invalidos.' }, { status: 400 })
  }

  const challenge = await getSecurityValidationChallenge(env, challengeId)
  if (!challenge || challenge.status !== 'pending') {
    return Response.json({ error: 'Código inválido ou expirado.' }, { status: 400 })
  }

  const expiresAt = new Date(challenge.expires_at)
  if (expiresAt.getTime() <= Date.now()) {
    return Response.json({ error: 'Código inválido ou expirado.' }, { status: 400 })
  }

  const expectedHash = await hashResetToken(code)
  if (expectedHash !== challenge.code_hash) {
    await env.DB
      .prepare('UPDATE tb_security_validation SET attempts = attempts + 1 WHERE id = ?')
      .bind(challengeId)
      .run()
    return Response.json({ error: 'Código inválido.' }, { status: 400 })
  }

  const nowIso = new Date().toISOString()
  await env.DB
    .prepare('UPDATE tb_security_validation SET status = ?, used_at = ? WHERE id = ?')
    .bind('used', nowIso, challengeId)
    .run()

  await env.DB
    .prepare(
      'UPDATE tb_user SET security_validated_at = ?, updated_at = ? WHERE id = ? AND company_id = ?'
    )
    .bind(nowIso, nowIso, challenge.user_id, challenge.company_id)
    .run()

  const user = await env.DB
    .prepare(
      `SELECT u.*, c.status AS company_status, p.name AS profile_name
       FROM tb_user u
       LEFT JOIN tb_company c ON c.id = u.company_id
       LEFT JOIN tb_profile p ON p.id = u.profile_id
       WHERE u.id = ? AND u.company_id = ?`
    )
    .bind(challenge.user_id, challenge.company_id)
    .first<UserWithCompanyRow>()

  if (!user || user.company_status !== 'ativo' || user.status !== 'ativo') {
    return Response.json({ error: 'Código inválido.' }, { status: 400 })
  }

  return finalizeLogin(request, env, user, clientIp, challenge.cs)
}

async function handleSecurityCodeResend(
  request: Request,
  env: Env
): Promise<Response> {
  const payload = await readJson(request)
  const challengeId = String(payload?.challenge_id || '').trim()

  if (!challengeId) {
    return Response.json({ ok: true })
  }

  const existing = await getSecurityValidationChallenge(env, challengeId)
  if (!existing || existing.status !== 'pending') {
    return Response.json({ ok: true })
  }

  const user = await env.DB
    .prepare(
      `SELECT u.*, c.status AS company_status, p.name AS profile_name
       FROM tb_user u
       LEFT JOIN tb_company c ON c.id = u.company_id
       LEFT JOIN tb_profile p ON p.id = u.profile_id
       WHERE u.id = ? AND u.company_id = ?`
    )
    .bind(existing.user_id, existing.company_id)
    .first<UserWithCompanyRow>()

  if (!user || user.company_status !== 'ativo' || user.status !== 'ativo') {
    return Response.json({ ok: true })
  }

  try {
    const challenge = await createSecurityValidationChallenge(env, user)
    return Response.json({ security_validation: challenge })
  } catch (error) {
    console.error('Erro ao reenviar código de segurança:', error)
    return Response.json(
      { error: 'Não foi possível reenviar o código.' },
      { status: 500 }
    )
  }
}

async function handleAuthMe(request: Request, env: Env): Promise<Response> {
  assertJwtSecret(env)
  const auth = await requireAuth(request, env)
  if (!auth) {
    return Response.json({ error: 'Token invalido.' }, { status: 401 })
  }

  // Company isolation: always filter by company_id.
  const user = await env.DB
    .prepare(
      `SELECT u.id, u.company_id, u.nome, u.email, u.cargo, u.equipe, u.profile_id,
              p.name AS profile_name
       FROM tb_user u
       LEFT JOIN tb_profile p ON p.id = u.profile_id
       WHERE u.id = ? AND u.company_id = ?`
    )
    .bind(auth.user_id, auth.company_id)
    .first<UserRow>()

  if (!user || user.status !== 'ativo') {
    return Response.json({ error: 'Usuario inativo.' }, { status: 401 })
  }

  return Response.json({
    user: {
      id: user.id,
      company_id: user.company_id,
      nome: user.nome,
      email: user.email,
      cargo: user.cargo,
      equipe: user.equipe,
      profile_id: user.profile_id,
      profile_name: user.profile_name
    }
  })
}

async function handleAuthPermissions(request: Request, env: Env): Promise<Response> {
  assertJwtSecret(env)
  const auth = await requireAuth(request, env)
  if (!auth) {
    return Response.json({ error: 'Token invalido.' }, { status: 401 })
  }

  const result = await env.DB.prepare(
    `SELECT perm.screen_id, perm.leitura, perm.criacao, perm.edicao, perm.exclusao
     FROM tb_user u
     LEFT JOIN tb_profile p ON p.id = u.profile_id
     LEFT JOIN tb_profile_permission perm ON perm.profile_id = u.profile_id
     WHERE u.id = ? AND u.company_id = ? AND p.status = 'ativo'`
  )
    .bind(auth.user_id, auth.company_id)
    .all<PermissionRow>()

  const permissions: Record<
    string,
    { leitura: boolean; criacao: boolean; edicao: boolean; exclusao: boolean }
  > = {}

  for (const row of result.results) {
    if (!row.screen_id) continue
    permissions[row.screen_id] = {
      leitura: row.leitura === 1,
      criacao: row.criacao === 1,
      edicao: row.edicao === 1,
      exclusao: row.exclusao === 1
    }
  }

  return Response.json({ permissions })
}

async function handleLogout(request: Request, env: Env): Promise<Response> {
  assertJwtSecret(env)
  const auth = await requireAuth(request, env)
  if (auth) {
    await revokeSession(env, auth.session_id, auth.company_id, auth.user_id)
  }

  const cookie = buildSessionCookie('', request, 0)
  const response = Response.json({ ok: true })
  response.headers.set('Set-Cookie', cookie)
  return response
}

async function handlePasswordResetRequest(
  request: Request,
  env: Env
): Promise<Response> {
  const payload = await readJson(request)
  const cs = String(payload?.cs || '').trim()
  if (!isValidCs(cs)) {
    return Response.json(
      { error: 'Informe um CS válido com 6 dígitos.' },
      { status: 400 }
    )
  }

  const user = await env.DB
    .prepare(
      `SELECT u.*, c.status AS company_status
       FROM tb_user u
       LEFT JOIN tb_company c ON c.id = u.company_id
       WHERE u.cs = ?`
    )
    .bind(cs)
    .first<UserWithCompanyRow>()

  if (
    !user ||
    user.company_status !== 'ativo' ||
    user.status !== 'ativo' ||
    !user.email
  ) {
    return Response.json({ ok: true })
  }

  const expiresMinutes = getPasswordResetExpirationMinutes(env)
  const expiresAt = new Date(
    Date.now() + expiresMinutes * 60 * 1000
  ).toISOString()
  const tokenId = crypto.randomUUID()
  const token = crypto.randomUUID()
  const tokenHash = await hashResetToken(token)
  await env.DB
    .prepare(
      'INSERT INTO tb_password_reset (id, company_id, user_id, token_hash, expires_at) VALUES (?, ?, ?, ?, ?)'
    )
    .bind(tokenId, user.company_id, user.id, tokenHash, expiresAt)
    .run()

  const resetLink = buildPasswordResetLink(env, tokenId, token)
  try {
    await sendPasswordResetEmail(env, user, resetLink)
  } catch (error) {
    console.error('Erro ao enviar email de recuperação:', error)
    await env.DB
      .prepare('DELETE FROM tb_password_reset WHERE id = ?')
      .bind(tokenId)
      .run()
    return Response.json(
      { error: 'Não foi possível enviar o email de recuperação.' },
      { status: 500 }
    )
  }

  return Response.json({ ok: true })
}

async function handlePasswordResetConfirm(
  request: Request,
  env: Env
): Promise<Response> {
  const payload = await readJson(request)
  const tokenId = String(payload?.token_id || '').trim()
  const token = String(payload?.token || '').trim()
  const senha = String(payload?.senha || '')

  if (!tokenId || !token || !senha) {
    return Response.json({ error: 'Dados inválidos.' }, { status: 400 })
  }

  if (!isPasswordValid(senha)) {
    return Response.json(
      {
        error:
          'Senha inválida. Utilize ao menos 7 caracteres, com letras, números e símbolos (!@#$%&).'
      },
      { status: 400 }
    )
  }

  const row = await env.DB
    .prepare(
      `SELECT user_id, company_id, token_hash, expires_at, used_at
       FROM tb_password_reset
       WHERE id = ?`
    )
    .bind(tokenId)
    .first<{
      user_id: string
      company_id: string
      token_hash: string
      expires_at: string
      used_at: string | null
    }>()

  if (!row || row.used_at) {
    return Response.json({ error: 'Link expirado ou inválido.' }, { status: 400 })
  }

  const expiresAt = new Date(row.expires_at)
  if (expiresAt.getTime() <= Date.now()) {
    return Response.json({ error: 'Link expirado ou inválido.' }, { status: 400 })
  }

  const expectedHash = await hashResetToken(token)
  if (expectedHash !== row.token_hash) {
    return Response.json({ error: 'Link expirado ou inválido.' }, { status: 400 })
  }

  const user = await env.DB
    .prepare('SELECT status FROM tb_user WHERE id = ? AND company_id = ?')
    .bind(row.user_id, row.company_id)
    .first<{ status: string }>()

  if (!user || user.status !== 'ativo') {
    return Response.json({ error: 'Link expirado ou inválido.' }, { status: 400 })
  }

  const passwordHash = await bcrypt.hash(senha, 10)
  await env.DB
    .prepare(
      'UPDATE tb_user_auth SET password_hash = ?, failed_attempts = 0, locked_until = NULL WHERE user_id = ?'
    )
    .bind(passwordHash, row.user_id)
    .run()

  await env.DB
    .prepare('UPDATE tb_password_reset SET used_at = ? WHERE id = ?')
    .bind(new Date().toISOString(), tokenId)
    .run()

  await revokeActiveSessionsForUser(env, row.user_id, row.company_id)

  return Response.json({ ok: true })
}

async function handleCreateUser(request: Request, env: Env): Promise<Response> {
  assertJwtSecret(env)
  const auth = await requireAuth(request, env)
  if (!auth) {
    return Response.json({ error: 'Token invalido.' }, { status: 401 })
  }
  const permissionError = await requirePermission(
    env,
    auth,
    'configuracao',
    'criacao'
  )
  if (permissionError) return permissionError

  const payload = await readJson(request)
  if (!payload) {
    return Response.json({ error: 'Dados invalidos.' }, { status: 400 })
  }

  const nome = String(payload.nome || '').trim()
  const cs = String(payload.cs || '').trim()
  const email = String(payload.email || '').trim().toLowerCase()
  const escala = normalizeEscala(String(payload.escala || ''))
  const profileId = payload.profile_id ? String(payload.profile_id).trim() : ''
  const cargo = payload.cargo ? String(payload.cargo).trim() : null
  const coordenacao = payload.coordenacao
    ? String(payload.coordenacao).trim()
    : null
  const equipe = payload.equipe ? String(payload.equipe).trim() : null
  const equipeAditiva = payload.equipe_aditiva
    ? String(payload.equipe_aditiva).trim()
    : null
  const status = normalizeStatus(String(payload.status || 'ativo'))
  const senha = String(payload.senha || '')

  if (!nome || !cs || !email || !senha || !escala || !profileId) {
    return Response.json(
      { error: 'Nome, CS, email, escala, perfil e senha sao obrigatorios.' },
      { status: 400 }
    )
  }

  if (!isValidEmail(email)) {
    return Response.json({ error: 'Email invalido.' }, { status: 400 })
  }

  if (!isPasswordValid(senha)) {
    return Response.json(
      {
        error:
          'Senha invalida. Minimo 7 caracteres, 1 letra, 1 numero e 1 especial (!@#$%&).'
      },
      { status: 400 }
    )
  }

  if (!status) {
    return Response.json({ error: 'Status invalido.' }, { status: 400 })
  }

  if (!escala) {
    return Response.json({ error: 'Escala invalida.' }, { status: 400 })
  }

  if (!isValidCs(cs)) {
    return Response.json({ error: 'CS deve conter 6 digitos.' }, { status: 400 })
  }

  const profile = await env.DB.prepare(
    'SELECT id, status FROM tb_profile WHERE id = ? AND company_id = ?'
  )
    .bind(profileId, auth.company_id)
    .first<ProfileRow>()

  if (!profile || profile.status !== 'ativo') {
    return Response.json({ error: 'Perfil invalido.' }, { status: 400 })
  }

  const company = await env.DB.prepare(
    'SELECT id, status FROM tb_company WHERE id = ?'
  )
    .bind(auth.company_id)
    .first<CompanyRow>()

  if (!company || company.status !== 'ativo') {
    return Response.json({ error: 'Empresa invalida.' }, { status: 400 })
  }

  const existing = await env.DB.prepare(
    'SELECT id FROM tb_user WHERE company_id = ? AND (cs = ? OR email = ? OR nome = ?)'
  )
    .bind(auth.company_id, cs, email, nome)
    .first<{ id: string }>()

  if (existing) {
    return Response.json({ error: 'Usuario ja existe.' }, { status: 409 })
  }

  const userId = crypto.randomUUID()
  const passwordHash = await bcrypt.hash(senha, 10)

  await env.DB.prepare(
    `INSERT INTO tb_user (
      id, company_id, nome, cs, email, escala, profile_id, cargo, coordenacao, equipe, equipe_aditiva, status, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`
  )
    .bind(
      userId,
      auth.company_id,
      nome,
      cs,
      email,
      escala,
      profileId,
      cargo,
      coordenacao,
      equipe,
      equipeAditiva,
      status
    )
    .run()

  await env.DB.prepare(
    'INSERT INTO tb_user_auth (user_id, password_hash) VALUES (?, ?)'
  )
    .bind(userId, passwordHash)
    .run()

  await logUserHistory(env, {
    companyId: auth.company_id,
    userId,
    changedByUserId: auth.user_id,
    changedByName: auth.nome,
    changes: 'Usuario criado'
  })

  const user = await env.DB.prepare(
    `SELECT u.id, u.company_id, u.nome, u.cs, u.email, u.escala, u.profile_id,
            p.name AS profile_name, u.cargo, u.coordenacao, u.equipe, u.equipe_aditiva,
            u.status, u.created_at, u.updated_at
     FROM tb_user u
     LEFT JOIN tb_profile p ON p.id = u.profile_id
     WHERE u.id = ? AND u.company_id = ?`
  )
    .bind(userId, auth.company_id)
    .first<UserRow>()

  return Response.json({ user }, { status: 201 })
}

async function handleListUsers(request: Request, env: Env): Promise<Response> {
  assertJwtSecret(env)
  const auth = await requireAuth(request, env)
  if (!auth) {
    return Response.json({ error: 'Token invalido.' }, { status: 401 })
  }
  const permissionError = await requirePermission(
    env,
    auth,
    'configuracao',
    'leitura'
  )
  if (permissionError) return permissionError

  const result = await env.DB.prepare(
    `SELECT u.id, u.company_id, u.nome, u.cs, u.email, u.escala, u.profile_id,
            p.name AS profile_name, u.cargo, u.coordenacao, u.equipe, u.equipe_aditiva,
            u.status, u.created_at, u.updated_at
     FROM tb_user u
     LEFT JOIN tb_profile p ON p.id = u.profile_id
     WHERE u.company_id = ?
     ORDER BY u.created_at DESC`
  )
    .bind(auth.company_id)
    .all<UserRow>()

  return Response.json({ users: result.results })
}

async function handlePlanejamentoFilters(
  request: Request,
  env: Env
): Promise<Response> {
  assertJwtSecret(env)
  const auth = await requireAuth(request, env)
  if (!auth) {
    return Response.json({ error: 'Token invalido.' }, { status: 401 })
  }

  const result = await env.DB.prepare(
    `SELECT
            TRIM(coordenacao) AS coordenacao,
            TRIM(equipe) AS equipe
     FROM tb_estrutura
     WHERE company_id = ?
       AND status = 'ativo'
       AND coordenacao IS NOT NULL
       AND TRIM(coordenacao) != ''
       AND equipe IS NOT NULL
       AND TRIM(equipe) != ''
     ORDER BY coordenacao, equipe`
  )
    .bind(auth.company_id)
    .all<{ coordenacao: string; equipe: string }>()

  const combos = result.results.filter(
    row => row.coordenacao && row.equipe
  )

  const coordenacoes = Array.from(
    new Set(combos.map(row => row.coordenacao))
  ).sort()

  const equipesByCoord: Record<string, string[]> = {}
  for (const row of combos) {
    if (!row.coordenacao) continue
    if (!equipesByCoord[row.coordenacao]) {
      equipesByCoord[row.coordenacao] = []
    }
    if (!equipesByCoord[row.coordenacao].includes(row.equipe)) {
      equipesByCoord[row.coordenacao].push(row.equipe)
    }
  }
  for (const coord of Object.keys(equipesByCoord)) {
    equipesByCoord[coord].sort()
  }

  return Response.json({
    coordenacoes,
    equipes_by_coordenacao: equipesByCoord
  })
}

async function handlePlanejamentoTechnicians(
  request: Request,
  env: Env
): Promise<Response> {
  assertJwtSecret(env)
  const auth = await requireAuth(request, env)
  if (!auth) {
    return Response.json({ error: 'Token invalido.' }, { status: 401 })
  }

  const url = new URL(request.url)
  const coordenacao = (url.searchParams.get('coordenacao') || '').trim()
  const equipe = (url.searchParams.get('equipe') || '').trim()
  if (!coordenacao || !equipe) {
    return Response.json({ technicians: [] })
  }

  const result = await env.DB.prepare(
    `SELECT id, nome, TRIM(coordenacao) AS coordenacao, TRIM(equipe) AS equipe
     FROM tb_user
     WHERE company_id = ?
       AND status = 'ativo'
       AND TRIM(coordenacao) = ?
       AND TRIM(equipe) = ?
     ORDER BY nome`
  )
    .bind(auth.company_id, coordenacao, equipe)
    .all<{ id: string; nome: string; coordenacao: string; equipe: string }>()

  return Response.json({
    technicians: result.results
  })
}

async function handlePlanejamentoAssets(
  request: Request,
  env: Env
): Promise<Response> {
  assertJwtSecret(env)
  const auth = await requireAuth(request, env)
  if (!auth) {
    return Response.json({ error: 'Token invalido.' }, { status: 401 })
  }

  const url = new URL(request.url)
  const coordenacao = (url.searchParams.get('coordenacao') || '').trim()
  const equipe = (url.searchParams.get('equipe') || '').trim()
  const yearMonth = (url.searchParams.get('year_month') || '').trim()
  if (
    !coordenacao ||
    !equipe ||
    !yearMonth ||
    !/^[0-9]{4}-[0-9]{2}$/.test(yearMonth)
  ) {
    return Response.json({ ativos: [] })
  }

  const result = await env.DB.prepare(
    `SELECT id,
            ATIVO_CODPE,
            ATIVO_DESCRITIVO_OS,
            ATIVO_SIGLA,
            ATIVO_CICLO,
            ATIVO_ULTIMA_MANUT,
            date(ATIVO_ULTIMA_MANUT, '+' || ATIVO_CONTADOR || ' month') AS proxima_manut
     FROM tb_ativo
     WHERE company_id = ?
       AND ATIVO_STATUS = 'ativo'
       AND TRIM(ATIVO_COORDENACAO) = ?
       AND TRIM(ATIVO_EQUIPE) = ?
       AND ATIVO_ULTIMA_MANUT IS NOT NULL
       AND TRIM(ATIVO_ULTIMA_MANUT) != ''
       AND ATIVO_CONTADOR > 0
       AND strftime('%Y-%m', date(ATIVO_ULTIMA_MANUT, '+' || ATIVO_CONTADOR || ' month')) = ?
     ORDER BY ATIVO_DESCRITIVO_OS`
  )
    .bind(auth.company_id, coordenacao, equipe, yearMonth)
    .all<PlanejamentoAssetRow>()

  return Response.json({
    ativos: result.results.map(row => ({
      id: row.id,
      codpe: row.ATIVO_CODPE,
      description: row.ATIVO_DESCRITIVO_OS,
      sigla: row.ATIVO_SIGLA,
      cycle: row.ATIVO_CICLO,
      lastMaintenance: row.ATIVO_ULTIMA_MANUT || null,
      dueDate: row.proxima_manut || null
    }))
  })
}

async function handleUpdateUser(request: Request, env: Env): Promise<Response> {
  assertJwtSecret(env)
  const auth = await requireAuth(request, env)
  if (!auth) {
    return Response.json({ error: 'Token invalido.' }, { status: 401 })
  }

  const payload = await readJson(request)
  if (!payload) {
    return Response.json({ error: 'Dados invalidos.' }, { status: 400 })
  }

  const id = String(payload.id || '').trim()
  if (!id) {
    return Response.json({ error: 'ID obrigatorio.' }, { status: 400 })
  }

  const nome = payload.nome ? String(payload.nome).trim() : null
  const cs = payload.cs ? String(payload.cs).trim() : null
  const email = payload.email ? String(payload.email).trim().toLowerCase() : null
  const escala = payload.escala ? normalizeEscala(String(payload.escala)) : null
  const profileId = payload.profile_id ? String(payload.profile_id).trim() : null
  const cargo = payload.cargo ? String(payload.cargo).trim() : null
  const coordenacao = payload.coordenacao
    ? String(payload.coordenacao).trim()
    : null
  const equipe = payload.equipe ? String(payload.equipe).trim() : null
  const equipeAditiva = payload.equipe_aditiva
    ? String(payload.equipe_aditiva).trim()
    : null
  const status = payload.status ? normalizeStatus(String(payload.status)) : null
  const senha = payload.senha ? String(payload.senha) : null

  if (cs && !isValidCs(cs)) {
    return Response.json({ error: 'CS deve conter 6 digitos.' }, { status: 400 })
  }

  if (email && !isValidEmail(email)) {
    return Response.json({ error: 'Email invalido.' }, { status: 400 })
  }

  if (payload.status && !status) {
    return Response.json({ error: 'Status invalido.' }, { status: 400 })
  }

  if (payload.escala && !escala) {
    return Response.json({ error: 'Escala invalida.' }, { status: 400 })
  }

  if (profileId) {
    const profile = await env.DB.prepare(
      'SELECT id, status FROM tb_profile WHERE id = ? AND company_id = ?'
    )
      .bind(profileId, auth.company_id)
      .first<ProfileRow>()

    if (!profile || profile.status !== 'ativo') {
      return Response.json({ error: 'Perfil invalido.' }, { status: 400 })
    }
  }

  if (senha && !isPasswordValid(senha)) {
    return Response.json(
      {
        error:
          'Senha invalida. Minimo 7 caracteres, 1 letra, 1 numero e 1 especial (!@#$%&).'
      },
      { status: 400 }
    )
  }

  const existing = await env.DB.prepare(
    `SELECT id, nome, cs, email, escala, profile_id, cargo, coordenacao, equipe, equipe_aditiva, status
     FROM tb_user WHERE id = ? AND company_id = ?`
  )
    .bind(id, auth.company_id)
    .first<UserRow>()

  if (!existing) {
    return Response.json({ error: 'Usuario nao encontrado.' }, { status: 404 })
  }

  const isDelete = status === 'excluido' && existing.status !== 'excluido'
  const permissionError = await requirePermission(
    env,
    auth,
    'configuracao',
    isDelete ? 'exclusao' : 'edicao'
  )
  if (permissionError) return permissionError

  if (cs || email || nome) {
    const conflict = await env.DB.prepare(
      'SELECT id FROM tb_user WHERE company_id = ? AND id != ? AND (cs = ? OR email = ? OR nome = ?)'
    )
      .bind(auth.company_id, id, cs ?? '', email ?? '', nome ?? '')
      .first<{ id: string }>()

    if (conflict) {
      return Response.json({ error: 'Usuario ja existe.' }, { status: 409 })
    }
  }

  const updates: string[] = []
  const values: Array<string | null> = []
  const changeLabels: string[] = []

  if (nome !== null && nome !== existing.nome) {
    updates.push('nome = ?')
    values.push(nome)
    changeLabels.push('nome')
  }
  if (cs !== null && cs !== existing.cs) {
    updates.push('cs = ?')
    values.push(cs)
    changeLabels.push('cs')
  }
  if (email !== null && email !== existing.email) {
    updates.push('email = ?')
    values.push(email)
    changeLabels.push('email')
  }
  if (escala !== null && escala !== existing.escala) {
    updates.push('escala = ?')
    values.push(escala)
    changeLabels.push('escala')
  }
  if (profileId !== null && profileId !== existing.profile_id) {
    updates.push('profile_id = ?')
    values.push(profileId)
    changeLabels.push('perfil')
  }
  if (cargo !== null && cargo !== existing.cargo) {
    updates.push('cargo = ?')
    values.push(cargo)
    changeLabels.push('cargo')
  }
  if (coordenacao !== null && coordenacao !== existing.coordenacao) {
    updates.push('coordenacao = ?')
    values.push(coordenacao)
    changeLabels.push('coordenacao')
  }
  if (equipe !== null && equipe !== existing.equipe) {
    updates.push('equipe = ?')
    values.push(equipe)
    changeLabels.push('equipe')
  }
  if (equipeAditiva !== null && equipeAditiva !== existing.equipe_aditiva) {
    updates.push('equipe_aditiva = ?')
    values.push(equipeAditiva)
    changeLabels.push('equipe_aditiva')
  }
  if (status !== null && status !== existing.status) {
    updates.push('status = ?')
    values.push(status)
    changeLabels.push('status')
  }

  if (!updates.length && !senha) {
    return Response.json({ error: 'Nada para atualizar.' }, { status: 400 })
  }

  if (updates.length) {
    updates.push("updated_at = datetime('now')")
    await env.DB.prepare(
      `UPDATE tb_user SET ${updates.join(', ')} WHERE id = ? AND company_id = ?`
    )
      .bind(...values, id, auth.company_id)
      .run()
  }

  if (senha) {
    const passwordHash = await bcrypt.hash(senha, 10)
    await env.DB
      .prepare(
        'UPDATE tb_user_auth SET password_hash = ?, failed_attempts = 0, locked_until = NULL WHERE user_id = ?'
      )
      .bind(passwordHash, id)
      .run()
    changeLabels.push('senha')
  }

  if (changeLabels.length) {
    const changeText = `Alterado: ${changeLabels.join(', ')}`
    await logUserHistory(env, {
      companyId: auth.company_id,
      userId: id,
      changedByUserId: auth.user_id,
      changedByName: auth.nome,
      changes: changeText
    })
  }

  const user = await env.DB.prepare(
    `SELECT u.id, u.company_id, u.nome, u.cs, u.email, u.escala, u.profile_id,
            p.name AS profile_name, u.cargo, u.coordenacao, u.equipe, u.equipe_aditiva,
            u.status, u.created_at, u.updated_at
     FROM tb_user u
     LEFT JOIN tb_profile p ON p.id = u.profile_id
     WHERE u.id = ? AND u.company_id = ?`
  )
    .bind(id, auth.company_id)
    .first<UserRow>()

  return Response.json({ user })
}

async function handleUserHistory(request: Request, env: Env): Promise<Response> {
  assertJwtSecret(env)
  const auth = await requireAuth(request, env)
  if (!auth) {
    return Response.json({ error: 'Token invalido.' }, { status: 401 })
  }
  const permissionError = await requirePermission(
    env,
    auth,
    'configuracao',
    'leitura'
  )
  if (permissionError) return permissionError

  const url = new URL(request.url)
  const userId = url.searchParams.get('user_id')
  if (!userId) {
    return Response.json({ error: 'user_id obrigatorio.' }, { status: 400 })
  }

  const result = await env.DB.prepare(
    `SELECT id, company_id, user_id, changed_by_user_id, changed_by_name, changes, created_at
     FROM tb_user_history
     WHERE company_id = ? AND user_id = ?
     ORDER BY created_at DESC`
  )
    .bind(auth.company_id, userId)
    .all<UserHistoryRow>()

  return Response.json({ history: result.results })
}

async function handleListProfiles(request: Request, env: Env): Promise<Response> {
  assertJwtSecret(env)
  const auth = await requireAuth(request, env)
  if (!auth) {
    return Response.json({ error: 'Token invalido.' }, { status: 401 })
  }
  const permissionError = await requirePermission(
    env,
    auth,
    'configuracao',
    'leitura'
  )
  if (permissionError) return permissionError

  const profiles = await env.DB.prepare(
    `SELECT id, company_id, name, status, created_at, updated_at
     FROM tb_profile
     WHERE company_id = ?
     ORDER BY created_at DESC`
  )
    .bind(auth.company_id)
    .all<ProfileRow>()

  const results = []
  for (const profile of profiles.results) {
    const permissions = await env.DB.prepare(
      `SELECT profile_id, screen_id, leitura, criacao, edicao, exclusao
       FROM tb_profile_permission
       WHERE profile_id = ?`
    )
      .bind(profile.id)
      .all<ProfilePermissionRow>()
    results.push({
      ...profile,
      permissions: permissions.results
    })
  }

  return Response.json({ profiles: results })
}

async function handleCreateProfile(request: Request, env: Env): Promise<Response> {
  assertJwtSecret(env)
  const auth = await requireAuth(request, env)
  if (!auth) {
    return Response.json({ error: 'Token invalido.' }, { status: 401 })
  }
  const permissionError = await requirePermission(
    env,
    auth,
    'configuracao',
    'criacao'
  )
  if (permissionError) return permissionError

  const payload = await readJson(request)
  if (!payload) {
    return Response.json({ error: 'Dados invalidos.' }, { status: 400 })
  }

  const name = String(payload.name || '').trim()
  const status = normalizeProfileStatus(String(payload.status || 'ativo'))
  const permissions = Array.isArray(payload.permissions)
    ? payload.permissions
    : []

  if (!name || !status) {
    return Response.json({ error: 'Nome e status sao obrigatorios.' }, { status: 400 })
  }

  const conflict = await env.DB.prepare(
    'SELECT id FROM tb_profile WHERE company_id = ? AND name = ?'
  )
    .bind(auth.company_id, name)
    .first<{ id: string }>()

  if (conflict) {
    return Response.json({ error: 'Perfil ja existe.' }, { status: 409 })
  }

  const profileId = crypto.randomUUID()
  await env.DB.prepare(
    `INSERT INTO tb_profile (id, company_id, name, status, created_at, updated_at)
     VALUES (?, ?, ?, ?, datetime('now'), datetime('now'))`
  )
    .bind(profileId, auth.company_id, name, status)
    .run()

  await insertProfilePermissions(env, profileId, permissions)

  await logProfileHistory(env, {
    companyId: auth.company_id,
    profileId,
    changedByUserId: auth.user_id,
    changedByName: auth.nome,
    changes: 'Perfil criado'
  })

  const profile = await env.DB.prepare(
    `SELECT id, company_id, name, status, created_at, updated_at
     FROM tb_profile WHERE id = ? AND company_id = ?`
  )
    .bind(profileId, auth.company_id)
    .first<ProfileRow>()

  const savedPermissions = await env.DB.prepare(
    `SELECT profile_id, screen_id, leitura, criacao, edicao, exclusao
     FROM tb_profile_permission WHERE profile_id = ?`
  )
    .bind(profileId)
    .all<ProfilePermissionRow>()

  return Response.json(
    { profile: { ...profile, permissions: savedPermissions.results } },
    { status: 201 }
  )
}

async function handleUpdateProfile(request: Request, env: Env): Promise<Response> {
  assertJwtSecret(env)
  const auth = await requireAuth(request, env)
  if (!auth) {
    return Response.json({ error: 'Token invalido.' }, { status: 401 })
  }
  const permissionError = await requirePermission(
    env,
    auth,
    'configuracao',
    'edicao'
  )
  if (permissionError) return permissionError

  const payload = await readJson(request)
  if (!payload) {
    return Response.json({ error: 'Dados invalidos.' }, { status: 400 })
  }

  const id = String(payload.id || '').trim()
  if (!id) {
    return Response.json({ error: 'ID obrigatorio.' }, { status: 400 })
  }

  const name = payload.name ? String(payload.name).trim() : null
  const status = payload.status ? normalizeProfileStatus(String(payload.status)) : null
  const permissions = Array.isArray(payload.permissions)
    ? payload.permissions
    : null

  if (payload.status && !status) {
    return Response.json({ error: 'Status invalido.' }, { status: 400 })
  }

  const existing = await env.DB.prepare(
    `SELECT id, name, status
     FROM tb_profile WHERE id = ? AND company_id = ?`
  )
    .bind(id, auth.company_id)
    .first<ProfileRow>()

  if (!existing) {
    return Response.json({ error: 'Perfil nao encontrado.' }, { status: 404 })
  }

  if (name && name !== existing.name) {
    const conflict = await env.DB.prepare(
      'SELECT id FROM tb_profile WHERE company_id = ? AND id != ? AND name = ?'
    )
      .bind(auth.company_id, id, name)
      .first<{ id: string }>()

    if (conflict) {
      return Response.json({ error: 'Perfil ja existe.' }, { status: 409 })
    }
  }

  const updates: string[] = []
  const values: Array<string> = []
  const changeLabels: string[] = []

  if (name && name !== existing.name) {
    updates.push('name = ?')
    values.push(name)
    changeLabels.push('nome')
  }
  if (status && status !== existing.status) {
    updates.push('status = ?')
    values.push(status)
    changeLabels.push('status')
  }

  if (!updates.length && !permissions) {
    return Response.json({ error: 'Nada para atualizar.' }, { status: 400 })
  }

  if (updates.length) {
    updates.push("updated_at = datetime('now')")
    await env.DB.prepare(
      `UPDATE tb_profile SET ${updates.join(', ')} WHERE id = ? AND company_id = ?`
    )
      .bind(...values, id, auth.company_id)
      .run()
  }

  if (permissions) {
    await env.DB.prepare('DELETE FROM tb_profile_permission WHERE profile_id = ?')
      .bind(id)
      .run()
    await insertProfilePermissions(env, id, permissions)
    changeLabels.push('permissoes')
  }

  if (changeLabels.length) {
    await logProfileHistory(env, {
      companyId: auth.company_id,
      profileId: id,
      changedByUserId: auth.user_id,
      changedByName: auth.nome,
      changes: `Alterado: ${changeLabels.join(', ')}`
    })
  }

  const profile = await env.DB.prepare(
    `SELECT id, company_id, name, status, created_at, updated_at
     FROM tb_profile WHERE id = ? AND company_id = ?`
  )
    .bind(id, auth.company_id)
    .first<ProfileRow>()

  const savedPermissions = await env.DB.prepare(
    `SELECT profile_id, screen_id, leitura, criacao, edicao, exclusao
     FROM tb_profile_permission WHERE profile_id = ?`
  )
    .bind(id)
    .all<ProfilePermissionRow>()

  return Response.json({ profile: { ...profile, permissions: savedPermissions.results } })
}

async function handleProfileHistory(request: Request, env: Env): Promise<Response> {
  assertJwtSecret(env)
  const auth = await requireAuth(request, env)
  if (!auth) {
    return Response.json({ error: 'Token invalido.' }, { status: 401 })
  }
  const permissionError = await requirePermission(
    env,
    auth,
    'configuracao',
    'leitura'
  )
  if (permissionError) return permissionError

  const url = new URL(request.url)
  const profileId = url.searchParams.get('profile_id')
  if (!profileId) {
    return Response.json({ error: 'profile_id obrigatorio.' }, { status: 400 })
  }

  const result = await env.DB.prepare(
    `SELECT id, company_id, profile_id, changed_by_user_id, changed_by_name, changes, created_at
     FROM tb_profile_history
     WHERE company_id = ? AND profile_id = ?
     ORDER BY created_at DESC`
  )
    .bind(auth.company_id, profileId)
    .all<ProfileHistoryRow>()

  return Response.json({ history: result.results })
}

async function handleListEstrutura(request: Request, env: Env): Promise<Response> {
  assertJwtSecret(env)
  const auth = await requireAuth(request, env)
  if (!auth) {
    return Response.json({ error: 'Token invalido.' }, { status: 401 })
  }
  const permissionError = await requirePermission(
    env,
    auth,
    'configuracao',
    'leitura'
  )
  if (permissionError) return permissionError

  const result = await env.DB.prepare(
    `SELECT id, company_id, coordenacao, equipe, cc, execucao, status, created_at
     FROM tb_estrutura
     WHERE company_id = ? AND status != 'excluido'
     ORDER BY created_at DESC`
  )
    .bind(auth.company_id)
    .all<EstruturaRow>()

  return Response.json({ estrutura: result.results })
}

async function handleCreateEstrutura(request: Request, env: Env): Promise<Response> {
  assertJwtSecret(env)
  const auth = await requireAuth(request, env)
  if (!auth) {
    return Response.json({ error: 'Token invalido.' }, { status: 401 })
  }
  const permissionError = await requirePermission(
    env,
    auth,
    'configuracao',
    'criacao'
  )
  if (permissionError) return permissionError

  const payload = await readJson(request)
  if (!payload) {
    return Response.json({ error: 'Dados invalidos.' }, { status: 400 })
  }

  const coordenacao = String(payload.coordenacao || '').trim()
  const equipe = String(payload.equipe || '').trim()
  const cc = String(payload.cc || '').trim()
  const execucao = String(payload.execucao || 'sim').trim().toLowerCase()

  if (!coordenacao || !equipe || !cc) {
    return Response.json(
      { error: 'Coordenacao, equipe e CC sao obrigatorios.' },
      { status: 400 }
    )
  }

  if (execucao !== 'sim' && execucao !== 'nao') {
    return Response.json({ error: 'Execucao invalida.' }, { status: 400 })
  }

  if (coordenacao.length > 20) {
    return Response.json(
      { error: 'Coordenacao deve ter no maximo 20 caracteres.' },
      { status: 400 }
    )
  }
  if (equipe.length > 10) {
    return Response.json(
      { error: 'Equipe deve ter no maximo 10 caracteres.' },
      { status: 400 }
    )
  }
  if (cc.length > 10) {
    return Response.json(
      { error: 'CC deve ter no maximo 10 caracteres.' },
      { status: 400 }
    )
  }

  const company = await env.DB.prepare(
    'SELECT id, status FROM tb_company WHERE id = ?'
  )
    .bind(auth.company_id)
    .first<CompanyRow>()

  if (!company || company.status !== 'ativo') {
    return Response.json({ error: 'Empresa invalida.' }, { status: 400 })
  }

  const conflict = await env.DB.prepare(
    'SELECT id FROM tb_estrutura WHERE company_id = ? AND coordenacao = ? AND equipe = ?'
  )
    .bind(auth.company_id, coordenacao, equipe)
    .first<{ id: string }>()

  if (conflict) {
    return Response.json({ error: 'Estrutura ja existe.' }, { status: 409 })
  }

  const estruturaId = crypto.randomUUID()
  await env.DB.prepare(
    `INSERT INTO tb_estrutura (id, company_id, coordenacao, equipe, cc, execucao, status, created_at)
     VALUES (?, ?, ?, ?, ?, ?, 'ativo', datetime('now'))`
  )
    .bind(estruturaId, auth.company_id, coordenacao, equipe, cc, execucao)
    .run()

  const estrutura = await env.DB.prepare(
    `SELECT id, company_id, coordenacao, equipe, cc, execucao, status, created_at
     FROM tb_estrutura
     WHERE id = ? AND company_id = ?`
  )
    .bind(estruturaId, auth.company_id)
    .first<EstruturaRow>()

  if (estrutura) {
    await logEstruturaHistory(env, {
      companyId: auth.company_id,
      estruturaId: estrutura.id,
      action: 'criado',
      beforeData: null,
      afterData: JSON.stringify({
        coordenacao: estrutura.coordenacao,
        equipe: estrutura.equipe,
        cc: estrutura.cc,
        execucao: estrutura.execucao,
        status: estrutura.status
      }),
      changedByUserId: auth.user_id,
      changedByName: auth.nome
    })
  }

  return Response.json({ estrutura }, { status: 201 })
}

async function handleUpdateEstrutura(request: Request, env: Env): Promise<Response> {
  assertJwtSecret(env)
  const auth = await requireAuth(request, env)
  if (!auth) {
    return Response.json({ error: 'Token invalido.' }, { status: 401 })
  }

  const payload = await readJson(request)
  if (!payload) {
    return Response.json({ error: 'Dados invalidos.' }, { status: 400 })
  }

  const id = String(payload.id || '').trim()
  if (!id) {
    return Response.json({ error: 'ID obrigatorio.' }, { status: 400 })
  }

  const coordenacao = payload.coordenacao
    ? String(payload.coordenacao).trim()
    : null
  const equipe = payload.equipe ? String(payload.equipe).trim() : null
  const cc = payload.cc ? String(payload.cc).trim() : null
  const execucao = payload.execucao
    ? String(payload.execucao).trim().toLowerCase()
    : null
  const status = payload.status ? normalizeStatus(String(payload.status)) : null

  if (coordenacao && coordenacao.length > 20) {
    return Response.json(
      { error: 'Coordenacao deve ter no maximo 20 caracteres.' },
      { status: 400 }
    )
  }
  if (equipe && equipe.length > 10) {
    return Response.json(
      { error: 'Equipe deve ter no maximo 10 caracteres.' },
      { status: 400 }
    )
  }
  if (cc && cc.length > 10) {
    return Response.json(
      { error: 'CC deve ter no maximo 10 caracteres.' },
      { status: 400 }
    )
  }
  if (payload.execucao && execucao !== 'sim' && execucao !== 'nao') {
    return Response.json({ error: 'Execucao invalida.' }, { status: 400 })
  }
  if (payload.status && !status) {
    return Response.json({ error: 'Status invalido.' }, { status: 400 })
  }

  const existing = await env.DB.prepare(
    `SELECT id, company_id, coordenacao, equipe, cc, execucao, status, created_at
     FROM tb_estrutura WHERE id = ? AND company_id = ?`
  )
    .bind(id, auth.company_id)
    .first<EstruturaRow>()

  if (!existing) {
    return Response.json({ error: 'Estrutura nao encontrada.' }, { status: 404 })
  }

  const isDelete = status === 'inativo' && existing.status !== 'inativo'
  const permissionError = await requirePermission(
    env,
    auth,
    'configuracao',
    isDelete ? 'exclusao' : 'edicao'
  )
  if (permissionError) return permissionError

  const nextCoordenacao = coordenacao ?? existing.coordenacao
  const nextEquipe = equipe ?? existing.equipe
  const shouldCheckUnique =
    (coordenacao && coordenacao !== existing.coordenacao) ||
    (equipe && equipe !== existing.equipe)

  if (shouldCheckUnique) {
    const conflict = await env.DB.prepare(
      'SELECT id FROM tb_estrutura WHERE company_id = ? AND coordenacao = ? AND equipe = ? AND id != ?'
    )
      .bind(auth.company_id, nextCoordenacao, nextEquipe, id)
      .first<{ id: string }>()

    if (conflict) {
      return Response.json({ error: 'Estrutura ja existe.' }, { status: 409 })
    }
  }

  const updates: string[] = []
  const values: Array<string | null> = []

  if (coordenacao !== null && coordenacao !== existing.coordenacao) {
    updates.push('coordenacao = ?')
    values.push(coordenacao)
  }
  if (equipe !== null && equipe !== existing.equipe) {
    updates.push('equipe = ?')
    values.push(equipe)
  }
  if (cc !== null && cc !== existing.cc) {
    updates.push('cc = ?')
    values.push(cc)
  }
  if (execucao !== null && execucao !== existing.execucao) {
    updates.push('execucao = ?')
    values.push(execucao)
  }
  if (status !== null && status !== existing.status) {
    updates.push('status = ?')
    values.push(status)
  }

  if (!updates.length) {
    if (status === 'excluido' && existing.status === 'excluido') {
      return Response.json({ estrutura: existing })
    }
    return Response.json({ error: 'Nada para atualizar.' }, { status: 400 })
  }

  await env.DB.prepare(
    `UPDATE tb_estrutura SET ${updates.join(', ')} WHERE id = ? AND company_id = ?`
  )
    .bind(...values, id, auth.company_id)
    .run()

  const estrutura = await env.DB.prepare(
    `SELECT id, company_id, coordenacao, equipe, cc, execucao, status, created_at
     FROM tb_estrutura
     WHERE id = ? AND company_id = ?`
  )
    .bind(id, auth.company_id)
    .first<EstruturaRow>()

  if (estrutura) {
    await logEstruturaHistory(env, {
      companyId: auth.company_id,
      estruturaId: estrutura.id,
      action: 'atualizado',
      beforeData: JSON.stringify({
        coordenacao: existing.coordenacao,
        equipe: existing.equipe,
        cc: existing.cc,
        execucao: existing.execucao,
        status: existing.status
      }),
      afterData: JSON.stringify({
        coordenacao: estrutura.coordenacao,
        equipe: estrutura.equipe,
        cc: estrutura.cc,
        execucao: estrutura.execucao,
        status: estrutura.status
      }),
      changedByUserId: auth.user_id,
      changedByName: auth.nome
    })
  }

  return Response.json({ estrutura })
}

async function handleEstruturaHistory(
  request: Request,
  env: Env
): Promise<Response> {
  assertJwtSecret(env)
  const auth = await requireAuth(request, env)
  if (!auth) {
    return Response.json({ error: 'Token invalido.' }, { status: 401 })
  }
  const permissionError = await requirePermission(
    env,
    auth,
    'configuracao',
    'leitura'
  )
  if (permissionError) return permissionError

  const url = new URL(request.url)
  const estruturaId = url.searchParams.get('estrutura_id')
  if (!estruturaId) {
    return Response.json({ error: 'estrutura_id obrigatorio.' }, { status: 400 })
  }

  const result = await env.DB.prepare(
    `SELECT id, company_id, estrutura_id, action, before_data, after_data, changed_by_user_id, changed_by_name, created_at
     FROM tb_estrutura_history
     WHERE company_id = ? AND estrutura_id = ?
     ORDER BY created_at DESC`
  )
    .bind(auth.company_id, estruturaId)
    .all<EstruturaHistoryRow>()

  return Response.json({ history: result.results })
}

async function handleListParametros(
  request: Request,
  env: Env
): Promise<Response> {
  assertJwtSecret(env)
  const auth = await requireAuth(request, env)
  if (!auth) {
    return Response.json({ error: 'Token invalido.' }, { status: 401 })
  }
  const permissionError = await requirePermission(
    env,
    auth,
    'configuracao',
    'leitura'
  )
  if (permissionError) return permissionError

  await ensureParametrosTable(env)

  const url = new URL(request.url)
  const conditions: string[] = ['company_id = ?']
  const values: Array<string | number> = [auth.company_id]

  const tipoParam = url.searchParams.get('tipo_parametro')
  if (tipoParam && PARAMETRO_TIPOS.includes(tipoParam as ParametroCadastroAtivoType)) {
    conditions.push('tipo_parametro = ?')
    values.push(tipoParam)
  }

  const ativoParam = parseBooleanFlag(url.searchParams.get('ativo'))
  if (ativoParam !== null) {
    conditions.push('ativo = ?')
    values.push(ativoParam)
  }

  const result = await env.DB.prepare(
    `SELECT id_parametro, company_id, tipo_parametro, valor, ativo, ordem, observacao, created_at, updated_at
     FROM tb_parametro
     WHERE ${conditions.join(' AND ')}
     ORDER BY tipo_parametro ASC, ordem IS NULL, ordem ASC`
  )
    .bind(...values)
    .all<ParametroCadastroAtivoRow>()

  return Response.json({ parametros: result.results })
}

async function handleCreateParametro(
  request: Request,
  env: Env
): Promise<Response> {
  assertJwtSecret(env)
  const auth = await requireAuth(request, env)
  if (!auth) {
    return Response.json({ error: 'Token invalido.' }, { status: 401 })
  }
  const permissionError = await requirePermission(
    env,
    auth,
    'configuracao',
    'criacao'
  )
  if (permissionError) return permissionError

  await ensureParametrosTable(env)

  const payload = await readJson(request)
  if (!payload) {
    return Response.json({ error: 'Dados invalidos.' }, { status: 400 })
  }

  const tipoParametro = String(payload.tipo_parametro || '').trim()
  if (!PARAMETRO_TIPOS.includes(tipoParametro as ParametroCadastroAtivoType)) {
    return Response.json({ error: 'Tipo de parametro invalido.' }, { status: 400 })
  }

  const valor = String(payload.valor || '').trim()
  if (!valor) {
    return Response.json({ error: 'Valor obrigatorio.' }, { status: 400 })
  }

  const ativoFlag = parseBooleanFlag(payload.ativo)
  const ativoValue = ativoFlag === null ? 1 : ativoFlag
  const ordemValue = payload.ordem !== undefined ? parseNullableNumber(payload.ordem) : null
  const observacaoValue =
    payload.observacao !== undefined
      ? String(payload.observacao).trim() || null
      : null

  const duplicate = await env.DB
    .prepare(
      `SELECT id_parametro
       FROM tb_parametro
       WHERE company_id = ? AND tipo_parametro = ? AND valor = ?`
    )
    .bind(auth.company_id, tipoParametro, valor)
    .first<{ id_parametro: string }>()

  if (duplicate) {
    return Response.json({ error: 'Parametro ja existe.' }, { status: 409 })
  }

  const idParametro = crypto.randomUUID()
  await env.DB.prepare(
    `INSERT INTO tb_parametro (
      id_parametro,
      company_id,
      tipo_parametro,
      valor,
      ativo,
      ordem,
      observacao,
      created_at,
      updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`
  )
    .bind(
      idParametro,
      auth.company_id,
      tipoParametro,
      valor,
      ativoValue,
      ordemValue,
      observacaoValue
    )
    .run()

  const inserted = await env.DB
    .prepare(
      `SELECT id_parametro, company_id, tipo_parametro, valor, ativo, ordem, observacao, created_at, updated_at
       FROM tb_parametro
       WHERE id_parametro = ?`
    )
    .bind(idParametro)
    .first<ParametroCadastroAtivoRow>()

  return Response.json({ parametro: inserted }, { status: 201 })
}

async function handleUpdateParametro(
  request: Request,
  env: Env
): Promise<Response> {
  assertJwtSecret(env)
  const auth = await requireAuth(request, env)
  if (!auth) {
    return Response.json({ error: 'Token invalido.' }, { status: 401 })
  }
  const permissionError = await requirePermission(
    env,
    auth,
    'configuracao',
    'edicao'
  )
  if (permissionError) return permissionError

  await ensureParametrosTable(env)

  const payload = await readJson(request)
  if (!payload) {
    return Response.json({ error: 'Dados invalidos.' }, { status: 400 })
  }

  const idParametro = String(payload.id_parametro || '').trim()
  if (!idParametro) {
    return Response.json({ error: 'id_parametro obrigatorio.' }, { status: 400 })
  }

  const existing = await env.DB
    .prepare(
      `SELECT id_parametro
       FROM tb_parametro
       WHERE id_parametro = ? AND company_id = ?`
    )
    .bind(idParametro, auth.company_id)
    .first<{ id_parametro: string }>()

  if (!existing) {
    return Response.json({ error: 'Parametro nao encontrado.' }, { status: 404 })
  }

  const updates: string[] = []
  const values: Array<string | number | null> = []

  if (payload.valor !== undefined) {
    const valor = String(payload.valor || '').trim()
    if (!valor) {
      return Response.json({ error: 'Valor obrigatorio.' }, { status: 400 })
    }
    updates.push('valor = ?')
    values.push(valor)
  }

  const ativoParam = payload.ativo === undefined ? null : parseBooleanFlag(payload.ativo)
  if (ativoParam !== null) {
    updates.push('ativo = ?')
    values.push(ativoParam)
  }

  if (payload.ordem !== undefined) {
    updates.push('ordem = ?')
    values.push(parseNullableNumber(payload.ordem))
  }

  if (payload.observacao !== undefined) {
    const observacao = String(payload.observacao).trim()
    updates.push('observacao = ?')
    values.push(observacao || null)
  }

  if (!updates.length) {
    return Response.json({ error: 'Nada para atualizar.' }, { status: 400 })
  }

  updates.push("updated_at = datetime('now')")

  const query = `UPDATE tb_parametro SET ${updates.join(', ')} WHERE id_parametro = ?`
  values.push(idParametro)

  await env.DB.prepare(query).bind(...values).run()

  const updated = await env.DB
    .prepare(
      `SELECT id_parametro, company_id, tipo_parametro, valor, ativo, ordem, observacao, created_at, updated_at
       FROM tb_parametro
       WHERE id_parametro = ?`
    )
    .bind(idParametro)
    .first<ParametroCadastroAtivoRow>()

  return Response.json({ parametro: updated })
}

async function handleListAtivos(request: Request, env: Env): Promise<Response> {
  assertJwtSecret(env)
  const auth = await requireAuth(request, env)
  if (!auth) {
    return Response.json({ error: 'Token invalido.' }, { status: 401 })
  }

  const url = new URL(request.url)
  const conditions: string[] = ['company_id = ?']
  const values: Array<string> = [auth.company_id]

  const applyFilter = (param: string | null, column: string) => {
    if (!param) return
    conditions.push(`${column} LIKE ?`)
    values.push(`%${param.trim()}%`)
  }

  applyFilter(url.searchParams.get('codpe'), 'ATIVO_CODPE')
  applyFilter(url.searchParams.get('descritivo'), 'ATIVO_DESCRITIVO_OS')
  applyFilter(url.searchParams.get('equipe'), 'ATIVO_EQUIPE')
  applyFilter(url.searchParams.get('ciclo'), 'ATIVO_CICLO')
  applyFilter(url.searchParams.get('sigla'), 'ATIVO_SIGLA')
  applyFilter(url.searchParams.get('monitorados'), 'ATIVO_MONITORADOS')
  applyFilter(url.searchParams.get('ultima_manut'), 'ATIVO_ULTIMA_MANUT')

  const result = await env.DB.prepare(
    `SELECT id,
            ATIVO_CODPE,
            ATIVO_DESCRITIVO_OS,
            ATIVO_COORDENACAO,
            ATIVO_EQUIPE,
            ATIVO_CICLO,
            ATIVO_SIGLA,
            ATIVO_MONITORADOS,
            ATIVO_ULTIMA_MANUT,
            ATIVO_STATUS
     FROM tb_ativo
     WHERE ${conditions.join(' AND ')}
     ORDER BY ATIVO_CODPE ASC`
  )
    .bind(...values)
    .all<AtivoRow>()

  return Response.json({ ativos: result.results })
}

async function handleListComponentes(
  request: Request,
  env: Env
): Promise<Response> {
  assertJwtSecret(env)
  const auth = await requireAuth(request, env)
  if (!auth) {
    return Response.json({ error: 'Token invalido.' }, { status: 401 })
  }
  const permissionError = await requirePermission(
    env,
    auth,
    'componentes',
    'leitura'
  )
  if (permissionError) return permissionError

  const url = new URL(request.url)
  const conditions: string[] = ['c.company_id = ?']
  const values: Array<string> = [auth.company_id]

  const applyFilter = (param: string | null, column: string) => {
    if (!param) return
    conditions.push(`${column} LIKE ?`)
    values.push(`%${param.trim()}%`)
  }

  applyFilter(url.searchParams.get('codpe'), 'a.ATIVO_CODPE')
  applyFilter(url.searchParams.get('descritivo'), 'a.ATIVO_DESCRITIVO_OS')
  applyFilter(url.searchParams.get('nome'), 'c.COMP_NOME')
  applyFilter(url.searchParams.get('modelo'), 'c.COMP_MODELO')
  applyFilter(url.searchParams.get('serial'), 'c.COMP_SERIAL')

  const result = await env.DB.prepare(
    `SELECT c.IDCOMPONETE,
            c.company_id,
            c.IDATIVO,
            c.COMP_NOME,
            c.COMP_SERIAL,
            c.COMP_DATA,
            c.COMP_MODELO,
            c.COMP_DESCRICAO,
            a.ATIVO_CODPE,
            a.ATIVO_DESCRITIVO_OS,
            a.ATIVO_SIGLA,
            a.ATIVO_COORDENACAO,
            a.ATIVO_EQUIPE
     FROM tb_componente c
     LEFT JOIN tb_ativo a ON a.id = c.IDATIVO AND a.company_id = c.company_id
     WHERE ${conditions.join(' AND ')}
     ORDER BY c.IDCOMPONETE DESC`
  )
    .bind(...values)
    .all<ComponenteListRow>()

  return Response.json({ componentes: result.results })
}

async function handleGetComponenteDetail(
  request: Request,
  env: Env
): Promise<Response> {
  assertJwtSecret(env)
  const auth = await requireAuth(request, env)
  if (!auth) {
    return Response.json({ error: 'Token invalido.' }, { status: 401 })
  }

  const permissionError = await requirePermission(
    env,
    auth,
    'componentes',
    'leitura'
  )
  if (permissionError) return permissionError

  const url = new URL(request.url)
  const idParam = url.searchParams.get('id')
  if (!idParam) {
    return Response.json(
      { error: 'component_id obrigatorio.' },
      { status: 400 }
    )
  }

  const componentId = Number(idParam)
  if (!Number.isFinite(componentId)) {
    return Response.json({ error: 'ID invalido.' }, { status: 400 })
  }

  const componente = await fetchComponenteWithAsset(
    env,
    auth.company_id,
    componentId
  )

  if (!componente) {
    return Response.json({ error: 'Componente nao encontrado.' }, { status: 404 })
  }

  return Response.json({ componente })
}

async function handleCreateComponente(
  request: Request,
  env: Env
): Promise<Response> {
  assertJwtSecret(env)
  const auth = await requireAuth(request, env)
  if (!auth) {
    return Response.json({ error: 'Token invalido.' }, { status: 401 })
  }

  const permissionError = await requirePermission(
    env,
    auth,
    'componentes',
    'criacao'
  )
  if (permissionError) return permissionError

  const payload = await readJson(request)
  if (!payload) {
    return Response.json({ error: 'Dados invalidos.' }, { status: 400 })
  }

  const idAtivo = String(payload.IDATIVO ?? '').trim()
  const nome = String(payload.COMP_NOME ?? '').trim()
  const modelo = String(payload.COMP_MODELO ?? '').trim()
  const serial =
    payload.COMP_SERIAL !== undefined && payload.COMP_SERIAL !== null
      ? String(payload.COMP_SERIAL).trim()
      : null
  const data =
    payload.COMP_DATA !== undefined && payload.COMP_DATA !== null
      ? String(payload.COMP_DATA).trim()
      : null
  const descricao =
    payload.COMP_DESCRICAO !== undefined && payload.COMP_DESCRICAO !== null
      ? String(payload.COMP_DESCRICAO).trim()
      : null

  if (!idAtivo || !nome || !modelo) {
    return Response.json(
      { error: 'IDATIVO, COMP_NOME e COMP_MODELO sao obrigatorios.' },
      { status: 400 }
    )
  }

  const ativo = await env.DB.prepare(
    'SELECT id FROM tb_ativo WHERE company_id = ? AND (id = ? OR ATIVO_CODPE = ?)'
  )
    .bind(auth.company_id, idAtivo, idAtivo)
    .first<{ id: string }>()

  if (!ativo) {
    return Response.json({ error: 'Ativo invalido.' }, { status: 400 })
  }

  const insert = await env.DB.prepare(
    `INSERT INTO tb_componente (company_id, IDATIVO, COMP_NOME, COMP_SERIAL, COMP_DATA, COMP_MODELO, COMP_DESCRICAO)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  )
    .bind(
      auth.company_id,
      ativo.id,
      nome,
      serial || null,
      data || null,
      modelo,
      descricao || null
    )
    .run()

  const componentId = Number(insert.meta.last_insert_rowid ?? 0)
  if (!componentId) {
    return Response.json(
      { error: 'Nao foi possivel criar o componente.' },
      { status: 500 }
    )
  }

  const componente = await fetchComponenteWithAsset(
    env,
    auth.company_id,
    componentId
  )

  if (!componente) {
    return Response.json(
      { error: 'Componente criado, mas nao foi possivel recuperar os dados.' },
      { status: 500 }
    )
  }

  return Response.json({ componente })
}

async function handleUpdateComponente(
  request: Request,
  env: Env
): Promise<Response> {
  assertJwtSecret(env)
  const auth = await requireAuth(request, env)
  if (!auth) {
    return Response.json({ error: 'Token invalido.' }, { status: 401 })
  }

  const permissionError = await requirePermission(
    env,
    auth,
    'componentes',
    'edicao'
  )
  if (permissionError) return permissionError

  const payload = await readJson(request)
  if (!payload) {
    return Response.json({ error: 'Dados invalidos.' }, { status: 400 })
  }

  const componentId = Number(payload.IDCOMPONETE ?? '')
  if (!Number.isFinite(componentId)) {
    return Response.json({ error: 'IDCOMPONETE obrigatorio.' }, { status: 400 })
  }

  const existing = await env.DB
    .prepare(
      `SELECT IDCOMPONETE,
              company_id,
              IDATIVO,
              COMP_NOME,
              COMP_SERIAL,
              COMP_DATA,
              COMP_MODELO,
              COMP_DESCRICAO
       FROM tb_componente
       WHERE IDCOMPONETE = ? AND company_id = ?`
    )
    .bind(componentId, auth.company_id)
    .first<ComponenteRow>()

  if (!existing) {
    return Response.json({ error: 'Componente nao encontrado.' }, { status: 404 })
  }

  const nome = String(payload.COMP_NOME ?? existing.COMP_NOME ?? '').trim()
  const modelo = String(payload.COMP_MODELO ?? existing.COMP_MODELO ?? '').trim()
  if (!nome || !modelo) {
    return Response.json(
      { error: 'COMP_NOME e COMP_MODELO sao obrigatorios.' },
      { status: 400 }
    )
  }

  const serial =
    payload.COMP_SERIAL !== undefined
      ? payload.COMP_SERIAL === null
        ? null
        : String(payload.COMP_SERIAL).trim()
      : existing.COMP_SERIAL
  const data =
    payload.COMP_DATA !== undefined
      ? payload.COMP_DATA === null
        ? null
        : String(payload.COMP_DATA).trim()
      : existing.COMP_DATA
  const descricao =
    payload.COMP_DESCRICAO !== undefined
      ? payload.COMP_DESCRICAO === null
        ? null
        : String(payload.COMP_DESCRICAO).trim()
      : existing.COMP_DESCRICAO
  const ativoInput = String(payload.IDATIVO ?? existing.IDATIVO ?? '').trim()
  if (!ativoInput) {
    return Response.json({ error: 'IDATIVO obrigatorio.' }, { status: 400 })
  }

  const ativo = await env.DB
    .prepare(
      `SELECT id
       FROM tb_ativo
       WHERE company_id = ? AND (id = ? OR ATIVO_CODPE = ?)`
    )
    .bind(auth.company_id, ativoInput, ativoInput)
    .first<{ id: string }>()

  if (!ativo) {
    return Response.json({ error: 'Ativo invalido.' }, { status: 400 })
  }

  const updates = [
    'IDATIVO = ?',
    'COMP_NOME = ?',
    'COMP_SERIAL = ?',
    'COMP_DATA = ?',
    'COMP_MODELO = ?',
    'COMP_DESCRICAO = ?'
  ]
  const values = [
    ativo.id,
    nome,
    serial || null,
    data || null,
    modelo,
    descricao || null,
    componentId,
    auth.company_id
  ]

  const changedFields: Array<{ label: string; before: string; after: string }> = []
  const diff = (
    label: string,
    beforeValue: string | null | undefined,
    afterValue: string | null | undefined
  ) => {
    const before = beforeValue ?? ''
    const after = afterValue ?? ''
    if (before !== after) {
      changedFields.push({ label, before, after })
    }
  }

  diff('Componente', existing.COMP_NOME, nome)
  diff('Modelo', existing.COMP_MODELO, modelo)
  diff('Serial', existing.COMP_SERIAL, serial)
  diff('Instalação', existing.COMP_DATA, data)
  diff('Descrição', existing.COMP_DESCRICAO, descricao)

  if (!changedFields.length) {
    return Response.json(
      { error: 'Nenhuma alteração detectada.' },
      { status: 400 }
    )
  }

  await env.DB
    .prepare(
      `UPDATE tb_componente
       SET ${updates.join(', ')}
       WHERE IDCOMPONETE = ? AND company_id = ?`
    )
    .bind(...values)
    .run()

  const now = new Date().toISOString()
  const resumo = changedFields
    .map(change => {
      const beforeValue = change.before || '-'
      const afterValue = change.after || '-'
      return `${change.label}: ${beforeValue} -> ${afterValue}`
    })
    .join(' | ')

  await env.DB.prepare(
    `INSERT INTO tb_componente_alteracao (
       company_id,
       IDCOMPONETE,
       usuario_id,
       data_hora,
       campos_alterados
     ) VALUES (?, ?, ?, ?, ?)`
  )
    .bind(auth.company_id, componentId, auth.user_id, now, resumo)
    .run()

  const componente = await fetchComponenteWithAsset(
    env,
    auth.company_id,
    componentId
  )

  if (!componente) {
    return Response.json(
      { error: 'Componente atualizado, mas nao foi possivel recuperar os dados.' },
      { status: 500 }
    )
  }

  return Response.json({ componente })
}

async function handleComponentesMaintenanceHistory(
  request: Request,
  env: Env
): Promise<Response> {
  assertJwtSecret(env)
  const auth = await requireAuth(request, env)
  if (!auth) {
    return Response.json({ error: 'Token invalido.' }, { status: 401 })
  }

  const permissionError = await requirePermission(
    env,
    auth,
    'componentes',
    'leitura'
  )
  if (permissionError) return permissionError

  const url = new URL(request.url)
  const componentId = Number(url.searchParams.get('component_id') ?? '')
  if (!Number.isFinite(componentId)) {
    return Response.json({ error: 'component_id obrigatorio.' }, { status: 400 })
  }

  const result = await env.DB.prepare(
    `SELECT id, company_id, hist_manut_id_componente, hist_manut_data_hora, hist_manut_id_os, created_at
     FROM tb_componente_manutencao
     WHERE company_id = ? AND hist_manut_id_componente = ?
     ORDER BY hist_manut_data_hora DESC`
  )
    .bind(auth.company_id, componentId)
    .all<ComponenteMaintenanceRow>()

  return Response.json({ history: result.results })
}

async function handleComponentesChangeHistory(
  request: Request,
  env: Env
): Promise<Response> {
  assertJwtSecret(env)
  const auth = await requireAuth(request, env)
  if (!auth) {
    return Response.json({ error: 'Token invalido.' }, { status: 401 })
  }

  const permissionError = await requirePermission(
    env,
    auth,
    'componentes',
    'leitura'
  )
  if (permissionError) return permissionError

  const url = new URL(request.url)
  const componentId = Number(url.searchParams.get('component_id') ?? '')
  if (!Number.isFinite(componentId)) {
    return Response.json({ error: 'component_id obrigatorio.' }, { status: 400 })
  }

  const result = await env.DB.prepare(
    `SELECT id, company_id, IDCOMPONETE, usuario_id, data_hora, campos_alterados, created_at
     FROM tb_componente_alteracao
     WHERE company_id = ? AND IDCOMPONETE = ?
     ORDER BY data_hora DESC`
  )
    .bind(auth.company_id, componentId)
    .all<ComponenteChangeRow>()

  return Response.json({ history: result.results })
}

async function handleListNotas(
  request: Request,
  env: Env
): Promise<Response> {
  assertJwtSecret(env)
  const auth = await requireAuth(request, env)
  if (!auth) {
    return Response.json({ error: 'Token invalido.' }, { status: 401 })
  }
  const permissionError = await requirePermission(env, auth, 'notas', 'leitura')
  if (permissionError) return permissionError

  const url = new URL(request.url)
  const conditions: string[] = ['n.company_id = ?']
  const values: Array<string> = [auth.company_id]

  const search = url.searchParams.get('search')
  if (search) {
    const term = `%${search.trim()}%`
    conditions.push(
      `(a.ATIVO_CODPE LIKE ? OR a.ATIVO_DESCRITIVO_OS LIKE ? OR n.nota_pendencia LIKE ?)`
    )
    values.push(term, term, term)
  }

  const status = normalizeNotaStatus(url.searchParams.get('status'))
  if (status) {
    conditions.push('n.nota_status = ?')
    values.push(status)
  }

  const result = await env.DB.prepare(
    `SELECT n.IDNOTA,
            n.company_id,
            n.id_ativo,
            n.id_os,
            n.nota_pendencia,
            n.nota_status,
            n.nota_data_criada,
            n.nota_data_programada,
            n.nota_data_realizada,
            n.nota_observacao_pcm,
            n.nota_observacao_tecnico,
            a.ATIVO_CODPE,
            a.ATIVO_DESCRITIVO_OS
     FROM tb_nota n
     LEFT JOIN tb_ativo a ON a.id = n.id_ativo AND a.company_id = n.company_id
     WHERE ${conditions.join(' AND ')}
     ORDER BY n.nota_data_criada DESC`
  )
    .bind(...values)
    .all<NotaListRow>()

  return Response.json({ notas: result.results })
}

async function handleGetNotaDetail(
  request: Request,
  env: Env
): Promise<Response> {
  assertJwtSecret(env)
  const auth = await requireAuth(request, env)
  if (!auth) {
    return Response.json({ error: 'Token invalido.' }, { status: 401 })
  }

  const permissionError = await requirePermission(env, auth, 'notas', 'leitura')
  if (permissionError) return permissionError

  const url = new URL(request.url)
  const idParam = url.searchParams.get('id')
  if (!idParam) {
    return Response.json({ error: 'nota_id obrigatorio.' }, { status: 400 })
  }
  const notaId = Number(idParam)
  if (!Number.isFinite(notaId)) {
    return Response.json({ error: 'ID invalido.' }, { status: 400 })
  }

  const nota = await fetchNotaWithAsset(env, auth.company_id, notaId)
  if (!nota) {
    return Response.json({ error: 'Nota nao encontrada.' }, { status: 404 })
  }

  return Response.json({ nota })
}

async function handleNotaChangeHistory(
  request: Request,
  env: Env
): Promise<Response> {
  assertJwtSecret(env)
  const auth = await requireAuth(request, env)
  if (!auth) {
    return Response.json({ error: 'Token invalido.' }, { status: 401 })
  }

  const permissionError = await requirePermission(env, auth, 'notas', 'leitura')
  if (permissionError) return permissionError

  const url = new URL(request.url)
  const notaId = Number(url.searchParams.get('nota_id') ?? '')
  if (!Number.isFinite(notaId)) {
    return Response.json({ error: 'nota_id obrigatorio.' }, { status: 400 })
  }

  const result = await env.DB.prepare(
    `SELECT id, company_id, IDNOTA, usuario_id, data_hora, campos_alterados, created_at
     FROM tb_nota_alteracao
     WHERE company_id = ? AND IDNOTA = ?
     ORDER BY data_hora DESC`
  )
    .bind(auth.company_id, notaId)
    .all<NotaChangeRow>()

  return Response.json({ history: result.results })
}

async function handleCreateNotas(
  request: Request,
  env: Env
): Promise<Response> {
  assertJwtSecret(env)
  const auth = await requireAuth(request, env)
  if (!auth) {
    return Response.json({ error: 'Token invalido.' }, { status: 401 })
  }

  const permissionError = await requirePermission(env, auth, 'notas', 'criacao')
  if (permissionError) return permissionError

  const payload = await readJson(request)
  if (!payload) {
    return Response.json({ error: 'Dados invalidos.' }, { status: 400 })
  }

  const ativosInput = Array.isArray(payload.ativos)
    ? payload.ativos.map(value => String(value ?? '').trim())
    : []
  if (!ativosInput.length && payload.IDATIVO) {
    ativosInput.push(String(payload.IDATIVO).trim())
  }
  const ativos = ativosInput.filter(Boolean)

  const pendencia = String(payload.nota_pendencia ?? '').trim()
  const status = normalizeNotaStatus(payload.nota_status)
  if (!ativos.length || !pendencia || !status) {
    return Response.json(
      { error: 'Ativo, pendencia e status sao obrigatorios.' },
      { status: 400 }
    )
  }

  const idOs =
    payload.id_os !== undefined && payload.id_os !== null
      ? String(payload.id_os).trim()
      : null
  const descricaoPcm =
    payload.nota_observacao_pcm !== undefined && payload.nota_observacao_pcm !== null
      ? String(payload.nota_observacao_pcm).trim()
      : null
  const descricaoTecnico =
    payload.nota_observacao_tecnico !== undefined &&
    payload.nota_observacao_tecnico !== null
      ? String(payload.nota_observacao_tecnico).trim()
      : null
  const dataProgramada =
    payload.nota_data_programada !== undefined &&
    payload.nota_data_programada !== null
      ? String(payload.nota_data_programada).trim()
      : null
  const dataRealizada =
    payload.nota_data_realizada !== undefined &&
    payload.nota_data_realizada !== null
      ? String(payload.nota_data_realizada).trim()
      : null

  const noteStmt = env.DB.prepare(
    `INSERT INTO tb_nota (
       company_id,
       id_ativo,
       id_os,
       nota_pendencia,
       nota_status,
       nota_data_programada,
       nota_data_realizada,
       nota_observacao_pcm,
       nota_observacao_tecnico
     ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  )

  const created: NotaListRow[] = []
  for (const ativoCodpe of ativos) {
    if (!ativoCodpe) continue
    const ativo = await env.DB
      .prepare(
        `SELECT id FROM tb_ativo WHERE company_id = ? AND (id = ? OR ATIVO_CODPE = ?)`
      )
      .bind(auth.company_id, ativoCodpe, ativoCodpe)
      .first<{ id: string }>()

    if (!ativo) {
      return Response.json({ error: `Ativo ${ativoCodpe} invalido.` }, { status: 400 })
    }

    const result = await noteStmt
      .bind(
        auth.company_id,
        ativo.id,
        idOs || null,
        pendencia,
        status,
        dataProgramada || null,
        dataRealizada || null,
        descricaoPcm || null,
        descricaoTecnico || null
      )
      .run()
    const notaId = Number(result.meta.last_insert_rowid ?? 0)
    if (!notaId) continue
    const record = await fetchNotaWithAsset(env, auth.company_id, notaId)
    if (record) {
      created.push(record)
    }
  }

  if (!created.length) {
    return Response.json(
      { error: 'Nao foi possivel criar as notas.' },
      { status: 500 }
    )
  }

  return Response.json({ notas: created })
}

async function handleUpdateNota(
  request: Request,
  env: Env
): Promise<Response> {
  assertJwtSecret(env)
  const auth = await requireAuth(request, env)
  if (!auth) {
    return Response.json({ error: 'Token invalido.' }, { status: 401 })
  }

  const permissionError = await requirePermission(env, auth, 'notas', 'edicao')
  if (permissionError) return permissionError

  const payload = await readJson(request)
  if (!payload) {
    return Response.json({ error: 'Dados invalidos.' }, { status: 400 })
  }

  const notaId = Number(payload.IDNOTA ?? '')
  if (!Number.isFinite(notaId)) {
    return Response.json({ error: 'IDNOTA obrigatorio.' }, { status: 400 })
  }

  const existing = await env.DB
    .prepare(
      `SELECT IDNOTA,
              company_id,
              id_ativo,
              id_os,
              nota_pendencia,
              nota_status,
              nota_data_programada,
              nota_data_realizada,
              nota_observacao_pcm,
              nota_observacao_tecnico
       FROM tb_nota
       WHERE IDNOTA = ? AND company_id = ?`
    )
    .bind(notaId, auth.company_id)
    .first<NotaRow>()

  if (!existing) {
    return Response.json({ error: 'Nota nao encontrada.' }, { status: 404 })
  }

  const pendencia = String(payload.nota_pendencia ?? existing.nota_pendencia ?? '').trim()
  const status = normalizeNotaStatus(
    payload.nota_status ?? existing.nota_status
  )
  if (!pendencia || !status) {
    return Response.json(
      { error: 'Pendencia e status sao obrigatorios.' },
      { status: 400 }
    )
  }

  const idOs =
    payload.id_os !== undefined
      ? payload.id_os === null
        ? null
        : String(payload.id_os).trim()
      : existing.id_os
  const descricaoPcm =
    payload.nota_observacao_pcm !== undefined
      ? payload.nota_observacao_pcm === null
        ? null
        : String(payload.nota_observacao_pcm).trim()
      : existing.nota_observacao_pcm
  const descricaoTecnico =
    payload.nota_observacao_tecnico !== undefined
      ? payload.nota_observacao_tecnico === null
        ? null
        : String(payload.nota_observacao_tecnico).trim()
      : existing.nota_observacao_tecnico
  const dataProgramada =
    payload.nota_data_programada !== undefined
      ? payload.nota_data_programada === null
        ? null
        : String(payload.nota_data_programada).trim()
      : existing.nota_data_programada
  const dataRealizada =
    payload.nota_data_realizada !== undefined
      ? payload.nota_data_realizada === null
        ? null
        : String(payload.nota_data_realizada).trim()
      : existing.nota_data_realizada
  const ativoInput = String(payload.IDATIVO ?? existing.id_ativo ?? '').trim()
  if (!ativoInput) {
    return Response.json({ error: 'IDATIVO obrigatorio.' }, { status: 400 })
  }

  const ativo = await env.DB
    .prepare(
      `SELECT id
       FROM tb_ativo
       WHERE company_id = ? AND (id = ? OR ATIVO_CODPE = ?)`
    )
    .bind(auth.company_id, ativoInput, ativoInput)
    .first<{ id: string }>()

  if (!ativo) {
    return Response.json({ error: 'Ativo invalido.' }, { status: 400 })
  }

  const updates = [
    'id_ativo = ?',
    'id_os = ?',
    'nota_pendencia = ?',
    'nota_status = ?',
    'nota_data_programada = ?',
    'nota_data_realizada = ?',
    'nota_observacao_pcm = ?',
    'nota_observacao_tecnico = ?'
  ]
  const values = [
    ativo.id,
    idOs || null,
    pendencia,
    status,
    dataProgramada || null,
    dataRealizada || null,
    descricaoPcm || null,
    descricaoTecnico || null,
    notaId,
    auth.company_id
  ]

  const changedFields: Array<{ label: string; before: string; after: string }> = []
  const diff = (
    label: string,
    beforeValue: string | null | undefined,
    afterValue: string | null | undefined
  ) => {
    const before = beforeValue ?? ''
    const after = afterValue ?? ''
    if (before !== after) {
      changedFields.push({ label, before, after })
    }
  }

  diff('Pendência', existing.nota_pendencia, pendencia)
  diff('Status', existing.nota_status, status)
  diff('Ativo', existing.id_ativo, ativo.id)
  diff('OS', existing.id_os, idOs)
  diff('Programada', existing.nota_data_programada, dataProgramada)
  diff('Realizada', existing.nota_data_realizada, dataRealizada)
  diff('Obs PCM', existing.nota_observacao_pcm, descricaoPcm)
  diff('Obs Técnico', existing.nota_observacao_tecnico, descricaoTecnico)

  if (!changedFields.length) {
    return Response.json(
      { error: 'Nenhuma alteração detectada.' },
      { status: 400 }
    )
  }

  await env.DB
    .prepare(
      `UPDATE tb_nota
       SET ${updates.join(', ')}
       WHERE IDNOTA = ? AND company_id = ?`
    )
    .bind(...values)
    .run()

  const now = new Date().toISOString()
  const resumo = changedFields
    .map(change => `${change.label}: ${change.before || '-'} -> ${change.after || '-'}`)
    .join(' | ')

  await env.DB.prepare(
    `INSERT INTO tb_nota_alteracao (
       company_id,
       IDNOTA,
       usuario_id,
       data_hora,
       campos_alterados
     ) VALUES (?, ?, ?, ?, ?)`
  )
    .bind(auth.company_id, notaId, auth.user_id, now, resumo)
    .run()

  const nota = await fetchNotaWithAsset(env, auth.company_id, notaId)
  if (!nota) {
    return Response.json(
      { error: 'Nota atualizada, mas nao foi possivel recuperar os dados.' },
      { status: 500 }
    )
  }

  return Response.json({ nota })
}

function normalizeBooleanFlag(value: unknown, fallback: 0 | 1): 0 | 1 {
  if (value === false || value === 'false' || value === 0 || value === '0') {
    return 0
  }
  if (value === true || value === 'true' || value === 1 || value === '1') {
    return 1
  }
  return fallback
}

function normalizeOptionalString(value: unknown): string | null {
  const text = String(value ?? '').trim()
  return text ? text : null
}

async function handleListTarefas(
  request: Request,
  env: Env
): Promise<Response> {
  assertJwtSecret(env)
  const auth = await requireAuth(request, env)
  if (!auth) {
    return Response.json({ error: 'Token invalido.' }, { status: 401 })
  }

  const permissionError = await requirePermission(env, auth, 'tarefas', 'leitura')
  if (permissionError) return permissionError

  const url = new URL(request.url)
  const pageParam = Number(url.searchParams.get('page') ?? '1')
  const perPageParam = Number(url.searchParams.get('per_page') ?? '20')
  const sortKey = url.searchParams.get('sort') === 'tarefa' ? 'tarefa' : 'sigla'
  const sortDir =
    url.searchParams.get('order') === 'desc' ? 'DESC' : 'ASC'

  const page = Math.max(1, Number.isFinite(pageParam) ? Math.trunc(pageParam) : 1)
  const perPage = Math.min(
    100,
    Math.max(5, Number.isFinite(perPageParam) ? Math.trunc(perPageParam) : 20)
  )

  const conditions: string[] = ['company_id = ?']
  const values: Array<string | number> = [auth.company_id]

  const siglaFilter = normalizeOptionalString(url.searchParams.get('sigla'))
  if (siglaFilter) {
    conditions.push('sigla LIKE ?')
    values.push(`%${siglaFilter}%`)
  }

  const sistemaFilter = normalizeOptionalString(url.searchParams.get('sistema'))
  if (sistemaFilter) {
    conditions.push('sistema LIKE ?')
    values.push(`%${sistemaFilter}%`)
  }

  const activeParam = url.searchParams.get('active')
  if (activeParam === 'false') {
    conditions.push('active = ?')
    values.push(0)
  } else if (activeParam === 'true' || activeParam === null) {
    conditions.push('active = ?')
    values.push(1)
  }

  const countResult = await env.DB
    .prepare(
      `SELECT COUNT(*) AS total
       FROM tb_tarefas
       WHERE ${conditions.join(' AND ')}`
    )
    .bind(...values)
    .first<{ total: number }>()

  const offset = (page - 1) * perPage
  const query = env.DB.prepare(
    `SELECT id,
            company_id,
            id_sigla,
            sigla,
            tarefa,
            medicao,
            criticidade,
            periodicidade,
            sub_sistema,
            sistema,
            codigo,
            active,
            created_at,
            updated_at,
            created_by,
            updated_by
     FROM tb_tarefas
     WHERE ${conditions.join(' AND ')}
     ORDER BY ${sortKey} ${sortDir}
     LIMIT ? OFFSET ?`
  )

  const result = await query.bind(...values, perPage, offset).all<TarefaRow>()

  const tarefas = result.results.map(row => ({
    ...row,
    medicao: row.medicao === 1,
    criticidade: row.criticidade === 1,
    active: row.active === 1
  }))

  return Response.json({
    tarefas,
    meta: {
      total: countResult?.total ?? 0,
      page,
      per_page: perPage
    }
  })
}

const MAX_TASK_BATCH = 50

async function handleCreateTarefa(
  request: Request,
  env: Env
): Promise<Response> {
  assertJwtSecret(env)
  const auth = await requireAuth(request, env)
  if (!auth) {
    return Response.json({ error: 'Token invalido.' }, { status: 401 })
  }

  const permissionError = await requirePermission(env, auth, 'tarefas', 'criacao')
  if (permissionError) return permissionError

  const payload = await readJson(request)
  if (!payload) {
    return Response.json({ error: 'Dados invalidos.' }, { status: 400 })
  }

  const sigla = String(payload.sigla || '').trim()
  if (!sigla) {
    return Response.json({ error: 'Sigla é obrigatória.' }, { status: 400 })
  }
  const idSigla = String(payload.id_sigla || sigla).trim()
  if (!idSigla) {
    return Response.json(
      { error: 'Identificador da sigla é obrigatório.' },
      { status: 400 }
    )
  }

  const tarefasPayload = Array.isArray(payload.tarefas) && payload.tarefas.length
    ? payload.tarefas
    : [payload]

  if (!tarefasPayload.length) {
    return Response.json(
      { error: 'Nenhuma tarefa foi enviada para criação.' },
      { status: 400 }
    )
  }

  if (tarefasPayload.length > MAX_TASK_BATCH) {
    return Response.json(
      { error: `O lote pode conter no máximo ${MAX_TASK_BATCH} tarefas.` },
      { status: 400 }
    )
  }

  const errors: string[] = []
  const normalizedRows: {
    tarefa: string
    codigo: string
    periodicidade: number
    sistema: string
    sub_sistema: string
    medicao: 0 | 1
    criticidade: 0 | 1
    active: 0 | 1
    sigla: string
    id_sigla: string
  }[] = []
  const seen = new Set<string>()

  tarefasPayload.forEach((item, index) => {
    const rowErrors: string[] = []
    const tarefa = String(item.tarefa ?? '').trim()
    const codigo = String(item.codigo ?? '').trim()
    const periodicidadeRaw = Number(item.periodicidade ?? '')
    const sistema = String(item.sistema ?? '').trim()
    const subSistema = String(item.sub_sistema ?? '').trim()
    const rowSigla = String(item.sigla ?? sigla).trim()
    const rowIdSigla = String(item.id_sigla ?? idSigla).trim()
    if (!tarefa) {
      rowErrors.push('Descrição da tarefa é obrigatória.')
    }
    if (!codigo) {
      rowErrors.push('Código interno é obrigatório.')
    }
    if (!Number.isFinite(periodicidadeRaw)) {
      rowErrors.push('Periodicidade inválida.')
    } else if (!Number.isInteger(periodicidadeRaw)) {
      rowErrors.push('Periodicidade deve ser um número inteiro.')
    } else if (periodicidadeRaw < 1 || periodicidadeRaw > 60) {
      rowErrors.push('Periodicidade precisa estar entre 1 e 60.')
    }
    if (!sistema) {
      rowErrors.push('Sistema é obrigatório.')
    }
    if (!subSistema) {
      rowErrors.push('Sub sistema é obrigatório.')
    }
    if (!rowSigla) {
      rowErrors.push('Sigla é obrigatória.')
    }
    if (!rowIdSigla) {
      rowErrors.push('Identificador da sigla é obrigatório.')
    }
    if (rowErrors.length) {
      errors.push(`Linha ${index + 1}: ${rowErrors.join(' ')}`)
    } else {
      const key = `${rowSigla}::${codigo}`
      if (seen.has(key)) {
        errors.push(
          `Linha ${index + 1}: Já existem duas tarefas com a mesma sigla e código no lote.`
        )
      } else {
        seen.add(key)
        normalizedRows.push({
          tarefa,
          codigo,
          periodicidade: Math.trunc(periodicidadeRaw),
          sistema,
          sub_sistema: subSistema,
          medicao: normalizeBooleanFlag(item.medicao, 0),
          criticidade: normalizeBooleanFlag(item.criticidade, 0),
          active: normalizeBooleanFlag(item.active, 1),
          sigla: rowSigla,
          id_sigla: rowIdSigla
        })
      }
    }
  })

  if (errors.length) {
    return Response.json({ error: errors.join(' ') }, { status: 400 })
  }

  for (let i = 0; i < normalizedRows.length; i++) {
    const row = normalizedRows[i]
      const existing = await env.DB
        .prepare(
          `SELECT id
           FROM tb_tarefas
           WHERE company_id = ? AND sigla = ? AND codigo = ?`
        )
        .bind(auth.company_id, row.sigla, row.codigo)
        .first<{ id: string }>()

    if (existing) {
      return Response.json(
        {
          error: `Linha ${i + 1}: Já existe uma tarefa com essa sigla e código.`
        },
        { status: 409 }
      )
    }
  }

  const now = new Date().toISOString()

  await env.DB.prepare('BEGIN').run()
  try {
    for (const row of normalizedRows) {
      const id = crypto.randomUUID()
      await env.DB
        .prepare(
           `INSERT INTO tb_tarefas (
             id,
             company_id,
             id_sigla,
             sigla,
             tarefa,
             medicao,
             criticidade,
             periodicidade,
             sub_sistema,
             sistema,
             codigo,
             active,
             created_at,
             updated_at,
             created_by,
             updated_by
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
        )
        .bind(
          id,
          auth.company_id,
          row.id_sigla,
          row.sigla,
          row.tarefa,
          row.medicao,
          row.criticidade,
          row.periodicidade,
          row.sub_sistema,
          row.sistema,
          row.codigo,
          row.active,
          now,
          now,
          auth.user_id,
          auth.user_id
        )
        .run()
    }
    await env.DB.prepare('COMMIT').run()
  } catch (err) {
    await env.DB.prepare('ROLLBACK').run()
    throw err
  }

  return Response.json({ ok: true, created: normalizedRows.length })
}

async function handleUpdateTarefa(
  request: Request,
  env: Env
): Promise<Response> {
  assertJwtSecret(env)
  const auth = await requireAuth(request, env)
  if (!auth) {
    return Response.json({ error: 'Token invalido.' }, { status: 401 })
  }

  const permissionError = await requirePermission(env, auth, 'tarefas', 'edicao')
  if (permissionError) return permissionError

  const payload = await readJson(request)
  if (!payload) {
    return Response.json({ error: 'Dados invalidos.' }, { status: 400 })
  }

  const tarefaId = String(payload.id || '').trim()
  if (!tarefaId) {
    return Response.json({ error: 'ID da tarefa obrigatorio.' }, { status: 400 })
  }

  const existing = await env.DB
    .prepare(
      `SELECT *
       FROM tb_tarefas
       WHERE id = ? AND company_id = ?`
    )
    .bind(tarefaId, auth.company_id)
    .first<TarefaRow>()

  if (!existing) {
    return Response.json({ error: 'Tarefa nao encontrada.' }, { status: 404 })
  }

  const sigla = String(payload.sigla ?? existing.sigla).trim()
  const codigo = String(payload.codigo ?? existing.codigo).trim()
  const tarefa = String(payload.tarefa ?? existing.tarefa).trim()
  if (!sigla || !codigo || !tarefa) {
    return Response.json(
      { error: 'Sigla, codigo e tarefa sao obrigatorios.' },
      { status: 400 }
    )
  }
  if (tarefa.length > 255) {
    return Response.json(
      { error: 'A descricao da tarefa nao pode ultrapassar 255 caracteres.' },
      { status: 400 }
    )
  }

  const periodicidadeRaw =
    payload.periodicidade !== undefined
      ? Number(payload.periodicidade)
      : existing.periodicidade
  if (!Number.isFinite(periodicidadeRaw)) {
    return Response.json(
      { error: 'Periodicidade invalida.' },
      { status: 400 }
    )
  }
  const periodicidade = Math.trunc(periodicidadeRaw)
  if (periodicidade < 1 || periodicidade > 60) {
    return Response.json(
      { error: 'Periodicidade deve estar entre 1 e 60.' },
      { status: 400 }
    )
  }

  const idSigla = String(payload.id_sigla ?? existing.id_sigla).trim()
  if (!idSigla) {
    return Response.json(
      { error: 'Identificador da sigla e obrigatorio.' },
      { status: 400 }
    )
  }

  if (sigla !== existing.sigla || codigo !== existing.codigo) {
    const conflict = await env.DB
      .prepare(
        `SELECT id
         FROM tb_tarefas
         WHERE company_id = ? AND sigla = ? AND codigo = ? AND id != ?`
      )
      .bind(auth.company_id, sigla, codigo, tarefaId)
      .first<{ id: string }>()

    if (conflict) {
      return Response.json(
        { error: 'Ja existe uma tarefa com essa sigla e codigo.' },
        { status: 409 }
      )
    }
  }

  const medicao = normalizeBooleanFlag(payload.medicao, existing.medicao)
  const criticidade = normalizeBooleanFlag(
    payload.criticidade,
    existing.criticidade
  )
  const active = normalizeBooleanFlag(payload.active, existing.active)
  const sistema =
    payload.sistema !== undefined
      ? normalizeOptionalString(payload.sistema)
      : existing.sistema
  const subSistema =
    payload.sub_sistema !== undefined
      ? normalizeOptionalString(payload.sub_sistema)
      : existing.sub_sistema
  const now = new Date().toISOString()

  await env.DB
    .prepare(
      `UPDATE tb_tarefas
       SET id_sigla = ?,
           sigla = ?,
           tarefa = ?,
           medicao = ?,
           criticidade = ?,
           periodicidade = ?,
           sub_sistema = ?,
           sistema = ?,
           codigo = ?,
           active = ?,
           updated_at = ?,
           updated_by = ?
       WHERE id = ? AND company_id = ?`
    )
    .bind(
      idSigla,
      sigla,
      tarefa,
      medicao,
      criticidade,
      periodicidade,
      subSistema,
      sistema,
      codigo,
      active,
      now,
      auth.user_id,
      tarefaId,
      auth.company_id
    )
    .run()

  return Response.json({ ok: true })
}

async function fetchNotaWithAsset(
  env: Env,
  companyId: string,
  notaId: number
): Promise<NotaListRow | null> {
  return env.DB
    .prepare(
      `SELECT n.IDNOTA,
              n.company_id,
              n.id_ativo,
              n.id_os,
              n.nota_pendencia,
              n.nota_status,
              n.nota_data_criada,
              n.nota_data_programada,
              n.nota_data_realizada,
              n.nota_observacao_pcm,
              n.nota_observacao_tecnico,
              a.ATIVO_CODPE,
              a.ATIVO_DESCRITIVO_OS
       FROM tb_nota n
       LEFT JOIN tb_ativo a ON a.id = n.id_ativo AND a.company_id = n.company_id
       WHERE n.company_id = ? AND n.IDNOTA = ?`
    )
    .bind(companyId, notaId)
    .first<NotaListRow>()
}

async function handleDeleteComponente(
  request: Request,
  env: Env
): Promise<Response> {
  assertJwtSecret(env)
  const auth = await requireAuth(request, env)
  if (!auth) {
    return Response.json({ error: 'Token invalido.' }, { status: 401 })
  }

  const permissionError = await requirePermission(
    env,
    auth,
    'componentes',
    'exclusao'
  )
  if (permissionError) return permissionError

  const url = new URL(request.url)
  const segments = url.pathname.split('/').filter(Boolean)
  const rawId = segments[segments.length - 1]
  const componentId = Number(rawId ?? '')
  if (!Number.isFinite(componentId)) {
    return Response.json({ error: 'ID invalido.' }, { status: 400 })
  }

  const result = await env.DB.prepare(
    'DELETE FROM tb_componente WHERE IDCOMPONETE = ? AND company_id = ?'
  )
    .bind(componentId, auth.company_id)
    .run()

  if ((result.meta?.changes ?? 0) === 0) {
    return Response.json({ error: 'Componente nao encontrado.' }, { status: 404 })
  }

  return Response.json({ ok: true })
}

async function fetchComponenteWithAsset(
  env: Env,
  companyId: string,
  componentId: number
): Promise<ComponenteListRow | null> {
  return env.DB
    .prepare(
      `SELECT c.IDCOMPONETE,
              c.company_id,
              c.IDATIVO,
              c.COMP_NOME,
              c.COMP_SERIAL,
              c.COMP_DATA,
              c.COMP_MODELO,
              c.COMP_DESCRICAO,
              a.ATIVO_CODPE,
              a.ATIVO_DESCRITIVO_OS,
              a.ATIVO_SIGLA,
              a.ATIVO_COORDENACAO,
              a.ATIVO_EQUIPE
       FROM tb_componente c
       LEFT JOIN tb_ativo a ON a.id = c.IDATIVO AND a.company_id = c.company_id
       WHERE c.company_id = ? AND c.IDCOMPONETE = ?`
    )
    .bind(companyId, componentId)
    .first<ComponenteListRow>()
}

async function handleGetAtivo(request: Request, env: Env): Promise<Response> {
  assertJwtSecret(env)
  const auth = await requireAuth(request, env)
  if (!auth) {
    return Response.json({ error: 'Token invalido.' }, { status: 401 })
  }

  const url = new URL(request.url)
  const id = url.searchParams.get('id')
  const codpe = url.searchParams.get('codpe')

  if (!id && !codpe) {
    return Response.json({ error: 'id ou codpe obrigatorio.' }, { status: 400 })
  }

  const query = id
    ? env.DB.prepare(
        `SELECT *
         FROM tb_ativo
         WHERE id = ? AND company_id = ?`
      ).bind(id, auth.company_id)
    : env.DB.prepare(
        `SELECT *
         FROM tb_ativo
         WHERE ATIVO_CODPE = ? AND company_id = ?`
      ).bind(codpe, auth.company_id)

  const ativo = await query.first<AtivoRow>()

  if (!ativo) {
    return Response.json({ error: 'Ativo nao encontrado.' }, { status: 404 })
  }

  return Response.json({ ativo })
}

async function handleCreateAtivo(request: Request, env: Env): Promise<Response> {
  assertJwtSecret(env)
  const auth = await requireAuth(request, env)
  if (!auth) {
    return Response.json({ error: 'Token invalido.' }, { status: 401 })
  }

  const payload = await readJson(request)
  if (!payload) {
    return Response.json({ error: 'Dados invalidos.' }, { status: 400 })
  }

  const ativoEmpresa = normalizeAtivoField(payload.ATIVO_EMPRESA)
  const ativoCodpe = normalizeAtivoField(payload.ATIVO_CODPE)
  const ativoDescritivo = normalizeAtivoField(payload.ATIVO_DESCRITIVO_OS)
  const ativoStatus = normalizeAtivoField(payload.ATIVO_STATUS)
  const ativoCoordenacao = normalizeAtivoField(payload.ATIVO_COORDENACAO)
  const ativoEquipe = normalizeAtivoField(payload.ATIVO_EQUIPE)
  const ativoMonitorados = normalizeAtivoField(payload.ATIVO_MONITORADOS)
  const ativoSigla = normalizeAtivoField(payload.ATIVO_SIGLA)
  const ativoCiclo = normalizeAtivoField(payload.ATIVO_CICLO)
  const contadorCiclo = normalizeAtivoField(payload.CONTADOR_CICLO)
  const ativoTolerancia = normalizeAtivoField(payload.ATIVO_TOLERANCIA)
  const ativoClasse = normalizeAtivoField(payload.ATIVO_CLASSE)
  const ativoGrupo = normalizeAtivoField(payload.ATIVO_GRUPO)
  const ativoOea = normalizeAtivoField(payload.ATIVO_OEA)
  const ativoTmm = normalizeAtivoField(payload.ATIVO_TMM)

  const requiredFields = [
    ativoEmpresa,
    ativoCodpe,
    ativoDescritivo,
    ativoStatus,
    ativoCoordenacao,
    ativoEquipe,
    ativoMonitorados,
    ativoSigla,
    ativoCiclo,
    contadorCiclo,
    ativoTolerancia,
    ativoClasse,
    ativoGrupo,
    ativoOea,
    ativoTmm
  ]

  if (requiredFields.some(value => !value)) {
    return Response.json(
      { error: 'Preencha todos os campos obrigatorios.' },
      { status: 400 }
    )
  }

  if (ativoCoordenacao.length > 20) {
    return Response.json(
      { error: 'Coordenacao deve ter no maximo 20 caracteres.' },
      { status: 400 }
    )
  }
  if (ativoEquipe.length > 10) {
    return Response.json(
      { error: 'Equipe deve ter no maximo 10 caracteres.' },
      { status: 400 }
    )
  }

  const company = await env.DB.prepare(
    'SELECT id, status FROM tb_company WHERE id = ?'
  )
    .bind(auth.company_id)
    .first<CompanyRow>()

  if (!company || company.status !== 'ativo') {
    return Response.json({ error: 'Empresa invalida.' }, { status: 400 })
  }

    const estrutura = await env.DB.prepare(
      `SELECT id FROM tb_estrutura
       WHERE company_id = ? AND coordenacao = ? AND equipe = ? AND status = 'ativo' AND execucao = 'sim'`
    )
      .bind(auth.company_id, ativoCoordenacao, ativoEquipe)
      .first<{ id: string }>()

  if (!estrutura) {
    return Response.json(
      { error: 'Coordenacao/equipe invalida.' },
      { status: 400 }
    )
  }

  const conflict = await env.DB.prepare(
    'SELECT id FROM tb_ativo WHERE company_id = ? AND ATIVO_CODPE = ?'
  )
    .bind(auth.company_id, ativoCodpe)
    .first<{ id: string }>()

  if (conflict) {
    return Response.json({ error: 'ATIVO_CODPE ja existe.' }, { status: 409 })
  }

  const ativoId = crypto.randomUUID()
  const ativoContador = 1

  const optionalField = (value: unknown) => {
    const normalized = value ? String(value).trim() : ''
    return normalized ? normalized : null
  }

  const insertValues = {
    id: ativoId,
    company_id: auth.company_id,
    ATIVO_EMPRESA: ativoEmpresa,
    ATIVO_CODPE: ativoCodpe,
    ATIVO_DESCRITIVO_OS: ativoDescritivo,
    ATIVO_STATUS: ativoStatus,
    ATIVO_COORDENACAO: ativoCoordenacao,
    ATIVO_EQUIPE: ativoEquipe,
    ATIVO_MONITORADOS: ativoMonitorados,
    ATIVO_SIGLA: ativoSigla,
    ATIVO_CICLO: ativoCiclo,
    ATIVO_CONTADOR: ativoContador,
    CONTADOR_CICLO: contadorCiclo,
    ATIVO_TOLERANCIA: ativoTolerancia,
    ATIVO_CLASSE: ativoClasse,
    ATIVO_GRUPO: ativoGrupo,
    ATIVO_OEA: ativoOea,
    ATIVO_TMM: ativoTmm,
    ATIVO_LATITUDE: optionalField(payload.ATIVO_LATITUDE),
    ATIVO_LONGITUDE: optionalField(payload.ATIVO_LONGITUDE),
    ATIVO_ULTIMA_MANUT: optionalField(payload.ATIVO_ULTIMA_MANUT),
    ATIVO_MODELO_POSTE: optionalField(payload.ATIVO_MODELO_POSTE),
    ATIVO_MODELO_RELE: optionalField(payload.ATIVO_MODELO_RELE),
    ATIVO_MODELO_DDS: optionalField(payload.ATIVO_MODELO_DDS),
    ATIVO_DDS_SERIAL: optionalField(payload.ATIVO_DDS_SERIAL),
    ATIVO_DDS_DTQ: optionalField(payload.ATIVO_DDS_DTQ),
    ATIVO_MYTRAIN: optionalField(payload.ATIVO_MYTRAIN),
    ATIVO_JAMPER1: optionalField(payload.ATIVO_JAMPER1),
    ATIVO_JAMPER2: optionalField(payload.ATIVO_JAMPER2),
    ATIVO_MODELO: optionalField(payload.ATIVO_MODELO),
    ATIVO_OBSERVACAO: optionalField(payload.ATIVO_OBSERVACAO)
  }

  await env.DB.prepare(
    `INSERT INTO tb_ativo (
      id,
      company_id,
      ATIVO_EMPRESA,
      ATIVO_CODPE,
      ATIVO_DESCRITIVO_OS,
      ATIVO_STATUS,
      ATIVO_COORDENACAO,
      ATIVO_EQUIPE,
      ATIVO_MONITORADOS,
      ATIVO_SIGLA,
      ATIVO_CICLO,
      ATIVO_CONTADOR,
      CONTADOR_CICLO,
      ATIVO_TOLERANCIA,
      ATIVO_CLASSE,
      ATIVO_GRUPO,
      ATIVO_OEA,
      ATIVO_TMM,
      ATIVO_LATITUDE,
      ATIVO_LONGITUDE,
      ATIVO_ULTIMA_MANUT,
      ATIVO_MODELO_POSTE,
      ATIVO_MODELO_RELE,
      ATIVO_MODELO_DDS,
      ATIVO_DDS_SERIAL,
      ATIVO_DDS_DTQ,
      ATIVO_MYTRAIN,
      ATIVO_JAMPER1,
      ATIVO_JAMPER2,
      ATIVO_MODELO,
      ATIVO_OBSERVACAO
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  )
    .bind(
      insertValues.id,
      insertValues.company_id,
      insertValues.ATIVO_EMPRESA,
      insertValues.ATIVO_CODPE,
      insertValues.ATIVO_DESCRITIVO_OS,
      insertValues.ATIVO_STATUS,
      insertValues.ATIVO_COORDENACAO,
      insertValues.ATIVO_EQUIPE,
      insertValues.ATIVO_MONITORADOS,
      insertValues.ATIVO_SIGLA,
      insertValues.ATIVO_CICLO,
      insertValues.ATIVO_CONTADOR,
      insertValues.CONTADOR_CICLO,
      insertValues.ATIVO_TOLERANCIA,
      insertValues.ATIVO_CLASSE,
      insertValues.ATIVO_GRUPO,
      insertValues.ATIVO_OEA,
      insertValues.ATIVO_TMM,
      insertValues.ATIVO_LATITUDE,
      insertValues.ATIVO_LONGITUDE,
      insertValues.ATIVO_ULTIMA_MANUT,
      insertValues.ATIVO_MODELO_POSTE,
      insertValues.ATIVO_MODELO_RELE,
      insertValues.ATIVO_MODELO_DDS,
      insertValues.ATIVO_DDS_SERIAL,
      insertValues.ATIVO_DDS_DTQ,
      insertValues.ATIVO_MYTRAIN,
      insertValues.ATIVO_JAMPER1,
      insertValues.ATIVO_JAMPER2,
      insertValues.ATIVO_MODELO,
      insertValues.ATIVO_OBSERVACAO
    )
    .run()

  await logAtivoHistory(env, {
    companyId: auth.company_id,
    ativoId,
    action: 'criado',
    beforeData: null,
    afterData: JSON.stringify(insertValues),
    changedByUserId: auth.user_id,
    changedByName: auth.nome
  })

  const ativo = await env.DB.prepare(
    `SELECT * FROM tb_ativo WHERE id = ? AND company_id = ?`
  )
    .bind(ativoId, auth.company_id)
    .first<AtivoRow>()

  return Response.json({ ativo }, { status: 201 })
}

async function handleUpdateAtivo(request: Request, env: Env): Promise<Response> {
  assertJwtSecret(env)
  const auth = await requireAuth(request, env)
  if (!auth) {
    return Response.json({ error: 'Token invalido.' }, { status: 401 })
  }

  const payload = await readJson(request)
  if (!payload) {
    return Response.json({ error: 'Dados invalidos.' }, { status: 400 })
  }

  const id = String(payload.id || '').trim()
  if (!id) {
    return Response.json({ error: 'ID obrigatorio.' }, { status: 400 })
  }

  const existing = await env.DB.prepare(
    `SELECT * FROM tb_ativo WHERE id = ? AND company_id = ?`
  )
    .bind(id, auth.company_id)
    .first<AtivoRow>()

  if (!existing) {
    return Response.json({ error: 'Ativo nao encontrado.' }, { status: 404 })
  }

  if (payload.ATIVO_STATUS !== undefined) {
    const nextStatus = String(payload.ATIVO_STATUS || '').trim().toLowerCase()
    if (nextStatus === 'inativo' && existing.ATIVO_STATUS.toLowerCase() !== 'inativo') {
      const permissionError = await requirePermission(
        env,
        auth,
        'ativos',
        'exclusao'
      )
      if (permissionError) return permissionError
    }
  }

  const nextStatusValue =
    payload.ATIVO_STATUS !== undefined
      ? String(payload.ATIVO_STATUS || '').trim()
      : existing.ATIVO_STATUS
  const statusChanged =
    payload.ATIVO_STATUS !== undefined &&
    nextStatusValue.toLowerCase() !== existing.ATIVO_STATUS.toLowerCase()
  const normalizedStatus = nextStatusValue.toLowerCase()
  const statusLogPayload =
    (payload.status_log as Record<string, unknown> | undefined) ?? undefined
  let statusLogEntry:
    | {
        observacao: string
        dataAlteracao: string
        dataPrevisaoReparo: string | null
      }
    | null = null
  if (statusChanged && normalizedStatus !== 'ok') {
    const observacao = String(statusLogPayload?.observacao ?? '').trim()
    const dataAlteracao = String(statusLogPayload?.data_alteracao ?? '').trim()
    if (!observacao || !dataAlteracao) {
      return Response.json(
        { error: 'Observação e data de alteração são obrigatórias para status não OK.' },
        { status: 400 }
      )
    }
    const previsaoRaw = statusLogPayload?.data_previsao_reparo
    const previsao =
      previsaoRaw === undefined || previsaoRaw === null
        ? null
        : String(previsaoRaw).trim() || null
    statusLogEntry = {
      observacao,
      dataAlteracao,
      dataPrevisaoReparo: previsao
    }
  }

  const requiredFieldsToCheck: Array<[string, unknown]> = [
    ['ATIVO_EMPRESA', payload.ATIVO_EMPRESA],
    ['ATIVO_CODPE', payload.ATIVO_CODPE],
    ['ATIVO_DESCRITIVO_OS', payload.ATIVO_DESCRITIVO_OS],
    ['ATIVO_STATUS', payload.ATIVO_STATUS],
    ['ATIVO_COORDENACAO', payload.ATIVO_COORDENACAO],
    ['ATIVO_EQUIPE', payload.ATIVO_EQUIPE],
    ['ATIVO_MONITORADOS', payload.ATIVO_MONITORADOS],
    ['ATIVO_SIGLA', payload.ATIVO_SIGLA],
    ['ATIVO_CICLO', payload.ATIVO_CICLO],
    ['CONTADOR_CICLO', payload.CONTADOR_CICLO],
    ['ATIVO_TOLERANCIA', payload.ATIVO_TOLERANCIA],
    ['ATIVO_CLASSE', payload.ATIVO_CLASSE],
    ['ATIVO_GRUPO', payload.ATIVO_GRUPO],
    ['ATIVO_OEA', payload.ATIVO_OEA],
    ['ATIVO_TMM', payload.ATIVO_TMM]
  ]

  for (const [field, value] of requiredFieldsToCheck) {
    if (value === undefined) continue
    if (!String(value ?? '').trim()) {
      return Response.json(
        { error: `Campo obrigatorio vazio: ${field}.` },
        { status: 400 }
      )
    }
  }

  const updates: string[] = []
  const values: Array<string | number | null> = []

  const applyUpdate = (field: keyof AtivoRow, value: unknown) => {
    if (value === undefined) return
    const normalized = value === null ? '' : String(value).trim()
    if (!normalized) {
      return
    }
    if ((existing as Record<string, unknown>)[field] === normalized) return
    updates.push(`${field} = ?`)
    values.push(normalized)
  }

  applyUpdate('ATIVO_EMPRESA', payload.ATIVO_EMPRESA)
  applyUpdate('ATIVO_CODPE', payload.ATIVO_CODPE)
  applyUpdate('ATIVO_DESCRITIVO_OS', payload.ATIVO_DESCRITIVO_OS)
  applyUpdate('ATIVO_STATUS', payload.ATIVO_STATUS)
  applyUpdate('ATIVO_COORDENACAO', payload.ATIVO_COORDENACAO)
  applyUpdate('ATIVO_EQUIPE', payload.ATIVO_EQUIPE)
  applyUpdate('ATIVO_MONITORADOS', payload.ATIVO_MONITORADOS)
  applyUpdate('ATIVO_SIGLA', payload.ATIVO_SIGLA)
  applyUpdate('ATIVO_CICLO', payload.ATIVO_CICLO)
  if (payload.ATIVO_CONTADOR !== undefined && payload.ATIVO_CONTADOR !== null) {
    const contadorValue = Number(payload.ATIVO_CONTADOR)
    if (Number.isNaN(contadorValue)) {
      return Response.json(
        { error: 'ATIVO_CONTADOR deve ser numerico.' },
        { status: 400 }
      )
    }
    if (contadorValue !== existing.ATIVO_CONTADOR) {
      updates.push('ATIVO_CONTADOR = ?')
      values.push(contadorValue)
    }
  }
  applyUpdate('CONTADOR_CICLO', payload.CONTADOR_CICLO)
  applyUpdate('ATIVO_TOLERANCIA', payload.ATIVO_TOLERANCIA)
  applyUpdate('ATIVO_CLASSE', payload.ATIVO_CLASSE)
  applyUpdate('ATIVO_GRUPO', payload.ATIVO_GRUPO)
  applyUpdate('ATIVO_OEA', payload.ATIVO_OEA)
  applyUpdate('ATIVO_TMM', payload.ATIVO_TMM)

  const optionalUpdate = (field: keyof AtivoRow, value: unknown) => {
    if (value === undefined) return
    const normalized = value ? String(value).trim() : null
    if ((existing as Record<string, unknown>)[field] === normalized) return
    updates.push(`${field} = ?`)
    values.push(normalized)
  }

  optionalUpdate('ATIVO_LATITUDE', payload.ATIVO_LATITUDE)
  optionalUpdate('ATIVO_LONGITUDE', payload.ATIVO_LONGITUDE)
  optionalUpdate('ATIVO_ULTIMA_MANUT', payload.ATIVO_ULTIMA_MANUT)
  optionalUpdate('ATIVO_MODELO_POSTE', payload.ATIVO_MODELO_POSTE)
  optionalUpdate('ATIVO_MODELO_RELE', payload.ATIVO_MODELO_RELE)
  optionalUpdate('ATIVO_MODELO_DDS', payload.ATIVO_MODELO_DDS)
  optionalUpdate('ATIVO_DDS_SERIAL', payload.ATIVO_DDS_SERIAL)
  optionalUpdate('ATIVO_DDS_DTQ', payload.ATIVO_DDS_DTQ)
  optionalUpdate('ATIVO_MYTRAIN', payload.ATIVO_MYTRAIN)
  optionalUpdate('ATIVO_JAMPER1', payload.ATIVO_JAMPER1)
  optionalUpdate('ATIVO_JAMPER2', payload.ATIVO_JAMPER2)
  optionalUpdate('ATIVO_MODELO', payload.ATIVO_MODELO)
  optionalUpdate('ATIVO_OBSERVACAO', payload.ATIVO_OBSERVACAO)

  if (!updates.length) {
    return Response.json({ error: 'Nada para atualizar.' }, { status: 400 })
  }

  const nextCodpe =
    payload.ATIVO_CODPE !== undefined &&
    String(payload.ATIVO_CODPE).trim().length > 0
      ? String(payload.ATIVO_CODPE).trim()
      : existing.ATIVO_CODPE
  const nextDescritivo =
    payload.ATIVO_DESCRITIVO_OS !== undefined
      ? String(payload.ATIVO_DESCRITIVO_OS).trim()
      : existing.ATIVO_DESCRITIVO_OS
  const nextCoordenacao =
    payload.ATIVO_COORDENACAO !== undefined
      ? String(payload.ATIVO_COORDENACAO).trim()
      : existing.ATIVO_COORDENACAO
  const nextEquipe =
    payload.ATIVO_EQUIPE !== undefined
      ? String(payload.ATIVO_EQUIPE).trim()
      : existing.ATIVO_EQUIPE

  if (nextCoordenacao.length > 20) {
    return Response.json(
      { error: 'Coordenacao deve ter no maximo 20 caracteres.' },
      { status: 400 }
    )
  }
  if (nextEquipe.length > 10) {
    return Response.json(
      { error: 'Equipe deve ter no maximo 10 caracteres.' },
      { status: 400 }
    )
  }

  if (
    nextCoordenacao !== existing.ATIVO_COORDENACAO ||
    nextEquipe !== existing.ATIVO_EQUIPE
  ) {
    const estrutura = await env.DB.prepare(
      `SELECT id FROM tb_estrutura
       WHERE company_id = ? AND coordenacao = ? AND equipe = ? AND status = 'ativo' AND execucao = 'sim'`
    )
      .bind(auth.company_id, nextCoordenacao, nextEquipe)
      .first<{ id: string }>()

    if (!estrutura) {
      return Response.json(
        { error: 'Coordenacao/equipe invalida.' },
        { status: 400 }
      )
    }
  }

  if (
    payload.ATIVO_CODPE !== undefined &&
    payload.ATIVO_CODPE !== null &&
    String(payload.ATIVO_CODPE).trim() !== existing.ATIVO_CODPE
  ) {
    const conflict = await env.DB.prepare(
      'SELECT id FROM tb_ativo WHERE company_id = ? AND ATIVO_CODPE = ? AND id != ?'
    )
      .bind(auth.company_id, String(payload.ATIVO_CODPE).trim(), id)
      .first<{ id: string }>()

    if (conflict) {
      return Response.json({ error: 'ATIVO_CODPE ja existe.' }, { status: 409 })
    }
  }

  await env.DB.prepare(
    `UPDATE tb_ativo SET ${updates.join(', ')} WHERE id = ? AND company_id = ?`
  )
    .bind(...values, id, auth.company_id)
    .run()

  const ativo = await env.DB.prepare(
    `SELECT * FROM tb_ativo WHERE id = ? AND company_id = ?`
  )
    .bind(id, auth.company_id)
    .first<AtivoRow>()

  if (ativo) {
    await logAtivoHistory(env, {
      companyId: auth.company_id,
      ativoId: id,
      action: 'atualizado',
      beforeData: JSON.stringify(existing),
      afterData: JSON.stringify(ativo),
      changedByUserId: auth.user_id,
      changedByName: auth.nome
    })
  }

  if (statusLogEntry && ativo) {
    await logAtivoStatusChange(env, {
      companyId: auth.company_id,
      ativoId: id,
      ativoCodpe: nextCodpe,
      ativoDescritivo: nextDescritivo,
      equipe: nextEquipe,
      status: nextStatusValue,
      observacao: statusLogEntry.observacao,
      dataAlteracao: statusLogEntry.dataAlteracao,
      dataPrevisaoReparo: statusLogEntry.dataPrevisaoReparo,
      changedByUserId: auth.user_id,
      changedByName: auth.nome
    })
  }

  return Response.json({ ativo })
}

async function handleAtivoStatusHistory(
  request: Request,
  env: Env
): Promise<Response> {
  assertJwtSecret(env)
  const auth = await requireAuth(request, env)
  if (!auth) {
    return Response.json({ error: 'Token invalido.' }, { status: 401 })
  }

  const url = new URL(request.url)
  const ativoId = url.searchParams.get('ativo_id')
  if (!ativoId) {
    return Response.json({ error: 'ativo_id obrigatorio.' }, { status: 400 })
  }

  const result = await env.DB.prepare(
    `SELECT id,
            ativo_id,
            ativo_codpe,
            ativo_descritivo,
            equipe,
            status,
            observacao,
            data_alteracao,
            data_previsao_reparo,
            changed_by_user_id,
            changed_by_name,
            created_at
     FROM tb_ativo_status_log
     WHERE company_id = ? AND ativo_id = ?
     ORDER BY data_alteracao DESC`
  )
    .bind(auth.company_id, ativoId)
    .all<AtivoStatusLogRow>()

  return Response.json({ history: result.results })
}

async function handleAtivoHistory(request: Request, env: Env): Promise<Response> {
  assertJwtSecret(env)
  const auth = await requireAuth(request, env)
  if (!auth) {
    return Response.json({ error: 'Token invalido.' }, { status: 401 })
  }

  const url = new URL(request.url)
  const ativoId = url.searchParams.get('ativo_id')
  if (!ativoId) {
    return Response.json({ error: 'ativo_id obrigatorio.' }, { status: 400 })
  }

  const result = await env.DB.prepare(
    `SELECT id, company_id, ativo_id, action, before_data, after_data, changed_by_user_id, changed_by_name, created_at
     FROM tb_ativo_history
     WHERE company_id = ? AND ativo_id = ?
     ORDER BY created_at DESC`
  )
    .bind(auth.company_id, ativoId)
    .all<AtivoHistoryRow>()

  return Response.json({ history: result.results })
}

function isPendingActionStatus(value?: string) {
  const normalized = String(value ?? '')
    .normalize('NFC')
    .trim()
    .toLowerCase()
  return !['concluída', 'concluida'].includes(normalized)
}

function isActionAssignedToUser(action: AcaoRow, auth: AuthPayload) {
  const responsible = action.id_usuario_responsavel?.trim().toLowerCase() ?? ''
  const userId = auth.user_id?.trim().toLowerCase() ?? ''
  return responsible && userId && responsible === userId
}

function userCanViewAllActions(auth: AuthPayload) {
  const role = auth.cargo?.trim().toLowerCase() ?? ''
  return role.includes('coordenador') || role.includes('gerente')
}

async function handleListActions(
  request: Request,
  env: Env
): Promise<Response> {
  assertJwtSecret(env)
  const auth = await requireAuth(request, env)
  if (!auth) {
    return Response.json({ error: 'Token invalido.' }, { status: 401 })
  }

  const rows = await env.DB.prepare(
    `SELECT
      id_acao,
      company_id,
      id_usuario_solicitante,
      id_usuario_responsavel,
      data_criado,
      data_vencimento,
      status,
      grupo_acao,
      origem_acao,
      equipe,
      criticidade,
      texto_acao,
      texto_enerramento,
      texto_devolutiva
     FROM tb_acao
     WHERE company_id = ?
     ORDER BY data_vencimento ASC`
  )
    .bind(auth.company_id)
    .all<AcaoRowRecord>()

  const actions = rows.results.map(mapActionRow)
  const pending = actions.filter(action => isPendingActionStatus(action.status))
  const visible = userCanViewAllActions(auth)
    ? pending
    : pending.filter(action => isActionAssignedToUser(action, auth))

  const sorted = visible.slice().sort((a, b) =>
    a.data_vencimento.localeCompare(b.data_vencimento)
  )

  return Response.json({ acoes: sorted })
}

async function handleListActionAttachments(
  request: Request,
  env: Env
): Promise<Response> {
  assertJwtSecret(env)
  const auth = await requireAuth(request, env)
  if (!auth) {
    return Response.json({ error: 'Token invalido.' }, { status: 401 })
  }

  const url = new URL(request.url)
  const acaoId = url.searchParams.get('acao_id')?.trim()
  if (!acaoId) {
    return Response.json({ error: 'acao_id obrigatorio.' }, { status: 400 })
  }

  const rows = await env.DB.prepare(
    `SELECT id,
            acao_id,
            company_id,
            filename,
            r2_key,
            content_type,
            size,
            created_at,
            created_by
     FROM tb_acao_anexo
     WHERE company_id = ? AND acao_id = ?
     ORDER BY created_at DESC`
  )
    .bind(auth.company_id, acaoId)
    .all<ActionAttachmentRow>()

  const attachments = rows.results.map(normalizeActionAttachmentRow)
  return Response.json({ anexos: attachments })
}

async function handleUploadActionAttachment(
  request: Request,
  env: Env
): Promise<Response> {
  assertJwtSecret(env)
  const auth = await requireAuth(request, env)
  if (!auth) {
    return Response.json({ error: 'Token invalido.' }, { status: 401 })
  }

  const formData = await request.formData()
  const acaoId = String(formData.get('acao_id') ?? '').trim()
  if (!acaoId) {
    return Response.json({ error: 'acao_id obrigatorio.' }, { status: 400 })
  }

  const fileEntry = formData.get('file')
  if (!fileEntry || !(fileEntry instanceof File)) {
    return Response.json({ error: 'Arquivo obrigatorio.' }, { status: 400 })
  }

  const actionExists = await env.DB.prepare(
    'SELECT id_acao FROM tb_acao WHERE company_id = ? AND id_acao = ? LIMIT 1'
  )
    .bind(auth.company_id, acaoId)
    .first<Record<string, unknown>>()

  if (!actionExists?.id_acao) {
    return Response.json({ error: 'Ação não encontrada.' }, { status: 404 })
  }

  const filename = String(fileEntry.name || 'anexo').trim()
  const fileBytes = await fileEntry.arrayBuffer()
  const size = fileBytes.byteLength
  const key = `acoes/${auth.company_id}/${acaoId}/${crypto.randomUUID()}-${filename}`
  await env.ATTACHMENTS.put(key, fileBytes, {
    httpMetadata: {
      contentType: fileEntry.type || 'application/octet-stream'
    },
    customMetadata: {
      company_id: auth.company_id,
      acao_id: acaoId,
      filename
    }
  })

  const attachmentId = crypto.randomUUID()
  await env.DB.prepare(
    `INSERT INTO tb_acao_anexo
     (id, acao_id, company_id, filename, r2_key, content_type, size, created_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  )
    .bind(
      attachmentId,
      acaoId,
      auth.company_id,
      filename,
      key,
      fileEntry.type || null,
      size,
      auth.user_id ?? null
    )
    .run()

  const row = await env.DB.prepare(
    `SELECT id,
            acao_id,
            company_id,
            filename,
            r2_key,
            content_type,
            size,
            created_at,
            created_by
     FROM tb_acao_anexo
     WHERE id = ? AND company_id = ?`
  )
    .bind(attachmentId, auth.company_id)
    .first<ActionAttachmentRow>()

  if (!row) {
    return Response.json(
      { error: 'Erro ao salvar anexo.' },
      { status: 500 }
    )
  }

  return Response.json(
    { anexo: normalizeActionAttachmentRow(row) },
    { status: 201 }
  )
}

async function handleDownloadActionAttachment(
  request: Request,
  env: Env
): Promise<Response> {
  assertJwtSecret(env)
  const auth = await requireAuth(request, env)
  if (!auth) {
    return Response.json({ error: 'Token invalido.' }, { status: 401 })
  }

  const url = new URL(request.url)
  const attachmentId = url.searchParams.get('id')?.trim()
  if (!attachmentId) {
    return Response.json({ error: 'id obrigatorio.' }, { status: 400 })
  }

  const row = await env.DB.prepare(
    `SELECT id,
            acao_id,
            company_id,
            filename,
            r2_key,
            content_type,
            size,
            created_at,
            created_by
     FROM tb_acao_anexo
     WHERE id = ? AND company_id = ?`
  )
    .bind(attachmentId, auth.company_id)
    .first<ActionAttachmentRow>()

  if (!row) {
    return Response.json({ error: 'Anexo não encontrado.' }, { status: 404 })
  }

  const object = await env.ATTACHMENTS.get(row.r2_key)
  if (!object?.body) {
    return Response.json(
      { error: 'Arquivo não encontrado no storage.' },
      { status: 404 }
    )
  }

  const headers = new Headers()
  headers.set('Content-Type', row.content_type ?? 'application/octet-stream')
  headers.set(
    'Content-Disposition',
    `attachment; filename="${row.filename.replace(/"/g, '\\"')}"`
  )
  return new Response(object.body, { headers })
}

async function handleListOrderService(
  request: Request,
  env: Env
): Promise<Response> {
  assertJwtSecret(env)
  const auth = await requireAuth(request, env)
  if (!auth) {
    return Response.json({ error: 'Token invalido.' }, { status: 401 })
  }

  const url = new URL(request.url)
  const conditions: string[] = ['os.company_id = ?']
  const values: Array<string | number> = [auth.company_id]

  const ano = url.searchParams.get('ano')
  const mes = url.searchParams.get('mes')
  if (ano) {
    conditions.push('os.os_ano = ?')
    values.push(Number(ano))
  }
  if (mes) {
    conditions.push('os.os_mes = ?')
    values.push(Number(mes))
  }
  const osNumeroRaw = url.searchParams.get('os_numero')
  if (osNumeroRaw) {
    const osNumero = Number(osNumeroRaw)
    if (!Number.isNaN(osNumero)) {
      conditions.push('os.os_numero = ?')
      values.push(osNumero)
    }
  }

  const statusList = (url.searchParams.get('status') || '')
    .split(',')
    .map(item => item.trim().toUpperCase())
    .filter(Boolean)
  if (statusList.length) {
    conditions.push(`os.os_status IN (${statusList.map(() => '?').join(', ')})`)
    values.push(...statusList)
  }

  const tipo = normalizeOsTipo(url.searchParams.get('tipo'))
  if (tipo) {
    conditions.push('os.os_tipo = ?')
    values.push(tipo)
  }

  const pdm = normalizeFlag(url.searchParams.get('pdm'))
  if (pdm !== null) {
    conditions.push('os.os_pdm = ?')
    values.push(pdm)
  }

  const capex = normalizeFlag(url.searchParams.get('capex'))
  if (capex !== null) {
    conditions.push('os.os_capex = ?')
    values.push(capex)
  }

  const equipeList = (url.searchParams.get('equipe') || '')
    .split(',')
    .map(item => item.trim())
    .filter(Boolean)
  if (equipeList.length) {
    conditions.push(`e.equipe IN (${equipeList.map(() => '?').join(', ')})`)
    values.push(...equipeList)
  }

  const coordenacao = url.searchParams.get('coordenacao')
  if (coordenacao) {
    conditions.push('e.coordenacao = ?')
    values.push(coordenacao)
  }

  const search = url.searchParams.get('search')
  if (search) {
    const terms = search
      .split(',')
      .map(item => item.trim())
      .filter(Boolean)
    const numericTerms = terms.filter(item => /^[0-9]+$/.test(item))
    const textTerms = terms.filter(item => !/^[0-9]+$/.test(item))

    const subConditions: string[] = []

    if (numericTerms.length) {
      subConditions.push(
        `os.os_numero IN (${numericTerms.map(() => '?').join(', ')})`
      )
      values.push(...numericTerms.map(Number))
    }

    for (const term of textTerms) {
      subConditions.push('(a.ATIVO_CODPE LIKE ? OR a.ATIVO_DESCRITIVO_OS LIKE ?)')
      values.push(`%${term}%`, `%${term}%`)
    }

    if (subConditions.length) {
      conditions.push(`(${subConditions.join(' OR ')})`)
    }
  }

  const result = await env.DB.prepare(
    `SELECT os.id,
            os.os_numero,
            os.os_status,
            os.os_pdm,
            os.os_tipo,
            os.os_checklist,
            os.os_capex,
            os.os_programado1,
            os.os_programado2,
            os.os_programado3,
            os.os_programado4,
            os.os_programado5,
            os.os_realizado_em,
            os.os_obs_pcm,
            a.ATIVO_CODPE,
            a.ATIVO_DESCRITIVO_OS,
            a.ATIVO_EQUIPE
     FROM tb_order_service os
     JOIN tb_ativo a ON a.id = os.ativo_id
     JOIN tb_estrutura e ON e.id = os.estrutura_id
     WHERE ${conditions.join(' AND ')}
     ORDER BY os.os_numero DESC`
  )
    .bind(...values)
    .all<OrderServiceListRow>()

  return Response.json({ os: result.results })
}

async function handleGetOrderService(
  request: Request,
  env: Env
): Promise<Response> {
  assertJwtSecret(env)
  const auth = await requireAuth(request, env)
  if (!auth) {
    return Response.json({ error: 'Token invalido.' }, { status: 401 })
  }

  const url = new URL(request.url)
  const id = url.searchParams.get('id')
  if (!id) {
    return Response.json({ error: 'id obrigatorio.' }, { status: 400 })
  }

  const os = await env.DB
    .prepare(
      `SELECT os.*,
              a.ATIVO_CODPE,
              a.ATIVO_DESCRITIVO_OS,
              a.ATIVO_EQUIPE,
              e.coordenacao AS estrutura_coordenacao,
              e.equipe AS estrutura_equipe
       FROM tb_order_service os
       JOIN tb_ativo a ON a.id = os.ativo_id
       JOIN tb_estrutura e ON e.id = os.estrutura_id
       WHERE os.id = ? AND os.company_id = ?`
    )
    .bind(id, auth.company_id)
    .first<OrderServiceRow>()

  if (!os) {
    return Response.json({ error: 'OS nao encontrada.' }, { status: 404 })
  }

  return Response.json({ os })
}

async function handleCreateOrderService(
  request: Request,
  env: Env
): Promise<Response> {
  assertJwtSecret(env)
  const auth = await requireAuth(request, env)
  if (!auth) {
    return Response.json({ error: 'Token invalido.' }, { status: 401 })
  }

  const payload = await readJson(request)
  if (!payload) {
    return Response.json({ error: 'Dados invalidos.' }, { status: 400 })
  }

  const estruturaId = String(payload.estrutura_id || '').trim()
  const ativoIdsRaw = Array.isArray(payload.ativo_ids) ? payload.ativo_ids : []
  const ativoIds = Array.from(
    new Set(ativoIdsRaw.map(id => String(id || '').trim()).filter(Boolean))
  )

  const osTipo = normalizeOsTipo(payload.os_tipo)
  const osPdm = normalizeFlag(payload.os_pdm)
  const osChecklist = normalizeFlag(payload.os_checklist)
  const osCapex = normalizeFlag(payload.os_capex)
  const osStatus = normalizeOsStatus(payload.os_status || 'CRIADO') || 'CRIADO'
  const osAno = Number(payload.os_ano)
  const osMes = Number(payload.os_mes)
  const osObsPcm = payload.os_obs_pcm ? String(payload.os_obs_pcm).trim() : null

  if (!estruturaId || !ativoIds.length || !osTipo) {
    return Response.json(
      { error: 'Estrutura, ativos e tipo sao obrigatorios.' },
      { status: 400 }
    )
  }

  if (osPdm === null || osChecklist === null || osCapex === null) {
    return Response.json({ error: 'Flags invalidas.' }, { status: 400 })
  }

  if (!Number.isInteger(osAno) || !Number.isInteger(osMes)) {
    return Response.json({ error: 'Ano/mes invalidos.' }, { status: 400 })
  }

  if (osMes < 1 || osMes > 12) {
    return Response.json({ error: 'Mes invalido.' }, { status: 400 })
  }

  const company = await env.DB.prepare(
    'SELECT id, status FROM tb_company WHERE id = ?'
  )
    .bind(auth.company_id)
    .first<CompanyRow>()

  if (!company || company.status !== 'ativo') {
    return Response.json({ error: 'Empresa invalida.' }, { status: 400 })
  }

  const estrutura = await env.DB.prepare(
    `SELECT id, coordenacao, equipe, status, execucao
     FROM tb_estrutura
     WHERE id = ? AND company_id = ?`
  )
    .bind(estruturaId, auth.company_id)
    .first<{ id: string; coordenacao: string; equipe: string; status: string; execucao: string }>()

  if (!estrutura || estrutura.status !== 'ativo' || estrutura.execucao !== 'sim') {
    return Response.json({ error: 'Estrutura invalida.' }, { status: 400 })
  }

  const placeholders = ativoIds.map(() => '?').join(', ')
  const ativos = await env.DB.prepare(
    `SELECT id, ATIVO_EQUIPE
     FROM tb_ativo
     WHERE company_id = ? AND id IN (${placeholders})`
  )
    .bind(auth.company_id, ...ativoIds)
    .all<{ id: string; ATIVO_EQUIPE: string }>()

  if (ativos.results.length !== ativoIds.length) {
    return Response.json({ error: 'Ativos invalidos.' }, { status: 400 })
  }

  for (const ativo of ativos.results) {
    if (ativo.ATIVO_EQUIPE !== estrutura.equipe) {
      return Response.json(
        { error: 'Ativo fora da equipe selecionada.' },
        { status: 400 }
      )
    }
  }

  const maxRow = await env.DB.prepare(
    'SELECT COALESCE(MAX(os_numero), 0) AS max_numero FROM tb_order_service WHERE company_id = ?'
  )
    .bind(auth.company_id)
    .first<{ max_numero: number }>()

  let nextNumero = (maxRow?.max_numero ?? 0) + 1
  const created: Array<{ id: string; os_numero: number; ativo_id: string }> = []

  for (const ativo of ativos.results) {
    const osId = crypto.randomUUID()
    const numero = nextNumero++

    await env.DB.prepare(
      `INSERT INTO tb_order_service (
        id,
        company_id,
        os_numero,
        estrutura_id,
        ativo_id,
        os_tipo,
        os_pdm,
        os_status,
        os_checklist,
        os_capex,
        os_realizado_em,
        os_programado1,
        os_programado2,
        os_programado3,
        os_programado4,
        os_programado5,
        os_obs_pcm,
        os_obs_tecnico,
        os_ano,
        os_mes,
        created_at,
        created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, NULL, NULL, NULL, NULL, NULL, ?, NULL, ?, ?, datetime('now'), ?)`
    )
      .bind(
        osId,
        auth.company_id,
        numero,
        estruturaId,
        ativo.id,
        osTipo,
        osPdm,
        osStatus,
        osChecklist,
        osCapex,
        osObsPcm,
        osAno,
        osMes,
        auth.user_id
      )
      .run()

    const afterData = {
      id: osId,
      company_id: auth.company_id,
      os_numero: numero,
      estrutura_id: estruturaId,
      ativo_id: ativo.id,
      os_tipo: osTipo,
      os_pdm: osPdm,
      os_status: osStatus,
      os_checklist: osChecklist,
      os_capex: osCapex,
      os_obs_pcm: osObsPcm,
      os_ano: osAno,
      os_mes: osMes
    }

    await logOrderServiceHistory(env, {
      companyId: auth.company_id,
      orderServiceId: osId,
      action: 'criado',
      beforeData: null,
      afterData: JSON.stringify(afterData),
      changedByUserId: auth.user_id,
      changedByName: auth.nome
    })

    created.push({ id: osId, os_numero: numero, ativo_id: ativo.id })
  }

  return Response.json({ created }, { status: 201 })
}

async function handleUpdateOrderService(
  request: Request,
  env: Env
): Promise<Response> {
  assertJwtSecret(env)
  const auth = await requireAuth(request, env)
  if (!auth) {
    return Response.json({ error: 'Token invalido.' }, { status: 401 })
  }

  const payload = await readJson(request)
  if (!payload) {
    return Response.json({ error: 'Dados invalidos.' }, { status: 400 })
  }

  const id = String(payload.id || '').trim()
  if (!id) {
    return Response.json({ error: 'ID obrigatorio.' }, { status: 400 })
  }

  const existing = await env.DB.prepare(
    `SELECT * FROM tb_order_service WHERE id = ? AND company_id = ?`
  )
    .bind(id, auth.company_id)
    .first<OrderServiceRow>()

  if (!existing) {
    return Response.json({ error: 'OS nao encontrada.' }, { status: 404 })
  }

  if (payload.os_programado1 !== undefined) {
    const todayKey = getLocalDateKey()
    const existingProgramado1 = normalizeDateOnly(existing.os_programado1)
    if (
      existing.os_status === 'PROGRAMADO' &&
      !existing.os_realizado_em &&
      existingProgramado1 &&
      existingProgramado1 < todayKey
    ) {
      return Response.json(
        { error: 'Semana 1 nao realizada nao pode ser alterada.' },
        { status: 400 }
      )
    }
  }

  if (payload.os_status !== undefined) {
    const nextStatus = normalizeOsStatus(payload.os_status)
    if (nextStatus === 'CANCELADO' && existing.os_status !== 'CANCELADO') {
      const permissionError = await requirePermission(
        env,
        auth,
        'planejamento',
        'exclusao'
      )
      if (permissionError) return permissionError
    }
  }

  const updates: string[] = []
  const values: Array<string | number | null> = []

  const updateOptionalText = (field: keyof OrderServiceRow, value: unknown) => {
    if (value === undefined) return
    const normalized = String(value ?? '').trim()
    const finalValue = normalized ? normalized : null
    if ((existing as Record<string, unknown>)[field] === finalValue) return null
    updates.push(`${field} = ?`)
    values.push(finalValue)
    return null
  }

  const updateFlag = (field: keyof OrderServiceRow, value: unknown) => {
    if (value === undefined) return
    const normalized = normalizeFlag(value)
    if (normalized === null) {
      return Response.json({ error: `Flag invalida: ${field}.` }, { status: 400 })
    }
    if ((existing as Record<string, unknown>)[field] === normalized) return null
    updates.push(`${field} = ?`)
    values.push(normalized)
    return null
  }

  const updateTipo = (value: unknown) => {
    if (value === undefined) return null
    const normalized = normalizeOsTipo(value)
    if (!normalized) {
      return Response.json({ error: 'Tipo invalido.' }, { status: 400 })
    }
    if (existing.os_tipo === normalized) return null
    updates.push('os_tipo = ?')
    values.push(normalized)
    return null
  }

  const updateStatus = (value: unknown) => {
    if (value === undefined) return null
    const normalized = normalizeOsStatus(value)
    if (!normalized) {
      return Response.json({ error: 'Status invalido.' }, { status: 400 })
    }
    if (existing.os_status === normalized) return null
    updates.push('os_status = ?')
    values.push(normalized)
    return null
  }

  const responses = [
    updateOptionalText('os_obs_pcm', payload.os_obs_pcm),
    updateOptionalText('os_obs_tecnico', payload.os_obs_tecnico),
    updateOptionalText('os_programado1', payload.os_programado1),
    updateOptionalText('os_programado2', payload.os_programado2),
    updateOptionalText('os_programado3', payload.os_programado3),
    updateOptionalText('os_programado4', payload.os_programado4),
    updateOptionalText('os_programado5', payload.os_programado5),
    updateOptionalText('os_realizado_em', payload.os_realizado_em),
    updateFlag('os_pdm', payload.os_pdm),
    updateFlag('os_checklist', payload.os_checklist),
    updateFlag('os_capex', payload.os_capex),
    updateTipo(payload.os_tipo),
    updateStatus(payload.os_status)
  ]

  const errorResponse = responses.find(item => item instanceof Response) as
    | Response
    | undefined
  if (errorResponse) return errorResponse

  if (payload.os_ano !== undefined) {
    const value = Number(payload.os_ano)
    if (!Number.isInteger(value)) {
      return Response.json({ error: 'Ano invalido.' }, { status: 400 })
    }
    if (value !== existing.os_ano) {
      updates.push('os_ano = ?')
      values.push(value)
    }
  }

  if (payload.os_mes !== undefined) {
    const value = Number(payload.os_mes)
    if (!Number.isInteger(value) || value < 1 || value > 12) {
      return Response.json({ error: 'Mes invalido.' }, { status: 400 })
    }
    if (value !== existing.os_mes) {
      updates.push('os_mes = ?')
      values.push(value)
    }
  }

  let nextEstruturaId = existing.estrutura_id
  let nextAtivoId = existing.ativo_id

  if (payload.estrutura_id !== undefined) {
    nextEstruturaId = String(payload.estrutura_id || '').trim()
    if (!nextEstruturaId) {
      return Response.json({ error: 'Estrutura invalida.' }, { status: 400 })
    }
    if (nextEstruturaId !== existing.estrutura_id) {
      const estrutura = await env.DB.prepare(
        `SELECT id, equipe, status, execucao FROM tb_estrutura WHERE id = ? AND company_id = ?`
      )
        .bind(nextEstruturaId, auth.company_id)
        .first<{ id: string; equipe: string; status: string; execucao: string }>()

      if (!estrutura || estrutura.status !== 'ativo' || estrutura.execucao !== 'sim') {
        return Response.json({ error: 'Estrutura invalida.' }, { status: 400 })
      }
      updates.push('estrutura_id = ?')
      values.push(nextEstruturaId)
    }
  }

  if (payload.ativo_id !== undefined) {
    nextAtivoId = String(payload.ativo_id || '').trim()
    if (!nextAtivoId) {
      return Response.json({ error: 'Ativo invalido.' }, { status: 400 })
    }
    if (nextAtivoId !== existing.ativo_id) {
      const ativo = await env.DB.prepare(
        `SELECT id, ATIVO_EQUIPE FROM tb_ativo WHERE id = ? AND company_id = ?`
      )
        .bind(nextAtivoId, auth.company_id)
        .first<{ id: string; ATIVO_EQUIPE: string }>()

      if (!ativo) {
        return Response.json({ error: 'Ativo invalido.' }, { status: 400 })
      }
      updates.push('ativo_id = ?')
      values.push(nextAtivoId)
    }
  }

  if (!updates.length) {
    return Response.json({ error: 'Nada para atualizar.' }, { status: 400 })
  }

  updates.push('updated_at = datetime(\'now\')')
  updates.push('updated_by = ?')
  values.push(auth.user_id)

  await env.DB.prepare(
    `UPDATE tb_order_service SET ${updates.join(', ')} WHERE id = ? AND company_id = ?`
  )
    .bind(...values, id, auth.company_id)
    .run()

  const os = await env.DB.prepare(
    `SELECT * FROM tb_order_service WHERE id = ? AND company_id = ?`
  )
    .bind(id, auth.company_id)
    .first<OrderServiceRow>()

  if (os) {
    await logOrderServiceHistory(env, {
      companyId: auth.company_id,
      orderServiceId: id,
      action: 'atualizado',
      beforeData: JSON.stringify(existing),
      afterData: JSON.stringify(os),
      changedByUserId: auth.user_id,
      changedByName: auth.nome
    })
  }

  return Response.json({ os })
}

async function handleBulkUpdateOrderService(
  request: Request,
  env: Env
): Promise<Response> {
  assertJwtSecret(env)
  const auth = await requireAuth(request, env)
  if (!auth) {
    return Response.json({ error: 'Token invalido.' }, { status: 401 })
  }

  const payload = await readJson(request)
  if (!payload) {
    return Response.json({ error: 'Dados invalidos.' }, { status: 400 })
  }

  const idsRaw = Array.isArray(payload.ids) ? payload.ids : []
  const ids = Array.from(
    new Set(idsRaw.map(id => String(id || '').trim()).filter(Boolean))
  )

  if (!ids.length) {
    return Response.json({ error: 'IDs obrigatorios.' }, { status: 400 })
  }

  const nextStatus =
    payload.os_status !== undefined ? normalizeOsStatus(payload.os_status) : null
  const nextTipo =
    payload.os_tipo !== undefined ? normalizeOsTipo(payload.os_tipo) : null

  if (payload.os_status !== undefined && !nextStatus) {
    return Response.json({ error: 'Status invalido.' }, { status: 400 })
  }
  if (payload.os_tipo !== undefined && !nextTipo) {
    return Response.json({ error: 'Tipo invalido.' }, { status: 400 })
  }
  if (!nextStatus && !nextTipo) {
    return Response.json({ error: 'Nada para atualizar.' }, { status: 400 })
  }

  const permissionError = await requirePermission(
    env,
    auth,
    'planejamento',
    'edicao'
  )
  if (permissionError) return permissionError

  if (nextStatus === 'CANCELADO') {
    const cancelPermission = await requirePermission(
      env,
      auth,
      'planejamento',
      'exclusao'
    )
    if (cancelPermission) return cancelPermission
  }

  const placeholders = ids.map(() => '?').join(', ')
  const existingRows = await env.DB.prepare(
    `SELECT * FROM tb_order_service WHERE company_id = ? AND id IN (${placeholders})`
  )
    .bind(auth.company_id, ...ids)
    .all<OrderServiceRow>()

  if (existingRows.results.length !== ids.length) {
    return Response.json({ error: 'OS invalidas.' }, { status: 400 })
  }

  let updated = 0

  for (const existing of existingRows.results) {
    const updates: string[] = []
    const values: Array<string | number | null> = []

    let changed = false

    if (nextStatus && existing.os_status !== nextStatus) {
      updates.push('os_status = ?')
      values.push(nextStatus)
      changed = true
    }

    if (nextTipo && existing.os_tipo !== nextTipo) {
      updates.push('os_tipo = ?')
      values.push(nextTipo)
      changed = true
    }

    if (!changed) continue

    updates.push('updated_at = datetime(\'now\')')
    updates.push('updated_by = ?')
    values.push(auth.user_id)

    await env.DB.prepare(
      `UPDATE tb_order_service SET ${updates.join(', ')} WHERE id = ? AND company_id = ?`
    )
      .bind(...values, existing.id, auth.company_id)
      .run()

    const afterData = {
      ...existing,
      os_status: nextStatus ?? existing.os_status,
      os_tipo: nextTipo ?? existing.os_tipo
    }

    await logOrderServiceHistory(env, {
      companyId: auth.company_id,
      orderServiceId: existing.id,
      action: 'atualizado',
      beforeData: JSON.stringify(existing),
      afterData: JSON.stringify(afterData),
      changedByUserId: auth.user_id,
      changedByName: auth.nome
    })

    updated += 1
  }

  return Response.json({ updated })
}

async function handleGetSchedulerConfig(
  request: Request,
  env: Env
): Promise<Response> {
  assertJwtSecret(env)
  const auth = await requireAuth(request, env)
  if (!auth) {
    return Response.json({ error: 'Token invalido.' }, { status: 401 })
  }

  const url = new URL(request.url)
  const mes = String(url.searchParams.get('mes') || '').trim()
  const coordenacao = String(url.searchParams.get('coordenacao') || '').trim()
  const equipeId = String(url.searchParams.get('equipe_id') || '').trim()

  if (!mes || !/^\d{4}-\d{2}$/.test(mes)) {
    return Response.json({ error: 'Mes invalido.' }, { status: 400 })
  }
  if (!coordenacao || !equipeId) {
    return Response.json(
      { error: 'Coordenacao e equipe sao obrigatorias.' },
      { status: 400 }
    )
  }

  const subEquipe = String(url.searchParams.get('sub_equipe') || '').trim()
  if (!subEquipe) {
    return Response.json(
      { error: 'Sub-equipe obrigatoria.' },
      { status: 400 }
    )
  }

  const row = await env.DB.prepare(
    `SELECT id, company_id, coordenacao, equipe_id, sub_equipe, mes, data_json
     FROM tb_os_scheduler_config_v2
     WHERE company_id = ? AND coordenacao = ? AND equipe_id = ? AND sub_equipe = ? AND mes = ?`
  )
    .bind(auth.company_id, coordenacao, equipeId, subEquipe, mes)
    .first<SchedulerConfigRow>()

  if (!row) {
    return Response.json({ config: null })
  }

  let config: unknown = null
  try {
    config = JSON.parse(row.data_json || 'null')
  } catch {
    config = null
  }

  return Response.json({ config })
}

async function handleUpsertSchedulerConfig(
  request: Request,
  env: Env
): Promise<Response> {
  assertJwtSecret(env)
  const auth = await requireAuth(request, env)
  if (!auth) {
    return Response.json({ error: 'Token invalido.' }, { status: 401 })
  }

  const payload = await readJson(request)
  if (!payload) {
    return Response.json({ error: 'Dados invalidos.' }, { status: 400 })
  }

  const mes = String(payload.mes || '').trim()
  const coordenacao = String(payload.coordenacao || '').trim()
  const equipeId = String(payload.equipe_id || '').trim()
  const subEquipe = String(payload.sub_equipe || '').trim()
  const config = payload.config

  if (!mes || !/^\d{4}-\d{2}$/.test(mes)) {
    return Response.json({ error: 'Mes invalido.' }, { status: 400 })
  }
  if (!coordenacao || !equipeId || !subEquipe) {
    return Response.json(
      { error: 'Coordenacao, equipe e sub-equipe sao obrigatorias.' },
      { status: 400 }
    )
  }
  if (!config || typeof config !== 'object') {
    return Response.json({ error: 'Configuracao invalida.' }, { status: 400 })
  }

  const dataJson = JSON.stringify(config)
  const existing = await env.DB.prepare(
    `SELECT id FROM tb_os_scheduler_config_v2
     WHERE company_id = ? AND coordenacao = ? AND equipe_id = ? AND sub_equipe = ? AND mes = ?`
  )
    .bind(auth.company_id, coordenacao, equipeId, subEquipe, mes)
    .first<{ id: string }>()

  if (existing?.id) {
    await env.DB.prepare(
      `UPDATE tb_os_scheduler_config_v2
       SET data_json = ?, updated_at = datetime('now')
       WHERE id = ? AND company_id = ?`
    )
      .bind(dataJson, existing.id, auth.company_id)
      .run()
  } else {
    const id = crypto.randomUUID()
    await env.DB.prepare(
      `INSERT INTO tb_os_scheduler_config_v2 (
         id,
         company_id,
         coordenacao,
         equipe_id,
         sub_equipe,
         mes,
         data_json,
         created_at,
         updated_at
       ) VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`
    )
      .bind(
        id,
        auth.company_id,
        coordenacao,
        equipeId,
        subEquipe,
        mes,
        dataJson
      )
      .run()
  }

  return Response.json({ ok: true })
}

async function handleGetSchedulerTeamConfig(
  request: Request,
  env: Env
): Promise<Response> {
  assertJwtSecret(env)
  const auth = await requireAuth(request, env)
  if (!auth) {
    return Response.json({ error: 'Token invalido.' }, { status: 401 })
  }

  const url = new URL(request.url)
  const coordenacao = url.searchParams.get('coordenacao')

  const conditions: string[] = ['company_id = ?']
  const values: Array<string | number> = [auth.company_id]

  if (coordenacao) {
    conditions.push('coordenacao = ?')
    values.push(coordenacao)
  }

  const result = await env.DB.prepare(
    `SELECT id, company_id, coordenacao, equipe, escala, observacao, created_at, updated_at
     FROM tb_os_scheduler_team_config
     WHERE ${conditions.join(' AND ')}
     ORDER BY coordenacao, equipe`
  )
    .bind(...values)
    .all<SchedulerTeamConfigRow>()

  return Response.json({ configs: result.results })
}

async function handleUpsertSchedulerTeamConfig(
  request: Request,
  env: Env
): Promise<Response> {
  assertJwtSecret(env)
  const auth = await requireAuth(request, env)
  if (!auth) {
    return Response.json({ error: 'Token invalido.' }, { status: 401 })
  }

  const payload = await readJson(request)
  if (!payload) {
    return Response.json({ error: 'Dados invalidos.' }, { status: 400 })
  }

  const coordenacao = String(payload.coordenacao || '').trim()
  const equipe = String(payload.equipe || '').trim()
  const escala = normalizeEscala(String(payload.escala || ''))
  const observacao =
    payload.observacao !== undefined && payload.observacao !== null
      ? String(payload.observacao).trim()
      : null

  if (!coordenacao || !equipe || !escala) {
    return Response.json(
      { error: 'Coordenacao, equipe e escala sao obrigatorias.' },
      { status: 400 }
    )
  }

  const existing = await env.DB.prepare(
    `SELECT id FROM tb_os_scheduler_team_config
     WHERE company_id = ? AND coordenacao = ? AND equipe = ?`
  )
    .bind(auth.company_id, coordenacao, equipe)
    .first<{ id: string }>()

  if (existing?.id) {
    await env.DB.prepare(
      `UPDATE tb_os_scheduler_team_config
       SET escala = ?, observacao = ?, updated_at = datetime('now')
       WHERE id = ? AND company_id = ?`
    )
      .bind(escala, observacao, existing.id, auth.company_id)
      .run()
  } else {
    const id = crypto.randomUUID()
    await env.DB.prepare(
      `INSERT INTO tb_os_scheduler_team_config (
         id,
         company_id,
         coordenacao,
         equipe,
         escala,
         observacao,
         created_at,
         updated_at
       ) VALUES (?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`
    )
      .bind(id, auth.company_id, coordenacao, equipe, escala, observacao)
      .run()
  }

  return Response.json({ ok: true })
}

async function handleGetSchedulerSubTeamConfig(
  request: Request,
  env: Env
): Promise<Response> {
  assertJwtSecret(env)
  const auth = await requireAuth(request, env)
  if (!auth) {
    return Response.json({ error: 'Token invalido.' }, { status: 401 })
  }

  const url = new URL(request.url)
  const coordenacao = url.searchParams.get('coordenacao')
  const equipeId = url.searchParams.get('equipe_id')

  const conditions: string[] = ['company_id = ?']
  const values: Array<string | number> = [auth.company_id]

  if (coordenacao) {
    conditions.push('coordenacao = ?')
    values.push(coordenacao)
  }
  if (equipeId) {
    conditions.push('equipe_id = ?')
    values.push(equipeId)
  }

  const result = await env.DB.prepare(
    `SELECT id, company_id, coordenacao, equipe_id, sub_equipe, escala, status, observacao, created_at, updated_at
     FROM tb_os_scheduler_sub_team
     WHERE ${conditions.join(' AND ')}
     ORDER BY coordenacao, equipe_id, sub_equipe`
  )
    .bind(...values)
    .all<SchedulerSubTeamConfigRow>()

  return Response.json({ configs: result.results })
}

async function handleUpsertSchedulerSubTeamConfig(
  request: Request,
  env: Env
): Promise<Response> {
  assertJwtSecret(env)
  const auth = await requireAuth(request, env)
  if (!auth) {
    return Response.json({ error: 'Token invalido.' }, { status: 401 })
  }

  const payload = await readJson(request)
  if (!payload) {
    return Response.json({ error: 'Dados invalidos.' }, { status: 400 })
  }

  const coordenacao = String(payload.coordenacao || '').trim()
  const equipeId = String(payload.equipe_id || '').trim()
  const subEquipe = String(payload.sub_equipe || '').trim()
  const escala = normalizeEscala(String(payload.escala || ''))
  const status = normalizeStatus(String(payload.status || 'ativo'))
  const observacao =
    payload.observacao !== undefined && payload.observacao !== null
      ? String(payload.observacao).trim()
      : null

  if (!coordenacao || !equipeId || !subEquipe || !escala || !status) {
    return Response.json(
      { error: 'Coordenacao, equipe, sub-equipe e escala sao obrigatorias.' },
      { status: 400 }
    )
  }

  const estrutura = await env.DB.prepare(
    `SELECT id, coordenacao FROM tb_estrutura
     WHERE id = ? AND company_id = ?`
  )
    .bind(equipeId, auth.company_id)
    .first<{ id: string; coordenacao: string }>()

  if (!estrutura || estrutura.coordenacao !== coordenacao) {
    return Response.json({ error: 'Equipe invalida.' }, { status: 400 })
  }

  const existing = await env.DB.prepare(
    `SELECT id FROM tb_os_scheduler_sub_team
     WHERE company_id = ? AND coordenacao = ? AND equipe_id = ? AND sub_equipe = ?`
  )
    .bind(auth.company_id, coordenacao, equipeId, subEquipe)
    .first<{ id: string }>()

  try {
    if (existing?.id) {
      await env.DB.prepare(
        `UPDATE tb_os_scheduler_sub_team
         SET escala = ?, status = ?, observacao = ?, updated_at = datetime('now')
         WHERE id = ? AND company_id = ?`
      )
        .bind(escala, status, observacao, existing.id, auth.company_id)
        .run()
    } else {
      const id = crypto.randomUUID()
      await env.DB.prepare(
        `INSERT INTO tb_os_scheduler_sub_team (
           id,
           company_id,
           coordenacao,
           equipe_id,
           sub_equipe,
           escala,
           status,
           observacao,
           created_at,
           updated_at
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`
      )
        .bind(
          id,
          auth.company_id,
          coordenacao,
          equipeId,
          subEquipe,
          escala,
          status,
          observacao
        )
        .run()
    }
  } catch (error) {
    console.error('scheduler-sub-team save failed', error)
    return Response.json({ error: 'Falha ao salvar sub-equipe.' }, { status: 400 })
  }

  return Response.json({ ok: true })
}

async function handleDeleteSchedulerSubTeamConfig(
  request: Request,
  env: Env
): Promise<Response> {
  assertJwtSecret(env)
  const auth = await requireAuth(request, env)
  if (!auth) {
    return Response.json({ error: 'Token invalido.' }, { status: 401 })
  }

  const url = new URL(request.url)
  const coordenacao = String(url.searchParams.get('coordenacao') || '').trim()
  const equipeId = String(url.searchParams.get('equipe_id') || '').trim()
  const subEquipe = String(url.searchParams.get('sub_equipe') || '').trim()

  if (!coordenacao || !equipeId || !subEquipe) {
    return Response.json(
      { error: 'Coordenacao, equipe e sub-equipe sao obrigatorias.' },
      { status: 400 }
    )
  }

  await env.DB.prepare(
    `DELETE FROM tb_os_scheduler_sub_team
     WHERE company_id = ? AND coordenacao = ? AND equipe_id = ? AND sub_equipe = ?`
  )
    .bind(auth.company_id, coordenacao, equipeId, subEquipe)
    .run()

  return Response.json({ ok: true })
}

async function handleGetSchedulerAssignments(
  request: Request,
  env: Env
): Promise<Response> {
  assertJwtSecret(env)
  const auth = await requireAuth(request, env)
  if (!auth) {
    return Response.json({ error: 'Token invalido.' }, { status: 401 })
  }

  const url = new URL(request.url)
  const coordenacao = url.searchParams.get('coordenacao')
  const equipeId = url.searchParams.get('equipe_id')
  const subEquipe = url.searchParams.get('sub_equipe')

  const conditions: string[] = ['company_id = ?']
  const values: Array<string | number> = [auth.company_id]

  if (coordenacao) {
    conditions.push('coordenacao = ?')
    values.push(coordenacao)
  }
  if (equipeId) {
    conditions.push('equipe_id = ?')
    values.push(equipeId)
  }
  if (subEquipe) {
    conditions.push('sub_equipe = ?')
    values.push(subEquipe)
  }

  const result = await env.DB.prepare(
    `SELECT id, company_id, os_id, coordenacao, equipe_id, sub_equipe, created_at, updated_at
     FROM tb_os_scheduler_assignment
     WHERE ${conditions.join(' AND ')}`
  )
    .bind(...values)
    .all<SchedulerAssignmentRow>()

  return Response.json({ assignments: result.results })
}

async function handleUpsertSchedulerAssignment(
  request: Request,
  env: Env
): Promise<Response> {
  assertJwtSecret(env)
  const auth = await requireAuth(request, env)
  if (!auth) {
    return Response.json({ error: 'Token invalido.' }, { status: 401 })
  }

  const payload = await readJson(request)
  if (!payload) {
    return Response.json({ error: 'Dados invalidos.' }, { status: 400 })
  }

  const osId = String(payload.os_id || '').trim()
  const coordenacao = String(payload.coordenacao || '').trim()
  const equipeId = String(payload.equipe_id || '').trim()
  const subEquipe = String(payload.sub_equipe || '').trim()

  if (!osId || !coordenacao || !equipeId || !subEquipe) {
    return Response.json(
      { error: 'OS, coordenacao, equipe e sub-equipe sao obrigatorias.' },
      { status: 400 }
    )
  }

  const os = await env.DB.prepare(
    `SELECT id, os_status, os_programado1, os_realizado_em
     FROM tb_order_service
     WHERE id = ? AND company_id = ?`
  )
    .bind(osId, auth.company_id)
    .first<OrderServiceRow>()

  if (!os) {
    return Response.json({ error: 'OS nao encontrada.' }, { status: 404 })
  }

  const estrutura = await env.DB.prepare(
    `SELECT id, coordenacao FROM tb_estrutura WHERE id = ? AND company_id = ?`
  )
    .bind(equipeId, auth.company_id)
    .first<{ id: string; coordenacao: string }>()

  if (!estrutura || estrutura.coordenacao !== coordenacao) {
    return Response.json({ error: 'Equipe invalida.' }, { status: 400 })
  }

  const existing = await env.DB.prepare(
    `SELECT id, coordenacao, equipe_id, sub_equipe
     FROM tb_os_scheduler_assignment
     WHERE company_id = ? AND os_id = ?`
  )
    .bind(auth.company_id, osId)
    .first<SchedulerAssignmentRow>()

  const todayKey = getLocalDateKey()
  const programado1 = normalizeDateOnly(os.os_programado1)
  const isOverdueWeek1 =
    os.os_status === 'PROGRAMADO' &&
    !os.os_realizado_em &&
    Boolean(programado1) &&
    (programado1 || '') < todayKey

  if (existing) {
    if (existing.equipe_id === equipeId && existing.sub_equipe === subEquipe) {
      return Response.json({ ok: true, id: existing.id })
    }
    if (os.os_status !== 'CRIADO' && !isOverdueWeek1) {
      return Response.json(
        { error: 'OS ja esta alocada em outra equipe.' },
        { status: 409 }
      )
    }
    await env.DB.prepare(
      `UPDATE tb_os_scheduler_assignment
       SET coordenacao = ?, equipe_id = ?, sub_equipe = ?, updated_at = datetime('now')
       WHERE id = ? AND company_id = ?`
    )
      .bind(coordenacao, equipeId, subEquipe, existing.id, auth.company_id)
      .run()
    return Response.json({ ok: true, id: existing.id })
  }

  const id = crypto.randomUUID()
  await env.DB.prepare(
    `INSERT INTO tb_os_scheduler_assignment (
       id,
       company_id,
       os_id,
       coordenacao,
       equipe_id,
       sub_equipe,
       created_at,
       updated_at
     ) VALUES (?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`
  )
    .bind(id, auth.company_id, osId, coordenacao, equipeId, subEquipe)
    .run()

  return Response.json({ ok: true, id })
}

async function handleDeleteSchedulerAssignment(
  request: Request,
  env: Env
): Promise<Response> {
  assertJwtSecret(env)
  const auth = await requireAuth(request, env)
  if (!auth) {
    return Response.json({ error: 'Token invalido.' }, { status: 401 })
  }

  const url = new URL(request.url)
  const osId = String(url.searchParams.get('os_id') || '').trim()
  if (!osId) {
    return Response.json({ error: 'os_id obrigatorio.' }, { status: 400 })
  }

  await env.DB.prepare(
    `DELETE FROM tb_os_scheduler_assignment
     WHERE company_id = ? AND os_id = ?`
  )
    .bind(auth.company_id, osId)
    .run()

  return Response.json({ ok: true })
}

async function handleGetSchedulerHolidays(
  request: Request,
  env: Env
): Promise<Response> {
  assertJwtSecret(env)
  const auth = await requireAuth(request, env)
  if (!auth) {
    return Response.json({ error: 'Token invalido.' }, { status: 401 })
  }

  const url = new URL(request.url)
  const equipeId = url.searchParams.get('equipe_id')

  const conditions: string[] = ['company_id = ?']
  const values: Array<string | number> = [auth.company_id]

  if (equipeId) {
    conditions.push('equipe_id = ?')
    values.push(equipeId)
  }

  const result = await env.DB.prepare(
    `SELECT id, company_id, equipe_id, feriado, data, created_at, updated_at
     FROM tb_os_scheduler_holiday
     WHERE ${conditions.join(' AND ')}
     ORDER BY data, feriado`
  )
    .bind(...values)
    .all<SchedulerHolidayRow>()

  return Response.json({ holidays: result.results })
}

async function handleUpsertSchedulerHoliday(
  request: Request,
  env: Env
): Promise<Response> {
  assertJwtSecret(env)
  const auth = await requireAuth(request, env)
  if (!auth) {
    return Response.json({ error: 'Token invalido.' }, { status: 401 })
  }

  const payload = await readJson(request)
  if (!payload) {
    return Response.json({ error: 'Dados invalidos.' }, { status: 400 })
  }

  const id = payload.id ? String(payload.id).trim() : ''
  const feriado = String(payload.feriado || '').trim()
  const data = String(payload.data || '').trim()

  if (!feriado || !data) {
    return Response.json(
      { error: 'Feriado e data sao obrigatorios.' },
      { status: 400 }
    )
  }

  if (id) {
    const equipeId = String(payload.equipe_id || '').trim()
    if (!equipeId) {
      return Response.json({ error: 'Equipe obrigatoria.' }, { status: 400 })
    }

    const estrutura = await env.DB.prepare(
      `SELECT id FROM tb_estrutura WHERE id = ? AND company_id = ?`
    )
      .bind(equipeId, auth.company_id)
      .first<{ id: string }>()

    if (!estrutura) {
      return Response.json({ error: 'Equipe invalida.' }, { status: 400 })
    }

    await env.DB.prepare(
      `UPDATE tb_os_scheduler_holiday
       SET equipe_id = ?, feriado = ?, data = ?, updated_at = datetime('now')
       WHERE id = ? AND company_id = ?`
    )
      .bind(equipeId, feriado, data, id, auth.company_id)
      .run()

    return Response.json({ ok: true })
  }

  const allEquipes = Boolean(payload.all_equipes)
  let equipeIds: string[] = Array.isArray(payload.equipe_ids)
    ? payload.equipe_ids.map((value: unknown) => String(value).trim()).filter(Boolean)
    : []

  if (allEquipes) {
    const result = await env.DB.prepare(
      `SELECT id FROM tb_estrutura
       WHERE company_id = ? AND status = 'ativo' AND execucao = 'sim'`
    )
      .bind(auth.company_id)
      .all<{ id: string }>()
    equipeIds = result.results.map(row => row.id)
  }

  if (!equipeIds.length) {
    return Response.json(
      { error: 'Selecione ao menos uma equipe.' },
      { status: 400 }
    )
  }

  const createdAt = await env.DB.prepare(`SELECT datetime('now') AS now`).first<{
    now: string
  }>()
  const now = createdAt?.now || new Date().toISOString()

  const insertStmt = env.DB.prepare(
    `INSERT INTO tb_os_scheduler_holiday (
       id,
       company_id,
       equipe_id,
       feriado,
       data,
       created_at,
       updated_at
     ) VALUES (?, ?, ?, ?, ?, ?, ?)`
  )

  for (const equipeId of equipeIds) {
    const estrutura = await env.DB.prepare(
      `SELECT id FROM tb_estrutura WHERE id = ? AND company_id = ?`
    )
      .bind(equipeId, auth.company_id)
      .first<{ id: string }>()

    if (!estrutura) {
      continue
    }

    const newId = crypto.randomUUID()
    await insertStmt
      .bind(newId, auth.company_id, equipeId, feriado, data, now, now)
      .run()
  }

  return Response.json({ ok: true })
}

async function handleBulkUploadTables(
  request: Request,
  env: Env
): Promise<Response> {
  assertJwtSecret(env)
  const auth = await requireAuth(request, env)
  if (!auth) {
    return Response.json({ error: 'Token invalido.' }, { status: 401 })
  }
  const tables = Object.values(BULK_UPLOAD_SCHEMAS).map(schema => ({
    name: schema.name,
    columns: schema.columns,
    description: schema.description
  }))
  return Response.json({ tables })
}

async function handleBulkUpload(
  request: Request,
  env: Env
): Promise<Response> {
  assertJwtSecret(env)
  const auth = await requireAuth(request, env)
  if (!auth) {
    return Response.json({ error: 'Token invalido.' }, { status: 401 })
  }

  const formData = await request.formData()
  const table = String(formData.get('table') || '').trim()
  const fileEntry = formData.get('file')

  if (!table || !fileEntry) {
    return Response.json({ error: 'Tabela e arquivo sao obrigatorios.' }, { status: 400 })
  }

  const schema = Object.values(BULK_UPLOAD_SCHEMAS).find(item => item.name === table)
  if (!schema) {
    return Response.json({ error: 'Tabela invalida.' }, { status: 400 })
  }

  let fileName: string | null = null
  if (
    fileEntry &&
    typeof fileEntry === 'object' &&
    'name' in fileEntry &&
    typeof (fileEntry as Record<string, unknown>).name === 'string'
  ) {
    fileName = (fileEntry as Record<string, unknown>).name as string
  }

  const displayName = fileName || 'arquivo'
  return Response.json({
    ok: true,
    message: `Carga para a tabela ${schema.name} recebida (${displayName}). O processamento sera feito em lote.`
  })
}

async function handleOrderServiceHistory(
  request: Request,
  env: Env
): Promise<Response> {
  assertJwtSecret(env)
  const auth = await requireAuth(request, env)
  if (!auth) {
    return Response.json({ error: 'Token invalido.' }, { status: 401 })
  }

  const url = new URL(request.url)
  const osId = url.searchParams.get('os_id')
  if (!osId) {
    return Response.json({ error: 'os_id obrigatorio.' }, { status: 400 })
  }

  const result = await env.DB.prepare(
    `SELECT id, company_id, order_service_id, action, before_data, after_data, changed_by_user_id, changed_by_name, created_at
     FROM tb_order_service_history
     WHERE company_id = ? AND order_service_id = ?
     ORDER BY created_at DESC`
  )
    .bind(auth.company_id, osId)
    .all<OrderServiceHistoryRow>()

  return Response.json({ history: result.results })
}

async function insertProfilePermissions(
  env: Env,
  profileId: string,
  permissions: Array<Record<string, unknown>>
) {
  for (const item of permissions) {
    const screenId = String(item.screen_id || '').trim()
    if (!screenId) continue
    const leitura = item.leitura ? 1 : 0
    const criacao = item.criacao ? 1 : 0
    const edicao = item.edicao ? 1 : 0
    const exclusao = item.exclusao ? 1 : 0
    await env.DB.prepare(
      `INSERT INTO tb_profile_permission (profile_id, screen_id, leitura, criacao, edicao, exclusao)
       VALUES (?, ?, ?, ?, ?, ?)`
    )
      .bind(profileId, screenId, leitura, criacao, edicao, exclusao)
      .run()
  }
}

async function revokeActiveSessionsForUser(
  env: Env,
  userId: string,
  companyId: string
): Promise<void> {
  const now = new Date().toISOString()
  await env.DB.prepare(
    `UPDATE tb_user_session
     SET revoked_at = ?
     WHERE company_id = ? AND user_id = ? AND revoked_at IS NULL`
  )
    .bind(now, companyId, userId)
    .run()
}

async function revokeSession(
  env: Env,
  sessionId: string,
  companyId: string,
  userId: string
): Promise<void> {
  const now = new Date().toISOString()
  await env.DB.prepare(
    `UPDATE tb_user_session
     SET revoked_at = ?
     WHERE id = ? AND company_id = ? AND user_id = ? AND revoked_at IS NULL`
  )
    .bind(now, sessionId, companyId, userId)
    .run()
}

async function createUserSession(
  env: Env,
  companyId: string,
  userId: string,
  ip: string | null
): Promise<string> {
  const id = crypto.randomUUID()
  const now = new Date().toISOString()
  await env.DB.prepare(
    `INSERT INTO tb_user_session (id, company_id, user_id, ip, created_at)
     VALUES (?, ?, ?, ?, ?)`
  )
    .bind(id, companyId, userId, ip, now)
    .run()
  return id
}

async function getSessionById(
  env: Env,
  sessionId: string,
  companyId: string,
  userId: string
): Promise<UserSessionRow | null> {
  return env.DB
    .prepare(
      `SELECT id, company_id, user_id, ip, created_at, revoked_at
       FROM tb_user_session
       WHERE id = ? AND company_id = ? AND user_id = ?`
    )
    .bind(sessionId, companyId, userId)
    .first<UserSessionRow>()
}

async function requireAuth(request: Request, env: Env): Promise<AuthPayload | null> {
  const header = request.headers.get('authorization') || ''
  let token = header.startsWith('Bearer ') ? header.slice(7).trim() : ''
  if (!token) {
    token = getTokenFromCookie(request) || ''
  }
  if (!token) return null
  const payload = await verifyJwt(token, env.JWT_SECRET)
  if (!payload) return null
  if (!payload.session_id) return null

  const session = await getSessionById(
    env,
    payload.session_id,
    payload.company_id,
    payload.user_id
  )
  if (!session || session.revoked_at) {
    return null
  }

  const requestIp = getClientIp(request)
  if (session.ip && requestIp && session.ip !== requestIp) {
    return null
  }

  const nowSeconds = Math.floor(Date.now() / 1000)
  const refreshThresholdSeconds = SESSION_REFRESH_THRESHOLD_MINUTES * 60
  if (payload.exp - nowSeconds <= refreshThresholdSeconds) {
    const expiresMinutes =
      parseInt(env.JWT_EXP_MINUTES || '', 10) || DEFAULT_JWT_EXP_MINUTES
    const refreshToken = await signJwt(
      {
        user_id: payload.user_id,
        company_id: payload.company_id,
        nome: payload.nome,
        cargo: payload.cargo,
        equipe: payload.equipe,
        session_id: payload.session_id
      },
      env.JWT_SECRET,
      expiresMinutes
    )
    scheduleSessionRefresh(request, refreshToken, expiresMinutes * 60)
  }

  return payload
}

async function requirePermission(
  env: Env,
  auth: AuthPayload,
  screenId: string,
  action: PermissionAction
): Promise<Response | null> {
  const row = await env.DB.prepare(
    `SELECT p.status AS profile_status,
            perm.leitura AS leitura,
            perm.criacao AS criacao,
            perm.edicao AS edicao,
            perm.exclusao AS exclusao
     FROM tb_user u
     LEFT JOIN tb_profile p ON p.id = u.profile_id
     LEFT JOIN tb_profile_permission perm
       ON perm.profile_id = u.profile_id AND perm.screen_id = ?
     WHERE u.id = ? AND u.company_id = ?`
  )
    .bind(screenId, auth.user_id, auth.company_id)
    .first<PermissionCheckRow>()

  if (!row || row.profile_status !== 'ativo') {
    return Response.json({ error: 'Acesso negado.' }, { status: 403 })
  }

  const allowed =
    action === 'leitura'
      ? row.leitura === 1
      : action === 'criacao'
        ? row.criacao === 1
        : action === 'edicao'
          ? row.edicao === 1
          : row.exclusao === 1

  if (!allowed) {
    return Response.json({ error: 'Acesso negado.' }, { status: 403 })
  }

  return null
}

async function signJwt(
  data: Omit<AuthPayload, 'exp'>,
  secret: string,
  expiresInMinutes: number
): Promise<string> {
  const header = { alg: 'HS256', typ: 'JWT' }
  const exp = Math.floor(Date.now() / 1000) + expiresInMinutes * 60
  const payload: AuthPayload = { ...data, exp }

  const headerB64 = base64UrlEncode(JSON.stringify(header))
  const payloadB64 = base64UrlEncode(JSON.stringify(payload))
  const signature = await hmacSha256(`${headerB64}.${payloadB64}`, secret)

  return `${headerB64}.${payloadB64}.${signature}`
}

async function verifyJwt(token: string, secret: string): Promise<AuthPayload | null> {
  const [headerB64, payloadB64, signature] = token.split('.')
  if (!headerB64 || !payloadB64 || !signature) return null

  const expected = await hmacSha256(`${headerB64}.${payloadB64}`, secret)
  if (!timingSafeEqual(signature, expected)) return null

  const payload = decodeBase64Url<AuthPayload>(payloadB64)
  if (!payload || typeof payload.exp !== 'number') return null
  if (payload.exp <= Math.floor(Date.now() / 1000)) return null

  return payload
}

async function hmacSha256(value: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(value))
  return base64UrlEncode(new Uint8Array(signature))
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let result = 0
  for (let i = 0; i < a.length; i += 1) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i)
  }
  return result === 0
}

function base64UrlEncode(input: string | Uint8Array): string {
  const bytes = typeof input === 'string' ? new TextEncoder().encode(input) : input
  let binary = ''
  bytes.forEach(byte => {
    binary += String.fromCharCode(byte)
  })
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
}

function decodeBase64Url<T>(value: string): T | null {
  const padded = value.replace(/-/g, '+').replace(/_/g, '/')
  const padLength = (4 - (padded.length % 4)) % 4
  const base64 = padded + '='.repeat(padLength)
  try {
    const decoded = atob(base64)
    return JSON.parse(decoded) as T
  } catch {
    return null
  }
}

function assertJwtSecret(env: Env) {
  if (!env.JWT_SECRET) {
    throw new Error('JWT_SECRET is required as an environment variable')
  }
}

function normalizeStatus(value: string): 'ativo' | 'inativo' | 'excluido' | null {
  if (value === 'ativo' || value === 'inativo' || value === 'excluido') {
    return value
  }
  return null
}

function normalizeProfileStatus(value: string): 'ativo' | 'inativo' | null {
  const normalized = normalizeStatus(value)
  if (normalized === 'excluido') {
    return null
  }
  return normalized
}

function normalizeEscala(value: string): 'ADM' | '6x2' | null {
  const normalized = String(value ?? '').trim().toUpperCase()
  if (normalized === 'ADM') return 'ADM'
  if (normalized === '6X2') return '6x2'
  return null
}

function normalizeAtivoField(value: unknown): string {
  return String(value ?? '').trim()
}

function normalizeOsTipo(value: unknown): 'PDM' | 'EX' | 'RI' | null {
  const normalized = String(value ?? '').trim().toUpperCase()
  if (normalized === 'PDM' || normalized === 'EX' || normalized === 'RI') {
    return normalized
  }
  return null
}

function normalizeOsStatus(
  value: unknown
): 'CRIADO' | 'PROGRAMADO' | 'REALIZADO' | 'CANCELADO' | null {
  const normalized = String(value ?? '').trim().toUpperCase()
  if (
    normalized === 'CRIADO' ||
    normalized === 'PROGRAMADO' ||
    normalized === 'REALIZADO' ||
    normalized === 'CANCELADO'
  ) {
    return normalized
  }
  return null
}

function normalizeFlag(value: unknown): 0 | 1 | null {
  if (value === 0 || value === '0' || value === false) return 0
  if (value === 1 || value === '1' || value === true) return 1
  return null
}

function normalizeDateOnly(value: unknown): string | null {
  if (!value) return null
  const trimmed = String(value).trim()
  if (!trimmed) return null
  const datePart = trimmed.split('T')[0].split(' ')[0]
  return datePart || null
}

function getLocalDateKey(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function isPasswordValid(value: string): boolean {
  if (value.length < 7) return false
  const hasLetter = /[A-Za-z]/.test(value)
  const hasNumber = /[0-9]/.test(value)
  const hasSpecial = /[!@#$%&]/.test(value)
  return hasLetter && hasNumber && hasSpecial
}

function isValidCs(value: string): boolean {
  return /^[0-9]{6}$/.test(value)
}

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

function maskEmailForHint(email: string): string {
  const [local, domain] = email.split('@')
  if (!domain) return email
  if (local.length <= 2) {
    return `**@${domain}`
  }
  const visible = local.slice(0, 1)
  const hidden = '*'.repeat(Math.min(local.length - 1, 3))
  return `${visible}${hidden}@${domain}`
}

function generateSecurityCode(): string {
  const array = new Uint32Array(1)
  crypto.getRandomValues(array)
  const number = array[0] % 1000000
  return String(number).padStart(6, '0')
}

function getSecurityCodeExpirationMinutes(env: Env): number {
  const parsed = parseInt(env.SECURITY_CODE_EXP_MINUTES || '', 10)
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return DEFAULT_SECURITY_CODE_EXP_MINUTES
  }
  return parsed
}

function shouldRequireSecurityValidation(lastValidatedAt?: string | null): boolean {
  if (!lastValidatedAt) return true
  const validatedMs = Date.parse(lastValidatedAt)
  if (Number.isNaN(validatedMs)) return true
  const intervalMs = DEFAULT_SECURITY_VALIDATION_INTERVAL_DAYS * 24 * 60 * 60 * 1000
  return validatedMs + intervalMs <= Date.now()
}

async function hashResetToken(token: string): Promise<string> {
  const digest = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(token)
  )
  const bytes = new Uint8Array(digest)
  return Array.from(bytes)
    .map(byte => byte.toString(16).padStart(2, '0'))
    .join('')
}

function getPasswordResetExpirationMinutes(env: Env): number {
  const parsed = parseInt(env.PASSWORD_RESET_TOKEN_EXP_MINUTES || '', 10)
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return DEFAULT_PASSWORD_RESET_EXP_MINUTES
  }
  return parsed
}

function buildPasswordResetLink(env: Env, tokenId: string, token: string): string {
  const raw = env.PASSWORD_RESET_FRONTEND_URL?.trim() || 'http://localhost:5173'
  let base: URL
  try {
    base = new URL(raw)
  } catch {
    base = new URL('http://localhost:5173')
  }
  base.pathname = PASSWORD_RESET_PAGE_PATH
  base.searchParams.set(PASSWORD_RESET_ID_QUERY, tokenId)
  base.searchParams.set(PASSWORD_RESET_TOKEN_QUERY, token)
  return base.toString()
}

async function sendPasswordResetEmail(
  env: Env,
  user: UserRow,
  resetLink: string
): Promise<void> {
  const apiUrl = env.PASSWORD_RESET_EMAIL_API_URL?.trim()
  const apiKey = env.PASSWORD_RESET_EMAIL_API_KEY?.trim()
  const from = env.PASSWORD_RESET_EMAIL_FROM?.trim()
  if (!apiUrl || !apiKey || !from) {
    throw new Error('Serviço de email para recuperação de senha não configurado.')
  }

  const subject =
    env.PASSWORD_RESET_EMAIL_SUBJECT?.trim() || DEFAULT_PASSWORD_RESET_EMAIL_SUBJECT
  const expiresMinutes = getPasswordResetExpirationMinutes(env)
  const plain = `Olá ${user.nome},\n\nRecebemos uma solicitação para redefinir sua senha. Clique no link abaixo para continuar e defina uma nova senha. O link expira em ${expiresMinutes} minutos.\n\n${resetLink}\n\nSe você não solicitou essa alteração, ignore este email.`
  const html = `
    <p>Olá ${user.nome},</p>
    <p>Recebemos uma solicitação para redefinir sua senha. Clique no link abaixo para continuar e defina uma nova senha.</p>
    <p><a href="${resetLink}">Redefinir minha senha</a></p>
    <p>Esse link expira em ${expiresMinutes} minutos. Se você não solicitou essa alteração, ignore este email.</p>
  `

  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      from,
      to: user.email,
      subject,
      text: plain,
      html
    })
  })

    if (!response.ok) {
      const errorBody = await response.text()
      throw new Error(
        `Falha ao enviar email de recuperação: ${response.status} ${errorBody}`
      )
    }
}

async function sendSecurityCodeEmail(
  env: Env,
  user: UserRow,
  code: string,
  expiresMinutes: number
): Promise<void> {
  const apiUrl = env.PASSWORD_RESET_EMAIL_API_URL?.trim()
  const apiKey = env.PASSWORD_RESET_EMAIL_API_KEY?.trim()
  const from = env.PASSWORD_RESET_EMAIL_FROM?.trim()
  if (!apiUrl || !apiKey || !from) {
    throw new Error('Serviço de email para segurança não configurado.')
  }

  const subject =
    env.SECURITY_CODE_EMAIL_SUBJECT?.trim() || DEFAULT_SECURITY_CODE_EMAIL_SUBJECT
  const plain = `Olá ${user.nome},\n\nInforme o código abaixo para continuar. O código expira em ${expiresMinutes} minutos.\n\n${code}\n\nSe você não solicitou esse código, ignore esta mensagem.\n`
  const html = `
    <p>Olá ${user.nome},</p>
    <p>Informe o código abaixo para continuar.</p>
    <p style="font-weight:600;font-size:1.4rem">${code}</p>
    <p>O código expira em ${expiresMinutes} minutos. Se você não solicitou, ignore esta mensagem.</p>
  `

  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      from,
      to: user.email,
      subject,
      text: plain,
      html
    })
  })

  if (!response.ok) {
    const errorBody = await response.text()
    throw new Error(
      `Falha ao enviar código de segurança: ${response.status} ${errorBody}`
    )
  }
}

async function createSecurityValidationChallenge(
  env: Env,
  user: UserRow
): Promise<{ challenge_id: string; expires_at: string; email_hint: string }> {
  await env.DB
    .prepare(
      `UPDATE tb_security_validation
       SET status = 'revoked', revoked_at = ?
       WHERE user_id = ? AND status = 'pending'`
    )
    .bind(new Date().toISOString(), user.id)
    .run()

  const expiresMinutes = getSecurityCodeExpirationMinutes(env)
  const expiresAt = new Date(
    Date.now() + expiresMinutes * 60 * 1000
  ).toISOString()
  const challengeId = crypto.randomUUID()
  const code = generateSecurityCode()
  const codeHash = await hashResetToken(code)

  await env.DB
    .prepare(
      `INSERT INTO tb_security_validation (
         id, company_id, user_id, cs, code_hash, expires_at, status
       ) VALUES (?, ?, ?, ?, ?, ?, 'pending')`
    )
    .bind(challengeId, user.company_id, user.id, user.cs, codeHash, expiresAt)
    .run()

  try {
    await sendSecurityCodeEmail(env, user, code, expiresMinutes)
  } catch (error) {
    await env.DB
      .prepare('DELETE FROM tb_security_validation WHERE id = ?')
      .bind(challengeId)
      .run()
    throw error
  }

  return {
    challenge_id: challengeId,
    expires_at: expiresAt,
    email_hint: maskEmailForHint(user.email)
  }
}

async function getSecurityValidationChallenge(
  env: Env,
  challengeId: string
): Promise<SecurityValidationRow | null> {
  return env.DB
    .prepare(
      `SELECT id, company_id, user_id, cs, code_hash, expires_at, status, attempts
       FROM tb_security_validation
       WHERE id = ?`
    )
    .bind(challengeId)
    .first<SecurityValidationRow>()
}

async function readJson(request: Request): Promise<Record<string, unknown> | null> {
  try {
    if (!request.body) return null
    return (await request.json()) as Record<string, unknown>
  } catch {
    return null
  }
}

function parseBooleanFlag(value: unknown): 0 | 1 | null {
  if (value === undefined || value === null) return null
  if (typeof value === 'boolean') return value ? 1 : 0
  const normalized = String(value).trim().toLowerCase()
  if (normalized === '1' || normalized === 'true') return 1
  if (normalized === '0' || normalized === 'false') return 0
  return null
}

function parseNullableNumber(value: unknown): number | null {
  if (value === undefined || value === null) return null
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null
  }
  const normalized = String(value).trim()
  if (!normalized) return null
  const parsed = Number(normalized)
  if (Number.isNaN(parsed)) return null
  return parsed
}

type LoginLogInput = {
  success: 0 | 1
  reason: string
  companyId?: string | null
  userId?: string | null
  cs?: string | null
  email?: string | null
  ip?: string | null
  userAgent?: string | null
}

async function logLoginAttempt(env: Env, input: LoginLogInput): Promise<void> {
  await env.DB
    .prepare(
      'INSERT INTO tb_login_log (id, company_id, user_id, cs, email, ip, user_agent, success, reason) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
    )
    .bind(
      crypto.randomUUID(),
      input.companyId ?? null,
      input.userId ?? null,
      input.cs ?? null,
      input.email ?? null,
      input.ip ?? null,
      input.userAgent ?? null,
      input.success,
      input.reason
    )
    .run()
}

type UserHistoryInput = {
  companyId: string
  userId: string
  changedByUserId: string
  changedByName: string
  changes: string
}

async function logUserHistory(env: Env, input: UserHistoryInput): Promise<void> {
  await env.DB
    .prepare(
      'INSERT INTO tb_user_history (id, company_id, user_id, changed_by_user_id, changed_by_name, changes) VALUES (?, ?, ?, ?, ?, ?)'
    )
    .bind(
      crypto.randomUUID(),
      input.companyId,
      input.userId,
      input.changedByUserId,
      input.changedByName,
      input.changes
    )
    .run()
}

type ProfileHistoryInput = {
  companyId: string
  profileId: string
  changedByUserId: string
  changedByName: string
  changes: string
}

async function logProfileHistory(env: Env, input: ProfileHistoryInput): Promise<void> {
  await env.DB
    .prepare(
      'INSERT INTO tb_profile_history (id, company_id, profile_id, changed_by_user_id, changed_by_name, changes) VALUES (?, ?, ?, ?, ?, ?)'
    )
    .bind(
      crypto.randomUUID(),
      input.companyId,
      input.profileId,
      input.changedByUserId,
      input.changedByName,
      input.changes
    )
    .run()
}

type EstruturaHistoryInput = {
  companyId: string
  estruturaId: string
  action: 'criado' | 'atualizado'
  beforeData: string | null
  afterData: string
  changedByUserId: string
  changedByName: string
}

async function logEstruturaHistory(
  env: Env,
  input: EstruturaHistoryInput
): Promise<void> {
  await env.DB
    .prepare(
      'INSERT INTO tb_estrutura_history (id, company_id, estrutura_id, action, before_data, after_data, changed_by_user_id, changed_by_name) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    )
    .bind(
      crypto.randomUUID(),
      input.companyId,
      input.estruturaId,
      input.action,
      input.beforeData,
      input.afterData,
      input.changedByUserId,
      input.changedByName
    )
    .run()
}

type AtivoHistoryInput = {
  companyId: string
  ativoId: string
  action: 'criado' | 'atualizado'
  beforeData: string | null
  afterData: string
  changedByUserId: string
  changedByName: string
}

async function logAtivoHistory(env: Env, input: AtivoHistoryInput): Promise<void> {
  await env.DB
    .prepare(
      'INSERT INTO tb_ativo_history (id, company_id, ativo_id, action, before_data, after_data, changed_by_user_id, changed_by_name) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    )
    .bind(
      crypto.randomUUID(),
      input.companyId,
      input.ativoId,
      input.action,
      input.beforeData,
      input.afterData,
      input.changedByUserId,
      input.changedByName
    )
    .run()
}

type AtivoStatusLogInput = {
  companyId: string
  ativoId: string
  ativoCodpe: string
  ativoDescritivo: string
  equipe: string
  status: string
  observacao: string
  dataAlteracao: string
  dataPrevisaoReparo: string | null
  changedByUserId: string | null
  changedByName: string | null
}
async function logAtivoStatusChange(
  env: Env,
  input: AtivoStatusLogInput
): Promise<void> {
  await env.DB
    .prepare(
      `INSERT INTO tb_ativo_status_log (
        id,
        company_id,
        ativo_id,
        ativo_codpe,
        ativo_descritivo,
        equipe,
        status,
        observacao,
        data_alteracao,
        data_previsao_reparo,
        changed_by_user_id,
        changed_by_name
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(
      crypto.randomUUID(),
      input.companyId,
      input.ativoId,
      input.ativoCodpe,
      input.ativoDescritivo,
      input.equipe,
      input.status,
      input.observacao,
      input.dataAlteracao,
      input.dataPrevisaoReparo,
      input.changedByUserId,
      input.changedByName
    )
    .run()
}

type OrderServiceHistoryInput = {
  companyId: string
  orderServiceId: string
  action: 'criado' | 'atualizado'
  beforeData: string | null
  afterData: string
  changedByUserId: string
  changedByName: string
}

async function logOrderServiceHistory(
  env: Env,
  input: OrderServiceHistoryInput
): Promise<void> {
  await env.DB
    .prepare(
      'INSERT INTO tb_order_service_history (id, company_id, order_service_id, action, before_data, after_data, changed_by_user_id, changed_by_name) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    )
    .bind(
      crypto.randomUUID(),
      input.companyId,
      input.orderServiceId,
      input.action,
      input.beforeData,
      input.afterData,
      input.changedByUserId,
      input.changedByName
    )
    .run()
}

function getClientIp(request: Request): string | null {
  return (
    request.headers.get('cf-connecting-ip') ||
    request.headers.get('x-forwarded-for') ||
    null
  )
}

function getTokenFromCookie(request: Request): string | null {
  const raw = request.headers.get('cookie') || ''
  if (!raw) return null
  const search = `${SESSION_COOKIE_NAME}=`
  const parts = raw.split(';')
  for (const part of parts) {
    const trimmed = part.trim()
    if (trimmed.startsWith(search)) {
      return trimmed.slice(search.length)
    }
  }
  return null
}

function isSecureRequest(request: Request): boolean {
  const forwardedProto = request.headers.get('x-forwarded-proto')
  if (forwardedProto) {
    return forwardedProto.toLowerCase().includes('https')
  }
  const protocol = new URL(request.url).protocol
  return protocol === 'https:'
}

function buildSessionCookie(
  value: string,
  request: Request,
  maxAgeSeconds: number
): string {
  const secure = isSecureRequest(request)
  const sameSite = secure ? 'None' : 'Lax'
  const parts = [
    `${SESSION_COOKIE_NAME}=${value}`,
    `Max-Age=${maxAgeSeconds}`,
    'Path=/',
    'HttpOnly',
    `SameSite=${sameSite}`
  ]
  if (secure) {
    parts.push('Secure')
  }
  return parts.join('; ')
}

const normalizeOrigins = (raw?: string): string[] =>
  (raw ?? '')
    .split(/\s+/)
    .map(origin => origin.trim())
    .filter(Boolean)

function resolveCorsOrigin(env: Env, request?: Request): string {
  const requestOrigin = request?.headers.get('origin')
  const allowedOrigins = normalizeOrigins(env.CORS_ORIGIN)
  if (allowedOrigins.includes('*')) {
    return '*'
  }
  if (requestOrigin) {
    if (allowedOrigins.includes(requestOrigin)) {
      return requestOrigin
    }
    if (
      allowedOrigins.some(origin => {
        if (origin.startsWith('*.')) {
          return requestOrigin.endsWith(origin.replace('*', ''))
        }
        return false
      })
    ) {
      return requestOrigin
    }
    if (requestOrigin.endsWith('.works-to-front.pages.dev')) {
      return requestOrigin
    }
  }
  if (allowedOrigins.length) {
    return allowedOrigins[0]
  }
  if (requestOrigin) {
    return requestOrigin
  }
  return '*'
}

function withCors(
  response: Response,
  env: Env,
  request?: Request
): Response {
  const origin = resolveCorsOrigin(env, request)
  const headers = new Headers(response.headers)
  headers.set('Access-Control-Allow-Origin', origin)
  headers.set('Access-Control-Allow-Methods', 'GET,POST,PATCH,DELETE,OPTIONS')
  headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  headers.set('Access-Control-Max-Age', '86400')
  if (origin !== '*') {
    headers.set('Access-Control-Allow-Credentials', 'true')
  }
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers
  })
}
