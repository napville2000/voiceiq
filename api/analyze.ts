import type { VercelRequest, VercelResponse } from '@vercel/node'

// ── Prompt ───────────────────────────────────────────────────────────────────
const SYSTEM_PROMPT = `You are VoiceIQ, an expert communication analyst for SCP Health's BSA team.
Analyze the provided meeting transcript and return ONLY a valid JSON object — no preamble, no markdown, no explanation.

Your goal is to uplift BSA team members by identifying communication strengths and specific growth areas.
Be encouraging, specific, and constructive. Never punitive.

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
      "tips": ["string", "string", "string"] (3 specific, actionable coaching tips)
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
  "overall_summary": "string (2-3 sentence meeting communication summary)",
  "meeting_effectiveness": number (0-100, overall communication effectiveness score)
}`

// ── Handler ──────────────────────────────────────────────────────────────────
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' })
  }

  const { transcript, meeting_name, meeting_date } = req.body ?? {}

  if (!transcript || typeof transcript !== 'string' || transcript.length < 100) {
    return res.status(400).json({ success: false, error: 'Transcript too short or missing' })
  }

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    // Scaffold mode: return mock data so frontend can be tested without API key
    return res.status(200).json({
      success: true,
      mock: true,
      data: getMockResult(meeting_name, transcript),
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
        max_tokens: 2000,
        system: SYSTEM_PROMPT,
        messages: [
          {
            role: 'user',
            content: `Meeting: ${meeting_name} | Date: ${meeting_date}\n\nTranscript:\n${transcript}`,
          },
        ],
      }),
    })

    if (!response.ok) {
      const err = await response.text()
      console.error('[VoiceIQ] Claude API error:', err)
      return res.status(500).json({ success: false, error: 'Analysis service unavailable' })
    }

    const claude = await response.json()
    const raw = claude.content?.[0]?.text ?? ''

    let parsed
    try {
      parsed = JSON.parse(raw)
    } catch {
      console.error('[VoiceIQ] Failed to parse Claude response:', raw)
      return res.status(500).json({ success: false, error: 'Failed to parse analysis' })
    }

    return res.status(200).json({ success: true, data: parsed })

  } catch (err) {
    console.error('[VoiceIQ] Unexpected error:', err)
    return res.status(500).json({ success: false, error: 'Unexpected server error' })
  }
}

// ── Mock data (used when ANTHROPIC_API_KEY not set — scaffold testing) ────────
function getMockResult(meetingName: string, transcript: string) {
  // Auto-detect speaker names from transcript
  const speakerMatches = [...transcript.matchAll(/^([A-Z][a-z]+(?: [A-Z][a-z]+)?)\s*:/gm)]
  const speakerNames = [...new Set(speakerMatches.map(m => m[1]))].slice(0, 4)
  const names = speakerNames.length >= 2 ? speakerNames : ['Zach Roberts', 'Sarah M']

  return {
    speakers: names.map((name, i) => ({
      name,
      share_of_voice: Math.round(100 / names.length + (i === 0 ? 10 : -5)),
      clarity_score: 72 + i * 4,
      topic_leadership: 68 + i * 6,
      conciseness: 65 + i * 5,
      pacing: 'good',
      word_count: 320 + i * 80,
      tips: [
        `${name.split(' ')[0]}, consider pausing after key points to invite responses — this strengthens topic ownership.`,
        'Use concrete metrics when referencing project status to improve clarity.',
        'Your engagement level is strong. Try summarizing action items at topic close.',
      ],
    })),
    topics: [
      { topic: meetingName || 'Main Discussion', primary_speaker: names[0], coverage_quality: 'strong', speakers_involved: names },
      { topic: 'Action Items', primary_speaker: names[0], coverage_quality: 'partial', speakers_involved: [names[0]] },
    ],
    overall_summary: `[MOCK DATA] This is scaffold test output for "${meetingName}". The real Claude analysis will appear here once ANTHROPIC_API_KEY is configured in Vercel environment variables.`,
    meeting_effectiveness: 74,
  }
}
