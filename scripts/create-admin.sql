-- Cria empresa, perfil, permissões e usuário admin caso não existam.

INSERT OR IGNORE INTO tb_company (id, nome, status)
VALUES ('cmp_tecrail', 'TecRail', 'ativo');

INSERT OR IGNORE INTO tb_profile (id, company_id, name, status)
VALUES ('prf_tec_admin', 'cmp_tecrail', 'Administrador', 'ativo');

INSERT OR IGNORE INTO tb_profile_permission (profile_id, screen_id, leitura, criacao, edicao, exclusao)
VALUES
  ('prf_tec_admin', 'configuracao', 1, 1, 1, 1),
  ('prf_tec_admin', 'ativos', 1, 1, 1, 1),
  ('prf_tec_admin', 'auth', 1, 1, 1, 1);

INSERT OR REPLACE INTO tb_user (
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
  equipe_aditiva,
  status,
  created_at,
  updated_at
) VALUES (
  'usr_tec_001',
  'cmp_tecrail',
  'Samuel dos Santos Chaves',
  '263087',
  'samuel.chaves@rumolog.com',
  'ADM',
  'prf_tec_admin',
  'Analista',
  'PCM',
  'PCM',
  'PCM',
  'ativo',
  datetime('now'),
  datetime('now')
);

INSERT OR REPLACE INTO tb_user_auth (user_id, password_hash)
VALUES ('usr_tec_001', '$2a$10$WqhJO1eANsjCOkxeuEJrpudCZ9/kdtCyjiLc2C5zZqsDq0QUM/KHm');
