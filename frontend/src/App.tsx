import { Routes, Route } from 'react-router-dom'
import { AuthProvider } from './hooks/useAuth'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'

import HomePage            from './pages/HomePage'
import LoginPage           from './pages/LoginPage'
import HelpPage            from './pages/HelpPage'
import WorkflowPage        from './pages/WorkflowPage'
import PublicResultsPage   from './pages/PublicResultsPage'
import AudienceVotePage    from './pages/AudienceVotePage'
import AdminUsersPage      from './pages/admin/AdminUsersPage'
import AdminEvalsPage      from './pages/admin/AdminEvalsPage'
import AdminEvalFormPage   from './pages/admin/AdminEvalFormPage'
import AdminAssignmentsPage from './pages/admin/AdminAssignmentsPage'
import JuryDashboardPage   from './pages/jury/JuryDashboardPage'
import JuryEvalPage        from './pages/jury/JuryEvalPage'

export default function App() {
  return (
    <AuthProvider>
      <Layout>
        <Routes>
          {/* Public */}
          <Route path="/"            element={<HomePage />} />
          <Route path="/login"       element={<LoginPage />} />
          <Route path="/hilfe"            element={<HelpPage />} />
          <Route path="/hilfe/infografik" element={<WorkflowPage />} />
          <Route path="/results/:id"      element={<PublicResultsPage />} />
          <Route path="/audience/:id"     element={<AudienceVotePage />} />

          {/* Admin */}
          <Route path="/admin/users" element={
            <ProtectedRoute role="admin"><AdminUsersPage /></ProtectedRoute>
          } />
          <Route path="/admin/evaluations" element={
            <ProtectedRoute role="admin"><AdminEvalsPage /></ProtectedRoute>
          } />
          <Route path="/admin/evaluations/new" element={
            <ProtectedRoute role="admin"><AdminEvalFormPage /></ProtectedRoute>
          } />
          <Route path="/admin/evaluations/:id/edit" element={
            <ProtectedRoute role="admin"><AdminEvalFormPage /></ProtectedRoute>
          } />
          <Route path="/admin/evaluations/:id/assignments" element={
            <ProtectedRoute role="admin"><AdminAssignmentsPage /></ProtectedRoute>
          } />

          {/* Jury */}
          <Route path="/jury" element={
            <ProtectedRoute role="jury"><JuryDashboardPage /></ProtectedRoute>
          } />
          <Route path="/jury/evaluations/:id" element={
            <ProtectedRoute role="jury"><JuryEvalPage /></ProtectedRoute>
          } />

          {/* 404 */}
          <Route path="*" element={
            <div className="text-center py-20 text-gray-400">
              <div className="text-6xl mb-4">404</div>
              <p>Seite nicht gefunden.</p>
            </div>
          } />
        </Routes>
      </Layout>
    </AuthProvider>
  )
}
