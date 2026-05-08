import io
import logging
import re
from fastapi import APIRouter, HTTPException, Request, BackgroundTasks, UploadFile, File, Form
from pydantic import BaseModel
from typing import Any
from services.cakto_service import build_checkout_url, get_order, is_paid
from services.payment_service import (
    create_session, get_session, find_session_by_order, update_session,
)
from services.supabase_service import save_profile

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/payment", tags=["Payment"])


class CheckoutRequest(BaseModel):
    linkedin_url: str
    profile_text: str | None = None


class CheckoutResponse(BaseModel):
    session_id: str
    checkout_url: str


class SessionStatusResponse(BaseModel):
    session_id: str
    status: str
    profile_id: str | None = None
    overall_score: int | None = None
    score_breakdown: list[Any] | None = None


@router.post("/checkout-pdf", response_model=CheckoutResponse)
async def create_checkout_pdf(
    pdf_file: UploadFile = File(...),
    linkedin_url: str = Form(default=""),
):
    """Accept a LinkedIn PDF export, extract text, create payment session."""
    from config import settings
    if not settings.cakto_checkout_url:
        raise HTTPException(status_code=503, detail="Pagamento não configurado ainda.")

    if not pdf_file.filename or not pdf_file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=422, detail="Envie um arquivo PDF válido.")

    try:
        from pypdf import PdfReader
        content = await pdf_file.read()
        reader = PdfReader(io.BytesIO(content))
        profile_text = "\n".join(page.extract_text() or "" for page in reader.pages)
    except Exception as e:
        raise HTTPException(status_code=422, detail=f"Erro ao ler PDF: {e}")

    if not profile_text.strip():
        raise HTTPException(status_code=422, detail="Não foi possível extrair texto do PDF. Use um PDF gerado pelo LinkedIn.")

    # Try to find LinkedIn URL inside the PDF text if not provided
    if not linkedin_url:
        match = re.search(r'linkedin\.com/in/[\w\-]+', profile_text)
        linkedin_url = f"https://www.{match.group()}" if match else "https://linkedin.com/in/unknown"

    session_id = create_session(linkedin_url, profile_text)
    checkout_url = build_checkout_url(session_id)
    return CheckoutResponse(session_id=session_id, checkout_url=checkout_url)


@router.post("/checkout", response_model=CheckoutResponse)
async def create_checkout(req: CheckoutRequest):
    """Create a payment session and return the Cakto checkout URL."""
    from config import settings
    if not settings.cakto_checkout_url:
        raise HTTPException(status_code=503, detail="Pagamento não configurado ainda.")

    session_id = create_session(req.linkedin_url, req.profile_text)
    checkout_url = build_checkout_url(session_id)
    return CheckoutResponse(session_id=session_id, checkout_url=checkout_url)


@router.get("/status/{session_id}", response_model=SessionStatusResponse)
async def get_status(session_id: str):
    """Poll this endpoint after redirecting user to Cakto. Returns status + full analysis when done."""
    session = get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Sessão não encontrada ou expirada.")

    breakdown = None
    if session.get("analysis"):
        analysis = session["analysis"]
        breakdown = analysis.get("score_breakdown") if isinstance(analysis, dict) else None

    logger.debug("Status poll — session=%s status=%s", session_id, session["status"])
    return SessionStatusResponse(
        session_id=session_id,
        status=session["status"],
        profile_id=session.get("profile_id"),
        overall_score=session.get("overall_score"),
        score_breakdown=breakdown,
    )


@router.get("/webhook")
async def cakto_webhook_verify():
    """URL validation endpoint — Cakto sends a GET to verify the webhook URL."""
    return {"ok": True, "service": "linkedin-pro-copilot"}


@router.post("/webhook")
async def cakto_webhook(request: Request, background_tasks: BackgroundTasks):
    """
    Recebe eventos da Cakto. Formato confirmado pelo payload de teste:
    {
      "secret": "...",
      "event": "purchase_approved",
      "data": {
        "id": "<order-uuid>",
        "status": "paid",
        "utm_content": "<session_id>",
        ...
      }
    }
    """
    try:
        payload = await request.json()
    except Exception:
        raise HTTPException(status_code=400, detail="Payload inválido")

    # Validar secret do webhook
    from config import settings
    expected_secret = settings.cakto_webhook_secret
    if expected_secret and payload.get("secret") != expected_secret:
        logger.warning("Webhook com secret inválido recebido")
        raise HTTPException(status_code=401, detail="Secret inválido")

    event = payload.get("event", "")
    logger.info("Cakto webhook: event=%s", event)

    if event != "purchase_approved":
        return {"ok": True}

    order_data = payload.get("data", {})
    order_id = order_data.get("id")
    session_id = order_data.get("utm_content", "")
    status = order_data.get("status", "")

    logger.info("Pedido %s | status=%s | session=%s", order_id, status, session_id)

    if status != "paid":
        return {"ok": True}

    # Localizar a sessão pelo utm_content
    session = get_session(session_id) if session_id else None
    if not session and order_id:
        session = find_session_by_order(order_id)

    if not session:
        logger.warning("Sessão não encontrada: utm_content=%s order=%s", session_id, order_id)
        return {"ok": True}  # 200 para Cakto não retentar

    if session["status"] in ("completed", "analyzing"):
        return {"ok": True}

    update_session(session["id"], status="paid", cakto_order_id=order_id)
    background_tasks.add_task(_run_analysis, session["id"])

    return {"ok": True}


