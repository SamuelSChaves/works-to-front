-- Schema for Cloudflare D1
-- Migration flow:
-- Local:  wrangler d1 execute app_db --local --file=db/schema.sql
-- Remote: wrangler d1 execute app_db --remote --file=db/schema.sql
-- Keep local in sync with remote by applying this file locally before remote deploy.

PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS tb_company (
  id TEXT PRIMARY KEY,
  nome TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('ativo', 'inativo')),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_company_nome
ON tb_company (nome);

CREATE TABLE IF NOT EXISTS tb_user (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  nome TEXT NOT NULL,
  cs TEXT NOT NULL,
  email TEXT NOT NULL,
  escala TEXT NOT NULL CHECK (escala IN ('ADM', '6x2')),
  profile_id TEXT,
  cargo TEXT,
  coordenacao TEXT,
  equipe TEXT,
  equipe_aditiva TEXT,
  status TEXT NOT NULL CHECK (status IN ('ativo', 'inativo')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (company_id) REFERENCES tb_company (id) ON DELETE CASCADE,
  FOREIGN KEY (profile_id) REFERENCES tb_profile (id) ON DELETE SET NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_user_company_cs
ON tb_user (company_id, cs);

CREATE UNIQUE INDEX IF NOT EXISTS idx_user_company_email
ON tb_user (company_id, email);

CREATE UNIQUE INDEX IF NOT EXISTS idx_user_company_nome
ON tb_user (company_id, nome);

CREATE TABLE IF NOT EXISTS tb_user_auth (
  user_id TEXT PRIMARY KEY,
  password_hash TEXT NOT NULL,
  last_login_at TEXT,
  failed_attempts INTEGER NOT NULL DEFAULT 0,
  locked_until TEXT,
  FOREIGN KEY (user_id) REFERENCES tb_user (id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS tb_password_reset (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  token_hash TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  used_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (company_id) REFERENCES tb_company (id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES tb_user (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_password_reset_user
ON tb_password_reset (user_id);

CREATE TABLE IF NOT EXISTS tb_login_log (
  id TEXT PRIMARY KEY,
  company_id TEXT,
  user_id TEXT,
  cs TEXT,
  email TEXT,
  ip TEXT,
  user_agent TEXT,
  success INTEGER NOT NULL,
  reason TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (company_id) REFERENCES tb_company (id) ON DELETE SET NULL,
  FOREIGN KEY (user_id) REFERENCES tb_user (id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_login_log_company
ON tb_login_log (company_id, created_at);

CREATE INDEX IF NOT EXISTS idx_login_log_user
ON tb_login_log (user_id, created_at);

CREATE TABLE IF NOT EXISTS tb_user_session (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  ip TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  revoked_at TEXT,
  FOREIGN KEY (company_id) REFERENCES tb_company (id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES tb_user (id) ON DELETE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_user_session_user_active
ON tb_user_session (company_id, user_id)
WHERE revoked_at IS NULL;

CREATE TABLE IF NOT EXISTS tb_tarefas (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  id_sigla TEXT NOT NULL,
  sigla TEXT NOT NULL,
  tarefa TEXT NOT NULL,
  medicao INTEGER NOT NULL DEFAULT 0 CHECK (medicao IN (0, 1)),
  criticidade INTEGER NOT NULL DEFAULT 0 CHECK (criticidade IN (0, 1)),
  periodicidade INTEGER NOT NULL CHECK (periodicidade BETWEEN 1 AND 60),
  sub_sistema TEXT,
  sistema TEXT,
  codigo TEXT NOT NULL,
  active INTEGER NOT NULL DEFAULT 1 CHECK (active IN (0, 1)),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  created_by TEXT,
  updated_by TEXT,
  FOREIGN KEY (company_id) REFERENCES tb_company (id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES tb_user (id) ON DELETE SET NULL,
  FOREIGN KEY (updated_by) REFERENCES tb_user (id) ON DELETE SET NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_tarefas_sigla_codigo
ON tb_tarefas (company_id, sigla, codigo);

CREATE TABLE IF NOT EXISTS tb_user_history (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  changed_by_user_id TEXT,
  changed_by_name TEXT,
  changes TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (company_id) REFERENCES tb_company (id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES tb_user (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_user_history_user
ON tb_user_history (user_id, created_at);

CREATE TABLE IF NOT EXISTS tb_profile (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  name TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('ativo', 'inativo')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (company_id) REFERENCES tb_company (id) ON DELETE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_profile_company_name
ON tb_profile (company_id, name);

CREATE TABLE IF NOT EXISTS tb_profile_permission (
  profile_id TEXT NOT NULL,
  screen_id TEXT NOT NULL,
  leitura INTEGER NOT NULL DEFAULT 0,
  criacao INTEGER NOT NULL DEFAULT 0,
  edicao INTEGER NOT NULL DEFAULT 0,
  exclusao INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (profile_id, screen_id),
  FOREIGN KEY (profile_id) REFERENCES tb_profile (id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS tb_profile_history (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  profile_id TEXT NOT NULL,
  changed_by_user_id TEXT,
  changed_by_name TEXT,
  changes TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (company_id) REFERENCES tb_company (id) ON DELETE CASCADE,
  FOREIGN KEY (profile_id) REFERENCES tb_profile (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_profile_history_profile
ON tb_profile_history (profile_id, created_at);

CREATE TABLE IF NOT EXISTS tb_estrutura (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  coordenacao TEXT NOT NULL,
  equipe TEXT NOT NULL,
  cc TEXT NOT NULL,
  execucao TEXT NOT NULL DEFAULT 'sim' CHECK (execucao IN ('sim', 'nao')),
  status TEXT NOT NULL DEFAULT 'ativo' CHECK (status IN ('ativo', 'inativo', 'excluido')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (company_id) REFERENCES tb_company (id) ON DELETE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_estrutura_company_unique
ON tb_estrutura (company_id, coordenacao, equipe);

CREATE TABLE IF NOT EXISTS tb_parametro (
  id_parametro TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  tipo_parametro TEXT NOT NULL CHECK (tipo_parametro IN (
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
  )),
  valor TEXT NOT NULL,
  ativo INTEGER NOT NULL DEFAULT 1 CHECK (ativo IN (0, 1)),
  ordem INTEGER,
  observacao TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (company_id) REFERENCES tb_company (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_parametro_company_tipo
ON tb_parametro (company_id, tipo_parametro);

CREATE TABLE IF NOT EXISTS tb_acao (
  id_acao TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  id_usuario_solicitante TEXT,
  id_usuario_responsavel TEXT,
  data_criado TEXT,
  data_vencimento TEXT,
  status TEXT NOT NULL CHECK (status IN ('Aberta', 'Em andamento', 'Concluída')),
  grupo_acao TEXT,
  origem_acao TEXT,
  equipe TEXT,
  criticidade TEXT,
  texto_acao TEXT,
  texto_enerramento TEXT,
  texto_devolutiva TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (company_id) REFERENCES tb_company (id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS tb_acao_anexo (
  id TEXT PRIMARY KEY,
  acao_id TEXT NOT NULL,
  company_id TEXT NOT NULL,
  filename TEXT NOT NULL,
  r2_key TEXT NOT NULL,
  content_type TEXT,
  size INTEGER,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  created_by TEXT,
  FOREIGN KEY (acao_id) REFERENCES tb_acao (id_acao) ON DELETE CASCADE,
  FOREIGN KEY (company_id) REFERENCES tb_company (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_tb_acao_anexo_company_action
  ON tb_acao_anexo (company_id, acao_id);

CREATE INDEX IF NOT EXISTS idx_acao_company_vencimento
ON tb_acao (company_id, data_vencimento);

CREATE TABLE IF NOT EXISTS tb_estrutura_history (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  estrutura_id TEXT NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('criado', 'atualizado')),
  before_data TEXT,
  after_data TEXT NOT NULL,
  changed_by_user_id TEXT,
  changed_by_name TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (company_id) REFERENCES tb_company (id) ON DELETE CASCADE,
  FOREIGN KEY (estrutura_id) REFERENCES tb_estrutura (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_estrutura_history_estrutura
ON tb_estrutura_history (estrutura_id, created_at);

CREATE TABLE IF NOT EXISTS tb_ativo (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  ATIVO_EMPRESA TEXT NOT NULL,
  ATIVO_CODPE TEXT NOT NULL,
  ATIVO_DESCRITIVO_OS TEXT NOT NULL,
  ATIVO_STATUS TEXT NOT NULL,
  ATIVO_COORDENACAO TEXT NOT NULL,
  ATIVO_EQUIPE TEXT NOT NULL,
  ATIVO_MONITORADOS TEXT NOT NULL,
  ATIVO_SIGLA TEXT NOT NULL,
  ATIVO_CICLO TEXT NOT NULL,
  ATIVO_CONTADOR INTEGER NOT NULL DEFAULT 1,
  CONTADOR_CICLO TEXT NOT NULL,
  ATIVO_TOLERANCIA TEXT NOT NULL,
  ATIVO_CLASSE TEXT NOT NULL,
  ATIVO_GRUPO TEXT NOT NULL,
  ATIVO_OEA TEXT NOT NULL,
  ATIVO_TMM TEXT NOT NULL,
  ATIVO_LATITUDE TEXT,
  ATIVO_LONGITUDE TEXT,
  ATIVO_ULTIMA_MANUT TEXT,
  ATIVO_MODELO_POSTE TEXT,
  ATIVO_MODELO_RELE TEXT,
  ATIVO_MODELO_DDS TEXT,
  ATIVO_DDS_SERIAL TEXT,
  ATIVO_DDS_DTQ TEXT,
  ATIVO_MYTRAIN TEXT,
  ATIVO_JAMPER1 TEXT,
  ATIVO_JAMPER2 TEXT,
  ATIVO_MODELO TEXT,
  ATIVO_OBSERVACAO TEXT,
  FOREIGN KEY (company_id) REFERENCES tb_company (id) ON DELETE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_ativo_company_codpe
ON tb_ativo (company_id, ATIVO_CODPE);

CREATE TABLE IF NOT EXISTS tb_ativo_history (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  ativo_id TEXT NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('criado', 'atualizado')),
  before_data TEXT,
  after_data TEXT NOT NULL,
  changed_by_user_id TEXT,
  changed_by_name TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (company_id) REFERENCES tb_company (id) ON DELETE CASCADE,
  FOREIGN KEY (ativo_id) REFERENCES tb_ativo (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_ativo_history_ativo
ON tb_ativo_history (ativo_id, created_at);

CREATE TABLE IF NOT EXISTS tb_ativo_status_log (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  ativo_id TEXT NOT NULL,
  ativo_codpe TEXT NOT NULL,
  ativo_descritivo TEXT NOT NULL,
  equipe TEXT NOT NULL,
  status TEXT NOT NULL,
  observacao TEXT NOT NULL,
  data_alteracao TEXT NOT NULL,
  data_previsao_reparo TEXT,
  changed_by_user_id TEXT,
  changed_by_name TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (company_id) REFERENCES tb_company (id) ON DELETE CASCADE,
  FOREIGN KEY (ativo_id) REFERENCES tb_ativo (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_ativo_status_log_ativo
ON tb_ativo_status_log (ativo_id, created_at);

CREATE TABLE IF NOT EXISTS tb_componente (
  IDCOMPONETE INTEGER PRIMARY KEY AUTOINCREMENT,
  company_id TEXT NOT NULL,
  IDATIVO TEXT NOT NULL,
  COMP_NOME TEXT NOT NULL,
  COMP_SERIAL TEXT,
  COMP_DATA TEXT,
  COMP_MODELO TEXT,
  COMP_DESCRICAO TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (company_id) REFERENCES tb_company (id) ON DELETE CASCADE,
  FOREIGN KEY (IDATIVO) REFERENCES tb_ativo (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_componente_ativo
ON tb_componente (IDATIVO);

CREATE TABLE IF NOT EXISTS tb_componente_manutencao (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  company_id TEXT NOT NULL,
  hist_manut_id_componente INTEGER NOT NULL,
  hist_manut_data_hora TEXT NOT NULL,
  hist_manut_id_os TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (company_id) REFERENCES tb_company (id) ON DELETE CASCADE,
  FOREIGN KEY (hist_manut_id_componente) REFERENCES tb_componente (IDCOMPONETE) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_componente_manutencao_componente
ON tb_componente_manutencao (company_id, hist_manut_id_componente);

CREATE TABLE IF NOT EXISTS tb_componente_alteracao (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  company_id TEXT NOT NULL,
  IDCOMPONETE INTEGER NOT NULL,
  usuario_id TEXT NOT NULL,
  data_hora TEXT NOT NULL,
  campos_alterados TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (company_id) REFERENCES tb_company (id) ON DELETE CASCADE,
  FOREIGN KEY (IDCOMPONETE) REFERENCES tb_componente (IDCOMPONETE) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_componente_alteracao_componente
ON tb_componente_alteracao (company_id, IDCOMPONETE);

CREATE TABLE IF NOT EXISTS tb_nota (
  IDNOTA INTEGER PRIMARY KEY AUTOINCREMENT,
  company_id TEXT NOT NULL,
  id_ativo TEXT NOT NULL,
  id_os TEXT,
  nota_pendencia TEXT NOT NULL,
  nota_status TEXT NOT NULL CHECK (
    nota_status IN (
      'Criado',
      'Novo',
      'Programado',
      'Ag. Material',
      'Ag',
      'Plano',
      'Cancelado'
    )
  ),
  nota_data_criada TEXT NOT NULL DEFAULT (datetime('now')),
  nota_data_programada TEXT,
  nota_data_realizada TEXT,
  nota_observacao_pcm TEXT,
  nota_observacao_tecnico TEXT,
  FOREIGN KEY (company_id) REFERENCES tb_company (id) ON DELETE CASCADE,
  FOREIGN KEY (id_ativo) REFERENCES tb_ativo (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_nota_company
ON tb_nota (company_id);

CREATE INDEX IF NOT EXISTS idx_nota_company_ativo
ON tb_nota (company_id, id_ativo);

CREATE TABLE IF NOT EXISTS tb_nota_alteracao (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  company_id TEXT NOT NULL,
  IDNOTA INTEGER NOT NULL,
  usuario_id TEXT NOT NULL,
  data_hora TEXT NOT NULL,
  campos_alterados TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (company_id) REFERENCES tb_company (id) ON DELETE CASCADE,
  FOREIGN KEY (IDNOTA) REFERENCES tb_nota (IDNOTA) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_nota_alteracao_nota
ON tb_nota_alteracao (company_id, IDNOTA);

CREATE TABLE IF NOT EXISTS tb_order_service (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  os_numero INTEGER NOT NULL,
  estrutura_id TEXT NOT NULL,
  ativo_id TEXT NOT NULL,
  os_tipo TEXT NOT NULL CHECK (os_tipo IN ('PDM', 'EX', 'RI')),
  os_pdm INTEGER NOT NULL CHECK (os_pdm IN (0, 1)),
  os_status TEXT NOT NULL CHECK (os_status IN ('CRIADO', 'PROGRAMADO', 'REALIZADO', 'CANCELADO')),
  os_checklist INTEGER NOT NULL CHECK (os_checklist IN (0, 1)),
  os_capex INTEGER NOT NULL CHECK (os_capex IN (0, 1)),
  os_realizado_em TEXT,
  os_programado1 TEXT,
  os_programado2 TEXT,
  os_programado3 TEXT,
  os_programado4 TEXT,
  os_programado5 TEXT,
  os_obs_pcm TEXT,
  os_obs_tecnico TEXT,
  os_ano INTEGER NOT NULL,
  os_mes INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  created_by TEXT NOT NULL,
  updated_at TEXT,
  updated_by TEXT,
  FOREIGN KEY (company_id) REFERENCES tb_company (id) ON DELETE CASCADE,
  FOREIGN KEY (estrutura_id) REFERENCES tb_estrutura (id) ON DELETE CASCADE,
  FOREIGN KEY (ativo_id) REFERENCES tb_ativo (id) ON DELETE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_order_service_company_numero
ON tb_order_service (company_id, os_numero);

CREATE TABLE IF NOT EXISTS tb_order_service_history (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  order_service_id TEXT NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('criado', 'atualizado')),
  before_data TEXT,
  after_data TEXT NOT NULL,
  changed_by_user_id TEXT,
  changed_by_name TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (company_id) REFERENCES tb_company (id) ON DELETE CASCADE,
  FOREIGN KEY (order_service_id) REFERENCES tb_order_service (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_order_service_history_os
ON tb_order_service_history (order_service_id, created_at);

CREATE TABLE IF NOT EXISTS tb_os_scheduler_config (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  coordenacao TEXT NOT NULL,
  equipe TEXT NOT NULL,
  mes TEXT NOT NULL,
  data_json TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (company_id) REFERENCES tb_company (id) ON DELETE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_os_scheduler_config_unique
ON tb_os_scheduler_config (company_id, coordenacao, equipe, mes);

CREATE TABLE IF NOT EXISTS tb_os_scheduler_team_config (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  coordenacao TEXT NOT NULL,
  equipe TEXT NOT NULL,
  escala TEXT NOT NULL,
  observacao TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (company_id) REFERENCES tb_company (id) ON DELETE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_os_scheduler_team_unique
ON tb_os_scheduler_team_config (company_id, coordenacao, equipe);

CREATE TABLE IF NOT EXISTS tb_os_scheduler_sub_team (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  coordenacao TEXT NOT NULL,
  equipe_id TEXT NOT NULL,
  sub_equipe TEXT NOT NULL,
  escala TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'ativo' CHECK (status IN ('ativo', 'inativo')),
  observacao TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (company_id) REFERENCES tb_company (id) ON DELETE CASCADE,
  FOREIGN KEY (equipe_id) REFERENCES tb_estrutura (id) ON DELETE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_os_scheduler_sub_team_unique
ON tb_os_scheduler_sub_team (company_id, equipe_id, sub_equipe);

CREATE TABLE IF NOT EXISTS tb_os_scheduler_config_v2 (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  coordenacao TEXT NOT NULL,
  equipe_id TEXT NOT NULL,
  sub_equipe TEXT NOT NULL,
  mes TEXT NOT NULL,
  data_json TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (company_id) REFERENCES tb_company (id) ON DELETE CASCADE,
  FOREIGN KEY (equipe_id) REFERENCES tb_estrutura (id) ON DELETE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_os_scheduler_config_v2_unique
ON tb_os_scheduler_config_v2 (company_id, equipe_id, sub_equipe, mes);

CREATE TABLE IF NOT EXISTS tb_os_scheduler_assignment (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  os_id TEXT NOT NULL,
  coordenacao TEXT NOT NULL,
  equipe_id TEXT NOT NULL,
  sub_equipe TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (company_id) REFERENCES tb_company (id) ON DELETE CASCADE,
  FOREIGN KEY (os_id) REFERENCES tb_order_service (id) ON DELETE CASCADE,
  FOREIGN KEY (equipe_id) REFERENCES tb_estrutura (id) ON DELETE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_os_scheduler_assignment_unique
ON tb_os_scheduler_assignment (company_id, os_id);

CREATE TABLE IF NOT EXISTS tb_os_scheduler_holiday (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  equipe_id TEXT NOT NULL,
  feriado TEXT NOT NULL,
  data TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (company_id) REFERENCES tb_company (id) ON DELETE CASCADE,
  FOREIGN KEY (equipe_id) REFERENCES tb_estrutura (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_os_scheduler_holiday_company
ON tb_os_scheduler_holiday (company_id, equipe_id, data);

CREATE TABLE IF NOT EXISTS tb_os_scheduler_comment (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  os_id TEXT NOT NULL,
  equipe_id TEXT NOT NULL,
  sub_equipe TEXT NOT NULL,
  date_key TEXT NOT NULL,
  comentario TEXT NOT NULL,
  created_by_user_id TEXT NOT NULL,
  created_by_name TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (company_id) REFERENCES tb_company (id) ON DELETE CASCADE,
  FOREIGN KEY (os_id) REFERENCES tb_order_service (id) ON DELETE CASCADE,
  FOREIGN KEY (equipe_id) REFERENCES tb_estrutura (id) ON DELETE CASCADE,
  FOREIGN KEY (created_by_user_id) REFERENCES tb_user (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_os_scheduler_comment_company
ON tb_os_scheduler_comment (company_id, equipe_id, sub_equipe, date_key);
