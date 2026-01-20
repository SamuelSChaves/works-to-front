import type { CSSProperties, MouseEventHandler } from 'react'

type ExportButtonProps = {
  onClick: MouseEventHandler<HTMLButtonElement>
  disabled?: boolean
  loading?: boolean
  label?: string
  style?: CSSProperties
}

export function ExportButton({
  onClick,
  disabled = false,
  loading = false,
  label = 'Exportar',
  style
}: ExportButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || loading}
      aria-busy={loading ? 'true' : undefined}
      style={{
        padding: '8px 16px',
        borderRadius: 10,
        border: '1px solid #e2e8f0',
        background: '#ffffff',
        cursor: disabled || loading ? 'not-allowed' : 'pointer',
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        fontWeight: 600,
        fontSize: 12,
        color: '#0f172a',
        opacity: disabled || loading ? 0.6 : 1,
        ...style
      }}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
        <path
          d="M12 3v10m0 0-4-4m4 4 4-4M5 17h14"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      {loading ? 'Exportando...' : label}
    </button>
  )
}
