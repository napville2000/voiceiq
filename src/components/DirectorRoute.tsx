import { Navigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export function DirectorRoute({ children }: { children: React.ReactNode }) {
  const { session, profile, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-scp-navy-tint flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-scp-green border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-scp-navy font-semibold">Loading...</p>
        </div>
      </div>
    )
  }

  if (!session) return <Navigate to="/login" replace />
  if (profile && profile.role !== 'director') return <Navigate to="/dashboard" replace />

  return <>{children}</>
}
