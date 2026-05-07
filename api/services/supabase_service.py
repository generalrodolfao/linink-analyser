import uuid
from datetime import datetime
from config import settings

try:
    from supabase import create_client, Client
    _db: Client | None = (
        create_client(settings.supabase_url, settings.supabase_service_role_key)
        if settings.supabase_url and settings.supabase_service_role_key
        else None
    )
except Exception:
    _db = None

# In-memory store used when Supabase is not configured (development)
_profiles: dict[str, dict] = {}


async def save_profile(
    linkedin_url: str,
    profile_data: dict,
    score: int,
    user_id: str | None = None,
) -> dict:
    record = {
        "id": str(uuid.uuid4()),
        "user_id": user_id,
        "linkedin_url": linkedin_url,
        "full_name": profile_data.get("full_name"),
        "headline": profile_data.get("headline"),
        "summary": profile_data.get("summary"),
        "experience_json": profile_data.get("experiences", []),
        "profile_score": score,
        "created_at": datetime.utcnow().isoformat(),
    }

    if _db:
        result = _db.table("profiles").insert(record).execute()
        saved = result.data[0] if result.data else record
    else:
        _profiles[record["id"]] = record
        saved = record

    return saved


async def get_profile(profile_id: str) -> dict | None:
    if _db:
        result = _db.table("profiles").select("*").eq("id", profile_id).execute()
        return result.data[0] if result.data else None
    return _profiles.get(profile_id)


async def save_ai_output(
    profile_id: str,
    category: str,
    content: str,
    metadata: dict | None = None,
) -> dict:
    record = {
        "id": str(uuid.uuid4()),
        "profile_id": profile_id,
        "category": category,
        "content": content,
        "metadata": metadata or {},
        "created_at": datetime.utcnow().isoformat(),
    }

    if _db:
        _db.table("ai_outputs").insert(record).execute()

    return record
