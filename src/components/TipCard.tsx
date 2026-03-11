import { useState } from 'react'
import type { SpeakerTip } from '../types'
import type { ExplainResponse } from '../types'

interface TipCardProps {
  tip: SpeakerTip
  speakerName: string
  meetingName: string
}

const PRIORITY_STYLES = {
  high: 'bg-red-50 text-red-700 border-red-200',
  medium: 'bg-amber-50 text-amber-700 border-amber-200',
}

const EFFORT_STYLES = {
  easy: 'bg-green-50 text-green-700 border-green-200',
  hard: 'bg-purple-50 text-purple-700 border-purple-200',
}

export function TipCard({ tip, speakerName, meetingName }: TipCardProps) {
  const [expanded, setExpanded] = useState(false)
  const [loading, setLoading] = useState(false)
  const [explanation, setExplanation] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleExplain() {
    // Already loaded — just toggle
    if (explanation) {
      setExpanded(v => !v)
      return
    }

    setExpanded(true)
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/.netlify/functions/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'explain',
          speaker: speakerName,
          tip,
          meeting_name: meetingName,
        }),
      })
      const data: ExplainResponse = await res.json()

      if (data.success && data.explanation) {
        setExplanation(data.explanation)
      } else {
        setError('Could not load explanation. Try again.')
      }
    } catch {
      setError('Network error. Try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="rounded-lg border border-scp-gray-warm overflow-hidden">
      {/* Main tip row */}
      <div className="bg-scp-navy-tint px-4 py-3 border-l-2 border-scp-green">
        <div className="flex items-start justify-between gap-3">
          <div className="flex gap-2.5 flex-1 min-w-0">
            <span className="text-scp-green-dark text-xs mt-0.5 flex-shrink-0">→</span>
            <p className="text-scp-gray text-sm leading-relaxed">{tip.summary}</p>
          </div>
          {/* Priority + Effort badges */}
          <div className="flex gap-1.5 flex-shrink-0 flex-wrap justify-end">
            <span className={`text-xs font-bold px-2 py-0.5 rounded border ${PRIORITY_STYLES[tip.priority]}`}>
              {tip.priority === 'high' ? '↑ High' : '→ Med'}
            </span>
            <span className={`text-xs font-bold px-2 py-0.5 rounded border ${EFFORT_STYLES[tip.effort]}`}>
              {tip.effort === 'easy' ? '⚡ Easy' : '🔧 Hard'}
            </span>
          </div>
        </div>

        {/* Before / After */}
        <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
          <div className="bg-white rounded px-3 py-2 border border-red-100">
            <p className="text-red-500 text-xs font-bold uppercase tracking-wide mb-1">Before</p>
            <p className="text-scp-gray text-xs leading-relaxed italic">"{tip.before}"</p>
          </div>
          <div className="bg-white rounded px-3 py-2 border border-green-100">
            <p className="text-green-600 text-xs font-bold uppercase tracking-wide mb-1">After</p>
            <p className="text-scp-gray text-xs leading-relaxed italic">"{tip.after}"</p>
          </div>
        </div>

        {/* Explain button */}
        <div className="mt-2 flex items-center gap-2">
          <p className="text-scp-gray-mid text-xs italic flex-1 truncate">{tip.observation}</p>
          <button
            onClick={handleExplain}
            className="text-scp-blue text-xs font-semibold hover:underline flex-shrink-0 transition-colors"
          >
            {expanded && explanation ? 'Hide ↑' : 'Explain →'}
          </button>
        </div>
      </div>

      {/* Expanded explanation */}
      {expanded && (
        <div className="bg-white px-4 py-4 border-t border-scp-gray-warm">
          {loading && (
            <div className="flex items-center gap-2 text-scp-gray-mid text-sm">
              <div className="w-4 h-4 border-2 border-scp-blue border-t-transparent rounded-full animate-spin" />
              Generating deeper explanation...
            </div>
          )}
          {error && (
            <p className="text-red-600 text-sm">{error}</p>
          )}
          {explanation && !loading && (
            <div className="space-y-2">
              <p className="text-scp-navy text-xs font-bold uppercase tracking-wide mb-2">Deep Dive</p>
              {explanation.split('\n\n').filter(Boolean).map((para, i) => (
                <p key={i} className="text-scp-gray text-sm leading-relaxed">{para}</p>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
