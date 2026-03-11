import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { NavBar } from '../components/NavBar'
import { MetricTooltip } from '../components/MetricTooltip'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import type { Analysis } from '../types'

function TrendBar({ values, color }: { values: number[]; color: string }) {
  const max = Math.max(...values, 1)
  return (
    <div className="flex items-end gap-1 h-10">
      {values.map((v, i) => (
        <div
          key={i}
          className={`flex-1 rounded-t-sm transition-all duration-500 ${i === values.length - 1 ? color : 'bg-scp-gray-cool'}`}
          style={{ height: `${(v / max) * 100}%`, minHeight: 4 }}
        />
      ))}
    </div>
  )
}

export function HistoryPage() {
  const { user } = useAuth()
  const [analyses, setAnalyses] = useState<Analysis[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    supabase
      .from('analyses')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'complete')
      .order('created_at', { ascending: false })
      .limit(20)
      .then(({ data }) => {
        setAnalyses((data ?? []) as Analysis[])
        setLoading(false)
      })
  }, [user])

  // Only complete analyses with scores and self_speaker_name
  const personal = analyses.filter(a => a.self_speaker_name !== null && a.scores !== null)
  const observer = analyses.filter(a => a.self_speaker_name === null && a.scores !== null)

  const chronological = [...personal].reverse()

  function getTrend(key: 'clarity_score' | 'topic_leadership' | 'conciseness') {
    return chronological.map(a => {
      const self = a.scores?.speakers.find(s => s.name === a.self_speaker_name)
      return self?.[key] ?? 0
    }).slice(-5)
  }

  const clarityTrend = getTrend('clarity_score')
  const leadershipTrend = getTrend('topic_leadership')
  const concisenessTrend = getTrend('conciseness')

  const latest = personal[0]
  const selfLatest = latest?.scores?.speakers.find(s => s.name === latest.self_speaker_name)
  const prev = personal[1]
  const selfPrev = prev?.scores?.speakers.find(s => s.name === prev.self_speaker_name)

  function delta(key: 'clarity_score' | 'topic_leadership' | 'conciseness') {
    if (!selfLatest || !selfPrev) return null
    return selfLatest[key] - selfPrev[key]
  }

  return (
    <div className="min-h-screen bg-scp-navy-tint">
      <NavBar />
      <main className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        <div>
          <h1 className="section-title text-2xl">My History</h1>
          <p className="text-scp-gray text-sm">Your communication trends and past session records.</p>
        </div>

        {loading ? (
          <div className="text-center py-16">
            <div className="w-8 h-8 border-4 border-scp-green border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-scp-gray text-sm">Loading history...</p>
          </div>
        ) : personal.length === 0 ? (
          <div className="card text-center py-12">
            <p className="text-scp-navy font-semibold text-lg mb-2">No personal analyses yet</p>
            <p className="text-scp-gray text-sm mb-4">Run your first analysis to start tracking your communication growth.</p>
            <Link to="/analyze" className="btn-primary inline-block">Analyze a Meeting</Link>
          </div>
        ) : (
          <>
            {/* Trend cards */}
            <div>
              <h2 className="text-scp-navy font-bold text-base mb-3 flex items-center gap-2">
                Your Progress
                <span className="h-px flex-1 bg-scp-gray-cool" />
                <span className="text-scp-gray-mid text-xs font-normal">Last {Math.min(personal.length, 5)} sessions</span>
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  { label: 'Clarity', key: 'clarity_score' as const, trend: clarityTrend, color: 'bg-scp-green', tooltip: 'clarity' as const },
                  { label: 'Topic Leadership', key: 'topic_leadership' as const, trend: leadershipTrend, color: 'bg-scp-cyan', tooltip: 'topic_leadership' as const },
                  { label: 'Conciseness', key: 'conciseness' as const, trend: concisenessTrend, color: 'bg-scp-blue', tooltip: 'conciseness' as const },
                ].map(({ label, key, trend, color, tooltip }) => {
                  const d = delta(key)
                  const latestVal = trend[trend.length - 1]
                  const prevVal = trend[trend.length - 2]
                  return (
                    <div key={key} className="card">
                      <div className="flex items-center gap-1 text-scp-gray-mid text-xs font-semibold uppercase tracking-wide mb-3">
                        {label} <MetricTooltip metricKey={tooltip} />
                      </div>
                      {trend.length > 0 && <TrendBar values={trend} color={color} />}
                      <div className="flex items-end justify-between mt-2">
                        <div>
                          <span className="text-scp-navy font-bold text-2xl">{latestVal ?? '–'}</span>
                          {prevVal !== undefined && <span className="text-scp-gray-mid text-xs ml-1">was {prevVal}</span>}
                        </div>
                        {d !== null && (
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${d > 0 ? 'bg-green-100 text-green-800' : d < 0 ? 'bg-red-100 text-red-800' : 'bg-scp-gray-cool text-scp-gray'}`}>
                            {d > 0 ? `↑ +${d}` : d < 0 ? `↓ ${d}` : '→ 0'}
                          </span>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Personal session list */}
            <div>
              <h2 className="text-scp-navy font-bold text-base mb-3 flex items-center gap-2">
                Session Records <span className="h-px flex-1 bg-scp-gray-cool" />
              </h2>
              <div className="space-y-2">
                {personal.map(a => {
                  const selfScore = a.scores?.speakers.find(s => s.name === a.self_speaker_name)
                  return (
                    <Link key={a.id} to={`/results/${a.id}`}
                      className="card hover:shadow-card-hover transition-shadow flex items-center justify-between gap-4 p-4 group">
                      <div className="flex-1 min-w-0">
                        <p className="text-scp-navy font-semibold group-hover:text-scp-blue transition-colors truncate">{a.meeting_name}</p>
                        <p className="text-scp-gray-mid text-xs mt-0.5">{a.meeting_date}</p>
                      </div>
                      <div className="flex gap-3 flex-shrink-0">
                        {selfScore && (
                          <>
                            <div className="text-center hidden sm:block">
                              <div className="text-scp-navy font-bold text-sm">{selfScore.clarity_score}</div>
                              <div className="text-scp-gray-mid text-xs">Clarity</div>
                            </div>
                            <div className="text-center hidden sm:block">
                              <div className="text-scp-navy font-bold text-sm">{selfScore.topic_leadership}</div>
                              <div className="text-scp-gray-mid text-xs">Leadership</div>
                            </div>
                          </>
                        )}
                        <div className="text-center">
                          <div className="badge-green">{a.scores?.meeting_effectiveness ?? '–'}</div>
                          <div className="text-scp-gray-mid text-xs mt-0.5">Score</div>
                        </div>
                      </div>
                      <span className="text-scp-gray-cool group-hover:text-scp-blue transition-colors">→</span>
                    </Link>
                  )
                })}
              </div>
            </div>

            {/* Observer records */}
            {observer.length > 0 && (
              <div>
                <h2 className="text-scp-navy font-bold text-base mb-3 flex items-center gap-2">
                  Observer Records
                  <span className="h-px flex-1 bg-scp-gray-cool" />
                  <span className="text-scp-gray-mid text-xs font-normal">Not included in your trends</span>
                </h2>
                <div className="space-y-2">
                  {observer.map(a => (
                    <Link key={a.id} to={`/results/${a.id}`}
                      className="card hover:shadow-card-hover transition-shadow flex items-center justify-between gap-4 p-4 group opacity-75">
                      <div className="flex-1 min-w-0">
                        <p className="text-scp-navy font-semibold group-hover:text-scp-blue transition-colors truncate">{a.meeting_name}</p>
                        <p className="text-scp-gray-mid text-xs mt-0.5">{a.meeting_date} · Observer</p>
                      </div>
                      <div className="badge-gray">{a.scores?.meeting_effectiveness ?? '–'} eff.</div>
                      <span className="text-scp-gray-cool group-hover:text-scp-blue transition-colors">→</span>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}
