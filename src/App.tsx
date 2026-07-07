import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { I18nProvider } from './i18n/I18nContext'
import { UserProvider } from './context/UserContext'
import { ThemeProvider } from './context/ThemeContext'
import { ProgramsProvider } from './context/ProgramsContext'
import { BlockHeightProvider } from './context/BlockHeightContext'
import { Layout } from './components/Layout'
import { CardSkeleton } from './components/LoadingSkeleton'
import { BlogPage } from './pages/BlogPage'
import { BlogPostPage } from './pages/BlogPostPage'
import { VerifyPage } from './pages/VerifyPage'
import { AgentsPage } from './pages/AgentsPage'
import { ApplyPage } from './pages/ApplyPage'
import { RegisterPage } from './pages/RegisterPage'
import { DashboardPage } from './pages/DashboardPage'
import { ProfilePage } from './pages/ProfilePage'
import { PortfolioPage } from './pages/PortfolioPage'
import { StackSimulatorPage } from './pages/StackSimulatorPage'
import { FinanceComparePage } from './pages/FinanceComparePage'
import { VaultPage } from './pages/VaultPage'
import { NotFoundPage } from './pages/NotFoundPage'
import { ErrorBoundary } from './components/ErrorBoundary'

const PitchPage = lazy(() => import('./pages/PitchPage').then((m) => ({ default: m.PitchPage })))
const ProgramsPage = lazy(() => import('./pages/ProgramsPage').then((m) => ({ default: m.ProgramsPage })))

export default function App() {
  return (
    <ErrorBoundary>
    <ThemeProvider>
    <ProgramsProvider>
    <BlockHeightProvider>
    <I18nProvider>
      <UserProvider>
        <BrowserRouter>
          <Routes>
            <Route element={<Layout />}>
              <Route
                index
                element={
                  <Suspense fallback={<div className="p-6 max-w-7xl mx-auto"><CardSkeleton count={1} /></div>}>
                    <PitchPage />
                  </Suspense>
                }
              />
              <Route path="portfolio" element={<PortfolioPage />} />
              <Route
                path="programs"
                element={
                  <Suspense fallback={<div className="p-6 max-w-7xl mx-auto"><CardSkeleton count={3} /></div>}>
                    <ProgramsPage />
                  </Suspense>
                }
              />
              <Route path="simulator" element={<StackSimulatorPage />} />
              <Route path="compare" element={<FinanceComparePage />} />
              <Route path="vault" element={<VaultPage />} />
              <Route path="blog" element={<BlogPage />} />
              <Route path="blog/:slug" element={<BlogPostPage />} />
              <Route path="verify" element={<VerifyPage />} />
              <Route path="agents" element={<AgentsPage />} />
              <Route path="apply" element={<ApplyPage />} />
              <Route path="register" element={<RegisterPage />} />
              <Route path="dashboard" element={<DashboardPage />} />
              <Route path="profile" element={<ProfilePage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </UserProvider>
    </I18nProvider>
    </BlockHeightProvider>
    </ProgramsProvider>
    </ThemeProvider>
    </ErrorBoundary>
  )
}