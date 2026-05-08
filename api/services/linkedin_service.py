from config import settings


async def fetch_linkedin_profile(linkedin_url: str, profile_text: str | None = None) -> dict:
    """
    Extract structured profile data.
    - If profile_text is provided: Claude parses the raw text via tool use.
    - If only URL: returns a minimal stub so the flow continues.
    """
    if profile_text and profile_text.strip():
        return await _parse_with_claude(linkedin_url, profile_text)

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


_PARSE_PROFILE_TOOL = {
    "name": "submit_profile",
    "description": "Submits the structured LinkedIn profile extracted from raw text.",
    "input_schema": {
        "type": "object",
        "properties": {
            "full_name":            {"type": ["string", "null"]},
            "headline":             {"type": ["string", "null"]},
            "summary":              {"type": ["string", "null"]},
            "experiences": {
                "type": "array",
                "items": {
                    "type": "object",
                    "properties": {
                        "title":       {"type": ["string", "null"]},
                        "company":     {"type": ["string", "null"]},
                        "description": {"type": ["string", "null"]},
                        "starts_at":   {
                            "anyOf": [
                                {"type": "object", "properties": {"year": {"type": "integer"}}, "required": ["year"]},
                                {"type": "null"},
                            ]
                        },
                        "ends_at": {
                            "anyOf": [
                                {"type": "object", "properties": {"year": {"type": "integer"}}, "required": ["year"]},
                                {"type": "null"},
                            ]
                        },
                    },
                },
            },
            "skills":               {"type": "array", "items": {"type": "string"}},
            "education": {
                "type": "array",
                "items": {
                    "type": "object",
                    "properties": {
                        "school":      {"type": ["string", "null"]},
                        "degree_name": {"type": ["string", "null"]},
                        "starts_at":   {
                            "anyOf": [
                                {"type": "object", "properties": {"year": {"type": "integer"}}, "required": ["year"]},
                                {"type": "null"},
                            ]
                        },
                        "ends_at": {
                            "anyOf": [
                                {"type": "object", "properties": {"year": {"type": "integer"}}, "required": ["year"]},
                                {"type": "null"},
                            ]
                        },
                    },
                },
            },
            "connections":           {"type": ["integer", "null"]},
            "recommendations_count": {"type": "integer"},
            "profile_url":           {"type": ["string", "null"]},
        },
        "required": ["full_name", "headline", "experiences", "skills"],
    },
}


async def _parse_with_claude(linkedin_url: str, raw_text: str) -> dict:
    from services.ai_service import _call_tool

    result = await _call_tool(
        system="Você é especialista em extração de dados de perfis LinkedIn.",
        user=(
            f"Extraia as informações estruturadas deste texto bruto de perfil LinkedIn. "
            f"Use null para campos ausentes.\n\n"
            f"Texto do perfil:\n{raw_text[:4500]}\n\n"
            f"O campo profile_url deve ser: {linkedin_url}"
        ),
        tool=_PARSE_PROFILE_TOOL,
        max_tokens=2048,
    )
    result.setdefault("profile_url", linkedin_url)
    result.setdefault("recommendations_count", 0)
    result.setdefault("connections", None)
    return result
