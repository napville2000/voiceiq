import { useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { NavBar } from '../components/NavBar'
import { SpeakerIdentityModal } from '../components/SpeakerIdentityModal'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'
import { matchSpeakerToUser } from '../lib/speakerMatch'
import type { AnalyzeResponse, AnalysisResult } from '../types'

type Step = 'form' | 'analyzing' | 'identity' | 'saving'

export function AnalyzePage() {
  const { user, profile } = useAuth()
  const navigate = useNavigate()

  const [transcript, setTranscript] = useState('')
  const [meetingName, setMeetingName] = useState('')
  const [meetingDate, setMeetingDate] = useState(new Date().toISOString().split('T')[0])
  const [step, setStep] = useState<Step>('form')
  const [error, setError] = useState<string | null>(null)

  // Holds the Claude result while we resolve speaker identity
  const [pendingResult, setPendingResult] = useState<AnalysisResult | null>(null)
  const [identityCandidates, setIdentityCandidates] = useState<string[]>([])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setStep('analyzing')

    try {
      const res = await fetch('/.netlify/functions/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript, meeting_name: meetingName, meeting_date: meetingDate }),
      })
      const data: AnalyzeResponse = await res.json()

      if (!data.success || !data.data) {
        setError(data.error ?? 'Analysis failed. Please try again.')
        setStep('form')
        return
      }

      const result = data.data
      const speakerNames = result.speakers.map(s => s.name)

      // Attempt auto-match
      const matchResult = matchSpeakerToUser(profile?.full_name ?? '', speakerNames)

      if (matchResult.matched) {
        // Confident match — skip modal, go straight to save
        await saveAnalysis(result, matchResult.speakerName)
      } else {
        // Need user to identify themselves
        setPendingResult(result)
        setIdentityCandidates(matchResult.candidates)
        setStep('identity')
      }
    } catch {
      setError('Failed to reach the analysis endpoint.')
      setStep('form')
    }
  }

  async function handleIdentitySelect(speakerName: string | null) {
    if (!pendingResult) return
    setStep('saving')
    await saveAnalysis(pendingResult, speakerName)
  }

  async function saveAnalysis(result: AnalysisResult, selfSpeakerName: string | null) {
    if (!user) return
    setStep('saving')

    const { data, error: dbError } = await supabase.from('analyses').insert({
      user_id: user.id,
      meeting_name: meetingName,
      meeting_date: meetingDate,
      transcript_preview: transcript.slice(0, 200),
      scores: result,
      self_speaker_name: selfSpeakerName,
    }).select().single()

    if (dbError) {
      console.error('[VoiceIQ] Save error:', dbError)
      setError('Analysis complete but could not save. Check your database connection.')
      setStep('form')
      return
    }

    // Navigate to results page
    navigate(`/results/${data.id}`)
  }

  return (
    <div className="min-h-screen bg-scp-navy-tint">
      <NavBar />

      {step === 'identity' && identityCandidates.length > 0 && (
        <SpeakerIdentityModal
          candidates={identityCandidates}
          onSelect={handleIdentitySelect}
        />
      )}

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="section-title text-2xl">Analyze Meeting</h1>
          <p className="text-scp-gray text-sm">
            Paste your meeting transcript to receive personal communication insights.
          </p>
        </div>

        {/* PHI Warning */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 mb-6 flex items-start gap-3">
          <span className="text-amber-500 text-lg flex-shrink-0">⚠</span>
          <p className="text-amber-800 text-sm">
            <strong>Confidentiality notice:</strong> Do not paste transcripts containing Protected Health Information (PHI),
            patient names, or personal identification. Meeting content is processed securely and stored only for your account.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">Meeting name</label>
              <input
                type="text"
                value={meetingName}
                onChange={e => setMeetingName(e.target.value)}
                className="input-field"
                placeholder="e.g. Sprint 13 Planning"
                required
                disabled={step !== 'form'}
              />
            </div>
            <div>
              <label className="label">Meeting date</label>
              <input
                type="date"
                value={meetingDate}
                onChange={e => setMeetingDate(e.target.value)}
                className="input-field"
                required
                disabled={step !== 'form'}
              />
            </div>
          </div>

          <div>
            <label className="label">Transcript</label>
            <p className="text-xs text-scp-gray-mid mb-2">
              Supports Teams, Zoom, and Otter formats. Speaker labels like "Zach Roberts:" or "[Zach]:" are auto-detected.
            </p>
            <textarea
              value={transcript}
              onChange={e => setTranscript(e.target.value)}
              className="input-field resize-none font-mono text-sm"
              rows={14}
              placeholder={`Zach Roberts: Good morning everyone, let's get started with the sprint review...\n\nSarah M: Thanks Zach. I wanted to cover the MuleSoft ticket status first...\n\nZach Roberts: Sure, go ahead Sarah.`}
              required
              disabled={step !== 'form'}
            />
            <p className="text-xs text-scp-gray-mid mt-1">
              {transcript.length} characters · ~{Math.round(transcript.split(/\s+/).filter(Boolean).length)} words
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded px-4 py-3 text-red-700 text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={step !== 'form' || transcript.length < 100}
            className="btn-primary"
          >
            {step === 'analyzing' && '⟳ Analyzing transcript...'}
            {step === 'saving' && '⟳ Saving results...'}
            {step === 'identity' && 'Waiting for speaker selection...'}
            {step === 'form' && 'Run Analysis'}
          </button>
        </form>
      </main>
    </div>
  )
}
