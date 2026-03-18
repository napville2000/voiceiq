import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'

// ── System prompts ─────────────────────────────────────────────────────────

const ANALYSIS_SYSTEM_PROMPT = `You are VoiceIQ, an expert communication analyst for SCP Health's BSA team.
Analyze the provided meeting transcript and return ONLY a valid JSON object — no preamble, no markdown, no explanation.

Your goal is to uplift BSA team members by identifying communication strengths and specific growth areas.
Be encouraging, specific, and constructive. Never punitive.

For each speaker's tips, you MUST:
1. Reference a specific moment, phrase, or pattern from the actual transcript
2. Show a concrete before/after example using realistic language from the meeting context
3. Assign a priority (high/medium) and effort (easy/hard) so the person knows where to start

Return this exact JSON structure:
{
  "speakers": [
    {
      "name": "string",
      "share_of_voice": number (0-100, percent of total words),
      "clarity_score": number (0-100),
      "topic_leadership": number (0-100, how often they introduced/drove topics),
      "conciseness": number (0-100),
      "pacing": "slow" | "good" | "fast",
      "word_count": number,
      "tips": [
        {
          "summary": "one sentence describing the issue or strength",
          "observation": "specific moment or pattern from the transcript that illustrates this",
          "before": "example of how it came across in the meeting",
          "after": "example of how it could be said more effectively",
          "priority": "high" | "medium",
          "effort": "easy" | "hard"
        }
      ]
    }
  ],
  "topics": [
    {
      "topic": "string",
      "primary_speaker": "string",
      "coverage_quality": "strong" | "partial" | "weak",
      "speakers_involved": ["string"]
    }
  ],
  "overall_summary": "string",
  "meeting_effectiveness": number
}`

const EXPLAIN_SYSTEM_PROMPT = `You are VoiceIQ, a communication coach for SCP Health's BSA team.
A user wants a deeper explanation of a specific coaching tip from their meeting analysis.
Be specific, practical, and encouraging. Give 2-3 paragraphs maximum.
Focus on the WHY behind the tip and give 2-3 concrete techniques they can practice immediately.
Do not repeat the before/after example verbatim — expand on it with additional context and nuance.
Return plain text only — no markdown, no JSON, no headers.`

// ── Helpers ─────────────────────────────────────────────────────────────────

function getMockResult(meetingName: string, transcript: string) {
  const speakerMatches = [...transcript.matchAll(/^([A-Z][a-z]+(?: [A-Z][a-z]+)?)\s*:/gm)]
  const names = [...new Set(speakerMatches.map(m => m[1]))].slice(0, 4)
  const speakers = names.length >= 2 ? names : ['Zach Roberts', 'Sarah M']
  return {
    speakers: speakers.map((name, i) => ({
      name,
      share_of_voice: Math.round(100 / speakers.length + (i === 0 ? 10 : -5)),
      clarity_score: 72 + i * 4,
      topic_leadership: 68 + i * 6,
      conciseness: 65 + i * 5,
      pacing: 'good',
      word_count: 320 + i * 80,
      tips: [{
        summary: `${name.split(' ')[0]}, consider pausing after key points to invite responses.`,
        observation: 'You delivered several multi-sentence updates without checking for questions.',
        before: '"...and then we\'ll move the timeline to Q3, the integration is on track, next topic."',
        after: '"...and then we\'ll move the timeline to Q3. Does anyone have questions on that before we move on?"',
        priority: 'high',
        effort: 'easy',
      }],
    })),
    topics: [{ topic: meetingName || 'Main Discussion', primary_speaker: speakers[0], coverage_quality: 'strong', speakers_involved: speakers }],
    overall_summary: `[MOCK] Scaffold test for "${meetingName}".`,
    meeting_effectiveness: 74,
  }
}

