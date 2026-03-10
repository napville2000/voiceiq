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
  share_of_voice: number
  clarity_score: number
  topic_leadership: number
  conciseness: number
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
  meeting_effectiveness: number
}

export interface Analysis {
  id: string
  user_id: string
  meeting_name: string
  meeting_date: string
  transcript_preview: string
  scores: AnalysisResult
  self_speaker_name: string | null
  created_at: string
}

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

export type SpeakerIdentityResult =
  | { matched: true; speakerName: string }
  | { matched: false; candidates: string[] }
