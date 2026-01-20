INSERT OR REPLACE INTO tb_ativo (
  id, company_id, ATIVO_EMPRESA, ATIVO_CODPE, ATIVO_DESCRITIVO_OS,
  ATIVO_STATUS, ATIVO_COORDENACAO, ATIVO_EQUIPE, ATIVO_MONITORADOS,
  ATIVO_SIGLA, ATIVO_CICLO, CONTADOR_CICLO, ATIVO_TOLERANCIA,
  ATIVO_CLASSE, ATIVO_GRUPO, ATIVO_OEA, ATIVO_TMM, ATIVO_MODELO
)
VALUES (
  'ativo_test_001', 'cmp_tecrail', 'TecRail', 'COD123', 'Ativo de Teste',
  'ativo', 'Coordenacao Teste', 'Equipe Teste', 'Sim',
  'TEST', 'Ciclo Teste', '1', '0.5',
  'Classe A', 'Grupo Teste', 'OEA1', 'TMM1', 'Modelo Teste'
);

INSERT INTO tb_nota (
  company_id, id_ativo, id_os, nota_pendencia, nota_status,
  nota_data_programada, nota_data_realizada, nota_observacao_pcm, nota_observacao_tecnico
)
VALUES (
  'cmp_tecrail', 'ativo_test_001', NULL, 'Pendência de teste criada via CLI', 'Criado',
  NULL, NULL, 'Observação PCM de teste', 'Observação técnica de teste'
);
