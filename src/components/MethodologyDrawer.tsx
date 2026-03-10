import { useEffect } from 'react'

interface MethodologyDrawerProps {
  open: boolean
  onClose: () => void
}

const METRICS = [
  {
    key: 'clarity',
    label: 'Clarity',
    icon: '💬',
    plain: 'How direct, structured, and easy to follow your statements were. High clarity means no filler words, logical flow between ideas, and complete thoughts delivered without backtracking.',
    technical: 'Claude evaluates sentence completeness, logical progression, absence of filler language ("um", "like", "you know", "sort of"), and whether ideas landed without unnecessary hedging. Scores above 85 indicate consistently clean, structured communication.',
    range: 'Range: 0–100. 85+ = Excellent. 70–84 = Good. Below 70 = Improvement opportunity.',
  },
  {
    key: 'topic_leadership',
    label: 'Topic Leadership',
    icon: '🎯',
    plain: 'How often you introduced, advanced, or redirected topics — rather than only responding to others. High scores mean you\'re driving the agenda, not just participating in it.',
    technical: 'Claude identifies who initiated each topic shift, who asked the driving or clarifying questions, and who provided the closing statement or action item on a topic. Facilitators naturally score higher; contributors in large meetings may intentionally score lower.',
    range: 'Range: 0–100. Context-dependent. A director or facilitator should aim for 70+.',
  },
  {
    key: 'conciseness',
    label: 'Conciseness',
    icon: '✂️',
    plain: 'The ratio of useful signal to total words spoken. A high score means you made your point efficiently — without over-explaining, repeating yourself, or going on tangents.',
    technical: 'Claude scans for repeated ideas, restated points, excessive qualifiers, and content that did not advance the conversation. A score of 90+ means nearly every sentence carried new information or moved the discussion forward.',
    range: 'Range: 0–100. 85+ = Very concise. 70–84 = Adequate. Below 70 = Consider tightening delivery.',
  },
  {
    key: 'pacing',
    label: 'Pacing',
    icon: '⏱️',
    plain: 'Whether your speech felt rushed, too slow, or well-timed relative to the meeting energy. Good pacing creates space for others to respond and signals confident delivery.',
    technical: 'Claude infers pacing from transcript cues: very short or incomplete responses may suggest rushing past topics; long unbroken monologues without inviting input may suggest over-pacing. Note: pacing accuracy improves significantly with audio data.',
    range: 'Values: Slow / Good / Fast. "Good" is neutral-positive. Context matters.',
  },
  {
    key: 'share_of_voice',
    label: 'Share of Voice',
    icon: '📊',
    plain: 'Your percentage of total words spoken. This is not inherently good or bad — it reflects your role. A facilitator should have more; a subject-matter contributor in a large meeting may intentionally have less.',
    technical: 'Calculated as (your word count ÷ total meeting word count) × 100. VoiceIQ uses this for context, not judgment. It becomes meaningful when tracked over time relative to your intended role in each meeting.',
    range: 'Range: 0–100%. No "right" answer — watch the trend relative to your role.',
  },
  {
    key: 'effectiveness',
    label: 'Meeting Effectiveness',
    icon: '⭐',
    plain: 'A composite score reflecting how well the entire group communicated — not any single person\'s performance. A high score means topics were covered well, action items were clear, and participation was constructive.',
    technical: 'Claude weights: topic coverage quality (strong/partial/weak), presence of clear action items or decisions, balanced participation across speakers, and whether agenda topics received adequate closure. This is a meeting-level signal, not individual accountability.',
    range: 'Range: 0–100. 80+ = Strong. 65–79 = Adequate. Below 65 = Meeting may need restructuring.',
  },
]

export function MethodologyDrawer({ open, onClose }: MethodologyDrawerProps) {
  // Close on Escape
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, onClose])

  if (!open) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed top-0 right-0 h-full w-full max-w-lg bg-white z-50 shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-scp-navy px-6 py-5 flex items-center justify-between flex-shrink-0">
          <div>
            <h2 className="text-white font-bold text-lg">Score Methodology</h2>
            <p className="text-white/60 text-sm mt-0.5">How VoiceIQ measures your communication</p>
          </div>
          <button
            onClick={onClose}
            className="text-white/60 hover:text-white text-2xl leading-none font-light transition-colors"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
          <p className="text-scp-gray text-sm leading-relaxed border-l-4 border-scp-green pl-4 bg-scp-navy-tint rounded-r-lg py-3 pr-4">
            VoiceIQ is a <strong>personal improvement mirror</strong>, not a surveillance tool. Every score is intended to help you grow — never to judge or compare against teammates.
          </p>

          {METRICS.map(metric => (
            <div key={metric.key} className="bg-white border border-scp-gray-warm rounded-lg overflow-hidden">
              <div className="bg-scp-navy-tint px-5 py-3 flex items-center gap-3 border-b border-scp-gray-warm">
                <span className="text-xl">{metric.icon}</span>
                <h3 className="text-scp-navy font-bold text-base">{metric.label}</h3>
              </div>
              <div className="px-5 py-4 space-y-3">
                <p className="text-scp-gray text-sm leading-relaxed">{metric.plain}</p>
                <div className="bg-scp-gray-warm rounded-lg p-3">
                  <p className="text-scp-gray-mid text-xs font-bold uppercase tracking-wide mb-1.5">How Claude evaluates this</p>
                  <p className="text-scp-gray text-xs leading-relaxed">{metric.technical}</p>
                </div>
                <p className="text-scp-gray-mid text-xs italic">{metric.range}</p>
              </div>
            </div>
          ))}

          <div className="bg-scp-navy rounded-lg p-5 text-center">
            <p className="text-white/80 text-sm leading-relaxed">
              Scores improve in accuracy with longer transcripts (300+ words). Very short meetings may produce lower-confidence results.
            </p>
          </div>
        </div>
      </div>
    </>
  )
}
