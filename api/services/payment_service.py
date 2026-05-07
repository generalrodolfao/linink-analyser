"""
In-memory payment session store.
Each session holds the profile data pending analysis and its payment/analysis status.
Replace with a Redis or DB store in production.
"""
import uuid
from datetime import datetime, timedelta

# session_id → session dict
_sessions: dict[str, dict] = {}

SESSION_TTL_HOURS = 2


def create_session(linkedin_url: str, profile_text: str | None) -> str:
    session_id = str(uuid.uuid4())
    _sessions[session_id] = {
        "id": session_id,
        "status": "pending_payment",   # pending_payment | paid | analyzing | completed | failed
        "linkedin_url": linkedin_url,
        "profile_text": profile_text,
        "profile_id": None,            # filled after analysis
        "created_at": datetime.utcnow().isoformat(),
        "expires_at": (datetime.utcnow() + timedelta(hours=SESSION_TTL_HOURS)).isoformat(),
        "cakto_order_id": None,
        "analysis": None,
    }
    return session_id


def get_session(session_id: str) -> dict | None:
    s = _sessions.get(session_id)
    if not s:
        return None
    if datetime.utcnow() > datetime.fromisoformat(s["expires_at"]):
        _sessions.pop(session_id, None)
        return None
    return s


def find_session_by_order(order_id: str) -> dict | None:
    for s in _sessions.values():
        if s.get("cakto_order_id") == order_id:
            return s
    return None


def update_session(session_id: str, **kwargs) -> None:
    if session_id in _sessions:
        _sessions[session_id].update(kwargs)
