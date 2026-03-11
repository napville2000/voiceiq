import { useEffect, useState } from 'react'
import { NavBar } from '../components/NavBar'
import { MetricTooltip } from '../components/MetricTooltip'
import { supabase } from '../lib/supabase'
import type { Analysis, UserProfile } from '../types'

interface MemberSummary {
  profile: UserProfile
  analyses: Analysis[]
  latest: Analysis | null
  avgClarity: number
  avgLeadership: number
  avgConciseness: number
  avgEffectiveness: number
  trend: 'up' | 'down' | 'flat' | 'new'
}

function TrendIndicator({ trend }: { trend: MemberSummary['trend'] }) {
  const map = {
    up: { icon: '↑', class: 'text-green-600 bg-green-50' },
    down: { icon: '↓', class: 'text-red-600 bg-red-50' },
    flat: { icon: '→', class: 'text-scp-gray-mid bg-scp-gray-warm' },
    new: { icon: '★', class: 'text-scp-blue bg-blue-50' },
  }
  const { icon, class: cls } = map[trend]
  return (
    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${cls}`}>{icon}</span>
  )
}

function avg(nums: number[]) {
  if (!nums.length) return 0
  return Math.round(nums.reduce((a, b) => a + b, 0) / nums.length)
}

function ScoreCell({ value, label, color }: { value: number; label: string; color: string }) {
  return (
    <div className="text-center">
      <div className={`text-lg font-bold ${color}`}>{value || '–'}</div>
      <div className="text-scp-gray-mid text-xs">{label}</div>
    </div>
  )
}

export function TeamPulsePage() {
  const [members, setMembers] = useState<MemberSummary[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      // Fetch all profiles (director RLS policy allows this)
      const { data: profiles } = await supabase
        .from('profiles')
        .select('*')
        .order('full_name')

      if (!profiles?.length) { setLoading(false); return }

      // Fetch all analyses with self_speaker_name set
      const { data: allAnalyses } = await supabase
        .from('analyses')
        .select('*')
        .not('self_speaker_name', 'is', null)
        .order('created_at', { ascending: false })

      const analyses = (allAnalyses ?? []) as Analysis[]

      const summaries: MemberSummary[] = (profiles as UserProfile[]).map(profile => {
        const mine = analyses
          .filter(a => a.user_id === profile.id)
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

        const selfScores = mine.map(a => {
          const s = a.scores.speakers.find(sp => sp.name === a.self_speaker_name)
          return s ?? null
        }).filter(Boolean)

        const avgC = avg(selfScores.map(s => s!.clarity_score))
        const avgL = avg(selfScores.map(s => s!.topic_leadership))
        const avgCon = avg(selfScores.map(s => s!.conciseness))
        const avgEff = avg(mine.map(a => a.scores.meeting_effectiveness))

        // Trend: compare latest vs previous clarity
        let trend: MemberSummary['trend'] = 'new'
        if (selfScores.length >= 2) {
          const diff = selfScores[0]!.clarity_score - selfScores[1]!.clarity_score
          trend = diff > 2 ? 'up' : diff < -2 ? 'down' : 'flat'
        } else if (selfScores.length === 1) {
          trend = 'new'
        }

        return {
          profile,
          analyses: mine,
          latest: mine[0] ?? null,
          avgClarity: avgC,
          avgLeadership: avgL,
          avgConciseness: avgCon,
          avgEffectiveness: avgEff,
          trend,
        }
      })

      setMembers(summaries)
      setLoading(false)
    }

    load()
  }, [])

  // Team averages (only members with data)
  const active = members.filter(m => m.analyses.length > 0)
  const teamAvgClarity = avg(active.map(m => m.avgClarity))
  const teamAvgLeadership = avg(active.map(m => m.avgLeadership))
  const teamAvgConciseness = avg(active.map(m => m.avgConciseness))
  const teamAvgEffectiveness = avg(active.map(m => m.avgEffectiveness))

  return (
    <div className="min-h-screen bg-scp-navy-tint">
      <NavBar />

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-6">

        {/* Header */}
        <div>
          <h1 className="section-title text-2xl">Team Pulse</h1>
          <p className="text-scp-gray text-sm">
            Aggregate communication scores across the BSA team. Individual coaching tips are private.
          </p>
        </div>

        {loading ? (
          <div className="text-center py-16">
            <div className="w-8 h-8 border-4 border-scp-green border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-scp-gray text-sm">Loading team data...</p>
          </div>
        ) : (
          <>
            {/* Team averages hero */}
            {active.length > 0 && (
              <div className="bg-scp-navy rounded-xl px-6 py-5">
                <p className="text-white/60 text-xs font-semibold uppercase tracking-wide mb-4">
                  Team Averages — {active.length} active member{active.length !== 1 ? 's' : ''}
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {[
                    { label: 'Clarity', value: teamAvgClarity, tooltip: 'clarity' as const },
                    { label: 'Topic Leadership', value: teamAvgLeadership, tooltip: 'topic_leadership' as const },
                    { label: 'Conciseness', value: teamAvgConciseness, tooltip: 'conciseness' as const },
                    { label: 'Effectiveness', value: teamAvgEffectiveness, tooltip: 'effectiveness' as const },
                  ].map(({ label, value, tooltip }) => (
                    <div key={label} className="text-center">
                      <div className="text-white font-bold text-3xl">{value || '–'}</div>
                      <div className="flex items-center justify-center gap-1 mt-1">
                        <span className="text-white/50 text-xs">{label}</span>
                        <span className="opacity-50"><MetricTooltip metricKey={tooltip} /></span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Member rows */}
            <div>
              <h2 className="text-scp-navy font-bold text-base mb-3 flex items-center gap-2">
                Team Members
                <span className="h-px flex-1 bg-scp-gray-cool" />
                <span className="text-scp-gray-mid text-xs font-normal">{members.length} total</span>
              </h2>

              <div className="space-y-3">
                {members.map(member => (
                  <div key={member.profile.id} className="card p-0 overflow-hidden">
                    <div className="px-5 py-4 flex items-center gap-4 flex-wrap">

                      {/* Avatar + name */}
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="w-10 h-10 rounded-full bg-scp-navy text-white flex items-center justify-center font-bold text-sm flex-shrink-0">
                          {member.profile.full_name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-scp-navy font-semibold text-sm truncate">{member.profile.full_name}</p>
                            <TrendIndicator trend={member.trend} />
                          </div>
                          <p className="text-scp-gray-mid text-xs">
                            {member.analyses.length === 0
                              ? 'No analyses yet'
                              : `${member.analyses.length} session${member.analyses.length !== 1 ? 's' : ''} · last ${member.latest ? new Date(member.latest.created_at).toLocaleDateString() : '–'}`
                            }
                          </p>
                        </div>
                      </div>

                      {/* Scores */}
                      {member.analyses.length > 0 ? (
                        <div className="flex gap-6">
                          <ScoreCell value={member.avgClarity} label="Clarity" color="text-scp-navy" />
                          <ScoreCell value={member.avgLeadership} label="Leadership" color="text-scp-navy" />
                          <ScoreCell value={member.avgConciseness} label="Conciseness" color="text-scp-navy" />
                          <ScoreCell value={member.avgEffectiveness} label="Effectiveness" color="text-scp-green-dark" />
                        </div>
                      ) : (
                        <p className="text-scp-gray-mid text-xs italic">Awaiting first analysis</p>
                      )}

                    </div>

                    {/* Score bars */}
                    {member.analyses.length > 0 && (
                      <div className="px-5 pb-3 grid grid-cols-3 gap-3">
                        {[
                          { value: member.avgClarity, color: 'bg-scp-green' },
                          { value: member.avgLeadership, color: 'bg-scp-cyan' },
                          { value: member.avgConciseness, color: 'bg-scp-blue' },
                        ].map(({ value, color }, i) => (
                          <div key={i} className="h-1 bg-scp-gray-warm rounded-full overflow-hidden">
                            <div className={`h-full rounded-full ${color}`} style={{ width: `${value}%` }} />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {active.length === 0 && (
              <div className="card text-center py-10">
                <p className="text-scp-navy font-semibold mb-1">No team data yet</p>
                <p className="text-scp-gray text-sm">Team members will appear here once they run their first analysis.</p>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}