@router.post("/verify/{order_id}")
async def verify_and_run(order_id: str, background_tasks: BackgroundTasks):
    """
    Manual verification endpoint: call this after returning from Cakto
    if the webhook hasn't fired yet. Validates the order directly via API.
    """
    try:
        order = await get_order(order_id)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Erro ao verificar pedido: {e}")

    if not is_paid(order):
        raise HTTPException(status_code=402, detail="Pagamento ainda não confirmado.")

    utm = (
        order.get("utm_content")
        or order.get("utmContent")
        or ""
    )

    session = get_session(utm) if utm else None
    if not session:
        session = find_session_by_order(order_id)

    if not session:
        raise HTTPException(status_code=404, detail="Sessão de análise não encontrada.")

    if session["status"] in ("completed", "analyzing"):
        return SessionStatusResponse(
            session_id=session["id"],
            status=session["status"],
            profile_id=session.get("profile_id"),
            overall_score=session.get("overall_score"),
        )

    update_session(session["id"], status="paid", cakto_order_id=order_id)
    background_tasks.add_task(_run_analysis, session["id"])

    return SessionStatusResponse(session_id=session["id"], status="analyzing")


async def _run_analysis(session_id: str) -> None:
    """Background task: analyse profile and store result in session."""
    session = get_session(session_id)
    if not session:
        logger.error("_run_analysis: sessão %s não encontrada (processo reiniciou?)", session_id)
        return

    update_session(session_id, status="analyzing")
    logger.info("Iniciando análise — session=%s linkedin=%s", session_id, session.get("linkedin_url"))

    try:
        from services.ai_service import parse_and_score
        from services.linkedin_service import fetch_linkedin_profile

        profile_text = session.get("profile_text") or ""

        if profile_text.strip():
            logger.info("parse_and_score via profile_text — session=%s chars=%d",
                        session_id, len(profile_text))
            raw_profile, scoring = await parse_and_score(profile_text)
        else:
            logger.info("fetch + score via URL — session=%s url=%s",
                        session_id, session.get("linkedin_url"))
            from services.ai_service import score_profile
            raw_profile = await fetch_linkedin_profile(session["linkedin_url"])
            scoring = await score_profile(raw_profile)

        overall_score = scoring.get("overall_score", 0)
        logger.info("Claude concluiu análise — session=%s overall_score=%s", session_id, overall_score)

        saved = await save_profile(
            linkedin_url=session["linkedin_url"],
            profile_data=raw_profile,
            score=overall_score,
        )

        update_session(
            session_id,
            status="completed",
            profile_id=saved["id"],
            overall_score=overall_score,
            analysis=scoring,
        )
        logger.info("Análise concluída — session=%s score=%s profile=%s",
                    session_id, overall_score, saved["id"])

    except Exception as e:
        logger.error("ERRO NA ANÁLISE — session=%s tipo=%s erro=%s",
                     session_id, type(e).__name__, e, exc_info=True)
        update_session(session_id, status="failed")


# ── Debug / diagnostics ──────────────────────────────────────────────────────

@router.get("/health/db")
async def payment_db_health():
    """Check Supabase connectivity and whether payment_sessions table exists."""
    from services.supabase_service import _db as db
    if not db:
        return {"supabase": False, "reason": "SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY não configurados", "sessions_in_memory": True}
    try:
        result = db.table("payment_sessions").select("id").limit(1).execute()
        return {"supabase": True, "table_ok": True, "sample_rows": len(result.data)}
    except Exception as e:
        return {"supabase": True, "table_ok": False, "error": str(e)}


@router.get("/debug/{session_id}")
async def debug_session(session_id: str):
    """Return raw session data for debugging. Remove before GA."""
    from services.payment_service import _sessions
    from services.supabase_service import _db as db

    mem = _sessions.get(session_id)
    supa = None
    if db:
        try:
            result = db.table("payment_sessions").select("id,status,overall_score,cakto_order_id,created_at,expires_at").eq("id", session_id).execute()
            supa = result.data[0] if result.data else None
        except Exception as e:
            supa = {"error": str(e)}

    return {
        "session_id": session_id,
        "in_memory": bool(mem),
        "in_memory_status": mem.get("status") if mem else None,
        "in_supabase": bool(supa and "error" not in supa),
        "supabase_data": supa,
    }


@router.post("/trigger-analysis/{session_id}")
async def trigger_analysis(session_id: str, background_tasks: BackgroundTasks):
    """
    Manually re-trigger analysis for a paid session. Use when webhook fired
    but analysis never started (e.g., after a process restart wiped in-memory state).
    """
    session = get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Sessão não encontrada.")
    if session["status"] == "completed":
        return {"ok": True, "message": "Análise já concluída.", "status": session["status"]}
    if session["status"] == "analyzing":
        return {"ok": True, "message": "Análise em andamento.", "status": session["status"]}
    if session["status"] not in ("paid", "failed"):
        raise HTTPException(status_code=400, detail=f"Status '{session['status']}' não permite re-análise. Pagamento confirmado?")

    background_tasks.add_task(_run_analysis, session_id)
    return {"ok": True, "message": "Análise iniciada.", "session_id": session_id}
