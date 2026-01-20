import type { ReactNode } from 'react'

type Tab = {
  id: string
  label: string
  icon?: ReactNode
}

type TabsProps = {
  tabs: Tab[]
  activeId: string
  onChange: (id: string) => void
}

export function Tabs({ tabs, activeId, onChange }: TabsProps) {
  return (
    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
      {tabs.map(tab => {
        const isActive = tab.id === activeId
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 10,
              padding: '10px 16px',
              borderRadius: 12,
              border: `1px solid ${isActive ? '#0f172a' : '#e2e8f0'}`,
              background: isActive
                ? 'linear-gradient(90deg, #0f172a, #111827)'
                : '#ffffff',
              color: isActive ? '#ffffff' : '#0f172a',
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: isActive
                ? '0 10px 20px rgba(15, 23, 42, 0.18)'
                : 'none'
            }}
          >
            {tab.icon}
            {tab.label}
          </button>
        )
      })}
    </div>
  )
}
