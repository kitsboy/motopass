import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { I18nProvider } from './i18n/I18nContext'
import { UserProvider } from './context/UserContext'
import { Layout } from './components/Layout'
import { PitchPage } from './pages/PitchPage'
import { ProgramsPage } from './pages/ProgramsPage'
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
import { ErrorBoundary } from './components/ErrorBoundary'

export default function App() {
  return (
    <ErrorBoundary>
    <I18nProvider>
      <UserProvider>
        <BrowserRouter>
          <Routes>
            <Route element={<Layout />}>
              <Route index element={<PitchPage />} />
              <Route path="portfolio" element={<PortfolioPage />} />
              <Route path="programs" element={<ProgramsPage />} />
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
            </Route>
          </Routes>
        </BrowserRouter>
      </UserProvider>
    </I18nProvider>
    </ErrorBoundary>
  )
}