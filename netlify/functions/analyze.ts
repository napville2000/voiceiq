import type { Handler } from '@netlify/functions'

// This function now handles ONLY the explain mode (tip drill-down).
// Main transcript analysis has moved to analyze-start + analyze-bg.

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

  if (body.mode !== 'explain') {
    return { statusCode: 400, body: JSON.stringify({ success: false, error: 'This endpoint only handles mode: explain. Use analyze-start for transcript analysis.' }) }
  }

  const { speaker, tip, meeting_name } = body

  if (!speaker || !tip) {
    return { statusCode: 400, body: JSON.stringify({ success: false, error: 'Missing speaker or tip' }) }
  }

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        explanation: `[Mock] This would provide a detailed explanation of "${tip.summary}" for ${speaker}. Claude would walk through the specific technique, explain why it matters in a BSA/healthcare context, and give 2-3 practice strategies.`
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

Please explain this coaching tip in depth — why it matters, the impact on how ${speaker.split(' ')[0]} is perceived, and 2-3 specific techniques to improve.`
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
