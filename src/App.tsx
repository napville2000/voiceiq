import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { useEffect } from 'react'
import { AuthProvider } from './hooks/useAuth'
import { ProtectedRoute } from './components/ProtectedRoute'
import { DirectorRoute } from './components/DirectorRoute'
import { LoginPage } from './pages/LoginPage'
import { SetupPage } from './pages/SetupPage'
import { DashboardPage } from './pages/DashboardPage'
import { AnalyzePage } from './pages/AnalyzePage'
import { ResultsPage } from './pages/ResultsPage'
import { HistoryPage } from './pages/HistoryPage'
import { TeamPulsePage } from './pages/TeamPulsePage'
import { supabase } from './lib/supabase'

function AuthCallback() {
  const navigate = useNavigate()
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate('/dashboard', { replace: true })
      } else {
        setTimeout(() => {
          supabase.auth.getSession().then(({ data: { session } }) => {
            navigate(session ? '/dashboard' : '/login', { replace: true })
          })
        }, 1000)
      }
    })
  }, [navigate])

  return (
    <div className="min-h-screen bg-scp-navy flex items-center justify-center">
      <div className="text-center">
        <div className="w-10 h-10 border-4 border-scp-green border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-white font-semibold">Signing you in...</p>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          {/* Setup is a protected route but bypasses the name check */}
          <Route path="/setup" element={<SetupPage />} />
          <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
          <Route path="/analyze" element={<ProtectedRoute><AnalyzePage /></ProtectedRoute>} />
          <Route path="/results/:id" element={<ProtectedRoute><ResultsPage /></ProtectedRoute>} />
          <Route path="/history" element={<ProtectedRoute><HistoryPage /></ProtectedRoute>} />
          <Route path="/team" element={<DirectorRoute><TeamPulsePage /></DirectorRoute>} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
