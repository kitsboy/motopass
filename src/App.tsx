import { lazy } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { I18nProvider } from './i18n/I18nContext'
import { UserProvider } from './context/UserContext'
import { ThemeProvider } from './context/ThemeContext'
import { ProgramsProvider } from './context/ProgramsContext'
import { BlockHeightProvider } from './context/BlockHeightContext'
import { BtcMapDensityProvider } from './context/BtcMapDensityContext'
import { BtcMapAuthProvider } from './context/BtcMapAuthContext'
import { Layout } from './components/Layout'
import { RouteSuspense } from './components/RouteSuspense'
import { ErrorBoundary } from './components/ErrorBoundary'

const PitchPage = lazy(() => import('./pages/PitchPage').then(m => ({ default: m.PitchPage })))
const ProgramsPage = lazy(() => import('./pages/ProgramsPage').then(m => ({ default: m.ProgramsPage })))
const PortfolioPage = lazy(() => import('./pages/PortfolioPage').then(m => ({ default: m.PortfolioPage })))
const StackSimulatorPage = lazy(() => import('./pages/StackSimulatorPage').then(m => ({ default: m.StackSimulatorPage })))
const FinanceComparePage = lazy(() => import('./pages/FinanceComparePage').then(m => ({ default: m.FinanceComparePage })))
const DashboardPage = lazy(() => import('./pages/DashboardPage').then(m => ({ default: m.DashboardPage })))
const RegisterPage = lazy(() => import('./pages/RegisterPage').then(m => ({ default: m.RegisterPage })))
const ProfilePage = lazy(() => import('./pages/ProfilePage').then(m => ({ default: m.ProfilePage })))
const ApplyPage = lazy(() => import('./pages/ApplyPage').then(m => ({ default: m.ApplyPage })))
const BtcMapPage = lazy(() => import('./pages/BtcMapPage').then(m => ({ default: m.BtcMapPage })))
const VaultPage = lazy(() => import('./pages/VaultPage').then(m => ({ default: m.VaultPage })))
const VerifyPage = lazy(() => import('./pages/VerifyPage').then(m => ({ default: m.VerifyPage })))
const AgentsPage = lazy(() => import('./pages/AgentsPage').then(m => ({ default: m.AgentsPage })))
const BlogPage = lazy(() => import('./pages/BlogPage').then(m => ({ default: m.BlogPage })))
const BlogPostPage = lazy(() => import('./pages/BlogPostPage').then(m => ({ default: m.BlogPostPage })))
const NotFoundPage = lazy(() => import('./pages/NotFoundPage').then(m => ({ default: m.NotFoundPage })))

export default function App() {
  return (
    <ErrorBoundary>
    <ThemeProvider>
    <ProgramsProvider>
    <BlockHeightProvider>
    <BtcMapDensityProvider>
    <BtcMapAuthProvider>
    <I18nProvider>
      <UserProvider>
        <BrowserRouter>
          <Routes>
            <Route element={<Layout />}>
              <Route index element={<RouteSuspense count={1}><PitchPage /></RouteSuspense>} />
              <Route path="portfolio" element={<RouteSuspense><PortfolioPage /></RouteSuspense>} />
              <Route path="programs" element={<RouteSuspense count={3}><ProgramsPage /></RouteSuspense>} />
              <Route path="simulator" element={<RouteSuspense><StackSimulatorPage /></RouteSuspense>} />
              <Route path="compare" element={<RouteSuspense><FinanceComparePage /></RouteSuspense>} />
              <Route path="btcmap" element={<RouteSuspense><BtcMapPage /></RouteSuspense>} />
              <Route path="vault" element={<RouteSuspense><VaultPage /></RouteSuspense>} />
              <Route path="blog" element={<RouteSuspense><BlogPage /></RouteSuspense>} />
              <Route path="blog/:slug" element={<RouteSuspense><BlogPostPage /></RouteSuspense>} />
              <Route path="verify" element={<RouteSuspense><VerifyPage /></RouteSuspense>} />
              <Route path="agents" element={<RouteSuspense><AgentsPage /></RouteSuspense>} />
              <Route path="apply" element={<RouteSuspense><ApplyPage /></RouteSuspense>} />
              <Route path="register" element={<RouteSuspense><RegisterPage /></RouteSuspense>} />
              <Route path="dashboard" element={<RouteSuspense><DashboardPage /></RouteSuspense>} />
              <Route path="profile" element={<RouteSuspense><ProfilePage /></RouteSuspense>} />
              <Route path="*" element={<RouteSuspense><NotFoundPage /></RouteSuspense>} />
            </Route>
          </Routes>
        </BrowserRouter>
      </UserProvider>
    </I18nProvider>
    </BtcMapAuthProvider>
    </BtcMapDensityProvider>
    </BlockHeightProvider>
    </ProgramsProvider>
    </ThemeProvider>
    </ErrorBoundary>
  )
}