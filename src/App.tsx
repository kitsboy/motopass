import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { I18nProvider } from './i18n/I18nContext'
import { Layout } from './components/Layout'
import { PitchPage } from './pages/PitchPage'
import { ProgramsPage } from './pages/ProgramsPage'
import { BlogPage } from './pages/BlogPage'
import { BlogPostPage } from './pages/BlogPostPage'
import { VerifyPage } from './pages/VerifyPage'
import { AgentsPage } from './pages/AgentsPage'
import { ApplyPage } from './pages/ApplyPage'

export default function App() {
  return (
    <I18nProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<PitchPage />} />
            <Route path="programs" element={<ProgramsPage />} />
            <Route path="blog" element={<BlogPage />} />
            <Route path="blog/:slug" element={<BlogPostPage />} />
            <Route path="verify" element={<VerifyPage />} />
            <Route path="agents" element={<AgentsPage />} />
            <Route path="apply" element={<ApplyPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </I18nProvider>
  )
}