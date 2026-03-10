import { useEffect, useState } from 'react'
import { NavBar } from '../components/NavBar'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import type { Analysis } from '../types'

export function HistoryPage() {
  const { user } = useAuth()
  const [analyses, setAnalyses] = useState<Analysis[]>([])
  const [loading, setLoading] = useState(true)
  const [dbStatus, setDbStatus] = useState<'checking' | 'connected' | 'error'>('checking')

  useEffect(() => {
    async function loadHistory() {
      if (!user) return
      setLoading(true)
      const { data, error } = await supabase
        .from('analyses')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20)

      if (error) {
        // Table may not exist yet in scaffold — that's expected
        console.warn('[VoiceIQ] analyses table not ready:', error.message)
        setDbStatus('error')
      } else {
        setAnalyses(data ?? [])
        setDbStatus('connected')
      }
      setLoading(false)
    }
    loadHistory()
  }, [user])

  return (
    <div className="min-h-screen bg-scp-navy-tint">
      <NavBar />

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="section-title text-2xl">My History</h1>
          <p className="text-scp-gray text-sm">Your past meeting analyses and communication trends.</p>
        </div>

        {/* DB Status banner — scaffold testing helper */}
        <div className={`rounded-lg px-4 py-3 mb-6 flex items-center gap-3 text-sm ${
          dbStatus === 'connected' ? 'bg-green-50 border border-green-200 text-green-800' :
          dbStatus === 'error' ? 'bg-amber-50 border border-amber-200 text-amber-800' :
          'bg-scp-navy-tint border border-scp-gray-cool text-scp-gray'
        }`}>
          <span>{dbStatus === 'connected' ? '✓' : dbStatus === 'error' ? '⚠' : '⟳'}</span>
          <span>
            {dbStatus === 'connected' && 'Supabase connected — analyses table ready.'}
            {dbStatus === 'error' && 'Analyses table not yet created. Run the SQL migration in Supabase to enable history.'}
            {dbStatus === 'checking' && 'Checking database connection...'}
          </span>
        </div>

        {loading ? (
          <div className="text-center py-16">
            <div className="w-8 h-8 border-4 border-scp-green border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-scp-gray text-sm">Loading history...</p>
          </div>
        ) : analyses.length === 0 ? (
          <div className="card text-center py-12">
            <p className="text-scp-navy font-semibold text-lg mb-2">No analyses yet</p>
            <p className="text-scp-gray text-sm mb-4">
              Run your first meeting analysis to start building your communication history.
            </p>
            <a href="/analyze" className="btn-primary inline-block">Analyze a Meeting</a>
          </div>
        ) : (
          <div className="space-y-3">
            {analyses.map(a => (
              <div key={a.id} className="card hover:shadow-card-hover transition-shadow cursor-pointer">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-scp-navy font-semibold">{a.meeting_name}</h3>
                    <p className="text-scp-gray text-sm mt-0.5">{a.meeting_date}</p>
                  </div>
                  <div className="text-right">
                    <span className="badge-green">
                      {a.scores?.meeting_effectiveness ?? '–'}%
                    </span>
                    <p className="text-xs text-scp-gray-mid mt-1">effectiveness</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
