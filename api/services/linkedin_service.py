import json
from config import settings


async def fetch_linkedin_profile(linkedin_url: str, profile_text: str | None = None) -> dict:
    """
    Extract structured profile data.
    - If profile_text is provided: Claude parses the raw text.
    - If only URL: returns a stub so the flow continues (user can paste text on the next call).
    """
    if profile_text and profile_text.strip():
        return await _parse_with_claude(linkedin_url, profile_text)

    # No text provided — return a minimal stub with the URL so scoring still works
    return {
        "full_name": None,
        "headline": None,
        "summary": None,
        "experiences": [],
        "skills": [],
        "education": [],
        "connections": None,
        "recommendations_count": 0,
        "profile_url": linkedin_url,
        "_stub": True,
    }


async def _parse_with_claude(linkedin_url: str, raw_text: str) -> dict:
    from services.ai_service import _call_ai
    import re

    prompt = f"""Você receberá o texto bruto copiado de um perfil do LinkedIn. Extraia as informações e retorne um JSON estruturado.

Texto do perfil:
{raw_text[:6000]}

Retorne APENAS um JSON válido com esta estrutura (use null para campos ausentes):
{{
  "full_name": "...",
  "headline": "...",
  "summary": "...",
  "experiences": [
    {{
      "title": "...",
      "company": "...",
      "description": "...",
      "starts_at": {{"year": 2020}},
      "ends_at": null
    }}
  ],
  "skills": ["...", "..."],
  "education": [
    {{
      "school": "...",
      "degree_name": "...",
      "starts_at": {{"year": 2015}},
      "ends_at": {{"year": 2019}}
    }}
  ],
  "connections": null,
  "recommendations_count": 0,
  "profile_url": "{linkedin_url}"
}}"""

    response = await _call_ai(prompt)

    match = re.search(r'\{[\s\S]*\}', response)
    if match:
        return json.loads(match.group())

    return {"full_name": None, "headline": None, "summary": raw_text[:500],
            "experiences": [], "skills": [], "education": [],
            "connections": None, "recommendations_count": 0, "profile_url": linkedin_url}
