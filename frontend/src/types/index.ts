export interface Profile {
  id: string
  user_id: string | null
  linkedin_url: string
  full_name: string | null
  headline: string | null
  summary: string | null
  experience_json: Record<string, unknown>[] | null
  profile_score: number | null
  created_at: string
}

export interface ScoreBreakdown {
  category: string
  score: number
  max_score: number
  suggestions: string[]
}

export interface ProfileAnalysis {
  profile: Profile
  score_breakdown: ScoreBreakdown[]
  overall_score: number
}

export interface AIOutput {
  id: string
  profile_id: string
  category: 'headline' | 'bio' | 'banner' | 'pitch' | 'application_email'
  content: string
  metadata: Record<string, unknown>
  created_at: string
}
