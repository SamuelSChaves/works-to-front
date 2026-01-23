import { NavLink, Outlet } from 'react-router-dom'
import {
  SlidersHorizontal,
  ShieldCheck,
  PieChart,
  Upload
} from 'lucide-react'

export function Configuracao() {
  return (
    <section style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <header>
        <h1 style={{ margin: 0, fontSize: 26 }}>Configuração</h1>
        <p style={{ margin: '8px 0 0', color: '#64748b' }}>
          Ajuste estruturas, perfis de acesso e usuários do sistema.
        </p>
      </header>

      <nav style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <NavLink
          to="ajustes"
          style={({ isActive }) => ({
            display: 'inline-flex',
            alignItems: 'center',
            gap: 10,
            padding: '10px 16px',
            borderRadius: 12,
            textDecoration: 'none',
            fontWeight: 600,
            color: isActive ? '#ffffff' : '#0f172a',
            background: isActive
              ? 'linear-gradient(90deg, #0f172a, #111827)'
              : '#ffffff',
            border: `1px solid ${isActive ? '#0f172a' : '#e2e8f0'}`,
            boxShadow: isActive
              ? '0 10px 20px rgba(15, 23, 42, 0.18)'
              : 'none'
          })}
        >
          <SlidersHorizontal size={16} />
          Ajustes de Sistema
        </NavLink>
        <NavLink
          to="perfil-acesso"
          style={({ isActive }) => ({
            display: 'inline-flex',
            alignItems: 'center',
            gap: 10,
            padding: '10px 16px',
            borderRadius: 12,
            textDecoration: 'none',
            fontWeight: 600,
            color: isActive ? '#ffffff' : '#0f172a',
            background: isActive
              ? 'linear-gradient(90deg, #0f172a, #111827)'
              : '#ffffff',
            border: `1px solid ${isActive ? '#0f172a' : '#e2e8f0'}`,
            boxShadow: isActive
              ? '0 10px 20px rgba(15, 23, 42, 0.18)'
              : 'none'
          })}
        >
          <ShieldCheck size={16} />
          Perfil de Acesso
        </NavLink>
        <NavLink
          to="dados"
          style={({ isActive }) => ({
            display: 'inline-flex',
            alignItems: 'center',
            gap: 10,
            padding: '10px 16px',
            borderRadius: 12,
            textDecoration: 'none',
            fontWeight: 600,
            color: isActive ? '#ffffff' : '#0f172a',
            background: isActive
              ? 'linear-gradient(90deg, #0f172a, #111827)'
              : '#ffffff',
            border: `1px solid ${isActive ? '#0f172a' : '#e2e8f0'}`,
            boxShadow: isActive
              ? '0 10px 20px rgba(15, 23, 42, 0.18)'
              : 'none'
          })}
        >
          <PieChart size={16} />
          Dados
        </NavLink>
        <NavLink
          to="dados/upload"
          style={({ isActive }) => ({
            display: 'inline-flex',
            alignItems: 'center',
            gap: 10,
            padding: '10px 16px',
            borderRadius: 12,
            textDecoration: 'none',
            fontWeight: 600,
            color: isActive ? '#ffffff' : '#0f172a',
            background: isActive
              ? 'linear-gradient(90deg, #0f172a, #111827)'
              : '#ffffff',
            border: `1px solid ${isActive ? '#0f172a' : '#e2e8f0'}`,
            boxShadow: isActive
              ? '0 10px 20px rgba(15, 23, 42, 0.18)'
              : 'none'
          })}
        >
          <Upload size={16} />
          Carga de dados
        </NavLink>
      </nav>

      <div style={{ minHeight: 480 }}>
        <Outlet />
      </div>
    </section>
  )
}
