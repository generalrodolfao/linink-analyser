"""
Payment session store backed by Supabase.
Falls back to in-memory when Supabase is not configured (local dev).

WARNING: In-memory sessions are lost on process restart. Configure Supabase
for production reliability. Without it, a Railway redeploy between checkout
and webhook arrival will silently discard the session.
"""
import logging
import uuid
from datetime import datetime, timedelta, timezone

logger = logging.getLogger(__name__)

SESSION_TTL_HOURS = 24


def _db():
    from services.supabase_service import _db as db
    return db


# Fallback in-memory store
_sessions: dict[str, dict] = {}


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _parse_dt(s: str) -> datetime:
    """Parse ISO datetime string, always returning a timezone-aware datetime."""
    s = s.replace("Z", "+00:00")
    dt = datetime.fromisoformat(s)
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt


def create_session(linkedin_url: str, profile_text: str | None) -> str:
    session_id = str(uuid.uuid4())
    now = _now()
    record = {
        "id": session_id,
        "status": "pending_payment",
        "linkedin_url": linkedin_url,
        "profile_text": profile_text,
        "profile_id": None,
        "overall_score": None,
        "cakto_order_id": None,
        "analysis": None,
        "created_at": now.isoformat(),
        "expires_at": (now + timedelta(hours=SESSION_TTL_HOURS)).isoformat(),
    }
    db = _db()
    if db:
        try:
            db.table("payment_sessions").insert(record).execute()
            logger.info("Session %s created in Supabase", session_id)
            return session_id
        except Exception as e:
            logger.error("Supabase create_session failed, falling back to memory: %s", e)
    _sessions[session_id] = record
    logger.warning("Session %s stored in-memory only (will be lost on restart)", session_id)
    return session_id


def get_session(session_id: str) -> dict | None:
    db = _db()
    if db:
        try:
            result = db.table("payment_sessions").select("*").eq("id", session_id).execute()
            if result.data:
                s = result.data[0]
                expires_str = s.get("expires_at", "")
                if expires_str:
                    try:
                        if _now() >= _parse_dt(expires_str):
                            logger.info("Session %s expired", session_id)
                            return None
                    except Exception as te:
                        logger.warning("Could not parse expires_at '%s': %s", expires_str, te)
                return s
            logger.warning("Session %s not found in Supabase", session_id)
            return None
        except Exception as e:
            logger.error("Supabase get_session failed, falling back to memory: %s", e)
    s = _sessions.get(session_id)
    if not s:
        return None
    try:
        if _now() >= _parse_dt(s["expires_at"]):
            _sessions.pop(session_id, None)
            return None
    except Exception:
        pass
    return s


def find_session_by_order(order_id: str) -> dict | None:
    db = _db()
    if db:
        try:
            result = db.table("payment_sessions").select("*").eq("cakto_order_id", order_id).execute()
            if result.data:
                return result.data[0]
        except Exception as e:
            logger.error("Supabase find_session_by_order failed: %s", e)
    for s in _sessions.values():
        if s.get("cakto_order_id") == order_id:
            return s
    return None


def update_session(session_id: str, **kwargs) -> None:
    db = _db()
    if db:
        try:
            db.table("payment_sessions").update(kwargs).eq("id", session_id).execute()
            logger.info("Session %s updated in Supabase: %s", session_id, list(kwargs.keys()))
            return
        except Exception as e:
            logger.error("Supabase update_session failed for %s: %s", session_id, e)
    if session_id in _sessions:
        _sessions[session_id].update(kwargs)
        logger.info("Session %s updated in-memory: %s", session_id, list(kwargs.keys()))
