import { lazy } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { I18nProvider } from './i18n/I18nContext'
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

const DashboardPage = lazy(() =>
  import('./pages/DashboardPage').then((m) => ({ default: m.DashboardPage })),
)
const TrustPage = lazy(() =>
  import('./pages/TrustPage').then((m) => ({ default: m.TrustPage })),
)
const RegisterPage = lazy(() =>
  import('./pages/RegisterPage').then((m) => ({ default: m.RegisterPage })),
)
const ProfilePage = lazy(() =>
  import('./pages/ProfilePage').then((m) => ({ default: m.ProfilePage })),
)
const NotFoundPage = lazy(() =>
  import('./pages/NotFoundPage').then((m) => ({ default: m.NotFoundPage })),
)
// Code-split the remaining static routes (batch adv10B perf): shrinks the
// critical-path index chunk so /trust (and every route) mounts faster.
// These were already lazy-prefetched by prefetchRoutes.ts — App was the only
// thing keeping them in the main bundle.
const PitchPage = lazy(() => import('./pages/PitchPage').then((m) => ({ default: m.PitchPage })))
const FinanceComparePage = lazy(() =>
  import('./pages/FinanceComparePage').then((m) => ({ default: m.FinanceComparePage })),
)
const ProgramsPage = lazy(() =>
  import('./pages/ProgramsPage').then((m) => ({ default: m.ProgramsPage })),
)
const VaultPage = lazy(() => import('./pages/VaultPage').then((m) => ({ default: m.VaultPage })))
const DistressedPage = lazy(() =>
  import('./pages/DistressedPage').then((m) => ({ default: m.DistressedPage })),
)
const AgentsPage = lazy(() =>
  import('./pages/AgentsPage').then((m) => ({ default: m.AgentsPage })),
)
const ApplyPage = lazy(() => import('./pages/ApplyPage').then((m) => ({ default: m.ApplyPage })))
const StackSimulatorPage = lazy(() =>
  import('./pages/StackSimulatorPage').then((m) => ({ default: m.StackSimulatorPage })),
)
const PortfolioPage = lazy(() =>
  import('./pages/PortfolioPage').then((m) => ({ default: m.PortfolioPage })),
)
const BtcMapPage = lazy(() => import('./pages/BtcMapPage').then((m) => ({ default: m.BtcMapPage })))
const BlogPage = lazy(() => import('./pages/BlogPage').then((m) => ({ default: m.BlogPage })))
const BlogPostPage = lazy(() =>
  import('./pages/BlogPostPage').then((m) => ({ default: m.BlogPostPage })),
)
const VerifyPage = lazy(() =>
  import('./pages/VerifyPage').then((m) => ({ default: m.VerifyPage })),
)

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
                                <Route
                                  index
                                  element={
                                    <RouteSuspense count={1}>
                                      <PitchPage />
                                    </RouteSuspense>
                                  }
                                />
                                <Route
                                  path="portfolio"
                                  element={
                                    <RouteSuspense>
                                      <PortfolioPage />
                                    </RouteSuspense>
                                  }
                                />
                                <Route path="programs" element={<ProgramsPage />} />
                                <Route path="simulator" element={<StackSimulatorPage />} />
                                <Route
                                  path="compare"
                                  element={
                                    <RouteSuspense>
                                      <FinanceComparePage />
                                    </RouteSuspense>
                                  }
                                />
                                <Route
                                  path="btcmap"
                                  element={
                                    <RouteSuspense>
                                      <BtcMapPage />
                                    </RouteSuspense>
                                  }
                                />
                                <Route
                                  path="trust"
                                  element={
                                    <RouteSuspense>
                                      <TrustPage />
                                    </RouteSuspense>
                                  }
                                />
                                <Route path="vault" element={<VaultPage />} />
                                <Route path="distressed" element={<DistressedPage />} />
                                <Route
                                  path="blog"
                                  element={
                                    <RouteSuspense>
                                      <BlogPage />
                                    </RouteSuspense>
                                  }
                                />
                                <Route
                                  path="blog/:slug"
                                  element={
                                    <RouteSuspense>
                                      <BlogPostPage />
                                    </RouteSuspense>
                                  }
                                />
                                <Route path="verify" element={<VerifyPage />} />
                                <Route path="agents" element={<AgentsPage />} />
                                <Route path="apply" element={<ApplyPage />} />
                                <Route
                                  path="register"
                                  element={
                                    <RouteSuspense>
                                      <RegisterPage />
                                    </RouteSuspense>
                                  }
                                />
                                <Route
                                  path="dashboard"
                                  element={
                                    <RouteSuspense>
                                      <DashboardPage />
                                    </RouteSuspense>
                                  }
                                />
                                <Route
                                  path="profile"
                                  element={
                                    <RouteSuspense>
                                      <ProfilePage />
                                    </RouteSuspense>
                                  }
                                />
                                <Route
                                  path="*"
                                  element={
                                    <RouteSuspense>
                                      <NotFoundPage />
                                    </RouteSuspense>
                                  }
                                />
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
