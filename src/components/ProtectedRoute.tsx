import { Navigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-scp-navy-tint flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-scp-green border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-scp-navy font-semibold">Loading VoiceIQ...</p>
        </div>
      </div>
    )
  }

  if (!session) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}
