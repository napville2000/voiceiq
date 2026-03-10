import { useState } from 'react'

interface MetricTooltipProps {
  metricKey: 'clarity' | 'topic_leadership' | 'conciseness' | 'pacing' | 'share_of_voice' | 'effectiveness'
}

const METRICS = {
  clarity: {
    label: 'Clarity',
    plain: 'How direct, structured, and easy to follow your statements were.',
    technical: 'Claude evaluates sentence completeness, logical flow, absence of filler words ("um", "like", "you know"), and whether ideas were expressed without unnecessary hedging or backtracking.',
  },
  topic_leadership: {
    label: 'Topic Leadership',
    plain: 'How often you introduced, advanced, or redirected topics — versus only responding to others.',
    technical: 'Claude identifies who initiated each topic shift, who asked clarifying or driving questions, and who provided the closing statement or action item on a topic. High scores reflect agenda ownership.',
  },
  conciseness: {
    label: 'Conciseness',
    plain: 'The ratio of useful information to total words spoken. High scores mean you made your point without over-explaining.',
    technical: 'Claude looks for repeated ideas, restated points, excessive qualifiers, and tangential content. A score of 90+ means nearly every sentence advanced the conversation.',
  },
  pacing: {
    label: 'Pacing',
    plain: 'Whether your speech felt rushed, too slow, or well-timed relative to the meeting energy.',
    technical: 'Claude infers pacing from transcript cues: very short incomplete responses may suggest rushing; very long unbroken monologues may suggest over-pacing. This is qualitative — audio analysis would improve accuracy.',
  },
  share_of_voice: {
    label: 'Share of Voice',
    plain: 'Your percentage of total words spoken in the meeting. This is not inherently good or bad — it depends on your role.',
    technical: 'Calculated as: (your word count / total word count) × 100. A facilitator should have higher SOV; a subject-matter contributor in a large meeting may intentionally have lower SOV.',
  },
  effectiveness: {
    label: 'Meeting Effectiveness',
    plain: 'A composite score reflecting how well the group communicated overall — not any individual\'s performance.',
    technical: 'Claude weights topic coverage quality (strong/partial/weak), presence of clear action items, balanced participation, and whether agenda topics received adequate closure. Range is 0–100.',
  },
}

export function MetricTooltip({ metricKey }: MetricTooltipProps) {
  const [open, setOpen] = useState(false)
  const metric = METRICS[metricKey]

  return (
    <span className="relative inline-flex ml-1">
      <button
        type="button"
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onClick={() => setOpen(v => !v)}
        className="w-4 h-4 rounded-full bg-scp-gray-cool text-scp-gray text-xs font-bold leading-none flex items-center justify-center hover:bg-scp-blue hover:text-white transition-colors focus:outline-none"
        aria-label={`What is ${metric.label}?`}
      >
        ?
      </button>

      {open && (
        <div className="absolute z-50 bottom-6 left-1/2 -translate-x-1/2 w-72 bg-white border border-scp-gray-cool rounded-lg shadow-card-hover p-4 text-left pointer-events-none">
          <div className="font-bold text-scp-navy text-sm mb-2">{metric.label}</div>
          <p className="text-scp-gray text-xs leading-relaxed mb-3">{metric.plain}</p>
          <div className="border-t border-scp-gray-warm pt-2">
            <p className="text-scp-gray-mid text-xs font-semibold uppercase tracking-wide mb-1">How Claude evaluates this</p>
            <p className="text-scp-gray text-xs leading-relaxed">{metric.technical}</p>
          </div>
          {/* Arrow */}
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-3 h-3 bg-white border-r border-b border-scp-gray-cool rotate-45" />
        </div>
      )}
    </span>
  )
}
