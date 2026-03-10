import type { Handler } from '@netlify/functions'

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
      "tips": ["string", "string", "string"]
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

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ success: false, error: 'Method not allowed' }) }
  }

  const { transcript, meeting_name, meeting_date } = JSON.parse(event.body ?? '{}')

  if (!transcript || transcript.length < 100) {
    return { statusCode: 400, body: JSON.stringify({ success: false, error: 'Transcript too short' }) }
  }

  const apiKey = process.env.ANTHROPIC_API_KEY
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
      return { statusCode: 500, body: JSON.stringify({ success: false, error: 'Analysis service unavailable' }) }
    }

    const claude = await response.json()
    const raw = claude.content?.[0]?.text ?? ''
    const parsed = JSON.parse(raw)

    return { statusCode: 200, body: JSON.stringify({ success: true, data: parsed }) }

  } catch (err) {
    console.error('[VoiceIQ] Error:', err)
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
        `${name.split(' ')[0]}, consider pausing after key points to invite responses.`,
        'Use concrete metrics when referencing project status to improve clarity.',
        'Your engagement level is strong. Try summarizing action items at topic close.',
      ],
    })),
    topics: [
      { topic: meetingName || 'Main Discussion', primary_speaker: speakers[0], coverage_quality: 'strong', speakers_involved: speakers },
    ],
    overall_summary: `[MOCK] Scaffold test for "${meetingName}".`,
    meeting_effectiveness: 74,
  }
}