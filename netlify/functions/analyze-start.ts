// Synchronous function — must complete in under 10 seconds
// Responsibilities:
//   1. Validate request
//   2. Store full transcript + metadata in Supabase (status: processing)
//   3. Invoke analyze-background with ONLY the analysis ID (tiny payload — avoids 256KB bg function limit)
//   4. Return analysis ID to frontend immediately
import type { Handler } from '@netlify/functions'
import { createClient } from '@supabase/supabase-js'

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ success: false, error: 'Method not allowed' }) }
  }

  let body: Record<string, string>
  try {
    body = JSON.parse(event.body ?? '{}')
  } catch {
    return { statusCode: 400, body: JSON.stringify({ success: false, error: 'Invalid JSON' }) }
  }

  const { transcript, meeting_name, meeting_date, user_id, self_speaker_name } = body

  if (!transcript || transcript.length < 100) {
    return { statusCode: 400, body: JSON.stringify({ success: false, error: 'Transcript too short' }) }
  }
  if (!user_id) {
    return { statusCode: 400, body: JSON.stringify({ success: false, error: 'user_id required' }) }
  }

  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Store full transcript in Supabase — background function will read and clear it
  const { data, error } = await supabase
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

  if (error || !data) {
    console.error('[analyze-start] DB insert error:', error)
    return { statusCode: 500, body: JSON.stringify({ success: false, error: 'Could not create analysis record' }) }
  }

  const analysisId = data.id

  // Invoke background function with only the analysis ID — well under 256KB limit
  const bgUrl = `${event.headers['x-forwarded-proto'] ?? 'https'}://${event.headers['host']}/.netlify/functions/analyze-background`
  
  fetch(bgUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ analysis_id: analysisId }),
  }).catch(err => console.error('[analyze-start] Failed to invoke background function:', err))

  return {
    statusCode: 200,
    body: JSON.stringify({ success: true, analysisId }),
  }
}
