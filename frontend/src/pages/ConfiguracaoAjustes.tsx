import { useCallback, useEffect, useMemo, useState } from 'react'

import { useNavigate } from 'react-router-dom'

import { Modal } from '../components/Modal'

import { Tabs } from '../components/Tabs'

import { ConfiguracaoCadastroAtivos } from './ConfiguracaoCadastroAtivos'

import { API_URL } from '../services/api'
import type { GrupoAcao } from '../data/gruposAcoes'
import {
  persistActionGroups,
  readPersistedActionGroups,
  persistOrigemGroups,
  readPersistedOrigemGroups
} from '../utils/acoesStorage'

import {

  getStoredToken,

  logout,

  setPostLoginRedirect,

  getStoredUser,

  subscribeToUserChanges,

  type User

} from '../services/auth'



const ajustesTabs = [
  { id: 'ordem-manutencao', label: 'Ordem de Manutenção' },
  { id: 'cadastro-ativo', label: 'Cadastro de Ativo' },
  { id: 'cadastro-componentes', label: 'Cadastro de Componentes' },
  { id: 'scheduler', label: 'Scheduler' },
  { id: 'feriados', label: 'Feriados' },
  { id: 'produtividade', label: 'Produtividade' },
  { id: 'acoes', label: 'Ações' }
]


type EstruturaItem = {

  id: string

  coordenacao: string

  equipe: string

  cc: string

  execucao?: string

  status: string

}



type SchedulerSubTeamConfig = {

  coordenacao: string

  equipe_id: string

  sub_equipe: string

  escala: string

  status: string

  observacao: string | null

}



type SchedulerHoliday = {

  id: string

  equipe_id: string

  feriado: string

  data: string

}



type CodigoAtividade = {

  id_company: string

  id_codigo: string

  nome_codigo: string

  sequencia_codigo: number

  observacao_codigo: string

  status_codigo: 'Ativo' | 'Inativo'

}



const initialCodigoAtividades: CodigoAtividade[] = [
  {
    id_company: 'COMPANY-01',
    id_codigo: 'COD-100',
    nome_codigo: 'Inspeção de rotina',
    sequencia_codigo: 10,
    observacao_codigo: 'Verificar integridade antes da operaçãoo.',
    status_codigo: 'Ativo'
  },
  {
    id_company: 'COMPANY-01',
    id_codigo: 'COD-110',
    nome_codigo: 'Lubrificação pesada',
    sequencia_codigo: 20,
    observacao_codigo: 'Aplicar lubrificante especial em rolamentos.',
    status_codigo: 'Ativo'
  },
  {
    id_company: 'COMPANY-01',
    id_codigo: 'COD-200',
    nome_codigo: 'Teste funcional',
    sequencia_codigo: 30,
    observacao_codigo: 'Executar sequências de teste após manutenção.',
    status_codigo: 'Inativo'
  }
]




const getDefaultCodigoForm = (companyId = '') => ({

  id_company: companyId,

  id_codigo: '',

  nome_codigo: '',

  sequencia_codigo: '',

  observacao_codigo: '',

  status_codigo: 'Ativo' as 'Ativo' | 'Inativo'

})



const codigoStatusOptions: Array<'Ativo' | 'Inativo'> = ['Ativo', 'Inativo']



function formatHolidayDate(value: string) {

  const [year, month, day] = value.split('-')

  if (!year || !month || !day) return value

  return `${day}/${month}/${year}`

}



