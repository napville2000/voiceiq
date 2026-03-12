import type { Handler } from '@netlify/functions'
import { createClient } from '@supabase/supabase-js'

// This function:
// 1. Validates the request
// 2. Creates a 'processing' row in Supabase
// 3. Fires the background function
// 4. Returns the analysis ID immediately (< 1s)

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

  // Init Supabase with service role key (server-side only — bypasses RLS for insert)
  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Create the pending analysis row
  const { data, error } = await supabase
    .from('analyses')
    .insert({
      user_id,
      meeting_name: meeting_name || 'Untitled Meeting',
      meeting_date: meeting_date || new Date().toISOString().split('T')[0],
      transcript_preview: transcript.slice(0, 200),
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

  // Fire the background function — don't await it
  const siteUrl = process.env.SITE_URL ?? process.env.DEPLOY_URL ?? 'https://voiceiq-napville2000.netlify.app'
  const bgUrl = `${siteUrl}/.netlify/functions/analyze-bg`
  fetch(bgUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ analysis_id: analysisId, transcript, meeting_name, meeting_date }),
  }).catch(err => console.error('[analyze-start] Failed to trigger bg function:', err))

  return {
    statusCode: 200,
    body: JSON.stringify({ success: true, analysisId }),
  }
}