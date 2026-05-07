from pydantic import BaseModel
from typing import Any


class ProfileAnalyzeRequest(BaseModel):
    linkedin_url: str
    profile_text: str | None = None  # texto copiado do LinkedIn (substitui Proxycurl)
    user_id: str | None = None


class ScoreBreakdown(BaseModel):
    category: str
    score: int
    max_score: int
    suggestions: list[str]


class ProfileData(BaseModel):
    id: str
    user_id: str | None
    linkedin_url: str
    full_name: str | None
    headline: str | None
    summary: str | None
    experience_json: list[dict[str, Any]] | None
    profile_score: int | None
    created_at: str


class ProfileAnalysisResponse(BaseModel):
    profile: ProfileData
    score_breakdown: list[ScoreBreakdown]
    overall_score: int


class GenerationRequest(BaseModel):
    profile_id: str


class HeadlinesResponse(BaseModel):
    headlines: list[str]
    profile_id: str


class BioResponse(BaseModel):
    bios: list[str]
    profile_id: str


class BannerResponse(BaseModel):
    image_url: str
    prompt_used: str
    profile_id: str


class PitchRequest(BaseModel):
    profile_id: str
    signal: str


class PitchResponse(BaseModel):
    pitches: list[str]
    profile_id: str


class ApplicationEmailRequest(BaseModel):
    profile_id: str
    job_description: str


class ApplicationEmailResponse(BaseModel):
    email: str
    profile_id: str
