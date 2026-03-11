import { useState, useEffect, useRef } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { NavBar } from '../components/NavBar'
import { SpeakerIdentityModal } from '../components/SpeakerIdentityModal'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'
import { matchSpeakerToUser } from '../lib/speakerMatch'
import type { AnalyzeStartResponse, Analysis } from '../types'

type Step = 'form' | 'submitting' | 'identity' | 'processing' | 'error'

// Staleness threshold — jobs older than 5 min still processing = failed
const STALE_MS = 5 * 60 * 1000
const POLL_INTERVAL_MS = 2000

export function AnalyzePage() {
  const { user, profile } = useAuth()
  const navigate = useNavigate()

  const [transcript, setTranscript] = useState('')
  const [meetingName, setMeetingName] = useState('')
  const [meetingDate, setMeetingDate] = useState(new Date().toISOString().split('T')[0])
  const [step, setStep] = useState<Step>('form')
  const [error, setError] = useState<string | null>(null)
  const [analysisId, setAnalysisId] = useState<string | null>(null)
  const [pollCount, setPollCount] = useState(0)

  // Pending state for identity modal
  const [pendingSpeakers, setPendingSpeakers] = useState<string[]>([])
  const pendingTranscript = useRef('')
  const pendingMeetingName = useRef('')
  const pendingMeetingDate = useRef('')

  // ── Polling ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (step !== 'processing' || !analysisId) return

    const interval = setInterval(async () => {
      setPollCount(c => c + 1)

      const { data } = await supabase
        .from('analyses')
        .select('id, status, error_message, scores, created_at')
        .eq('id', analysisId)
        .single()

      if (!data) return

      const analysis = data as Analysis

      if (analysis.status === 'complete' && analysis.scores) {
        clearInterval(interval)
        navigate(`/results/${analysisId}`)
        return
      }

      if (analysis.status === 'failed') {
        clearInterval(interval)
        setError(analysis.error_message ?? 'Analysis failed. Please try again.')
        setStep('error')
        return
      }

      // Staleness check
      const age = Date.now() - new Date(analysis.created_at).getTime()
      if (age > STALE_MS && analysis.status === 'processing') {
        clearInterval(interval)
        // Update DB to failed
        await supabase.from('analyses').update({ status: 'failed', error_message: 'Analysis timed out' }).eq('id', analysisId)
        setError('Analysis took too long. Please try again.')
        setStep('error')
      }
    }, POLL_INTERVAL_MS)

    return () => clearInterval(interval)
  }, [step, analysisId, navigate])

  // ── Submit ────────────────────────────────────────────────────────────────
  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!user || !profile) return

    setError(null)
    setStep('submitting')

    // Detect speakers from transcript for identity matching
    const speakerMatches = [...transcript.matchAll(/^([A-Z][a-zA-Z]+(?: [A-Z][a-zA-Z]+)?)\s*:/gm)]
    const detectedSpeakers = [...new Set(speakerMatches.map(m => m[1]))]

    // Try auto-match first
    const matchResult = detectedSpeakers.length > 0
      ? matchSpeakerToUser(profile.full_name, detectedSpeakers)
      : { matched: false as const, candidates: [] }

    if (!matchResult.matched && matchResult.candidates.length > 0) {
      // Need user to identify themselves — store pending state
      pendingTranscript.current = transcript
      pendingMeetingName.current = meetingName
      pendingMeetingDate.current = meetingDate
      setPendingSpeakers(matchResult.candidates)
      setStep('identity')
      return
    }

    const selfSpeakerName = matchResult.matched ? matchResult.speakerName : null
    await startAnalysis(selfSpeakerName)
  }

  async function handleIdentitySelect(speakerName: string | null) {
    setStep('submitting')
    await startAnalysis(speakerName)
  }

  async function startAnalysis(selfSpeakerName: string | null) {
    if (!user) return

    const res = await fetch('/.netlify/functions/analyze-start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        transcript: pendingTranscript.current || transcript,
        meeting_name: pendingMeetingName.current || meetingName,
        meeting_date: pendingMeetingDate.current || meetingDate,
        user_id: user.id,
        self_speaker_name: selfSpeakerName,
      }),
    })

    const data: AnalyzeStartResponse = await res.json()

    if (!data.success || !data.analysisId) {
      setError(data.error ?? 'Could not start analysis. Please try again.')
      setStep('error')
      return
    }

    setAnalysisId(data.analysisId)
    setPollCount(0)
    setStep('processing')
  }

  async function handleRetry() {
    if (!analysisId) { setStep('form'); return }

    // Re-trigger the background function for the same analysis ID
    setError(null)
    setStep('submitting')

    const { data } = await supabase
      .from('analyses')
      .select('*')
      .eq('id', analysisId)
      .single()

    if (!data) { setStep('form'); return }

    // Reset status to processing
    await supabase.from('analyses')
      .update({ status: 'processing', error_message: null })
      .eq('id', analysisId)

    // Re-fire background function
    await fetch('/.netlify/functions/analyze-bg', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        analysis_id: analysisId,
        transcript: data.transcript_preview, // note: only preview stored, limited retry fidelity
        meeting_name: data.meeting_name,
        meeting_date: data.meeting_date,
      }),
    })

    setPollCount(0)
    setStep('processing')
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-scp-navy-tint">
      <NavBar />

      {step === 'identity' && pendingSpeakers.length > 0 && (
        <SpeakerIdentityModal
          candidates={pendingSpeakers}
          onSelect={handleIdentitySelect}
        />
      )}

      <main className="max-w-4xl mx-auto px-4 py-8">

        {/* Processing screen */}
        {(step === 'processing' || step === 'submitting') && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 border-4 border-scp-green border-t-transparent rounded-full animate-spin mb-6" />
            <h2 className="text-scp-navy font-bold text-xl mb-2">
              {step === 'submitting' ? 'Starting analysis...' : 'Claude is reviewing your transcript'}
            </h2>
            <p className="text-scp-gray text-sm max-w-sm">
              {step === 'submitting'
                ? 'Setting up your analysis job...'
                : 'Analyzing speaker patterns, topic coverage, and communication effectiveness. This usually takes 20–40 seconds.'}
            </p>
            {step === 'processing' && pollCount > 0 && (
              <p className="text-scp-gray-mid text-xs mt-4">
                Checking for results... ({pollCount * 2}s elapsed)
              </p>
            )}
          </div>
        )}

        {/* Error screen */}
        {step === 'error' && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center mb-5">
              <span className="text-red-500 text-2xl">!</span>
            </div>
            <h2 className="text-scp-navy font-bold text-xl mb-2">Analysis Failed</h2>
            <p className="text-scp-gray text-sm max-w-sm mb-6">{error}</p>
            <div className="flex gap-3">
              {analysisId && (
                <button onClick={handleRetry} className="btn-primary">
                  Retry Analysis
                </button>
              )}
              <button onClick={() => { setStep('form'); setAnalysisId(null) }} className="btn-ghost">
                Start Over
              </button>
            </div>
          </div>
        )}

        {/* Form */}
        {step === 'form' && (
          <>
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
                />
                <p className="text-xs text-scp-gray-mid mt-1">
                  {transcript.length} characters · ~{Math.round(transcript.split(/\s+/).filter(Boolean).length)} words
                </p>
              </div>

              <button
                type="submit"
                disabled={transcript.length < 100}
                className="btn-primary"
              >
                Run Analysis
              </button>
            </form>
          </>
        )}
      </main>
    </div>
  )
}
