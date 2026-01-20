-- Seed data for local development only.
-- Execute locally: wrangler d1 execute app_db --local --file=db/seed.sql
-- Do NOT run this on remote.
-- Passwords (bcrypt): Senha123! and Senha456!

INSERT INTO tb_company (id, nome, status)
VALUES
  ('cmp_tecrail', 'TecRail', 'ativo'),
  ('cmp_urbana', 'Urbana Rail', 'ativo');

INSERT INTO tb_profile (id, company_id, name, status)
VALUES
  ('prf_tec_admin', 'cmp_tecrail', 'Administrador', 'ativo'),
  ('prf_urb_admin', 'cmp_urbana', 'Administrador', 'ativo');

INSERT INTO tb_user (
  id,
  company_id,
  nome,
  cs,
  email,
  escala,
  profile_id,
  cargo,
  coordenacao,
  equipe,
  status,
  created_at,
  updated_at
)
VALUES
  (
    'usr_tec_001',
    'cmp_tecrail',
    'Samuel Chaves',
    '263087',
    'samucavint@gmail.com',
    'ADM',
    'prf_tec_admin',
    'Analista',
    'PCM',
    'PCM',
    'ativo',
    datetime('now'),
    datetime('now')
  ),
  (
    'usr_urb_001',
    'cmp_urbana',
    'Bruno Lima',
    '123456',
    'bruno.lima@urbana.local',
    '6x2',
    'prf_urb_admin',
    'Supervisor',
    'Coordenacao Sul',
    'Equipe Operacoes',
    'ativo',
    datetime('now'),
    datetime('now')
  );

INSERT INTO tb_user_auth (user_id, password_hash)
VALUES
  ('usr_tec_001', '$2a$10$WqhJO1eANsjCOkxeuEJrpudCZ9/kdtCyjiLc2C5zZqsDq0QUM/KHm'),
  ('usr_urb_001', '$2a$10$OgFqVEta7D2U58JKV3ukfecUcHOaStxXBhDfHz31ENMpM99b9Ms2O');

INSERT INTO tb_tarefas (
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
)
VALUES
  (
    'tarefa_tecr_ddc_001',
    'cmp_tecrail',
    'DDC',
    'DDC',
    'Checar conexões e aterramento do DDC',
    1,
    1,
    7,
    'Elétrico',
    'Energia',
    'DDC-001',
    1,
    datetime('now'),
    datetime('now'),
    'usr_tec_001',
    'usr_tec_001'
  ),
  (
    'tarefa_tecr_dds_001',
    'cmp_tecrail',
    'DDS',
    'DDS',
    'Aferir indicadores de status do painel DDS',
    0,
    1,
    30,
    'Comunicação',
    'Redes',
    'DDS-002',
    1,
    datetime('now'),
    datetime('now'),
    'usr_tec_001',
    'usr_tec_001'
  ),
  (
    'tarefa_urb_amv_001',
    'cmp_urbana',
    'AMV',
    'AMV',
    'Inspecionar rotor e lubrificação',
    1,
    0,
    14,
    'Mecânico',
    'Energia',
    'AMV-001',
    0,
    datetime('now'),
    datetime('now'),
    'usr_urb_001',
    'usr_urb_001'
  );
