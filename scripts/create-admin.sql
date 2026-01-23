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

INSERT OR IGNORE INTO tb_acao (
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
) VALUES (
  'acao_001',
  'cmp_tecrail',
  'usr_tec_001',
  'usr_tec_001',
  '2026-01-15',
  '2026-01-22',
  'Aberta',
  'Infraestrutura',
  'Operação',
  'Equipe Campo',
  'Alta',
  'Revisar atuadores do painel mestre.',
  'Em revisão',
  'Repassar para o setor AC.'
);

INSERT OR IGNORE INTO tb_acao (
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
) VALUES (
  'acao_002',
  'cmp_tecrail',
  'usr_urb_001',
  'usr_tec_001',
  '2026-01-12',
  '2026-01-20',
  'Em andamento',
  'Operação',
  'Planejamento',
  'Equipe Campo',
  'Média',
  'Testar comunicação entre séries.',
  'Aguardando resposta.',
  'OK após testes.'
);

INSERT OR IGNORE INTO tb_acao (
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
) VALUES (
  'acao_003',
  'cmp_tecrail',
  'usr_urb_001',
  'usr_urb_001',
  '2026-01-10',
  '2026-01-18',
  'Concluída',
  'Segurança',
  'Auditoria',
  'Equipe Campo',
  'Baixa',
  'Atualizar procedimentos de emergência.',
  'Finalizado',
  'Documento publicado.'
);
