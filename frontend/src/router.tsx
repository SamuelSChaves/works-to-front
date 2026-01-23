import { lazy, type ComponentType, type LazyExoticComponent } from 'react'
import { createBrowserRouter, Navigate } from 'react-router-dom'
import { MainLayout } from './layout/MainLayout'
import {
  RedirectIfAuthenticated,
  RequireAuth,
  SuspenseLoader
} from './routerHelpers'

type LazyComponent<T extends ComponentType<Record<string, unknown>>> =
  LazyExoticComponent<T>

const lazyLoad = <T extends ComponentType<Record<string, unknown>>>(
  loader: () => Promise<{ default: T }>
): LazyComponent<T> => lazy(loader)

const LoginPage = lazyLoad(() =>
  import('./pages/Login').then(module => ({ default: module.Login }))
)
const HomePage = lazyLoad(() =>
  import('./pages/Home').then(module => ({ default: module.Home }))
)
const PlanejamentoPage = lazyLoad(() =>
  import('./pages/Planejamento').then(module => ({ default: module.Planejamento }))
)
const AtivosPage = lazyLoad(() =>
  import('./pages/Ativos').then(module => ({ default: module.Ativos }))
)
const ComponentesPage = lazyLoad(() =>
  import('./pages/Componentes').then(module => ({ default: module.Componentes }))
)
const OrdensServicoPage = lazyLoad(() =>
  import('./pages/OrdensServico').then(module => ({ default: module.OrdensServico }))
)
const OrdensServicoSchedulerPage = lazyLoad(() =>
  import('./pages/OrdensServicoScheduler').then(module => ({
    default: module.OrdensServicoScheduler
  }))
)
const ConfiguracaoPage = lazyLoad(() =>
  import('./pages/Configuracao').then(module => ({ default: module.Configuracao }))
)
const ConfiguracaoAjustesPage = lazyLoad(() =>
  import('./pages/ConfiguracaoAjustes').then(module => ({
    default: module.ConfiguracaoAjustes
  }))
)
const ConfiguracaoPerfilAcessoPage = lazyLoad(() =>
  import('./pages/ConfiguracaoPerfilAcesso').then(module => ({
    default: module.ConfiguracaoPerfilAcesso
  }))
)
const ConfiguracaoCadastroAtivosPage = lazyLoad(() =>
  import('./pages/ConfiguracaoCadastroAtivos').then(module => ({
    default: module.ConfiguracaoCadastroAtivos
  }))
)
const ConfiguracaoDadosPage = lazyLoad(() =>
  import('./pages/ConfiguracaoDados').then(module => ({
    default: module.ConfiguracaoDados
  }))
)
const NotasPage = lazyLoad(() =>
  import('./pages/Notas').then(module => ({ default: module.Notas }))
)
const TarefasPage = lazyLoad(() =>
  import('./pages/Tarefas').then(module => ({ default: module.Tarefas }))
)
const MaterialCadastroPage = lazyLoad(() =>
  import('./pages/MaterialCadastro').then(module => ({
    default: module.MaterialCadastro
  }))
)
const MaterialKanbanPage = lazyLoad(() =>
  import('./pages/MaterialKanban').then(module => ({
    default: module.MaterialKanban
  }))
)
const MaterialEstoquePage = lazyLoad(() =>
  import('./pages/MaterialEstoque').then(module => ({
    default: module.MaterialEstoque
  }))
)
const MaterialConsumoPage = lazyLoad(() =>
  import('./pages/MaterialConsumo').then(module => ({
    default: module.MaterialConsumo
  }))
)
const ProdutividadeDashboardPage = lazyLoad(() =>
  import('./pages/ProdutividadeDashboard').then(module => ({
    default: module.ProdutividadeDashboard
  }))
)
const ProdutividadeApontamentosPage = lazyLoad(() =>
  import('./pages/ProdutividadeApontamentos').then(module => ({
    default: module.ProdutividadeApontamentos
  }))
)
const ProdutividadeRotogramaPage = lazyLoad(() =>
  import('./pages/ProdutividadeRotograma').then(module => ({
    default: module.ProdutividadeRotograma
  }))
)
const AcoesTOPage = lazyLoad(() =>
  import('./pages/AcoesTO').then(module => ({ default: module.AcoesTO }))
)
const DataUploadPage = lazyLoad(() =>
  import('./pages/DataUpload').then(module => ({ default: module.DataUpload }))
)

