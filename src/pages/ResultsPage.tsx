import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { NavBar } from '../components/NavBar'
import { MetricTooltip } from '../components/MetricTooltip'
import { MethodologyDrawer } from '../components/MethodologyDrawer'
import { TipCard } from '../components/TipCard'
import { supabase } from '../lib/supabase'
import type { Analysis, SpeakerScore } from '../types'

const AVATAR_COLORS = ['bg-scp-navy', 'bg-scp-blue', 'bg-scp-cyan', 'bg-scp-green-dark']

function ScoreBar({ value, color }: { value: number; color: string }) {
  return (
    <div className="h-1.5 bg-scp-gray-warm rounded-full overflow-hidden mt-1.5">
      <div className={`h-full rounded-full transition-all duration-700 ${color}`} style={{ width: `${value}%` }} />
    </div>
  )
}

function QualityBadge({ quality }: { quality: 'strong' | 'partial' | 'weak' }) {
  const map = {
    strong: 'bg-green-100 text-green-800',
    partial: 'bg-orange-100 text-orange-800',
    weak: 'bg-red-100 text-red-800',
  }
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide ${map[quality]}`}>
      {quality}
    </span>
  )
}

function SpeakerCard({
  speaker,
  isSelf,
  avatarColor,
  meetingName,
}: {
  speaker: SpeakerScore
  isSelf: boolean
  avatarColor: string
  meetingName: string
}) {
  const pacingColor = {
    good: 'bg-green-100 text-green-800',
    slow: 'bg-blue-100 text-blue-800',
    fast: 'bg-orange-100 text-orange-800',
  }[speaker.pacing]

  return (
    <div className={`card overflow-hidden ${isSelf ? 'ring-2 ring-scp-green' : ''}`}>
      {/* Header */}
      <div className="bg-scp-navy-tint border-b border-scp-gray-warm px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-11 h-11 rounded-full ${avatarColor} text-white flex items-center justify-center font-bold text-lg flex-shrink-0`}>
            {speaker.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-scp-navy font-bold text-base">{speaker.name}</span>
              {isSelf && <span className="text-xs font-bold bg-scp-green text-scp-navy px-2 py-0.5 rounded-full">You</span>}
            </div>
            <span className="text-scp-gray-mid text-xs">{speaker.word_count} words spoken</span>
          </div>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${pacingColor}`}>
          {speaker.pacing.charAt(0).toUpperCase() + speaker.pacing.slice(1)} pacing
        </span>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-y sm:divide-y-0 divide-scp-gray-warm border-b border-scp-gray-warm">
        <div className="px-5 py-4">
          <div className="flex items-center text-scp-gray-mid text-xs font-semibold uppercase tracking-wide">
            Clarity <MetricTooltip metricKey="clarity" />
          </div>
          <div className="text-scp-navy font-bold text-2xl mt-1">{speaker.clarity_score}</div>
          <ScoreBar value={speaker.clarity_score} color="bg-scp-green" />
        </div>
        <div className="px-5 py-4">
          <div className="flex items-center text-scp-gray-mid text-xs font-semibold uppercase tracking-wide">
            Topic Leadership <MetricTooltip metricKey="topic_leadership" />
          </div>
          <div className="text-scp-navy font-bold text-2xl mt-1">{speaker.topic_leadership}</div>
          <ScoreBar value={speaker.topic_leadership} color="bg-scp-cyan" />
        </div>
        <div className="px-5 py-4">
          <div className="flex items-center text-scp-gray-mid text-xs font-semibold uppercase tracking-wide">
            Conciseness <MetricTooltip metricKey="conciseness" />
          </div>
          <div className="text-scp-navy font-bold text-2xl mt-1">{speaker.conciseness}</div>
          <ScoreBar value={speaker.conciseness} color="bg-scp-blue" />
        </div>
        <div className="px-5 py-4">
          <div className="flex items-center text-scp-gray-mid text-xs font-semibold uppercase tracking-wide">
            Share of Voice <MetricTooltip metricKey="share_of_voice" />
          </div>
          <div className="text-scp-navy font-bold text-2xl mt-1">{speaker.share_of_voice}%</div>
          <ScoreBar value={speaker.share_of_voice} color="bg-scp-green-dark" />
        </div>
      </div>

      {/* SOV bar */}
      <div className="px-6 py-3 border-b border-scp-gray-warm">
        <div className="flex justify-between text-xs text-scp-gray-mid mb-1.5">
          <span className="font-semibold uppercase tracking-wide">Share of Voice</span>
          <span className="font-bold text-scp-navy">{speaker.share_of_voice}% of meeting</span>
        </div>
        <div className="h-2.5 bg-scp-gray-warm rounded-full overflow-hidden">
          <div className={`h-full rounded-full ${avatarColor}`} style={{ width: `${speaker.share_of_voice}%`, opacity: 0.85 }} />
        </div>
      </div>

      {/* Tips */}
      <div className="px-6 py-4">
        <p className="text-scp-navy font-bold text-xs uppercase tracking-wide mb-3">
          💡 Coaching Tips for {speaker.name.split(' ')[0]}
        </p>
        <div className="space-y-2">
          {Array.isArray(speaker.tips) && speaker.tips.map((tip, i) => (
            typeof tip === 'string' ? (
              // Backwards compat: old string-format tips
              <div key={i} className="flex gap-2.5 bg-scp-navy-tint rounded-lg px-3 py-2.5 border-l-2 border-scp-green">
                <span className="text-scp-green-dark text-xs mt-0.5 flex-shrink-0">→</span>
                <p className="text-scp-gray text-sm leading-relaxed">{tip}</p>
              </div>
            ) : (
              <TipCard key={i} tip={tip} speakerName={speaker.name} meetingName={meetingName} />
            )
          ))}
        </div>
      </div>
    </div>
  )
}

export function ResultsPage() {
  const { id } = useParams<{ id: string }>()
  const [analysis, setAnalysis] = useState<Analysis | null>(null)
  const [loading, setLoading] = useState(true)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [activeSpeakerIdx, setActiveSpeakerIdx] = useState(0)

  useEffect(() => {
    if (!id) return
    supabase
      .from('analyses')
      .select('*')
      .eq('id', id)
      .single()
      .then(({ data }) => {
        if (data) setAnalysis(data as Analysis)
        setLoading(false)
      })
  }, [id])

  if (loading) {
    return (
      <div className="min-h-screen bg-scp-navy-tint flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-scp-green border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-scp-navy font-semibold">Loading results...</p>
        </div>
      </div>
    )
  }

  if (!analysis) {
    return (
      <div className="min-h-screen bg-scp-navy-tint">
        <NavBar />
        <main className="max-w-4xl mx-auto px-4 py-16 text-center">
          <p className="text-scp-navy font-bold text-lg mb-2">Analysis not found</p>
          <Link to="/analyze" className="btn-primary inline-block mt-4">New Analysis</Link>
        </main>
      </div>
    )
  }

  const scores = analysis.scores
  const selfName = analysis.self_speaker_name
  const isObserver = selfName === null

  const orderedSpeakers = selfName
    ? [...scores.speakers].sort((a, b) => a.name === selfName ? -1 : b.name === selfName ? 1 : 0)
    : scores.speakers

  const activeScore = orderedSpeakers[activeSpeakerIdx] ?? orderedSpeakers[0]

  const circumference = 220
  const offset = circumference - (circumference * scores.meeting_effectiveness) / 100

  return (
    <div className="min-h-screen bg-scp-navy-tint">
      <NavBar />
      <MethodologyDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-scp-navy font-bold text-2xl">{analysis.meeting_name}</h1>
            <p className="text-scp-gray-mid text-sm mt-1">
              {analysis.meeting_date}
              <span className="mx-2 text-scp-gray-cool">·</span>
              {scores.speakers.length} speakers
              <span className="mx-2 text-scp-gray-cool">·</span>
              {scores.topics.length} topics
              {isObserver && <><span className="mx-2 text-scp-gray-cool">·</span><span className="italic">Observer record</span></>}
            </p>
          </div>
          <button onClick={() => setDrawerOpen(true)} className="text-scp-blue text-sm font-semibold hover:underline flex-shrink-0">
            How is this scored? →
          </button>
        </div>

        {/* Effectiveness hero */}
        <div className="bg-scp-navy rounded-xl px-6 py-6 flex items-center gap-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-scp-green/5 rounded-full -translate-y-1/2 translate-x-1/4 pointer-events-none" />
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h2 className="text-white font-bold text-base">Meeting Effectiveness</h2>
              <button onClick={() => setDrawerOpen(true)} className="w-4 h-4 rounded-full bg-white/20 text-white text-xs font-bold flex items-center justify-center hover:bg-white/30 transition-colors">?</button>
            </div>
            <p className="text-white/60 text-sm leading-relaxed max-w-md">{scores.overall_summary}</p>
          </div>
          <div className="flex flex-col items-center flex-shrink-0">
            <div className="relative w-20 h-20">
              <svg width="80" height="80" viewBox="0 0 80 80" className="-rotate-90">
                <circle cx="40" cy="40" r="34" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="7" />
                <circle cx="40" cy="40" r="34" fill="none" stroke="#b5bd00" strokeWidth="7" strokeLinecap="round"
                  strokeDasharray={circumference} strokeDashoffset={offset} className="transition-all duration-1000" />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-white font-bold text-xl">{scores.meeting_effectiveness}</span>
              </div>
            </div>
            <span className="text-white/50 text-xs font-semibold uppercase tracking-wide mt-1">/ 100</span>
          </div>
        </div>

        {/* Action bar */}
        <div className="flex gap-3 flex-wrap">
          <Link to="/analyze" className="btn-ghost text-sm py-2 px-4">← New Analysis</Link>
          <Link to="/history" className="btn-ghost text-sm py-2 px-4">View History</Link>
        </div>

        {/* Speaker tabs + card */}
        <div>
          <h2 className="text-scp-navy font-bold text-base mb-3 flex items-center gap-2">
            Speaker Analysis <span className="h-px flex-1 bg-scp-gray-cool" />
          </h2>
          <div className="flex gap-2 mb-4 flex-wrap">
            {orderedSpeakers.map((s, i) => (
              <button
                key={s.name}
                onClick={() => setActiveSpeakerIdx(i)}
                className={`px-4 py-2 rounded-md border-2 text-sm font-semibold transition-all ${
                  activeSpeakerIdx === i
                    ? 'border-scp-navy bg-scp-navy text-white'
                    : 'border-scp-gray-cool bg-white text-scp-gray-mid hover:border-scp-blue hover:text-scp-blue'
                }`}
              >
                {s.name === selfName ? `${s.name} (You)` : s.name}
              </button>
            ))}
          </div>
          <SpeakerCard
            speaker={activeScore}
            isSelf={activeScore.name === selfName}
            avatarColor={AVATAR_COLORS[activeSpeakerIdx % AVATAR_COLORS.length]}
            meetingName={analysis.meeting_name}
          />
        </div>

        {/* Topic coverage */}
        <div>
          <h2 className="text-scp-navy font-bold text-base mb-3 flex items-center gap-2">
            Topic Coverage <span className="h-px flex-1 bg-scp-gray-cool" />
          </h2>
          <div className="card overflow-hidden p-0">
            {scores.topics.map((topic, i) => (
              <div key={i} className={`px-5 py-4 flex items-center gap-4 flex-wrap hover:bg-scp-navy-tint transition-colors ${i < scores.topics.length - 1 ? 'border-b border-scp-gray-warm' : ''}`}>
                <div className="flex-1 min-w-0">
                  <p className="text-scp-navy font-semibold text-sm truncate">{topic.topic}</p>
                  <p className="text-scp-gray-mid text-xs mt-0.5">Led by {topic.primary_speaker}</p>
                </div>
                <div className="flex gap-1.5 flex-wrap">
                  {topic.speakers_involved.map(name => (
                    <span key={name} className="text-xs px-2 py-0.5 bg-scp-navy-tint text-scp-navy rounded-full font-medium">{name}</span>
                  ))}
                </div>
                <QualityBadge quality={topic.coverage_quality} />
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
