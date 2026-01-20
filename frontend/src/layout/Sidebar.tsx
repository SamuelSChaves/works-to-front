import { useEffect, useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import {
  Activity,
  Archive,
  Calendar,
  CalendarCheck,
  ClipboardCheck,
  ClipboardList,
  Cpu,
  FileText,
  LayoutDashboard,
  Layers,
  ListChecks,
  Menu,
  Package,
  Server,
  Settings,
  Wrench
} from 'lucide-react'
import {
  fetchPermissions,
  getStoredPermissions,
  getStoredToken,
  getStoredUser,
  logout,
  subscribeToUserChanges
} from '../services/auth'
import type { User } from '../services/auth'
import type { Permissions } from '../services/auth'
import { SCREEN_PERMISSIONS } from '../config/screens'
import logo from '../assets/LogoTo.png'

type MenuItem = {
  id: string
  label: string
  path?: string
  icon: typeof LayoutDashboard
  children?: MenuItem[]
}

const SIDEBAR_WIDTH = 260

type SidebarProps = {
  collapsed: boolean
  onToggle: () => void
}

const screenLabelById = new Map(
  SCREEN_PERMISSIONS.map(screen => [screen.id, screen.label])
)

function getScreenLabel(id: string, fallback: string) {
  return screenLabelById.get(id) || fallback
}

const LAWNGREEN = '#7cfc00'

const menu: MenuItem[] = [
  { id: 'painel', label: 'Painel', path: '/app', icon: LayoutDashboard },
  {
    id: 'gestao-ativos',
    label: 'Gestão de Ativos',
    icon: Package,
    children: [
      {
        id: 'ativos',
        label: getScreenLabel('ativos', 'Painel de Ativos'),
        path: '/app/ativos',
        icon: Server
      },
      {
        id: 'componentes',
        label: getScreenLabel('componentes', 'Componentes'),
        path: '/app/componentes',
        icon: Cpu
      },
      {
        id: 'notas',
        label: getScreenLabel('notas', 'Notas'),
        path: '/app/notas',
        icon: FileText
      },
      {
        id: 'tarefas',
        label: getScreenLabel('tarefas', 'Tarefas'),
        path: '/app/gestao-ativos/tarefas',
        icon: ClipboardCheck
      }
    ]
  },
  {
    id: 'gestao-material',
    label: getScreenLabel('gestao-material', 'Gestão Material'),
    icon: Archive,
    children: [
      {
        id: 'cadastro-material',
        label: getScreenLabel('material-cadastro', 'Cadastro de Material'),
        path: '/app/gestao-material/cadastro',
        icon: FileText
      },
      {
        id: 'kanban',
        label: getScreenLabel('material-kanban', 'Kanban'),
        path: '/app/gestao-material/kanban',
        icon: ListChecks
      },
      {
        id: 'estoque',
        label: getScreenLabel('material-estoque', 'Estoque'),
        path: '/app/gestao-material/estoque',
        icon: Server
      },
      {
        id: 'consumo',
        label: getScreenLabel('material-consumo', 'Consumo'),
        path: '/app/gestao-material/consumo',
        icon: ClipboardCheck
      }
    ]
  },
  {
    id: 'ordem-servico',
    label: 'Ordem de Serviço',
    icon: ClipboardList,
    children: [
      {
        id: 'programacao',
        label: 'Painel OS',
        path: '/app/ordens-servico',
        icon: ListChecks
      },
      {
        id: 'scheduler',
        label: 'Scheduler',
        path: '/app/ordens-servico/scheduler',
        icon: Calendar
      }
    ]
  },
  {
    id: 'planejamento',
    label: 'Planejamento',
    icon: Layers,
    children: [
      {
        id: 'plano-manutencao',
        label: 'Plano de manutenção',
        path: '/app/planejamento/manutencao',
        icon: Wrench
      },
      {
        id: 'plano-tarefas',
        label: 'Plano de tarefas',
        path: '/app/planejamento/tarefas',
        icon: CalendarCheck
      }
    ]
  },
  {
    id: 'produtividade',
    label: getScreenLabel('produtividade', 'Produtividade'),
    icon: Activity,
    children: [
      {
        id: 'produtividade-dashboard',
        label: getScreenLabel('produtividade-dashboard', 'DashBoard'),
        path: '/app/produtividade/dashboard',
        icon: LayoutDashboard
      },
      {
        id: 'produtividade-apontamentos',
        label: getScreenLabel('produtividade-apontamentos', 'Apontamentos'),
        path: '/app/produtividade/apontamentos',
        icon: ClipboardList
      },
      {
        id: 'produtividade-rotograma',
        label: getScreenLabel('produtividade-rotograma', 'Rotograma'),
        path: '/app/produtividade/rotograma',
        icon: Calendar
      }
    ]
  },
  {
    id: 'acoes',
    label: getScreenLabel('acoes', 'Ações TO'),
    path: '/app/acoes',
    icon: ClipboardCheck
  },
  {
    id: 'configuracoes',
    label: getScreenLabel('configuracao', 'Configuração'),
    path: '/app/configuracao',
    icon: Settings
  }
]

function getInitials(user?: User | null) {
  const raw = user?.nome || user?.email || ''
  const parts = raw
    .trim()
    .split(/\s+/)
    .filter(Boolean)
  if (!parts.length) {
    return 'U'
  }
  const initials = parts
    .slice(0, 2)
    .map(part => part[0].toUpperCase())
    .join('')
  return initials
}

function getPrimaryLabel(user?: User | null) {
  if (!user) return 'Visitante'
  const name = user.nome || user.email || 'Usuario'
  const firstName = name.split(' ')[0]
  return firstName || user.email || 'Usuario'
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const [user, setUser] = useState<User | null>(getStoredUser())
  const [permissions, setPermissions] = useState<Permissions | null>(
    getStoredPermissions()
  )
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({
    'gestao-ativos': false,
    'ordem-servico': false,
    'gestao-material': false,
    planejamento: false,
    produtividade: false
  })
  const navigate = useNavigate()

  const sidebarWidth = collapsed ? 72 : SIDEBAR_WIDTH

  useEffect(() => {
    return subscribeToUserChanges(() => {
      const nextUser = getStoredUser()
      setUser(prev => {
        if (!prev && !nextUser) return prev
        if (!prev || !nextUser) return nextUser
        if (
          prev.id === nextUser.id &&
          prev.nome === nextUser.nome &&
          prev.email === nextUser.email
        ) {
          return prev
        }
        return nextUser
      })
      setPermissions(getStoredPermissions())
    })
  }, [])

  useEffect(() => {
    const token = getStoredToken()
    if (!token) return
    fetchPermissions()
      .then(setPermissions)
      .catch(() => {
        setPermissions(getStoredPermissions())
      })
  }, [user])

  const handleLogout = () => {
    logout()
    setUserMenuOpen(false)
    navigate('/')
  }

  const showConfiguracao = permissions
    ? permissions.configuracao?.leitura === true
    : true
  const menuItems = showConfiguracao
    ? menu
    : menu.filter(item => item.path !== '/app/configuracao')

  const toggleMenu = (id: string) => {
    setOpenMenus(prev => {
      const nextOpen = !prev[id]
      return {
        'gestao-ativos': false,
        'ordem-servico': false,
        'gestao-material': false,
        planejamento: false,
        produtividade: false,
        [id]: nextOpen
      }
    })
  }

  return (
    <aside
      style={{
        width: sidebarWidth,
        '--sidebar-width': `${sidebarWidth}px`,
        position: 'fixed',
        left: 0,
        top: 0,
        height: '100vh',
        background: 'linear-gradient(180deg, #0b1020 0%, #0c1326 100%)',
        color: '#e2e8f0',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        borderRight: '1px solid #111827',
        transition: 'width 0.2s ease'
      }as React.CSSProperties
    }
    >
      <div>
        <div
          style={{
            padding: '20px 20px',
            borderBottom: '1px solid #1f2937',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            justifyContent: collapsed ? 'center' : 'flex-start'
          }}
        >
          {collapsed ? (
            <button
              type="button"
              onClick={onToggle}
              style={{
                borderRadius: 10,
                border: '1px solid #1f2937',
                background: '#0f172a',
                color: '#cbd5f5',
                width: 36,
                height: 36,
                display: 'grid',
                placeItems: 'center',
                cursor: 'pointer'
              }}
              aria-label="Expandir menu lateral"
            >
              <Menu size={18} />
            </button>
          ) : (
            <>
              <img src={logo} alt="TecRail" style={{ width: 28, height: 28 }} />
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <strong style={{ fontSize: 16, letterSpacing: 0.3 }}>
                  TO Works
                </strong>
                <span style={{ fontSize: 12, color: '#94a3b8' }}>
                  Planejando com inteligencia
                </span>
              </div>
            </>
          )}
        </div>

        {!collapsed && (
          <nav
            style={{
              padding: '16px 14px',
              display: 'flex',
              flexDirection: 'column',
              gap: 10
            }}
          >
          {menuItems.map(item => {
            if (item.children && item.children.length) {
              const isOpen = Boolean(openMenus[item.id])
              return (
                <div key={item.label} style={{ display: 'grid', gap: 8 }}>
                  <button
                    type="button"
                    onClick={() => toggleMenu(item.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: collapsed ? 0 : 10,
                      padding: '10px 12px',
                      color: '#e2e8f0',
                      fontWeight: 700,
                      fontSize: 12,
                      textTransform: 'uppercase',
                      letterSpacing: 0.6,
                      background: isOpen ? '#111827' : 'transparent',
                      borderRadius: 10,
                      border: 'none',
                      cursor: 'pointer',
                      justifyContent: collapsed ? 'center' : 'space-between'
                    }}
                  >
                    <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <item.icon size={18} />
                      <span style={{ display: collapsed ? 'none' : 'inline' }}>
                        {item.label}
                      </span>
                    </span>
                    <span
                      style={{
                        display: collapsed ? 'none' : 'inline',
                        transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)',
                        transition: 'transform 0.2s',
                        fontSize: 14,
                        color: '#94a3b8'
                      }}
                    >
                      {'>'}
                    </span>
                  </button>
                  {isOpen &&
                    item.children.map(child => (
                      <NavLink

                        key={child.path}

                        to={child.path || ''}

                        end={child.path === '/app'}

                        style={({ isActive }) => {
                          const iconColor = isActive ? LAWNGREEN : '#cbd5f5'
                          return {
                            display: 'flex',
                            alignItems: 'center',
                            gap: collapsed ? 0 : 12,
                            padding: '10px 12px',
                            marginLeft: 6,
                            borderRadius: 12,
                            textDecoration: 'none',
                            color: isActive ? '#ffffff' : '#cbd5f5',
                            fontWeight: 600,
                            background: isActive
                              ? 'linear-gradient(90deg, #1e293b, #0f172a)'
                              : 'transparent',
                            border: '1px solid transparent',
                            ['--sidebar-icon-color']: iconColor
                          } as React.CSSProperties
                        }}

                      >

                        <child.icon

                          size={18}

                          style={{ color: 'var(--sidebar-icon-color)' }}

                        />

                        <span style={{ display: collapsed ? 'none' : 'inline' }}>

                          {child.label}

                        </span>

                      </NavLink>
                    ))}
                </div>
              )
            }

            if (item.id === 'painel') {
              return (
                <div
                  key={item.path}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8
                  }}
                >
                  <NavLink
                    to={item.path || ''}
                    end={item.path === '/app'}
                    style={({ isActive }) => ({
                      display: 'flex',
                      alignItems: 'center',
                      gap: collapsed ? 0 : 12,
                      padding: '10px 12px',
                      borderRadius: 10,
                      textDecoration: 'none',
                      color: isActive ? '#ffffff' : '#e2e8f0',
                      fontWeight: 700,
                      fontSize: 12,
                      textTransform: 'uppercase',
                      letterSpacing: 0.6,
                      background: isActive
                        ? 'linear-gradient(90deg, #1e293b, #0f172a)'
                        : 'transparent',
                      boxShadow: isActive
                        ? '0 10px 20px rgba(15, 23, 42, 0.28)'
                        : 'none',
                      justifyContent: collapsed ? 'center' : 'flex-start',
                      flex: 1
                    })}
                  >
                    <item.icon size={18} />
                    <span style={{ display: collapsed ? 'none' : 'inline' }}>
                      {item.label}
                    </span>
                  </NavLink>
                  <button
                    type="button"
                    onClick={onToggle}
                    style={{
                      borderRadius: 8,
                      border: '1px solid #1f2937',
                      background: '#0f172a',
                      color: '#cbd5f5',
                      width: 32,
                      height: 32,
                      display: 'grid',
                      placeItems: 'center',
                      cursor: 'pointer',
                      flexShrink: 0
                    }}
                    aria-label={
                      collapsed ? 'Expandir menu lateral' : 'Ocultar menu lateral'
                    }
                  >
                    <Menu size={16} />
                  </button>
                </div>
              )
            }

            return (
              <NavLink
                key={item.path}
                to={item.path || ''}
                end={item.path === '/app'}
                style={({ isActive }) => ({
                  display: 'flex',
                  alignItems: 'center',
                  gap: collapsed ? 0 : 12,
                  padding: '10px 12px',
                  borderRadius: 10,
                  textDecoration: 'none',
                  color: isActive ? '#ffffff' : '#e2e8f0',
                  fontWeight: 700,
                  fontSize: 12,
                  textTransform: 'uppercase',
                  letterSpacing: 0.6,
                  background: isActive
                    ? 'linear-gradient(90deg, #1e293b, #0f172a)'
                    : 'transparent',
                  boxShadow: isActive
                    ? '0 10px 20px rgba(15, 23, 42, 0.28)'
                    : 'none',
                  justifyContent: collapsed ? 'center' : 'flex-start'
                })}
              >
                <item.icon size={18} />
                <span style={{ display: collapsed ? 'none' : 'inline' }}>
                  {item.label}
                </span>
              </NavLink>
            )
          })}
          </nav>
        )}
      </div>

      {!collapsed && (
        <div
          style={{
            padding: '16px 18px 20px',
            borderTop: '1px solid #1f2937',
            background: '#0b1220'
          }}
        >
        <div
          onClick={() => setUserMenuOpen(state => !state)}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            cursor: 'pointer'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 999,
                background: '#2563eb',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 600,
                fontSize: 16,
                color: '#ffffff'
              }}
            >
              {getInitials(user)}
            </div>
            <div>
              <strong>{getPrimaryLabel(user)}</strong>
              <div style={{ fontSize: 12, color: '#94a3b8' }}>
                {user?.profileName ||
                  user?.cargo ||
                  user?.role ||
                  user?.email ||
                  'Perfil do usuário'}
              </div>
            </div>
          </div>
          <span
            style={{
              transform: userMenuOpen ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.2s',
              fontSize: 16,
              opacity: 0.6,
              color: '#cbd5f5'
            }}
          >
            v
          </span>
        </div>

        {userMenuOpen && (
          <div
            style={{
              marginTop: 12,
              paddingLeft: 14,
              display: 'flex',
              flexDirection: 'column',
              gap: 8
            }}
          >
            {user && (
              <>
                <span style={{ fontSize: 12, color: '#64748b' }}>
                  Usuario conectado:
                </span>
                <span style={{ fontWeight: 600 }}>{user.nome}</span>
              </>
            )}
            <button
              type="button"
              onClick={handleLogout}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#f87171',
                padding: '6px 0',
                fontWeight: 600,
                cursor: 'pointer',
                textAlign: 'left'
              }}
            >
              Sair
            </button>
          </div>
        )}

        <div
          style={{
            marginTop: 20,
            fontSize: 11,
            color: '#64748b',
            lineHeight: 1.4
          }}
        >
          <div>2026 Tecnologia Operacional</div>
          <div>v1.0.0 - 01/2026</div>
        </div>
        </div>
      )}
    </aside>
  )
}
