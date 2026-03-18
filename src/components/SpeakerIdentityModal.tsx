import { useState } from 'react'

interface SpeakerIdentityModalProps {
  candidates: string[]
  onSelect: (name: string | null) => void
}

export function SpeakerIdentityModal({ candidates, onSelect }: SpeakerIdentityModalProps) {
  const [manualName, setManualName] = useState('')

  const noSpeakersDetected = candidates.length === 0

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-card-hover w-full max-w-md overflow-hidden">
          {/* Header */}
          <div className="bg-scp-navy px-6 py-5">
            <h2 className="text-white font-bold text-lg">Which speaker is you?</h2>
            <p className="text-white/60 text-sm mt-1">
              {noSpeakersDetected
                ? "VoiceIQ couldn't detect speaker names in this transcript. Enter your name exactly as it appears so your scores are tracked correctly."
                : "VoiceIQ tracks your personal scores over time. Select your name so we know which data to attribute to you."}
            </p>
          </div>

          <div className="px-6 py-5 space-y-3">
            {/* Detected speaker buttons */}
            {candidates.map(name => (
              <button
                key={name}
                onClick={() => onSelect(name)}
                className="w-full text-left px-4 py-3 rounded-lg border-2 border-scp-gray-cool hover:border-scp-blue hover:bg-scp-navy-tint transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-scp-navy text-white flex items-center justify-center font-bold text-sm flex-shrink-0 group-hover:bg-scp-blue transition-colors">
                    {name.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-scp-navy font-semibold">{name}</span>
                </div>
              </button>
            ))}

            {/* Manual name entry — always shown if no candidates detected */}
            {noSpeakersDetected && (
              <div className="space-y-2">
                <input
                  type="text"
                  value={manualName}
                  onChange={e => setManualName(e.target.value)}
                  className="input-field"
                  placeholder="Your name as it appears in the transcript"
                  autoFocus
                />
                <button
                  onClick={() => manualName.trim() && onSelect(manualName.trim())}
                  disabled={!manualName.trim()}
                  className="btn-primary w-full"
                >
                  That's me
                </button>
              </div>
            )}

            <div className="border-t border-scp-gray-warm pt-3">
              <button
                onClick={() => onSelect(null)}
                className="w-full text-left px-4 py-3 rounded-lg border-2 border-dashed border-scp-gray-cool hover:border-scp-gray-mid transition-all text-scp-gray-mid text-sm font-medium"
              >
                I'm not in this transcript — save as observer record
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
