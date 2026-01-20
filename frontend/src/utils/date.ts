export function formatBrasiliaDateTime(value: string) {
  const normalized =
    /\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/.test(value) &&
    !/Z$|[+-]\d{2}:\d{2}$/.test(value)
      ? `${value.replace(' ', 'T')}Z`
      : value
  const date = new Date(normalized)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })
}
