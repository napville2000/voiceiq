import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { NavBar } from '../components/NavBar'

export function DashboardPage() {
  const { profile } = useAuth()
  const firstName = profile?.full_name?.split(' ')[0] ?? 'there'

  return (
    <div className="min-h-screen bg-scp-navy-tint">
      <NavBar />

      <main className="max-w-6xl mx-auto px-4 py-8">

        {/* Welcome header */}
        <div className="mb-8">
          <h1 className="text-scp-navy font-bold text-2xl">
            Good to see you, {firstName}.
          </h1>
          <p className="text-scp-gray mt-1">
            Your communication intelligence hub — ready when you are.
          </p>
        </div>

        {/* Quick actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Link to="/analyze" className="card hover:shadow-card-hover transition-shadow group">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-lg bg-scp-green flex items-center justify-center flex-shrink-0 group-hover:bg-scp-green-dark transition-colors">
                <span className="text-scp-navy text-xl font-bold">+</span>
              </div>
              <div>
                <h3 className="text-scp-navy font-bold">Analyze Meeting</h3>
                <p className="text-scp-gray text-sm mt-1">Paste a transcript to get instant communication insights.</p>
              </div>
            </div>
          </Link>

          <Link to="/history" className="card hover:shadow-card-hover transition-shadow group">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-lg bg-scp-blue flex items-center justify-center flex-shrink-0">
                <span className="text-white text-lg">📋</span>
              </div>
              <div>
                <h3 className="text-scp-navy font-bold">My History</h3>
                <p className="text-scp-gray text-sm mt-1">Review past analyses and track your improvement over time.</p>
              </div>
            </div>
          </Link>

          {profile?.role === 'director' && (
            <Link to="/team" className="card hover:shadow-card-hover transition-shadow group">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-lg bg-scp-cyan flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-lg">📊</span>
                </div>
                <div>
                  <h3 className="text-scp-navy font-bold">Team Pulse</h3>
                  <p className="text-scp-gray text-sm mt-1">Monitor BSA team communication trends and growth.</p>
                </div>
              </div>
            </Link>
          )}
        </div>

        {/* How it works */}
        <div className="card-tint">
          <h3 className="text-scp-navy font-bold text-sm mb-3">How VoiceIQ Works</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm text-scp-gray">
            <div className="flex gap-3">
              <span className="text-scp-green font-bold text-base flex-shrink-0">1.</span>
              <p>Paste a meeting transcript from Teams, Zoom, or Otter into the Analyze page.</p>
            </div>
            <div className="flex gap-3">
              <span className="text-scp-green font-bold text-base flex-shrink-0">2.</span>
              <p>Claude analyzes speaker clarity, topic leadership, conciseness, and pacing.</p>
            </div>
            <div className="flex gap-3">
              <span className="text-scp-green font-bold text-base flex-shrink-0">3.</span>
              <p>Your personal scores are saved to History so you can track improvement over time.</p>
            </div>
          </div>
        </div>

      </main>
    </div>
  )
}
