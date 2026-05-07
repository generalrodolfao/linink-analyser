from fastapi import APIRouter, HTTPException
from models.schemas import (
    PitchRequest, PitchResponse,
    ApplicationEmailRequest, ApplicationEmailResponse,
)
from services.supabase_service import get_profile, save_ai_output
from services.ai_service import generate_pitch, generate_application_email

router = APIRouter(prefix="/outreach", tags=["Outreach"])


@router.post("/pitch", response_model=PitchResponse)
async def create_pitch(request: PitchRequest):
    profile = await _require_profile(request.profile_id)
    pitches = await generate_pitch(_slim(profile), request.signal)
    await save_ai_output(request.profile_id, "pitch", "\n---\n".join(pitches), {"signal": request.signal})
    return PitchResponse(pitches=pitches, profile_id=request.profile_id)


@router.post("/application-email", response_model=ApplicationEmailResponse)
async def create_application_email(request: ApplicationEmailRequest):
    profile = await _require_profile(request.profile_id)
    email = await generate_application_email(_slim(profile), request.job_description)
    await save_ai_output(
        request.profile_id,
        "application_email",
        email,
        {"jd_length": len(request.job_description)},
    )
    return ApplicationEmailResponse(email=email, profile_id=request.profile_id)


async def _require_profile(profile_id: str) -> dict:
    profile = await get_profile(profile_id)
    if not profile:
        raise HTTPException(status_code=404, detail="Perfil não encontrado")
    return profile


def _slim(profile: dict) -> dict:
    return {
        "full_name": profile.get("full_name"),
        "headline": profile.get("headline"),
        "summary": profile.get("summary"),
        "experience_json": profile.get("experience_json", []),
    }
