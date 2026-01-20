import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'

const SIDEBAR_WIDTH = 260
const SIDEBAR_COLLAPSED_WIDTH = 72

export function MainLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const sidebarWidth = sidebarCollapsed ? SIDEBAR_COLLAPSED_WIDTH : SIDEBAR_WIDTH
  return (
    <div
      style={{
        minHeight: '100vh',
        width: '100vw',
        background: '#ffffff',
        overflowX: 'hidden'
      }}
    >
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(value => !value)}
      />

      <div
        style={{
          marginLeft: sidebarWidth,
          minHeight: '100vh',
          width: `calc(100vw - ${sidebarWidth}px)`,
          padding: '40px 48px',
          background: '#ffffff',
          boxSizing: 'border-box'
        }}
      >
        <Outlet />
      </div>
    </div>
  )
}
