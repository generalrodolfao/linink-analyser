"""
Payment session store backed by Supabase.
Falls back to in-memory when Supabase is not configured (local dev).
"""
import uuid
from datetime import datetime, timedelta

SESSION_TTL_HOURS = 24


def _db():
    from services.supabase_service import _db as db
    return db


# Fallback in-memory store
_sessions: dict[str, dict] = {}


def create_session(linkedin_url: str, profile_text: str | None) -> str:
    session_id = str(uuid.uuid4())
    record = {
        "id": session_id,
        "status": "pending_payment",
        "linkedin_url": linkedin_url,
        "profile_text": profile_text,
        "profile_id": None,
        "overall_score": None,
        "cakto_order_id": None,
        "analysis": None,
        "created_at": datetime.utcnow().isoformat(),
        "expires_at": (datetime.utcnow() + timedelta(hours=SESSION_TTL_HOURS)).isoformat(),
    }
    db = _db()
    if db:
        try:
            db.table("payment_sessions").insert(record).execute()
            return session_id
        except Exception:
            pass
    _sessions[session_id] = record
    return session_id


def get_session(session_id: str) -> dict | None:
    db = _db()
    if db:
        try:
            result = db.table("payment_sessions").select("*").eq("id", session_id).execute()
            if result.data:
                s = result.data[0]
                if datetime.utcnow() < datetime.fromisoformat(s["expires_at"]):
                    return s
                return None
        except Exception:
            pass
    s = _sessions.get(session_id)
    if not s:
        return None
    if datetime.utcnow() > datetime.fromisoformat(s["expires_at"]):
        _sessions.pop(session_id, None)
        return None
    return s


def find_session_by_order(order_id: str) -> dict | None:
    db = _db()
    if db:
        try:
            result = db.table("payment_sessions").select("*").eq("cakto_order_id", order_id).execute()
            if result.data:
                return result.data[0]
        except Exception:
            pass
    for s in _sessions.values():
        if s.get("cakto_order_id") == order_id:
            return s
    return None


def update_session(session_id: str, **kwargs) -> None:
    db = _db()
    if db:
        try:
            db.table("payment_sessions").update(kwargs).eq("id", session_id).execute()
            return
        except Exception:
            pass
    if session_id in _sessions:
        _sessions[session_id].update(kwargs)