export const router = createBrowserRouter([
  {
    path: '/',
    element: (
      <RedirectIfAuthenticated>
        <SuspenseLoader>
          <LoginPage />
        </SuspenseLoader>
      </RedirectIfAuthenticated>
    )
  },
  {
    path: '/app',
    element: (
      <RequireAuth>
        <MainLayout />
      </RequireAuth>
    ),
    children: [
      {
        index: true,
        element: (
          <SuspenseLoader>
            <HomePage />
          </SuspenseLoader>
        )
      },
      {
        path: 'planejamento',
        element: <Navigate to="planejamento/manutencao" replace />
      },
      {
        path: 'planejamento/manutencao',
        element: (
          <SuspenseLoader>
            <PlanejamentoPage />
          </SuspenseLoader>
        )
      },
      {
        path: 'planejamento/tarefas',
        element: (
          <SuspenseLoader>
            <PlanejamentoPage />
          </SuspenseLoader>
        )
      },
      {
        path: 'ativos',
        element: (
          <SuspenseLoader>
            <AtivosPage />
          </SuspenseLoader>
        )
      },
      {
        path: 'componentes',
        element: (
          <SuspenseLoader>
            <ComponentesPage />
          </SuspenseLoader>
        )
      },
      {
        path: 'notas',
        element: (
          <SuspenseLoader>
            <NotasPage />
          </SuspenseLoader>
        )
      },
      {
        path: 'gestao-ativos/tarefas',
        element: (
          <SuspenseLoader>
            <TarefasPage />
          </SuspenseLoader>
        )
      },
      {
        path: 'gestao-material',
        element: <Navigate to="gestao-material/cadastro" replace />
      },
      {
        path: 'gestao-material/cadastro',
        element: (
          <SuspenseLoader>
            <MaterialCadastroPage />
          </SuspenseLoader>
        )
      },
      {
        path: 'produtividade',
        element: <Navigate to="produtividade/dashboard" replace />
      },
      {
        path: 'dados/upload',
        element: (
          <SuspenseLoader>
            <DataUploadPage />
          </SuspenseLoader>
        )
      },
      {
        path: 'produtividade/dashboard',
        element: (
          <SuspenseLoader>
            <ProdutividadeDashboardPage />
          </SuspenseLoader>
        )
      },
      {
        path: 'produtividade/apontamentos',
        element: (
          <SuspenseLoader>
            <ProdutividadeApontamentosPage />
          </SuspenseLoader>
        )
      },
      {
        path: 'produtividade/rotograma',
        element: (
          <SuspenseLoader>
            <ProdutividadeRotogramaPage />
          </SuspenseLoader>
        )
      },
      {
        path: 'acoes',
        element: (
          <SuspenseLoader>
            <AcoesTOPage />
          </SuspenseLoader>
        )
      },
      {
        path: 'gestao-material/kanban',
        element: (
          <SuspenseLoader>
            <MaterialKanbanPage />
          </SuspenseLoader>
        )
      },
      {
        path: 'gestao-material/estoque',
        element: (
          <SuspenseLoader>
            <MaterialEstoquePage />
          </SuspenseLoader>
        )
      },
      {
        path: 'gestao-material/consumo',
        element: (
          <SuspenseLoader>
            <MaterialConsumoPage />
          </SuspenseLoader>
        )
      },
      {
        path: 'ordens-servico',
        element: (
          <SuspenseLoader>
            <OrdensServicoPage />
          </SuspenseLoader>
        )
      },
      {
        path: 'ordens-servico/scheduler',
        element: (
          <SuspenseLoader>
            <OrdensServicoSchedulerPage />
          </SuspenseLoader>
        )
      },
      {
        path: 'configuracao',
        element: (
          <SuspenseLoader>
            <ConfiguracaoPage />
          </SuspenseLoader>
        ),
        children: [
          { index: true, element: <Navigate to="ajustes" replace /> },
          {
            path: 'ajustes',
            element: (
              <SuspenseLoader>
                <ConfiguracaoAjustesPage />
              </SuspenseLoader>
            )
          },
          {
            path: 'perfil-acesso',
            element: (
              <SuspenseLoader>
                <ConfiguracaoPerfilAcessoPage />
              </SuspenseLoader>
            )
          },
          {
            path: 'cadastro-ativos',
            element: (
              <SuspenseLoader>
                <ConfiguracaoCadastroAtivosPage />
              </SuspenseLoader>
            )
          },
        {
          path: 'dados',
          element: (
            <SuspenseLoader>
              <ConfiguracaoDadosPage />
            </SuspenseLoader>
          )
        }
        ,
        {
          path: 'dados/upload',
          element: (
            <SuspenseLoader>
              <DataUploadPage />
            </SuspenseLoader>
          )
        }
      ]
    }
    ]
  },
  {
    path: '*',
    element: <Navigate to="/" replace />
  }
])
