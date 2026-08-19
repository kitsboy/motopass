import { lazy } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { I18nProvider } from './i18n/I18nContext'
import { PitchPage } from './pages/PitchPage'
import { UserProvider } from './context/UserContext'
import { ThemeProvider } from './context/ThemeContext'
import { ProgramsProvider } from './context/ProgramsContext'
import { BlockHeightProvider } from './context/BlockHeightContext'
import { BtcPriceProvider } from './context/BtcPriceContext'
import { BtcMapDensityProvider } from './context/BtcMapDensityContext'
import { BtcMapAuthProvider } from './context/BtcMapAuthContext'
import { Layout } from './components/Layout'
import { RouteSuspense } from './components/RouteSuspense'
import { ErrorBoundary } from './components/ErrorBoundary'
import { ToastProvider } from './components/ui/Toast'
import { FinanceComparePage } from './pages/FinanceComparePage'
import { VerifyPage } from './pages/VerifyPage'
import { ProgramsPage } from './pages/ProgramsPage'
import { VaultPage } from './pages/VaultPage'
import { DistressedPage } from './pages/DistressedPage'
import { AgentsPage } from './pages/AgentsPage'
import { ApplyPage } from './pages/ApplyPage'
import { StackSimulatorPage } from './pages/StackSimulatorPage'

const PortfolioPage = lazy(() => import('./pages/PortfolioPage').then(m => ({ default: m.PortfolioPage })))
const DashboardPage = lazy(() => import('./pages/DashboardPage').then(m => ({ default: m.DashboardPage })))
const RegisterPage = lazy(() => import('./pages/RegisterPage').then(m => ({ default: m.RegisterPage })))
const ProfilePage = lazy(() => import('./pages/ProfilePage').then(m => ({ default: m.ProfilePage })))
const BtcMapPage = lazy(() => import('./pages/BtcMapPage').then(m => ({ default: m.BtcMapPage })))
const BlogPage = lazy(() => import('./pages/BlogPage').then(m => ({ default: m.BlogPage })))
const BlogPostPage = lazy(() => import('./pages/BlogPostPage').then(m => ({ default: m.BlogPostPage })))
const NotFoundPage = lazy(() => import('./pages/NotFoundPage').then(m => ({ default: m.NotFoundPage })))

export default function App() {
  return (
    <ThemeProvider>
    <ProgramsProvider>
    <BlockHeightProvider>
    <BtcPriceProvider>
    <BtcMapDensityProvider>
    <BtcMapAuthProvider>
    <I18nProvider>
    <ToastProvider>
      <UserProvider>
        <BrowserRouter>
          <ErrorBoundary>
          <Routes>
            <Route element={<Layout />}>
              <Route index element={<RouteSuspense count={1}><PitchPage /></RouteSuspense>} />
              <Route path="portfolio" element={<RouteSuspense><PortfolioPage /></RouteSuspense>} />
              <Route path="programs" element={<ProgramsPage />} />
              <Route path="simulator" element={<StackSimulatorPage />} />
              <Route path="compare" element={<RouteSuspense><FinanceComparePage /></RouteSuspense>} />
              <Route path="btcmap" element={<RouteSuspense><BtcMapPage /></RouteSuspense>} />
              <Route path="vault" element={<VaultPage />} />
              <Route path="distressed" element={<DistressedPage />} />
              <Route path="blog" element={<RouteSuspense><BlogPage /></RouteSuspense>} />
              <Route path="blog/:slug" element={<RouteSuspense><BlogPostPage /></RouteSuspense>} />
              <Route path="verify" element={<VerifyPage />} />
              <Route path="agents" element={<AgentsPage />} />
              <Route path="apply" element={<ApplyPage />} />
              <Route path="register" element={<RouteSuspense><RegisterPage /></RouteSuspense>} />
              <Route path="dashboard" element={<RouteSuspense><DashboardPage /></RouteSuspense>} />
              <Route path="profile" element={<RouteSuspense><ProfilePage /></RouteSuspense>} />
              <Route path="*" element={<RouteSuspense><NotFoundPage /></RouteSuspense>} />
            </Route>
          </Routes>
          </ErrorBoundary>
        </BrowserRouter>
      </UserProvider>
    </ToastProvider>
    </I18nProvider>
    </BtcMapAuthProvider>
    </BtcMapDensityProvider>
    </BtcPriceProvider>
    </BlockHeightProvider>
    </ProgramsProvider>
    </ThemeProvider>
  )
}