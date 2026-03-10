import type { VercelRequest, VercelResponse } from '@vercel/node'

export default function handler(_req: VercelRequest, res: VercelResponse) {
  const supabaseConfigured = !!(
    process.env.VITE_SUPABASE_URL && process.env.VITE_SUPABASE_ANON_KEY
  )
  const claudeConfigured = !!process.env.ANTHROPIC_API_KEY

  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    supabase: supabaseConfigured ? 'connected' : 'not configured',
    claude: claudeConfigured ? 'configured' : 'not configured',
  })
}
