import io
from fastapi import APIRouter, HTTPException, UploadFile, File
from models.schemas import (
    ProfileAnalyzeRequest, ProfileAnalysisResponse, ProfileData, ScoreBreakdown,
)
from services.linkedin_service import fetch_linkedin_profile
from services.ai_service import score_profile
from services.supabase_service import save_profile

router = APIRouter(prefix="/profile", tags=["Profile"])


@router.post("/analyze-pdf", response_model=ProfileAnalysisResponse)
async def analyze_profile_pdf(pdf_file: UploadFile = File(...)):
    """Direct PDF upload → analysis without payment gate."""
    try:
        from pypdf import PdfReader
        import re
        content = await pdf_file.read()
        reader = PdfReader(io.BytesIO(content))
        profile_text = "\n".join(page.extract_text() or "" for page in reader.pages)
    except Exception as e:
        raise HTTPException(status_code=422, detail=f"Erro ao ler PDF: {e}")

    if not profile_text.strip():
        raise HTTPException(status_code=422, detail="Não foi possível extrair texto do PDF.")

    import re
    match = re.search(r'linkedin\.com/in/[\w\-]+', profile_text)
    linkedin_url = f"https://www.{match.group()}" if match else "https://linkedin.com/in/unknown"

    try:
        raw_profile = await fetch_linkedin_profile(linkedin_url, profile_text)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Erro ao processar perfil: {e}")

    try:
        scoring = await score_profile(raw_profile)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao pontuar perfil: {e}")

    overall_score = scoring.get("overall_score", 0)
    saved = await save_profile(linkedin_url=linkedin_url, profile_data=raw_profile, score=overall_score)

    profile = ProfileData(
        id=saved["id"],
        user_id=saved.get("user_id"),
        linkedin_url=saved["linkedin_url"],
        full_name=saved.get("full_name"),
        headline=saved.get("headline"),
        summary=saved.get("summary"),
        experience_json=saved.get("experience_json"),
        profile_score=saved.get("profile_score"),
        created_at=saved["created_at"],
    )
    breakdown = [ScoreBreakdown(**item) for item in scoring.get("score_breakdown", [])]
    return ProfileAnalysisResponse(profile=profile, score_breakdown=breakdown, overall_score=overall_score)


@router.post("/analyze", response_model=ProfileAnalysisResponse)
async def analyze_profile(request: ProfileAnalyzeRequest):
    try:
        raw_profile = await fetch_linkedin_profile(request.linkedin_url, request.profile_text)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Erro ao buscar perfil: {e}")

    try:
        scoring = await score_profile(raw_profile)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao pontuar perfil: {e}")

    overall_score = scoring.get("overall_score", 0)

    saved = await save_profile(
        linkedin_url=request.linkedin_url,
        profile_data=raw_profile,
        score=overall_score,
        user_id=request.user_id,
    )

    profile = ProfileData(
        id=saved["id"],
        user_id=saved.get("user_id"),
        linkedin_url=saved["linkedin_url"],
        full_name=saved.get("full_name"),
        headline=saved.get("headline"),
        summary=saved.get("summary"),
        experience_json=saved.get("experience_json"),
        profile_score=saved.get("profile_score"),
        created_at=saved["created_at"],
    )

    breakdown = [ScoreBreakdown(**item) for item in scoring.get("score_breakdown", [])]

    return ProfileAnalysisResponse(
        profile=profile,
        score_breakdown=breakdown,
        overall_score=overall_score,
    )
