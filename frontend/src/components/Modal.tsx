import type { ReactNode } from 'react'

type ModalProps = {
  title: string
  isOpen: boolean
  onClose: () => void
  children: ReactNode
  footer?: ReactNode
  fullScreen?: boolean
  width?: string
  maxWidth?: string
}

export function Modal({
  title,
  isOpen,
  onClose,
  children,
  footer,
  fullScreen
  ,
  width = 'min(720px, 100%)',
  maxWidth
}: ModalProps) {
  if (!isOpen) return null

  const containerStyle = fullScreen
    ? {
        width: '100%',
        height: '100%',
        borderRadius: 0,
        padding: 24,
        overflow: 'hidden'
      }
    : {
        width,
        maxWidth,
        borderRadius: 18,
        padding: 24
      }

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: 'fixed',
        top: 0,
        right: 0,
        bottom: 0,
        left: 'var(--sidebar-width, 260px)',
        background: 'rgba(15, 23, 42, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        zIndex: 50
      }}
    >
      <div
        style={{
          ...containerStyle,
          background: '#ffffff',
          boxShadow: '0 20px 60px rgba(15, 23, 42, 0.2)',
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
          padding: 24
        }}
      >
        <header
          style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}
        >
          <div>
            <h3 style={{ margin: 0 }}>{title}</h3>
            <p style={{ margin: '6px 0 0', color: '#64748b', fontSize: 13 }}>
              Preencha os dados obrigatórios para continuar.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              border: '1px solid #e2e8f0',
              background: '#ffffff',
              borderRadius: 10,
              padding: '6px 10px',
              cursor: 'pointer',
              fontWeight: 600
            }}
          >
            Fechar
          </button>
        </header>

        <div
          style={
            fullScreen
              ? { flex: 1, minHeight: 0, overflowY: 'auto' }
              : undefined
          }
        >
          {children}
        </div>

        {footer && (
          <footer
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: 12
            }}
          >
            {footer}
          </footer>
        )}
      </div>
    </div>
  )
}
