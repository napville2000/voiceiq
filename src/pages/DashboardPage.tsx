import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { NavBar } from '../components/NavBar'
import { supabase } from '../lib/supabase'
import type { Analysis } from '../types'

export function DashboardPage() {
  const { profile, user } = useAuth()
  const navigate = useNavigate()
  const firstName = profile?.full_name?.split(' ')[0] ?? 'there'
  const [processingJob, setProcessingJob] = useState<Analysis | null>(null)
  const [checking, setChecking] = useState(true)

  // Check for any in-progress or recently failed jobs on mount
  useEffect(() => {
    if (!user) return
    supabase
      .from('analyses')
      .select('*')
      .eq('user_id', user.id)
      .in('status', ['processing', 'failed'])
      .order('created_at', { ascending: false })
      .limit(1)
      .then(({ data }) => {
        if (data?.[0]) setProcessingJob(data[0] as Analysis)
        setChecking(false)
      })
  }, [user])

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

        {/* In-progress / failed job banner */}
        {!checking && processingJob && (
          <div className={`rounded-lg px-5 py-4 mb-6 flex items-center justify-between gap-4 flex-wrap ${
            processingJob.status === 'processing'
              ? 'bg-blue-50 border border-blue-200'
              : 'bg-red-50 border border-red-200'
          }`}>
            <div className="flex items-center gap-3">
              {processingJob.status === 'processing' ? (
                <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin flex-shrink-0" />
              ) : (
                <span className="text-red-500 text-lg flex-shrink-0">!</span>
              )}
              <div>
                <p className={`font-semibold text-sm ${processingJob.status === 'processing' ? 'text-blue-800' : 'text-red-800'}`}>
                  {processingJob.status === 'processing'
                    ? `Analysis in progress: "${processingJob.meeting_name}"`
                    : `Analysis failed: "${processingJob.meeting_name}"`}
                </p>
                <p className={`text-xs mt-0.5 ${processingJob.status === 'processing' ? 'text-blue-600' : 'text-red-600'}`}>
                  {processingJob.status === 'processing'
                    ? 'Claude is still working on this. Results will appear in your history when complete.'
                    : processingJob.error_message ?? 'Something went wrong during analysis.'}
                </p>
              </div>
            </div>
            {processingJob.status === 'processing' ? (
              <Link
                to="/analyze"
                className="text-blue-700 text-sm font-semibold hover:underline flex-shrink-0"
              >
                View progress →
              </Link>
            ) : (
              <button
                onClick={() => navigate('/analyze')}
                className="text-red-700 text-sm font-semibold hover:underline flex-shrink-0"
              >
                Retry →
              </button>
            )}
          </div>
        )}

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
