import { useState } from 'react'
import type { FormEvent } from 'react'
import { NavBar } from '../components/NavBar'
import type { AnalyzeResponse } from '../types'

export function AnalyzePage() {
  const [transcript, setTranscript] = useState('')
  const [meetingName, setMeetingName] = useState('')
  const [meetingDate, setMeetingDate] = useState(new Date().toISOString().split('T')[0])
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<AnalyzeResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript, meeting_name: meetingName, meeting_date: meetingDate }),
      })
      const data: AnalyzeResponse = await res.json()
      setResult(data)
    } catch {
      setError('Failed to reach the analysis endpoint. Is the server running?')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-scp-navy-tint">
      <NavBar />

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="section-title text-2xl">Analyze Meeting</h1>
          <p className="text-scp-gray text-sm">
            Paste your meeting transcript to receive communication insights for each participant.
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

          {error && (
            <div className="bg-red-50 border border-red-200 rounded px-4 py-3 text-red-700 text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || transcript.length < 100}
            className="btn-primary"
          >
            {loading ? 'Analyzing...' : 'Run Analysis'}
          </button>
        </form>

        {/* Scaffold result preview */}
        {result && (
          <div className="mt-8 card">
            <h2 className="section-title mb-3">API Response (Scaffold Test)</h2>
            <pre className="bg-scp-navy-tint rounded p-4 text-xs overflow-auto text-scp-navy">
              {JSON.stringify(result, null, 2)}
            </pre>
            <p className="text-scp-gray text-sm mt-3">
              ✓ Endpoint reached successfully. Full results UI built in Phase 1.
            </p>
          </div>
        )}
      </main>
    </div>
  )
}
