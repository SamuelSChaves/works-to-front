import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent
} from 'react'
import { getStoredToken } from '../services/auth'
import {
  fetchBulkUploadTables,
  uploadBulkData
} from '../services/api'
import type { TableSchema } from '../services/api'

const FALLBACK_TABLES: TableSchema[] = [
  { name: 'ativos', columns: ['ATIVO_CODPE', 'ATIVO_DESCRITIVO_OS', 'ATIVO_CICLO'] },
  { name: 'componentes', columns: ['COMP_NOME', 'COMP_MODELO', 'COMP_DATA'] },
  { name: 'notas', columns: ['nota_pendencia', 'nota_status', 'id_os'] },
  { name: 'planos_manutencao', columns: ['coordenacao', 'equipe', 'year_month'] },
  { name: 'ordens_servico', columns: ['os_numero', 'ATIVO_CODPE', 'os_status'] }
]

const pageStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: 24,
  height: '100%'
} as const

const cardStyle = {
  borderRadius: 20,
  border: '1px solid #e5e7eb',
  background: '#ffffff',
  padding: 24,
  boxShadow: '0 30px 60px rgba(15,23,42,0.08)'
} as const

const formGrid = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
  gap: 16
} as const

const infoList = [
  'Use arquivos CSV ou XLSX com cabeçalhos iguais aos campos da tabela destino.',
  'Sempre informe a mesma ortografia (letras minúsculas) do esquema criado.',
  'Arquivos grandes podem levar alguns segundos para processar; o upload roda em lote.'
]

type UploadStatus = 'idle' | 'sending' | 'success' | 'error'

