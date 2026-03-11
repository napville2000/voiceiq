// Background function — Netlify runs this async, no timeout pressure
// Named .mts so Netlify treats it as a background function
import type { Handler } from '@netlify/functions'
import { createClient } from '@supabase/supabase-js'

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

export const handler: Handler = async (event) => {
  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  let analysisId: string | undefined

  try {
    const body = JSON.parse(event.body ?? '{}')
    analysisId = body.analysis_id
    const { transcript, meeting_name, meeting_date } = body

    if (!analysisId || !transcript) {
      console.error('[analyze-bg] Missing analysis_id or transcript')
      return { statusCode: 400, body: 'Missing required fields' }
    }

    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      // No API key — write mock result so dev/staging still works
      const mock = getMockResult(meeting_name, transcript)
      await supabase.from('analyses').update({ scores: mock, status: 'complete' }).eq('id', analysisId)
      return { statusCode: 200, body: 'Mock complete' }
    }

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
        system: SYSTEM_PROMPT,
        messages: [{
          role: 'user',
          content: `Meeting: ${meeting_name} | Date: ${meeting_date}\n\nTranscript:\n${transcript}`,
        }],
      }),
    })

    if (!response.ok) {
      const errText = await response.text()
      console.error('[analyze-bg] Claude API error:', response.status, errText)
      await supabase.from('analyses')
        .update({ status: 'failed', error_message: `Claude API error: ${response.status}` })
        .eq('id', analysisId)
      return { statusCode: 200, body: 'Analysis failed — Claude API error' }
    }

    const claude = await response.json()
    const raw = claude.content?.[0]?.text ?? ''
    const parsed = JSON.parse(raw)

    await supabase.from('analyses')
      .update({ scores: parsed, status: 'complete' })
      .eq('id', analysisId)

    return { statusCode: 200, body: 'Analysis complete' }

  } catch (err) {
    console.error('[analyze-bg] Unexpected error:', err)
    if (analysisId) {
      const supabaseErr = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
      await supabaseErr.from('analyses')
        .update({ status: 'failed', error_message: 'Unexpected processing error' })
        .eq('id', analysisId)
    }
    return { statusCode: 200, body: 'Analysis failed — unexpected error' }
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
