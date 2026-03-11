// ── Auth ────────────────────────────────────────────────────────────────────
export interface UserProfile {
  id: string
  email: string
  full_name: string
  role: 'analyst' | 'director'
  created_at: string
}

// ── Analysis ─────────────────────────────────────────────────────────────────
export interface SpeakerTip {
  summary: string
  observation: string
  before: string
  after: string
  priority: 'high' | 'medium'
  effort: 'easy' | 'hard'
}

export interface SpeakerScore {
  name: string
  share_of_voice: number
  clarity_score: number
  topic_leadership: number
  conciseness: number
  pacing: 'slow' | 'good' | 'fast'
  word_count: number
  tips: SpeakerTip[]
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

// ── API ──────────────────────────────────────────────────────────────────────
export interface AnalyzeResponse {
  success: boolean
  data?: AnalysisResult
  error?: string
}

export interface ExplainResponse {
  success: boolean
  explanation?: string
  error?: string
}

export type SpeakerIdentityResult =
  | { matched: true; speakerName: string }
  | { matched: false; candidates: string[] }