export function DataUpload() {
  const [availableTables, setAvailableTables] = useState<TableSchema[]>(
    FALLBACK_TABLES
  )
  const [tablesLoading, setTablesLoading] = useState(true)
  const [selectedTable, setSelectedTable] = useState<string>(
    FALLBACK_TABLES[0].name
  )
  const [file, setFile] = useState<File | null>(null)
  const [headersPreview, setHeadersPreview] = useState<string[]>([])
  const [status, setStatus] = useState<{
    type: UploadStatus
    message?: string
  }>({ type: 'idle' })

  const fileInputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    let cancelled = false
    const token = getStoredToken()
    if (!token) {
      setTablesLoading(false)
      return
    }
    const loadTables = async () => {
      try {
        const tables = await fetchBulkUploadTables(token)
        if (!cancelled && tables.length) {
          setAvailableTables(tables)
          setSelectedTable(tables[0].name)
        }
      } catch {
        if (!cancelled) {
          setAvailableTables(FALLBACK_TABLES)
          setSelectedTable(FALLBACK_TABLES[0].name)
        }
      } finally {
        if (!cancelled) {
          setTablesLoading(false)
        }
      }
    }
    loadTables()
    return () => {
      cancelled = true
    }
    // we purposefully ignore selectedTable to avoid resetting
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const selectedSchema = useMemo(() => {
    return (
      availableTables.find(item => item.name === selectedTable) ||
      FALLBACK_TABLES.find(item => item.name === selectedTable) ||
      FALLBACK_TABLES[0]
    )
  }, [availableTables, selectedTable])

  const handleDownloadTemplate = () => {
    const columns = selectedSchema?.columns ?? []
    const content = columns.length
      ? columns.join(',')
      : 'coluna1,coluna2,coluna3'
    const blob = new Blob([content + '\n'], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `${selectedTable || 'template'}.csv`
    anchor.click()
    URL.revokeObjectURL(url)
  }

  const tableOptions = useMemo(() => {
    return availableTables.length ? availableTables : FALLBACK_TABLES
  }, [availableTables])

  const canUpload = Boolean(selectedTable && file && status.type !== 'sending')

  const parseHeaders = (value: File) => {
    const reader = new FileReader()
    reader.onload = () => {
      const text = String(reader.result ?? '')
      const [firstLine] = text.split(/\r?\n/)
      if (!firstLine) {
        setHeadersPreview([])
        return
      }
      const headers = firstLine.split(/,|;/).map(header => header.trim())
      setHeadersPreview(headers.filter(Boolean))
    }
    reader.readAsText(value)
  }

  const handleFileChange = (event: FormEvent<HTMLInputElement>) => {
    const nextFile = event.currentTarget.files?.[0] ?? null
    fileInputRef.current = event.currentTarget
    setFile(nextFile)
    setStatus({ type: 'idle' })
    if (nextFile) {
      parseHeaders(nextFile)
    } else {
      setHeadersPreview([])
    }
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!canUpload) return
    const token = getStoredToken()
    if (!token || !file) {
      setStatus({
        type: 'error',
        message: 'Faça login novamente antes de subir a carga.'
      })
      return
    }
    const payload = new FormData()
    payload.append('table', selectedTable)
    payload.append('file', file)
    setStatus({ type: 'sending', message: 'Enviando arquivo...' })
    try {
      const response = await uploadBulkData(payload, token)
      setStatus({
        type: 'success',
        message: response.message
          ? String(response.message)
          : 'Carga recebida; aguarde processamento em lote.'
      })
      setFile(null)
      setHeadersPreview([])
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Não foi possível enviar a carga.'
      setStatus({ type: 'error', message })
    }
  }

  return (
    <section style={pageStyle}>
      <header>
        <p style={{ margin: 0, fontSize: 13, color: '#64748b' }}>
          Upload em massa
        </p>
        <h1 style={{ margin: '6px 0 0', fontSize: 32 }}>Carga de dados</h1>
      </header>

      <div style={cardStyle}>
        <form style={formGrid} onSubmit={handleSubmit}>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            Tabela destino
            <select
              value={selectedTable}
              onChange={event => setSelectedTable(event.target.value)}
              disabled={tablesLoading}
              style={{
                borderRadius: 12,
                border: '1px solid #e5e7eb',
                padding: '10px 12px',
                background: '#ffffff'
              }}
            >
              {tableOptions.map(table => (
              <option key={table.name} value={table.name}>
                {table.name}
              </option>
            ))}
          </select>
        </label>

          <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            Arquivo (CSV/XLSX)
            <input
              type="file"
              accept=".csv,.xlsx"
              onChange={handleFileChange}
              ref={fileInputRef}
              style={{
                borderRadius: 12,
                border: '1px dashed #cbd5f5',
                padding: '12px',
                background: '#f8fafc',
                cursor: 'pointer'
              }}
            />
          </label>

          <div
            style={{
              display: 'flex',
              gap: 12,
              alignItems: 'center',
              gridColumn: '1 / -1'
            }}
          >
            <button
              type="submit"
              disabled={!canUpload}
              style={{
                flex: 1,
                borderRadius: 12,
                border: 'none',
                background: canUpload ? '#1d4ed8' : '#94a3b8',
                color: '#ffffff',
                fontWeight: 600,
                padding: '14px 16px',
                cursor: canUpload ? 'pointer' : 'not-allowed'
              }}
            >
              {status.type === 'sending' ? 'Enviando...' : 'Enviar planilha'}
            </button>
            <button
              type="button"
              onClick={handleDownloadTemplate}
              style={{
                borderRadius: 12,
                border: '1px dashed #cbd5f5',
                background: '#f8fafc',
                padding: '14px 16px',
                cursor: 'pointer',
                fontWeight: 600,
                color: '#0f172a'
              }}
            >
              Baixar modelo
            </button>
          </div>
        </form>

        {headersPreview.length > 0 && (
          <div style={{ marginTop: 16 }}>
            <strong style={{ fontSize: 14 }}>Cabeçalhos detectados</strong>
            <p style={{ margin: '6px 0 0', color: '#475569', fontSize: 13 }}>
              {headersPreview.join(' · ')}
            </p>
          </div>
        )}

        {selectedSchema && selectedSchema.columns.length > 0 && (
          <div style={{ marginTop: 16 }}>
            <strong style={{ fontSize: 14 }}>Colunas esperadas</strong>
            <p style={{ margin: '6px 0 0', color: '#475569', fontSize: 13 }}>
              {selectedSchema.columns.join(' · ')}
            </p>
          </div>
        )}

        {status.message && (
          <p
            style={{
              marginTop: 16,
              color: status.type === 'error' ? '#b91c1c' : '#15803d',
              fontSize: 13
            }}
          >
            {status.message}
          </p>
        )}
      </div>

      <div style={cardStyle}>
        <h2 style={{ marginTop: 0, fontSize: 20 }}>Como preparar a planilha</h2>
        <ul style={{ paddingLeft: 20, margin: '16px 0 0 0', color: '#475569' }}>
          {infoList.map(item => (
            <li key={item} style={{ marginBottom: 8 }}>
              {item}
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
