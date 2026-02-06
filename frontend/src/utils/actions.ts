import type { AcaoRecord, AcaoStatus } from '../types/acao'

function normalizeActionStatus(value: string): AcaoStatus {
  const normalized = String(value ?? '').trim().toLowerCase()
  if (normalized.includes('conclu')) {
    return 'Concluída'
  }
  if (normalized.includes('andamento')) {
    return 'Em andamento'
  }
  return 'Aberta'
}

export function normalizeActionRow(entry: Record<string, unknown>): AcaoRecord {
  const toStringValue = (...keys: (string | undefined)[]) => {
    for (const key of keys) {
      if (!key) continue
      const value = entry[key]
      if (value !== undefined && value !== null) {
        return String(value)
      }
    }
    return ''
  }

  const asNumber = (value: unknown) => {
    const numberValue = Number(value)
    return Number.isNaN(numberValue) ? 0 : numberValue
  }

  return {
    id_company: toStringValue('id_company', 'company_id'),
    id_acao: asNumber(entry['id_acao'] ?? entry['id']),
    id_acao_raw: toStringValue('id_acao', 'id'),
    id_usuario_solicitante: toStringValue(
      'id_usuario_solicitante',
      'requester_id'
    ),
    id_usuario_responsavel: toStringValue(
      'id_usuario_responsavel',
      'responsible_id'
    ),
    data_criado: toStringValue('data_criado', 'created_at'),
    data_vencimento: toStringValue('data_vencimento', 'due_date'),
    status: normalizeActionStatus(toStringValue('status', 'estado')),
    grupo_acao: toStringValue('grupo_acao', 'group'),
    origem_acao:
      toStringValue('origem_acao', 'origin') || 'Operacao',
    equipe: toStringValue('equipe', 'team'),
    criticidade: toStringValue('criticidade', 'criticality') || 'Alta',
    texto_acao: toStringValue('texto_acao', 'description'),
    texto_enerramento: toStringValue('texto_enerramento', 'close_note'),
    texto_devolutiva: toStringValue('texto_devolutiva', 'feedback'),
    incidente_codigo: toStringValue('incidente_codigo', 'incident_code')
  }
}
