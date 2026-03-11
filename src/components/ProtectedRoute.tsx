import { Navigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

// Detects whether a name looks like an auto-generated email prefix
// e.g. "sarah.m", "zachary_roberts", "jsmith" — no spaces, has dots/underscores, or all lowercase single word
function nameNeedsSetup(fullName: string): boolean {
  if (!fullName) return true
  const trimmed = fullName.trim()
  // Has a space = likely a real name ("Zach Roberts")
  if (trimmed.includes(' ')) return false
  // Contains dot or underscore = email prefix pattern
  if (trimmed.includes('.') || trimmed.includes('_')) return true
  // All lowercase single word with no space = probably email prefix
  if (trimmed === trimmed.toLowerCase()) return true
  return false
}

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { session, profile, loading } = useAuth()

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

  if (!session) return <Navigate to="/login" replace />

  // Profile loaded and name looks like an email prefix → first-time setup
  if (profile && nameNeedsSetup(profile.full_name)) {
    return <Navigate to="/setup" replace />
  }

  return <>{children}</>
}
