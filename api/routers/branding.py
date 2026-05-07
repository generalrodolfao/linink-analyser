import base64
from fastapi import APIRouter, HTTPException
from fastapi.responses import Response
from models.schemas import GenerationRequest, HeadlinesResponse, BioResponse, BannerResponse
from services.supabase_service import get_profile, save_ai_output
from services.ai_service import generate_headlines, generate_bio, generate_banner_svg

router = APIRouter(prefix="/branding", tags=["Branding"])


@router.post("/headlines", response_model=HeadlinesResponse)
async def create_headlines(request: GenerationRequest):
    profile = await _require_profile(request.profile_id)
    headlines = await generate_headlines(_slim(profile))
    await save_ai_output(request.profile_id, "headline", "\n---\n".join(headlines))
    return HeadlinesResponse(headlines=headlines, profile_id=request.profile_id)


@router.post("/bio", response_model=BioResponse)
async def create_bio(request: GenerationRequest):
    profile = await _require_profile(request.profile_id)
    bios = await generate_bio(_slim(profile))
    await save_ai_output(request.profile_id, "bio", "\n---\n".join(bios))
    return BioResponse(bios=bios, profile_id=request.profile_id)


@router.post("/banner", response_model=BannerResponse)
async def create_banner(request: GenerationRequest):
    profile = await _require_profile(request.profile_id)
    svg = await generate_banner_svg(_slim(profile))
    # Encode SVG as data URI so the frontend can use it directly in <img>
    svg_b64 = base64.b64encode(svg.encode()).decode()
    image_url = f"data:image/svg+xml;base64,{svg_b64}"
    await save_ai_output(request.profile_id, "banner", svg, {"type": "svg"})
    return BannerResponse(image_url=image_url, prompt_used="SVG gerado por Claude", profile_id=request.profile_id)


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
