import logging
from fastapi import APIRouter, HTTPException, Request, BackgroundTasks
from pydantic import BaseModel
from services.cakto_service import build_checkout_url, get_order, is_paid
from services.payment_service import (
    create_session, get_session, find_session_by_order, update_session,
)
from services.linkedin_service import fetch_linkedin_profile
from services.ai_service import score_profile
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
    """Poll this endpoint after redirecting user to Cakto. Returns status + profile_id when done."""
    session = get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Sessão não encontrada ou expirada.")

    return SessionStatusResponse(
        session_id=session_id,
        status=session["status"],
        profile_id=session.get("profile_id"),
        overall_score=session.get("overall_score"),
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
    """Background task: fetch + score profile and store result in session."""
    session = get_session(session_id)
    if not session:
        return

    update_session(session_id, status="analyzing")
    try:
        raw_profile = await fetch_linkedin_profile(
            session["linkedin_url"], session.get("profile_text")
        )
        scoring = await score_profile(raw_profile)
        overall_score = scoring.get("overall_score", 0)

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
        logger.info("Análise concluída para sessão %s — score %s", session_id, overall_score)

    except Exception as e:
        logger.error("Erro na análise da sessão %s: %s", session_id, e)
        update_session(session_id, status="failed")
