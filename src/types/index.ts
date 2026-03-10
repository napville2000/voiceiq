// ── Auth ────────────────────────────────────────────────────────────────────
export interface UserProfile {
  id: string
  email: string
  full_name: string
  role: 'analyst' | 'director'
  created_at: string
}

// ── Analysis ─────────────────────────────────────────────────────────────────
export interface SpeakerScore {
  name: string
  share_of_voice: number        // 0–100 percent
  clarity_score: number         // 0–100
  topic_leadership: number      // 0–100
  conciseness: number           // 0–100
  pacing: 'slow' | 'good' | 'fast'
  word_count: number
  tips: string[]
}

export interface TopicCoverage {
  topic: string
  primary_speaker: string
  coverage_quality: 'strong' | 'partial' | 'weak'
  speakers_involved: string[]
}

export interface AnalysisResult {
  speakers: SpeakerScore[]
  topics: TopicCoverage[]
  overall_summary: string
  meeting_effectiveness: number  // 0–100
}

export interface Analysis {
  id: string
  user_id: string
  meeting_name: string
  meeting_date: string
  transcript_preview: string     // first 200 chars only, for history list
  scores: AnalysisResult
  created_at: string
}

// ── API ──────────────────────────────────────────────────────────────────────
export interface AnalyzeRequest {
  transcript: string
  meeting_name: string
  meeting_date: string
}

export interface AnalyzeResponse {
  success: boolean
  data?: AnalysisResult
  error?: string
}

export interface HealthResponse {
  status: 'ok'
  timestamp: string
  supabase: 'connected' | 'not configured'
  claude: 'configured' | 'not configured'
}