// ── Handler ──────────────────────────────────────────────────────────────────

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' })
  }

  // @vercel/node does not auto-parse JSON bodies — handle both parsed object and raw string
  let body: Record<string, unknown>
  try {
    body = typeof req.body === 'object' && req.body !== null
      ? req.body as Record<string, unknown>
      : JSON.parse(typeof req.body === 'string' ? req.body : '{}')
  } catch {
    return res.status(400).json({ success: false, error: 'Invalid JSON body' })
  }

  const mode = body.mode as string | undefined

  // ── Mode: explain ──────────────────────────────────────────────────────────
  if (mode === 'explain') {
    const speaker = body.speaker as string | undefined
    const tip = body.tip as Record<string, string> | undefined
    const meeting_name = body.meeting_name as string | undefined

    if (!speaker || !tip) {
      return res.status(400).json({ success: false, error: 'Missing speaker or tip' })
    }

    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      return res.status(200).json({
        success: true,
        explanation: `[Mock] This would provide a detailed explanation of "${tip.summary}" for ${speaker}. Claude would walk through the specific technique, explain why it matters in a BSA/healthcare context, and give 2-3 practice strategies.`,
      })
    }

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 700,
          system: EXPLAIN_SYSTEM_PROMPT,
          messages: [{
            role: 'user',
            content: `Meeting: ${meeting_name ?? 'Unknown'}
Speaker: ${speaker}
Coaching tip: ${tip.summary}
Observation from transcript: ${tip.observation}
Before example: ${tip.before}
After example: ${tip.after}

Please explain this coaching tip in depth — why it matters, the impact on how ${speaker.split(' ')[0]} is perceived, and 2-3 specific techniques to improve.`,
          }],
        }),
      })

      if (!response.ok) {
        const errText = await response.text()
        console.error('[VoiceIQ/explain] Claude error:', response.status, errText)
        return res.status(500).json({ success: false, error: 'Explain service unavailable' })
      }

      const claude = await response.json() as { content?: { text?: string }[] }
      const explanation = claude.content?.[0]?.text ?? ''
      return res.status(200).json({ success: true, explanation })

    } catch (err) {
      console.error('[VoiceIQ/explain] Unexpected error:', err)
      return res.status(500).json({ success: false, error: 'Unexpected error' })
    }
  }

  // ── Mode: full analysis ────────────────────────────────────────────────────
  if (!mode || mode === 'full') {
    const { transcript, meeting_name, meeting_date, user_id, self_speaker_name } = body as {
      transcript?: string
      meeting_name?: string
      meeting_date?: string
      user_id?: string
      self_speaker_name?: string | null
    }

    if (!transcript || transcript.length < 100) {
      return res.status(400).json({ success: false, error: 'Transcript too short' })
    }
    if (!user_id) {
      return res.status(400).json({ success: false, error: 'user_id required' })
    }

    const supabaseUrl = process.env.SUPABASE_URL
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!supabaseUrl || !serviceKey) {
      return res.status(500).json({ success: false, error: 'Server configuration error' })
    }

    const supabase = createClient(supabaseUrl, serviceKey)

    // Insert the processing row — scores starts NULL
    const { data: row, error: insertError } = await supabase
      .from('analyses')
      .insert({
        user_id,
        meeting_name: meeting_name || 'Untitled Meeting',
        meeting_date: meeting_date || new Date().toISOString().split('T')[0],
        transcript_preview: transcript.slice(0, 200),
        full_transcript: transcript,
        scores: null,
        self_speaker_name: self_speaker_name ?? null,
        status: 'processing',
      })
      .select('id')
      .single()

    if (insertError || !row) {
      console.error('[VoiceIQ/analyze] DB insert error:', insertError)
      return res.status(500).json({ success: false, error: 'Could not create analysis record' })
    }

    const analysisId = row.id as string

    const resolvedMeetingName = meeting_name || 'Untitled Meeting'
    const resolvedMeetingDate = meeting_date || new Date().toISOString().split('T')[0]

    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      // No API key — return mock immediately
      const mock = getMockResult(resolvedMeetingName, transcript)
      await supabase
        .from('analyses')
        .update({ scores: mock, status: 'complete', full_transcript: null })
        .eq('id', analysisId)
      return res.status(200).json({ success: true, analysisId })
    }

    // Call Claude synchronously (Vercel free tier: 60s limit is enough for most transcripts)
    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 4000,
          system: ANALYSIS_SYSTEM_PROMPT,
          messages: [{
            role: 'user',
            content: `Meeting: ${resolvedMeetingName} | Date: ${resolvedMeetingDate}\n\nTranscript:\n${transcript}`,
          }],
        }),
      })

      if (!response.ok) {
        const errText = await response.text()
        console.error('[VoiceIQ/analyze] Claude API error:', response.status, errText)
        await supabase
          .from('analyses')
          .update({ status: 'failed', error_message: `Claude API error: ${response.status}`, full_transcript: null })
          .eq('id', analysisId)
        return res.status(200).json({ success: true, analysisId })
      }

      const claude = await response.json() as { content?: { text?: string }[] }
      const raw = claude.content?.[0]?.text ?? ''

      let parsed: unknown
      try {
        parsed = JSON.parse(raw)
      } catch {
        console.error('[VoiceIQ/analyze] JSON parse failed. Raw:', raw.slice(0, 500))
        await supabase
          .from('analyses')
          .update({ status: 'failed', error_message: 'Analysis response could not be parsed', full_transcript: null })
          .eq('id', analysisId)
        return res.status(200).json({ success: true, analysisId })
      }

      // Store results and clear full transcript (HIPAA-adjacent caution)
      await supabase
        .from('analyses')
        .update({ scores: parsed, status: 'complete', full_transcript: null })
        .eq('id', analysisId)

      console.log('[VoiceIQ/analyze] Complete:', analysisId)
      return res.status(200).json({ success: true, analysisId })

    } catch (err) {
      console.error('[VoiceIQ/analyze] Unexpected error:', err)
      await supabase
        .from('analyses')
        .update({ status: 'failed', error_message: 'Unexpected processing error', full_transcript: null })
        .eq('id', analysisId)
      return res.status(200).json({ success: true, analysisId })
    }
  }

  return res.status(400).json({ success: false, error: `Unknown mode: ${mode}` })
}
