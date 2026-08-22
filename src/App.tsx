import { lazy } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { I18nProvider } from './i18n/I18nContext'
import { PitchPage } from './pages/PitchPage'
import { UserProvider } from './context/UserContext'
import { ThemeProvider } from './context/ThemeContext'
import { ProgramsProvider } from './context/ProgramsContext'
import { BlockHeightProvider } from './context/BlockHeightContext'
import { BtcPriceProvider } from './context/BtcPriceContext'
import { DisplayCurrencyProvider } from './context/DisplayCurrencyContext'
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
import { PortfolioPage } from './pages/PortfolioPage'
import { BtcMapPage } from './pages/BtcMapPage'
import { BlogPage } from './pages/BlogPage'
import { BlogPostPage } from './pages/BlogPostPage'

const DashboardPage = lazy(() => import('./pages/DashboardPage').then(m => ({ default: m.DashboardPage })))
const RegisterPage = lazy(() => import('./pages/RegisterPage').then(m => ({ default: m.RegisterPage })))
const ProfilePage = lazy(() => import('./pages/ProfilePage').then(m => ({ default: m.ProfilePage })))
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
    <DisplayCurrencyProvider>
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
    </DisplayCurrencyProvider>
    </I18nProvider>
    </BtcMapAuthProvider>
    </BtcMapDensityProvider>
    </BtcPriceProvider>
    </BlockHeightProvider>
    </ProgramsProvider>
    </ThemeProvider>
  )
}