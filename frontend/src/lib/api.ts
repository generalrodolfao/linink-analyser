const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

async function request<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

export const analyzeProfile = (linkedinUrl: string, profileText?: string) =>
  request('/profile/analyze', { linkedin_url: linkedinUrl, profile_text: profileText || null })

export const generateHeadlines = (profileId: string) =>
  request('/branding/headlines', { profile_id: profileId })

export const generateBio = (profileId: string) =>
  request('/branding/bio', { profile_id: profileId })

export const generateBanner = (profileId: string) =>
  request('/branding/banner', { profile_id: profileId })

export const generatePitch = (profileId: string, signal: string) =>
  request('/outreach/pitch', { profile_id: profileId, signal })

export const generateApplicationEmail = (profileId: string, jobDescription: string) =>
  request('/outreach/application-email', { profile_id: profileId, job_description: jobDescription })
