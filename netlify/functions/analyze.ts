import type { Handler } from '@netlify/functions'

// ── Main analysis prompt (A+D: before/after examples + priority/effort tags) ──
const SYSTEM_PROMPT = `You are VoiceIQ, an expert communication analyst for SCP Health's BSA team.
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

// ── Explain prompt — called when user clicks "Explain" on a specific tip ──
const EXPLAIN_PROMPT = `You are VoiceIQ, a communication coach for SCP Health's BSA team.
A user wants a deeper explanation of a specific coaching tip from their meeting analysis.
Be specific, practical, and encouraging. Give 2-3 paragraphs maximum.
Focus on the WHY behind the tip and give 2-3 concrete techniques they can practice immediately.
Do not repeat the before/after example verbatim — expand on it with additional context and nuance.
Return plain text only — no markdown, no JSON, no headers.`

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ success: false, error: 'Method not allowed' }) }
  }

  const body = JSON.parse(event.body ?? '{}')
  const apiKey = process.env.ANTHROPIC_API_KEY

  // ── Mode: explain (secondary call for tip drill-down) ──
  if (body.mode === 'explain') {
    const { speaker, tip, meeting_name } = body

    if (!speaker || !tip) {
      return { statusCode: 400, body: JSON.stringify({ success: false, error: 'Missing speaker or tip' }) }
    }

    if (!apiKey) {
      return {
        statusCode: 200,
        body: JSON.stringify({
          success: true,
          explanation: `[Mock] This would provide a detailed explanation of "${tip.summary}" for ${speaker}. In production, Claude would walk through the specific technique, explain why it matters in a BSA/healthcare context, and give 2-3 practice strategies you could use in your next meeting.`
        })
      }
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
          max_tokens: 600,
          system: EXPLAIN_PROMPT,
          messages: [{
            role: 'user',
            content: `Meeting: ${meeting_name}
Speaker: ${speaker}
Coaching tip: ${tip.summary}
Observation from transcript: ${tip.observation}
Before example: ${tip.before}
After example: ${tip.after}

Please explain this coaching tip in depth — why it matters, the impact it has on how ${speaker.split(' ')[0]} is perceived, and 2-3 specific techniques to improve.`
          }],
        }),
      })

      if (!response.ok) {
        return { statusCode: 500, body: JSON.stringify({ success: false, error: 'Explain service unavailable' }) }
      }

      const claude = await response.json()
      const explanation = claude.content?.[0]?.text ?? ''
      return { statusCode: 200, body: JSON.stringify({ success: true, explanation }) }

    } catch (err) {
      console.error('[VoiceIQ] Explain error:', err)
      return { statusCode: 500, body: JSON.stringify({ success: false, error: 'Unexpected error' }) }
    }
  }

  // ── Mode: analyze (main transcript analysis) ──
  const { transcript, meeting_name, meeting_date } = body

  if (!transcript || transcript.length < 100) {
    return { statusCode: 400, body: JSON.stringify({ success: false, error: 'Transcript too short' }) }
  }

  if (!apiKey) {
    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, mock: true, data: getMockResult(meeting_name, transcript) })
    }
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
        max_tokens: 3000,
        system: SYSTEM_PROMPT,
        messages: [{
          role: 'user',
          content: `Meeting: ${meeting_name} | Date: ${meeting_date}\n\nTranscript:\n${transcript}`,
        }],
      }),
    })

    if (!response.ok) {
      return { statusCode: 500, body: JSON.stringify({ success: false, error: 'Analysis service unavailable' }) }
    }

    const claude = await response.json()
    const raw = claude.content?.[0]?.text ?? ''
    const parsed = JSON.parse(raw)
    return { statusCode: 200, body: JSON.stringify({ success: true, data: parsed }) }

  } catch (err) {
    console.error('[VoiceIQ] Analyze error:', err)
    return { statusCode: 500, body: JSON.stringify({ success: false, error: 'Unexpected error' }) }
  }
}

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
      tips: [
        {
          summary: `${name.split(' ')[0]}, consider pausing after key points to invite responses.`,
          observation: 'You delivered several multi-sentence updates without checking for questions.',
          before: '"...and then we\'ll move the timeline to Q3, the integration is on track, next topic."',
          after: '"...and then we\'ll move the timeline to Q3. Does anyone have questions on that before we move on?"',
          priority: 'high',
          effort: 'easy',
        },
        {
          summary: 'Use concrete metrics when referencing project status.',
          observation: 'Status updates used qualitative language without supporting numbers.',
          before: '"The migration is mostly done and going well."',
          after: '"We\'re at 84% on the migration — 6 records outstanding, targeting completion by Thursday."',
          priority: 'high',
          effort: 'easy',
        },
        {
          summary: 'Summarize action items explicitly at topic close.',
          observation: 'Transitions between topics happened without confirming next steps.',
          before: '"Ok, let\'s move on to the next item."',
          after: '"So the action there is Sarah owns the ticket by Friday — confirmed? Great, moving on."',
          priority: 'medium',
          effort: 'hard',
        },
      ],
    })),
    topics: [
      { topic: meetingName || 'Main Discussion', primary_speaker: speakers[0], coverage_quality: 'strong', speakers_involved: speakers },
    ],
    overall_summary: `[MOCK] Scaffold test for "${meetingName}".`,
    meeting_effectiveness: 74,
  }
}