export function ConfiguracaoAjustes() {

  const navigate = useNavigate()

  const [activeTab, setActiveTab] = useState('ordem-manutencao')

  const [estruturas, setEstruturas] = useState<EstruturaItem[]>([])

  const [allSubTeams, setAllSubTeams] = useState<SchedulerSubTeamConfig[]>([])

  const [subTeams, setSubTeams] = useState<SchedulerSubTeamConfig[]>([])

  const [editingSubTeam, setEditingSubTeam] = useState<string | null>(null)

  const [holidays, setHolidays] = useState<SchedulerHoliday[]>([])

  const [holidayModalOpen, setHolidayModalOpen] = useState(false)

  const [editingHolidayId, setEditingHolidayId] = useState<string | null>(null)

  const [holidayForm, setHolidayForm] = useState({

    feriado: '',

    data: '',

    equipeIds: [] as string[],

    allEquipes: false

  })

  const [holidayEquipeFilter, setHolidayEquipeFilter] = useState('')

  const [selectedTeam, setSelectedTeam] = useState<{

    coordenacao: string

    equipe: string

    equipeId: string

  } | null>(null)

  const [modalOpen, setModalOpen] = useState(false)

  const [form, setForm] = useState({ subEquipe: '', escala: '', status: 'ativo', observacao: '' })

  const [codigoAtividades, setCodigoAtividades] = useState<CodigoAtividade[]>(initialCodigoAtividades)

  const [isCodigoExpanded, setIsCodigoExpanded] = useState(true)

  const [codigoModalOpen, setCodigoModalOpen] = useState(false)

  const [selectedCodigoAtividade, setSelectedCodigoAtividade] = useState<CodigoAtividade | null>(null)

  const [codigoForm, setCodigoForm] = useState(() =>

    getDefaultCodigoForm(getStoredUser()?.empresaId ?? '')

  )

const [actionGroups, setActionGroups] = useState<GrupoAcao[]>(() =>
  readPersistedActionGroups()
)

  const [groupForm, setGroupForm] = useState({

    id: '',

    nome: '',

    descricao: '',

    status: 'Ativo' as 'Ativo' | 'Inativo'

  })

  const [editingGroupId, setEditingGroupId] = useState<string | null>(null)

  const [origemGroups, setOrigemGroups] = useState<string[]>(() =>

    readPersistedOrigemGroups()

  )

  const [origemInputValue, setOrigemInputValue] = useState('')

  const [editingOrigemGroup, setEditingOrigemGroup] = useState<string | null>(null)

  const [isActionGroupsExpanded, setIsActionGroupsExpanded] = useState(false)

  const [isOrigemExpanded, setIsOrigemExpanded] = useState(false)

  const sectionCardStyle = {

    borderRadius: 20,

    border: '1px solid #e2e8f0',

    background: '#ffffff',

    boxShadow: '0 18px 35px rgba(15, 23, 42, 0.08)',

    padding: 24,

    display: 'flex',

    flexDirection: 'column' as const,

    gap: 16

  }

  const sectionHeaderStyle = {

    display: 'flex',

    justifyContent: 'space-between',

    flexWrap: 'wrap' as const,

    alignItems: 'center',

    gap: 12

  }



  const [currentUser, setCurrentUser] = useState<User | null>(() => getStoredUser())

  const userCompanyId = currentUser?.empresaId ?? ''



  useEffect(() => {

    const token = getStoredToken()

    if (!token) return

    fetch(`${API_URL}/estrutura`, {

      headers: { Authorization: `Bearer ${token}` }

    })

      .then(response => {

        if (response.status === 401) {

          setPostLoginRedirect(window.location.pathname + window.location.search)

          logout()

          navigate('/')

          return null

        }

        if (!response.ok) return null

        return response.json()

      })

      .then(data => {

        if (!data) return

        const list = Array.isArray(data.estrutura) ? data.estrutura : []

        const ativos = list.filter(

          (item: EstruturaItem) =>

            item.status === 'ativo' && item.execucao === 'sim'

        )

        setEstruturas(ativos)

      })

      .catch(() => {

        setEstruturas([])

      })

  }, [navigate])



  const loadConfigs = useCallback(() => {

    const token = getStoredToken()

    if (!token) return

    fetch(`${API_URL}/os/scheduler-sub-team`, {

      headers: { Authorization: `Bearer ${token}` }

    })

      .then(response => {

        if (response.status === 401) {

          setPostLoginRedirect(window.location.pathname + window.location.search)

          logout()

          navigate('/')

          return null

        }

        if (!response.ok) return null

        return response.json()

      })

      .then(data => {

        if (!data) return

        const list = Array.isArray(data.configs) ? data.configs : []

        setAllSubTeams(list)

      })

      .catch(() => {

        setAllSubTeams([])

      })

  }, [navigate])



  useEffect(() => {

    const unsubscribe = subscribeToUserChanges(() => {

      const nextUser = getStoredUser()

      setCurrentUser(nextUser)

      setCodigoForm(getDefaultCodigoForm(nextUser?.empresaId ?? ''))

    })

    return unsubscribe

  }, [])



  const loadHolidays = useCallback(() => {

    const token = getStoredToken()

    if (!token) return

    fetch(`${API_URL}/os/scheduler-holiday`, {

      headers: { Authorization: `Bearer ${token}` }

    })

      .then(response => {

        if (response.status === 401) {

          setPostLoginRedirect(window.location.pathname + window.location.search)

          logout()

          navigate('/')

          return null

        }

        if (!response.ok) return null

        return response.json()

      })

      .then(data => {

        if (!data) return

        const list = Array.isArray(data.holidays) ? data.holidays : []

        setHolidays(list)

      })

      .catch(() => {

        setHolidays([])

      })

  }, [navigate])



  const loadSubTeams = (coordenacao: string, equipeId: string) => {

    const token = getStoredToken()

    if (!token) return

    const params = new URLSearchParams({ coordenacao, equipe_id: equipeId })

    fetch(`${API_URL}/os/scheduler-sub-team?${params.toString()}`, {

      headers: { Authorization: `Bearer ${token}` }

    })

      .then(response => {

        if (response.status === 401) {

          setPostLoginRedirect(window.location.pathname + window.location.search)

          logout()

          navigate('/')

          return null

        }

        if (!response.ok) return null

        return response.json()

      })

      .then(data => {

        if (!data) return

        const list = Array.isArray(data.configs) ? data.configs : []

        setSubTeams(list)

      })

      .catch(() => {

        setSubTeams([])

      })

  }



  useEffect(() => {

    loadConfigs()

    loadHolidays()

  }, [loadConfigs, loadHolidays])



  const teamList = useMemo(() => {

    const map = new Map<string, { coordenacao: string; equipe: string; equipeId: string }>()

    estruturas.forEach(item => {

      const key = `${item.coordenacao}::${item.equipe}`

      if (!map.has(key)) {

        map.set(key, {

          coordenacao: item.coordenacao,

          equipe: item.equipe,

          equipeId: item.id

        })

      }

    })

    return Array.from(map.values())

  }, [estruturas])



  const subTeamMap = useMemo(() => {

    const map = new Map<string, SchedulerSubTeamConfig[]>()

    allSubTeams

      .filter(cfg => cfg.status === 'ativo')

      .forEach(cfg => {

        const key = `${cfg.coordenacao}::${cfg.equipe_id}`

        const list = map.get(key) || []

        list.push(cfg)

        map.set(key, list)

      })

    return map

  }, [allSubTeams])



  const activeSubTeams = useMemo(() => {

    return subTeams.filter(item => item.status === 'ativo')

  }, [subTeams])



  const filteredHolidays = useMemo(() => {

    const list = holidayEquipeFilter

      ? holidays.filter(item => item.equipe_id === holidayEquipeFilter)

      : holidays



    return [...list].sort((a, b) => {

      const equipeA =

        estruturas.find(item => item.id === a.equipe_id)?.equipe || a.equipe_id

      const equipeB =

        estruturas.find(item => item.id === b.equipe_id)?.equipe || b.equipe_id

      const equipeCompare = equipeA.localeCompare(equipeB)

      if (equipeCompare !== 0) return equipeCompare

      return a.data.localeCompare(b.data)

    })

  }, [holidayEquipeFilter, holidays, estruturas])



  const openModal = (team: { coordenacao: string; equipe: string; equipeId: string }) => {

    setSelectedTeam(team)

    setEditingSubTeam(null)

    setForm({ subEquipe: '', escala: '', status: 'ativo', observacao: '' })

    setModalOpen(true)

    loadSubTeams(team.coordenacao, team.equipeId)

  }



  const handleSave = async () => {

    if (!selectedTeam) return

    if (!form.subEquipe || !form.escala || !form.status) return

    const token = getStoredToken()

    if (!token) return

    const response = await fetch(`${API_URL}/os/scheduler-sub-team`, {

      method: 'PATCH',

      headers: {

        'Content-Type': 'application/json',

        Authorization: `Bearer ${token}`

      },

      body: JSON.stringify({

        coordenacao: selectedTeam.coordenacao,

        equipe_id: selectedTeam.equipeId,

        sub_equipe: form.subEquipe,

        escala: form.escala,

        status: form.status,

        observacao: form.observacao

      })

    })



    if (response.status === 401) {

      setPostLoginRedirect(window.location.pathname + window.location.search)

      logout()

      navigate('/')

      return

    }

    if (response.ok) {

      loadConfigs()

      loadSubTeams(selectedTeam.coordenacao, selectedTeam.equipeId)

      setModalOpen(false)

      return

    }

  }



  const handleEditSubTeam = (subTeam: SchedulerSubTeamConfig) => {

    setEditingSubTeam(subTeam.sub_equipe)

    setForm({

      subEquipe: subTeam.sub_equipe,

      escala: subTeam.escala,

      status: subTeam.status || 'ativo',

      observacao: subTeam.observacao || ''

    })

  }



  const toggleCodigoPanel = () => {

    setIsCodigoExpanded(state => !state)

  }



  const openCodigoModal = (codigo: CodigoAtividade) => {

    setSelectedCodigoAtividade(codigo)

    setCodigoForm({

      id_company: codigo.id_company,

      id_codigo: codigo.id_codigo,

      nome_codigo: codigo.nome_codigo,

      sequencia_codigo: String(codigo.sequencia_codigo),

      observacao_codigo: codigo.observacao_codigo,

      status_codigo: codigo.status_codigo

    })

    setCodigoModalOpen(true)

  }



  const handleCodigoSave = () => {

    if (!selectedCodigoAtividade) return

    const updated = {

      id_company: codigoForm.id_company,

      id_codigo: codigoForm.id_codigo,

      nome_codigo: codigoForm.nome_codigo,

      sequencia_codigo: Number(codigoForm.sequencia_codigo) || 0,

      observacao_codigo: codigoForm.observacao_codigo,

      status_codigo: codigoForm.status_codigo

    }

    setCodigoAtividades(prev =>

      prev.map(item =>

        item.id_codigo === selectedCodigoAtividade.id_codigo ? updated : item

      )

    )

    resetCodigoModal()

  }



  const resetCodigoModal = () => {

    setSelectedCodigoAtividade(null)

    setCodigoForm(getDefaultCodigoForm(userCompanyId))

    setCodigoModalOpen(false)

  }





  const resetGroupForm = () => {

    setEditingGroupId(null)

    setGroupForm({

      id: '',

      nome: '',

      descricao: '',

      status: 'Ativo'

    })

  }

  const updateAndPersistGroups = (updater: (prev: GrupoAcao[]) => GrupoAcao[]) => {

    setActionGroups(prev => {

      const next = updater(prev)

      persistActionGroups(next)

      return next

    })

  }


  const handleEditGroup = (group: GrupoAcao) => {

    setEditingGroupId(group.id)

    setGroupForm({

      id: group.id,

      nome: group.nome,

      descricao: group.descricao,

      status: group.status

    })

  }



  const handleGroupSave = () => {

    if (!groupForm.nome.trim()) return

    if (editingGroupId) {

      updateAndPersistGroups(prev =>

        prev.map(item =>

          item.id === editingGroupId

            ? {

                ...item,

                nome: groupForm.nome.trim(),

                descricao: groupForm.descricao.trim(),

                status: groupForm.status

              }

            : item

        )

      )

      resetGroupForm()

      return

    }

    const nextId = `GRP-${String(actionGroups.length + 1).padStart(2, '0')}`

    updateAndPersistGroups(prev => [

      ...prev,

      {

        id: nextId,

        nome: groupForm.nome.trim(),

        descricao: groupForm.descricao.trim(),

        status: groupForm.status

      }

    ])

    resetGroupForm()

  }

  const handleSaveOrigemGroup = () => {

    const trimmed = origemInputValue.trim()

    if (!trimmed) return

    const normalized = trimmed.toLowerCase()

    const hasConflict = origemGroups.some(group => {

      const matches = group.toLowerCase() === normalized

      if (editingOrigemGroup) {

        return matches && group !== editingOrigemGroup

      }

      return matches

    })

    if (hasConflict) {

      return

    }

    const next = editingOrigemGroup

      ? origemGroups.map(group => (group === editingOrigemGroup ? trimmed : group))

      : [...origemGroups, trimmed]

    setOrigemGroups(next)

    persistOrigemGroups(next)

    setOrigemInputValue('')

    setEditingOrigemGroup(null)

  }

  const handleEditOrigemGroup = (group: string) => {

    setOrigemInputValue(group)

    setEditingOrigemGroup(group)

  }

  const handleDeleteOrigemGroup = (group: string) => {

    const next = origemGroups.filter(item => item !== group)

    setOrigemGroups(next)

    persistOrigemGroups(next)

    if (editingOrigemGroup === group) {

      setEditingOrigemGroup(null)

      setOrigemInputValue('')

    }

  }

  const handleCancelOrigemEdit = () => {

    setEditingOrigemGroup(null)

    setOrigemInputValue('')

  }



  const handleNewSubTeam = () => {

    setEditingSubTeam(null)

    setForm({ subEquipe: '', escala: '', status: 'ativo', observacao: '' })

  }



  const handleDeleteSubTeam = async (subEquipe: string) => {

    if (!selectedTeam) return

    const token = getStoredToken()

    if (!token) return

    const params = new URLSearchParams({

      coordenacao: selectedTeam.coordenacao,

      equipe_id: selectedTeam.equipeId,

      sub_equipe: subEquipe

    })

    const response = await fetch(

      `${API_URL}/os/scheduler-sub-team?${params.toString()}`,

      {

        method: 'DELETE',

        headers: { Authorization: `Bearer ${token}` }

      }

    )

    if (response.status === 401) {

      setPostLoginRedirect(window.location.pathname + window.location.search)

      logout()

      navigate('/')

      return

    }

    if (response.ok) {

      loadConfigs()

      loadSubTeams(selectedTeam.coordenacao, selectedTeam.equipeId)

    }

  }



  const openHolidayModal = () => {

    setEditingHolidayId(null)

    setHolidayForm({ feriado: '', data: '', equipeIds: [], allEquipes: false })

    setHolidayModalOpen(true)

  }



  const openEditHoliday = (holiday: SchedulerHoliday) => {

    setEditingHolidayId(holiday.id)

    setHolidayForm({

      feriado: holiday.feriado,

      data: holiday.data,

      equipeIds: [holiday.equipe_id],

      allEquipes: false

    })

    setHolidayModalOpen(true)

  }



  const handleSaveHoliday = async () => {

    if (!holidayForm.feriado || !holidayForm.data) return

    const token = getStoredToken()

    if (!token) return

    const payload: Record<string, unknown> = {

      feriado: holidayForm.feriado,

      data: holidayForm.data

    }



    if (editingHolidayId) {

      payload.id = editingHolidayId

      payload.equipe_id = holidayForm.equipeIds[0] || ''

    } else {

      payload.all_equipes = holidayForm.allEquipes

      payload.equipe_ids = holidayForm.equipeIds

    }



    const response = await fetch(`${API_URL}/os/scheduler-holiday`, {

      method: 'PATCH',

      headers: {

        'Content-Type': 'application/json',

        Authorization: `Bearer ${token}`

      },

      body: JSON.stringify(payload)

    })



    if (response.status === 401) {

      setPostLoginRedirect(window.location.pathname + window.location.search)

      logout()

      navigate('/')

      return

    }

    if (response.ok) {

      loadHolidays()

      setHolidayModalOpen(false)

    }

  }



  return (

    <section style={{ display: 'flex', flexDirection: 'column' as const, gap: 16 }}>

      <header>

        <h2 style={{ margin: 0, fontSize: 22 }}>Ajustes de Sistema</h2>

        <p style={{ margin: '6px 0 0', color: '#64748b' }}>
          Centralize parâmetros gerais e configurações operacionais.
        </p>
      </header>



      <div

        style={{

          display: 'flex',

          alignItems: 'center',

          gap: 12,

          flexWrap: 'wrap' as const

        }}

      >

        <Tabs tabs={ajustesTabs} activeId={activeTab} onChange={setActiveTab} />

      </div>



      {![ 'scheduler', 'feriados', 'produtividade' ].includes(activeTab) && (

        <div

          style={{

            padding: 20,

            borderRadius: 16,

            border: '1px solid #e2e8f0',

            background: '#ffffff'

          }}

        >

          <p style={{ margin: 0, color: '#475569' }}>

            Area reservada para{' '}

            {ajustesTabs.find(tab => tab.id === activeTab)?.label}.

          </p>

        </div>

      )}



      {activeTab === 'produtividade' && (

        <div

          style={{

            marginTop: 16,

            borderRadius: 16,

            border: '1px solid #e2e8f0',

            background: '#ffffff',

            padding: 20,

            display: 'flex',

            flexDirection: 'column' as const,

            gap: 16

          }}

        >

          <button

            type="button"

            onClick={toggleCodigoPanel}

            style={{

              border: '1px solid #e2e8f0',

              borderRadius: 12,

              padding: '12px 16px',

              background: '#f8fafc',

              display: 'flex',

              justifyContent: 'space-between',

              alignItems: 'center',

              fontWeight: 600,

              cursor: 'pointer'

            }}

          >

          <span>Código Atividade</span>
          <span
            style={{
              transform: isCodigoExpanded ? 'rotate(0deg)' : 'rotate(-90deg)',
              transition: 'transform 0.2s',
              fontSize: 16
            }}
          >
              Ocultar
          </span>
        </button>
          {isCodigoExpanded && (

            <div

              style={{

                overflowX: 'auto',

                borderRadius: 12,

                border: '1px solid #e2e8f0',

                padding: 12,

                background: 'transparent'

              }}

            >

              <table

                style={{

                  width: '100%',

                  borderCollapse: 'collapse',

                  minWidth: 680,

                  color: '#0f172a',

                  fontSize: 13

                }}

              >

                <thead>

                  <tr

                    style={{

                      color: '#475569',

                      fontSize: 12,

                      textTransform: 'uppercase'

                    }}

                  >

                    <th style={{ textAlign: 'left', padding: '10px 8px' }}>

                      Id Company

                    </th>

                    <th style={{ textAlign: 'left', padding: '10px 8px' }}>
                      Id Código
                    </th>
                    <th style={{ textAlign: 'left', padding: '10px 8px' }}>
                      Nome do Códigos
                    </th>
                    <th style={{ textAlign: 'left', padding: '10px 8px' }}>
                      Sequência
                    </th>
                    <th style={{ textAlign: 'left', padding: '10px 8px' }}>
                      Observação
                    </th>
                    <th style={{ textAlign: 'left', padding: '10px 8px' }}>
                      Status
                    </th>
                    <th style={{ textAlign: 'left', padding: '10px 8px' }}>
                      Ações
                    </th>
                  </tr>
                </thead>

                <tbody>

                  {codigoAtividades.length === 0 && (

                    <tr>

                      <td

                        colSpan={7}

                        style={{

                          padding: '16px',

                          textAlign: 'center',

                          color: '#94a3b8'

                        }}

                      >

                        Nenhum código cadastrado.
                      </td>

                    </tr>

                  )}

                  {codigoAtividades.map(item => (

                    <tr

                      key={item.id_codigo}

                      style={{

                        borderTop: '1px solid #e2e8f0',

                        color: '#0f172a'

                      }}

                    >

                      <td

                        style={{

                          padding: '12px 8px',

                          fontWeight: 600,

                          color: '#0f172a'

                        }}

                      >

                        {item.id_company}

                      </td>

                      <td

                        style={{

                          padding: '12px 8px',

                          color: '#475569',

                          fontWeight: 600

                        }}

                      >

                        {item.id_codigo}

                      </td>

                      <td

                        style={{

                          padding: '12px 8px',

                          color: '#475569'

                        }}

                      >

                        {item.nome_codigo}

                      </td>

                      <td

                        style={{

                          padding: '12px 8px',

                          color: '#475569'

                        }}

                      >

                        {item.sequencia_codigo}

                      </td>

                      <td

                        style={{

                          padding: '12px 8px',

                          color: '#64748b',

                          fontSize: 12

                        }}

                      >

                        {item.observacao_codigo}

                      </td>

                      <td style={{ padding: '12px 8px' }}>

                        <span

                          style={{

                            padding: '4px 10px',

                            borderRadius: 999,

                            fontSize: 12,

                            fontWeight: 600,

                            color:

                              item.status_codigo === 'Ativo'

                                ? '#4ade80'

                                : '#f87171',

                            background:

                              item.status_codigo === 'Ativo'

                                ? 'rgba(16,185,129,0.15)'

                                : 'rgba(248,113,113,0.15)',

                            border:

                              item.status_codigo === 'Ativo'

                                ? '1px solid rgba(16,185,129,0.4)'

                                : '1px solid rgba(248,113,113,0.4)'

                          }}

                        >

                          {item.status_codigo}

                        </span>

                      </td>

                      <td style={{ padding: '12px 8px' }}>

                        <button

                          type="button"

                          onClick={() => openCodigoModal(item)}

                          style={{

                            padding: '6px 12px',

                            borderRadius: 8,

                            border: '1px solid #1f2937',

                            background: '#0f172a',

                            color: '#e2e8f0',

                            cursor: 'pointer',

                            fontWeight: 600

                          }}

                        >

                          Editar

                        </button>

                      </td>

                    </tr>

                  ))}

                </tbody>

              </table>

            </div>
          )}
        </div>
      )}
      {activeTab === 'acoes' && (
        <div
          style={{
            marginTop: 16,
            display: 'flex',
            flexDirection: 'column' as const,
            gap: 20
          }}
        >
          <div style={sectionCardStyle}>
            <div style={sectionHeaderStyle}>
              <div>
                <strong>Grupos de Ações</strong>
                <p style={{ margin: '6px 0 0', color: '#64748b' }}>
                  Registre e categorize os grupos que usam as ações TO para alinhamento
                  de criticidade e departamento.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsActionGroupsExpanded(value => !value)}
                style={{
                  borderRadius: 12,
                  border: '1px solid #e2e8f0',
                  background: isActionGroupsExpanded ? '#eef2ff' : '#f8fafc',
                  padding: '8px 14px',
                  cursor: 'pointer',
                  fontWeight: 600,
                  color: '#1f2937'
                }}
                aria-expanded={isActionGroupsExpanded}
              >
                {isActionGroupsExpanded ? 'Ocultar detalhes' : 'Expandir detalhes'}
              </button>
            </div>
            {isActionGroupsExpanded && (
              <div style={{ display: 'grid', gap: 20 }}>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                    gap: 14
                  }}
                >
                  {actionGroups.map(group => (
                    <div
                      key={group.id}
                      style={{
                        border: '1px solid #e2e8f0',
                        borderRadius: 12,
                        background: '#f8fafc',
                        padding: 16,
                        display: 'flex',
                        flexDirection: 'column' as const,
                        gap: 8,
                        minHeight: 140
                      }}
                    >
                      <div style={{ fontWeight: 700 }}>{group.nome}</div>
                      <div style={{ color: '#475569', fontSize: 13 }}>{group.descricao}</div>
                      <div style={{ color: '#64748b', fontSize: 12 }}>Status: {group.status}</div>
                      <button
                        type="button"
                        onClick={() => handleEditGroup(group)}
                        style={{
                          alignSelf: 'flex-start',
                          border: 'none',
                          background: '#2563eb',
                          color: '#ffffff',
                          padding: '6px 12px',
                          borderRadius: 8,
                          cursor: 'pointer',
                          fontWeight: 600
                        }}
                      >
                        Editar
                      </button>
                    </div>
                  ))}
                </div>
                <div
                  style={{
                    borderTop: '1px solid #e2e8f0',
                    paddingTop: 16,
                    display: 'grid',
                    gap: 12,
                    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))'
                  }}
                >
                  <div>
                    <strong>{editingGroupId ? 'Atualizar grupo' : 'Criar novo grupo'}</strong>
                    <p style={{ margin: '4px 0 0', fontSize: 13, color: '#64748b' }}>
                      Defina o nome, descrição e o status dos grupos de ações usados na operação.
                    </p>
                  </div>
                  <label style={{ display: 'flex', flexDirection: 'column' as const, gap: 6 }}>
                    <span style={{ fontSize: 12, color: '#475569' }}>Nome do grupo</span>
                    <input
                      value={groupForm.nome}
                      onChange={event =>
                        setGroupForm(prev => ({ ...prev, nome: event.target.value }))
                      }
                      style={{ borderRadius: 10, border: '1px solid #e2e8f0', padding: '10px 12px' }}
                    />
                  </label>
                  <label style={{ display: 'flex', flexDirection: 'column' as const, gap: 6 }}>
                    <span style={{ fontSize: 12, color: '#475569' }}>Descrição</span>
                    <textarea
                      rows={2}
                      value={groupForm.descricao}
                      onChange={event =>
                        setGroupForm(prev => ({ ...prev, descricao: event.target.value }))
                      }
                      style={{
                        borderRadius: 10,
                        border: '1px solid #e2e8f0',
                        padding: '10px 12px',
                        resize: 'vertical'
                      }}
                    />
                  </label>
                  <label style={{ display: 'flex', flexDirection: 'column' as const, gap: 6 }}>
                    <span style={{ fontSize: 12, color: '#475569' }}>Status</span>
                    <select
                      value={groupForm.status}
                      onChange={event =>
                        setGroupForm(prev => ({
                          ...prev,
                          status: event.target.value as 'Ativo' | 'Inativo'
                        }))
                      }
                      style={{ borderRadius: 10, border: '1px solid #e2e8f0', padding: '10px 12px' }}
                    >
                      <option value="Ativo">Ativo</option>
                      <option value="Inativo">Inativo</option>
                    </select>
                  </label>
                  <div
                    style={{
                      display: 'flex',
                      gap: 8,
                      alignItems: 'center',
                      justifyContent: 'flex-end'
                    }}
                  >
                    <button
                      type="button"
                      onClick={resetGroupForm}
                      style={{
                        borderRadius: 10,
                        border: '1px solid #e2e8f0',
                        background: '#ffffff',
                        padding: '8px 14px',
                        cursor: 'pointer'
                      }}
                    >
                      Limpar
                    </button>
                    <button
                      type="button"
                      onClick={handleGroupSave}
                      style={{
                        borderRadius: 10,
                        border: 'none',
                        background: 'linear-gradient(90deg, #10b981, #0f9d58)',
                        color: '#ffffff',
                        padding: '8px 14px',
                        cursor: 'pointer',
                        fontWeight: 600
                      }}
                    >
                      Salvar grupo
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div style={sectionCardStyle}>
            <div style={sectionHeaderStyle}>
              <div>
                <strong>Grupo de Origem</strong>
                <p style={{ margin: '6px 0 0', color: '#64748b', fontSize: 13 }}>
                  Categorize as origens que disparam as ações TO para melhor rastreamento.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsOrigemExpanded(value => !value)}
                style={{
                  borderRadius: 12,
                  border: '1px solid #e2e8f0',
                  background: isOrigemExpanded ? '#eef2ff' : '#f8fafc',
                  padding: '8px 14px',
                  cursor: 'pointer',
                  fontWeight: 600,
                  color: '#1f2937'
                }}
                aria-expanded={isOrigemExpanded}
              >
                {isOrigemExpanded ? 'Ocultar detalhes' : 'Expandir detalhes'}
              </button>
            </div>
            {isOrigemExpanded && (
              <div style={{ display: 'grid', gap: 20 }}>
                <div
                  style={{
                    borderRadius: 12,
                    border: '1px solid #e2e8f0',
                    background: '#f8fafc',
                    padding: 14,
                    display: 'flex',
                    flexWrap: 'wrap' as const,
                    gap: 12
                  }}
                >
                  {origemGroups.length ? (
                    origemGroups.map(group => (
                      <div
                        key={group}
                        style={{
                          border: '1px solid #e2e8f0',
                          borderRadius: 12,
                          padding: '10px 14px',
                          background: '#ffffff',
                          display: 'flex',
                          gap: 8,
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          minWidth: 200
                        }}
                      >
                        <span style={{ fontWeight: 600, color: '#0f172a' }}>{group}</span>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button
                            type="button"
                            onClick={() => handleEditOrigemGroup(group)}
                            style={{
                              borderRadius: 8,
                              border: '1px solid #2563eb',
                              background: '#2563eb',
                              color: '#ffffff',
                              padding: '4px 10px',
                              cursor: 'pointer',
                              fontSize: 12,
                              fontWeight: 600
                            }}
                          >
                            Editar
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteOrigemGroup(group)}
                            style={{
                              borderRadius: 8,
                              border: '1px solid #f87171',
                              background: '#fee2e2',
                              color: '#b91c1c',
                              padding: '4px 10px',
                              cursor: 'pointer',
                              fontSize: 12,
                              fontWeight: 600
                            }}
                          >
                            Excluir
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p style={{ color: '#94a3b8', fontSize: 13, margin: 0 }}>
                      Ainda não há grupos de origem registrados.
                    </p>
                  )}
                </div>
                <div
                  style={{
                    borderTop: '1px solid #e2e8f0',
                    paddingTop: 16,
                    display: 'grid',
                    gap: 12,
                    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))'
                  }}
                >
                  <div>
                    <strong>{editingOrigemGroup ? 'Atualizar origem' : 'Criar origem'}</strong>
                    <p style={{ margin: '4px 0 0', fontSize: 13, color: '#64748b' }}>
                      Use um nome claro para representar a origem das ações TO.
                    </p>
                  </div>
                  <label style={{ display: 'flex', flexDirection: 'column' as const, gap: 6 }}>
                    <span style={{ fontSize: 12, color: '#475569' }}>
                      Nome do grupo de origem
                    </span>
                    <input
                      value={origemInputValue}
                      onChange={event => setOrigemInputValue(event.target.value)}
                      style={{ borderRadius: 10, border: '1px solid #e2e8f0', padding: '10px 12px' }}
                    />
                  </label>
                  <div
                    style={{
                      display: 'flex',
                      gap: 8,
                      justifyContent: 'flex-end',
                      alignItems: 'center'
                    }}
                  >
                    {editingOrigemGroup && (
                      <button
                        type="button"
                        onClick={handleCancelOrigemEdit}
                        style={{
                          borderRadius: 10,
                          border: '1px solid #e2e8f0',
                          background: '#ffffff',
                          padding: '8px 14px',
                          cursor: 'pointer'
                        }}
                      >
                        Cancelar
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={handleSaveOrigemGroup}
                      style={{
                        borderRadius: 10,
                        border: 'none',
                        background: 'linear-gradient(90deg, #2563eb, #1d4ed8)',
                        color: '#ffffff',
                        padding: '8px 14px',
                        cursor: 'pointer',
                        fontWeight: 600
                      }}
                    >
                      {editingOrigemGroup ? 'Salvar alterações' : 'Adicionar grupo'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      {activeTab === 'cadastro-ativo' && (

        <div style={{ marginTop: 16 }}>

          <ConfiguracaoCadastroAtivos />

        </div>

      )}



      {activeTab === 'scheduler' && (

        <div

          style={{

            padding: 20,

            borderRadius: 16,

            border: '1px solid #e2e8f0',

            background: '#ffffff',

            display: 'grid',

            gap: 16

          }}

        >

          <div style={{ fontWeight: 700 }}>Parametrizar Equipe</div>

          <div style={{ fontSize: 12, color: '#64748b' }}>LMR</div>

          <div

            style={{

              display: 'grid',

              gridTemplateColumns: 'minmax(160px, max-content) max-content',

              gap: 16,

              fontSize: 12,

              color: '#94a3b8',

              justifyItems: 'start'

            }}

          >

            <div>Nome equipe</div>

            <div>Qtd sub-equipes</div>

          </div>

          <div style={{ display: 'grid', gap: 6 }}>

            {teamList.map(team => {

              const subTeams = subTeamMap.get(

                `${team.coordenacao}::${team.equipeId}`

              )

              return (

                <button

                  key={`${team.coordenacao}-${team.equipe}`}

                  type="button"

                  onClick={() => openModal(team)}

                  style={{

                    display: 'grid',

                    gridTemplateColumns: 'minmax(160px, max-content) max-content',

                    gap: 16,

                    padding: '10px 12px',

                    borderRadius: 10,

                    border: '1px solid #e2e8f0',

                    background: '#ffffff',

                    textAlign: 'left',

                    cursor: 'pointer',

                    justifyItems: 'start',

                    alignItems: 'center'

                  }}

                >

                  <div>{team.equipe}</div>

                  <div style={{ color: '#64748b' }}>

                    {subTeams ? `${subTeams.length} sub-equipes` : '0 sub-equipes'}

                  </div>

                </button>

              )

            })}

          </div>

        </div>

      )}



      {activeTab === 'feriados' && (

        <div

          style={{

            padding: 20,

            borderRadius: 16,

            border: '1px solid #e2e8f0',

            background: '#ffffff',

            display: 'grid',

            gap: 16

          }}

        >

          <div

            style={{

              display: 'flex',

              justifyContent: 'space-between',

              alignItems: 'center',

              gap: 12

            }}

          >

            <div style={{ fontWeight: 700 }}>Feriados</div>

            <select

              value={holidayEquipeFilter}

              onChange={event => setHolidayEquipeFilter(event.target.value)}

              style={{

                padding: '6px 10px',

                borderRadius: 8,

                border: '1px solid #e2e8f0',

                minWidth: 180

              }}

            >

              <option value="">Selecione</option>

              {teamList.map(team => (

                <option key={team.equipeId} value={team.equipeId}>

                  {team.equipe}

                </option>

              ))}

            </select>

            <button

              type="button"

              onClick={openHolidayModal}

              style={{

                padding: '8px 12px',

                borderRadius: 10,

                border: '1px solid #e2e8f0',

                background: '#ffffff',

                cursor: 'pointer',

                fontWeight: 600

              }}

            >

              Cadastrar feriado

            </button>

          </div>

          <div

            style={{

              display: 'grid',

              gridTemplateColumns:

                'minmax(160px, 1fr) minmax(160px, 1fr) 120px 120px',

              gap: 12,

              fontSize: 12,

              color: '#94a3b8'

            }}

          >

            <div>Equipe</div>

            <div>Feriado</div>

            <div>Data</div>

            <div>Acoes</div>

          </div>

          <div style={{ display: 'grid', gap: 6 }}>

            {filteredHolidays.length === 0 && (

              <div style={{ fontSize: 12, color: '#94a3b8' }}>

                Nenhum feriado cadastrado.

              </div>

            )}

            {filteredHolidays.map(holiday => {

              const equipeName =

                estruturas.find(item => item.id === holiday.equipe_id)?.equipe ||

                holiday.equipe_id

              return (

                <div

                  key={holiday.id}

                  style={{

                    display: 'grid',

                    gridTemplateColumns:

                      'minmax(160px, 1fr) minmax(160px, 1fr) 120px 120px',

                    gap: 12,

                    padding: '10px 12px',

                    borderRadius: 10,

                    border: '1px solid #e2e8f0',

                    background: '#ffffff',

                    alignItems: 'center'

                  }}

                >

                  <div>{equipeName}</div>

                  <div style={{ color: '#64748b' }}>{holiday.feriado}</div>

                  <div style={{ color: '#64748b' }}>

                    {formatHolidayDate(holiday.data)}

                  </div>

                  <div>

                    <button

                      type="button"

                      onClick={() => openEditHoliday(holiday)}

                      style={{

                        padding: '6px 8px',

                        borderRadius: 8,

                        border: '1px solid #e2e8f0',

                        background: '#ffffff',

                        cursor: 'pointer'

                      }}

                    >

                      Editar

                    </button>

                  </div>

                </div>

              )

            })}

          </div>

        </div>

      )}



      <Modal

        title={editingHolidayId ? 'Editar feriado' : 'Cadastrar feriado'}

        isOpen={holidayModalOpen}

        onClose={() => setHolidayModalOpen(false)}

        footer={

          <>

            <button

              type="button"

              onClick={() => setHolidayModalOpen(false)}

              style={{

                padding: '10px 16px',

                borderRadius: 10,

                border: '1px solid #e2e8f0',

                background: '#ffffff',

                fontWeight: 600,

                cursor: 'pointer'

              }}

            >

              Fechar

            </button>

            <button

              type="button"

              onClick={handleSaveHoliday}

              style={{

                padding: '10px 16px',

                borderRadius: 10,

                border: 'none',

                background: '#1d4ed8',

                color: '#ffffff',

                fontWeight: 600,

                cursor: 'pointer'

              }}

            >

              Salvar

            </button>

          </>

        }

      >

        <div style={{ display: 'grid', gap: 12 }}>

          <div style={{ display: 'grid', gap: 6 }}>

            <label style={{ fontSize: 12, fontWeight: 600, color: '#475569' }}>

              Feriado

            </label>

            <input

              value={holidayForm.feriado}

              onChange={event =>

                setHolidayForm(prev => ({ ...prev, feriado: event.target.value }))

              }

              style={{

                padding: '10px 12px',

                borderRadius: 10,

                border: '1px solid #e2e8f0'

              }}

            />

          </div>

          <div style={{ display: 'grid', gap: 6 }}>

            <label style={{ fontSize: 12, fontWeight: 600, color: '#475569' }}>

              Data

            </label>

            <input

              type="date"

              value={holidayForm.data}

              onChange={event =>

                setHolidayForm(prev => ({ ...prev, data: event.target.value }))

              }

              style={{

                padding: '10px 12px',

                borderRadius: 10,

                border: '1px solid #e2e8f0'

              }}

            />

          </div>

          {editingHolidayId ? (

            <div style={{ display: 'grid', gap: 6 }}>

              <label style={{ fontSize: 12, fontWeight: 600, color: '#475569' }}>

                Equipe

              </label>

              <select

                value={holidayForm.equipeIds[0] || ''}

                onChange={event =>

                  setHolidayForm(prev => ({

                    ...prev,

                    equipeIds: event.target.value ? [event.target.value] : []

                  }))

                }

                style={{

                  padding: '10px 12px',

                  borderRadius: 10,

                  border: '1px solid #e2e8f0'

                }}

              >

                <option value="">Selecione</option>

                {teamList.map(team => (

                  <option key={team.equipeId} value={team.equipeId}>

                    {team.equipe}

                  </option>

                ))}

              </select>

            </div>

          ) : (

            <div style={{ display: 'grid', gap: 8 }}>

              <div style={{ fontSize: 12, fontWeight: 600, color: '#475569' }}>

                Equipes

              </div>

              <select

                multiple

                size={6}

                value={

                  holidayForm.allEquipes ? ['__ALL__'] : holidayForm.equipeIds

                }

                onChange={event => {

                  const values = Array.from(event.target.selectedOptions).map(

                    option => option.value

                  )

                  if (values.includes('__ALL__')) {

                    setHolidayForm(prev => ({

                      ...prev,

                      allEquipes: true,

                      equipeIds: []

                    }))

                    return

                  }

                  setHolidayForm(prev => ({

                    ...prev,

                    allEquipes: false,

                    equipeIds: values

                  }))

                }}

                style={{

                  padding: '10px 12px',

                  borderRadius: 10,

                  border: '1px solid #e2e8f0'

                }}

              >

                <option value="__ALL__">Todas</option>

                {teamList.map(team => (

                  <option key={team.equipeId} value={team.equipeId}>

                    {team.equipe}

                  </option>

                ))}

              </select>

            </div>

          )}

        </div>

      </Modal>



      <Modal

        title="Parametrizar equipe"

        isOpen={modalOpen}

        onClose={() => setModalOpen(false)}

        footer={

          <>

            <button

              type="button"

              onClick={() => setModalOpen(false)}

              style={{

                padding: '10px 16px',

                borderRadius: 10,

                border: '1px solid #e2e8f0',

                background: '#ffffff',

                fontWeight: 600,

                cursor: 'pointer'

              }}

            >

              Fechar

            </button>

            <button

              type="button"

              onClick={handleSave}

              style={{

                padding: '10px 16px',

                borderRadius: 10,

                border: 'none',

                background: '#1d4ed8',

                color: '#ffffff',

                fontWeight: 600,

                cursor: 'pointer'

              }}

            >

              Salvar

            </button>

          </>

        }

      >

        {selectedTeam && (

          <div style={{ display: 'grid', gap: 12 }}>

            <div style={{ fontWeight: 700 }}>{selectedTeam.equipe}</div>

            <div style={{ color: '#64748b', fontSize: 12 }}>

              Coordenacao: {selectedTeam.coordenacao}

            </div>



              <div

                style={{

                  display: 'grid',

                  gridTemplateColumns: 'minmax(140px, 1fr) minmax(140px, 1fr) 120px 120px 140px',

                  gap: 8,

                  fontSize: 12,

                  color: '#94a3b8'

                }}

              >

                <div>Sub-equipe</div>

                <div>Observaçãoo</div>

                <div>Escala</div>

                <div>Status</div>

                <div>Acoes</div>

              </div>

            <div style={{ display: 'grid', gap: 6 }}>

            {activeSubTeams.length === 0 && (

              <div style={{ fontSize: 12, color: '#94a3b8' }}>

                Nenhuma sub-equipe cadastrada.

              </div>

            )}

            {activeSubTeams.map(item => (

              <div

                key={item.sub_equipe}

                    style={{

                      display: 'grid',

                      gridTemplateColumns:

                        'minmax(140px, 1fr) minmax(140px, 1fr) 120px 120px 140px',

                      gap: 8,

                      padding: '8px 10px',

                      borderRadius: 10,

                      border: '1px solid #e2e8f0',

                      background: '#ffffff'

                    }}

                  >

                    <div>{item.sub_equipe}</div>

                    <div style={{ color: '#64748b' }}>{item.observacao || '-'}</div>

                    <div style={{ color: '#64748b' }}>{item.escala}</div>

                    <div style={{ color: '#64748b' }}>{item.status}</div>

                    <div style={{ display: 'flex', gap: 6 }}>

                    <button

                      type="button"

                      onClick={() => handleEditSubTeam(item)}

                      style={{

                        padding: '6px 8px',

                        borderRadius: 8,

                        border: '1px solid #e2e8f0',

                        background: '#ffffff',

                        cursor: 'pointer'

                      }}

                    >

                      Editar

                    </button>

                    <button

                      type="button"

                      onClick={() => handleDeleteSubTeam(item.sub_equipe)}

                      style={{

                        padding: '6px 8px',

                        borderRadius: 8,

                        border: '1px solid #fecaca',

                        background: '#fee2e2',

                        color: '#b91c1c',

                        cursor: 'pointer'

                      }}

                    >

                      Excluir

                    </button>

                  </div>

                </div>

              ))}

            </div>



            <div style={{ display: 'flex', justifyContent: 'space-between' }}>

              <strong>Nova sub-equipe</strong>

              <button

                type="button"

                onClick={handleNewSubTeam}

                style={{

                  padding: '6px 10px',

                  borderRadius: 8,

                  border: '1px solid #e2e8f0',

                  background: '#ffffff',

                  cursor: 'pointer'

                }}

              >

                Limpar

              </button>

            </div>

            <div style={{ display: 'grid', gap: 6 }}>

              <label style={{ fontSize: 12, fontWeight: 600, color: '#475569' }}>

                Nome da sub-equipe

              </label>

              <input

                value={form.subEquipe}

                disabled={Boolean(editingSubTeam)}

                onChange={event =>

                  setForm(prev => ({ ...prev, subEquipe: event.target.value }))

                }

                style={{

                  padding: '10px 12px',

                  borderRadius: 10,

                  border: '1px solid #e2e8f0'

                }}

              />

            </div>

            <div style={{ display: 'grid', gap: 6 }}>

              <label style={{ fontSize: 12, fontWeight: 600, color: '#475569' }}>

                Observação

              </label>

              <input

                value={form.observacao}

                onChange={event =>

                  setForm(prev => ({ ...prev, observacao: event.target.value }))

                }

                style={{

                  padding: '10px 12px',

                  borderRadius: 10,

                  border: '1px solid #e2e8f0'

                }}

              />

            </div>

            <div style={{ display: 'grid', gap: 6 }}>

              <label style={{ fontSize: 12, fontWeight: 600, color: '#475569' }}>

                Escala

              </label>

              <select

                value={form.escala}

                onChange={event =>

                  setForm(prev => ({ ...prev, escala: event.target.value }))

                }

                style={{

                  padding: '10px 12px',

                  borderRadius: 10,

                  border: '1px solid #e2e8f0'

                }}

              >

                <option value="">Selecione</option>

                <option value="ADM">ADM</option>

                <option value="6x2">6x2</option>

              </select>

            </div>

            <div style={{ display: 'grid', gap: 6 }}>

              <label style={{ fontSize: 12, fontWeight: 600, color: '#475569' }}>

                Status

              </label>

              <select

                value={form.status}

                onChange={event =>

                  setForm(prev => ({ ...prev, status: event.target.value }))

                }

                style={{

                  padding: '10px 12px',

                  borderRadius: 10,

                  border: '1px solid #e2e8f0'

                }}

              >

                <option value="ativo">Ativo</option>

                <option value="inativo">Inativo</option>

              </select>

            </div>

          </div>

        )}

      </Modal>

      <Modal
        title="Editar Código Atividade"
        isOpen={codigoModalOpen}
        onClose={resetCodigoModal}
        footer={
          <>
            <button
              type="button"
              onClick={resetCodigoModal}
              style={{
                padding: '10px 16px',
                borderRadius: 10,
                border: '1px solid #e2e8f0',
                background: '#ffffff',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Fechar
            </button>
            <button
              type="button"
              onClick={handleCodigoSave}
              style={{
                padding: '10px 16px',
                borderRadius: 10,
                border: 'none',
                background: '#1d4ed8',
                color: '#ffffff',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Salvar
            </button>
          </>
        }
      >
        <div style={{ display: 'grid', gap: 12 }}>

          <div style={{ display: 'grid', gap: 6 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#475569' }}>
              Id Company
            </label>
            <input
              value={codigoForm.id_company}
              disabled
              style={{
                padding: '10px 12px',
                borderRadius: 10,
                border: '1px solid #e2e8f0',
                background: '#f8fafc'
              }}
            />
          </div>
          <div style={{ display: 'grid', gap: 6 }}>

            <label style={{ fontSize: 12, fontWeight: 600, color: '#475569' }}>
              Id Código
            </label>
            <input

              value={codigoForm.id_codigo}

              onChange={event =>

                setCodigoForm(prev => ({

                  ...prev,

                  id_codigo: event.target.value

                }))

              }

              style={{

                padding: '10px 12px',

                borderRadius: 10,

                border: '1px solid #e2e8f0'

              }}

            />

          </div>

          <div style={{ display: 'grid', gap: 6 }}>

            <label style={{ fontSize: 12, fontWeight: 600, color: '#475569' }}>
              Nome do Código
            </label>
            <input

              value={codigoForm.nome_codigo}

              onChange={event =>

                setCodigoForm(prev => ({

                  ...prev,

                  nome_codigo: event.target.value

                }))

              }

              style={{

                padding: '10px 12px',

                borderRadius: 10,

                border: '1px solid #e2e8f0'

              }}

            />

          </div>

          <div style={{ display: 'grid', gap: 6 }}>

            <label style={{ fontSize: 12, fontWeight: 600, color: '#475569' }}>
              Sequência
            </label>
            <input

              type="number"

              value={codigoForm.sequencia_codigo}

              onChange={event =>

                setCodigoForm(prev => ({

                  ...prev,

                  sequencia_codigo: event.target.value

                }))

              }

              style={{

                padding: '10px 12px',

                borderRadius: 10,

                border: '1px solid #e2e8f0'

              }}

            />

          </div>

          <div style={{ display: 'grid', gap: 6 }}>

            <label style={{ fontSize: 12, fontWeight: 600, color: '#475569' }}>
              Observação
            </label>
            <textarea

              rows={3}

              value={codigoForm.observacao_codigo}

              onChange={event =>

                setCodigoForm(prev => ({

                  ...prev,

                  observacao_codigo: event.target.value

                }))

              }

              style={{

                padding: '10px 12px',

                borderRadius: 10,

                border: '1px solid #e2e8f0',

                resize: 'vertical'

              }}

            />

          </div>

          <div style={{ display: 'grid', gap: 6 }}>

            <label style={{ fontSize: 12, fontWeight: 600, color: '#475569' }}>

              Status

            </label>

            <select

              value={codigoForm.status_codigo}

              onChange={event =>

                setCodigoForm(prev => ({

                  ...prev,

                  status_codigo: event.target.value as 'Ativo' | 'Inativo'

                }))

              }

              style={{

                padding: '10px 12px',

                borderRadius: 10,

                border: '1px solid #e2e8f0'

              }}

            >

              {codigoStatusOptions.map(option => (

                <option key={option} value={option}>

                  {option}

                </option>

              ))}

            </select>

          </div>

        </div>

      </Modal>

    </section>

  )

}



