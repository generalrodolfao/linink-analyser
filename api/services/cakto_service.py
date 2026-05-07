import httpx
from config import settings

_token_cache: dict = {}
CAKTO_BASE = "https://api.cakto.com.br"


async def get_access_token() -> str:
    """Obtain and cache Cakto OAuth Bearer token."""
    import time
    cached = _token_cache.get("token")
    expires_at = _token_cache.get("expires_at", 0)

    if cached and time.time() < expires_at - 60:
        return cached

    async with httpx.AsyncClient() as client:
        resp = await client.post(
            f"{CAKTO_BASE}/public_api/token/",
            data={
                "client_id": settings.cakto_client_id,
                "client_secret": settings.cakto_client_secret,
            },
            headers={"Content-Type": "application/x-www-form-urlencoded"},
            timeout=15.0,
        )
        resp.raise_for_status()
        data = resp.json()

    _token_cache["token"] = data["access_token"]
    _token_cache["expires_at"] = time.time() + data.get("expires_in", 36000)
    return data["access_token"]


async def get_order(order_id: str) -> dict:
    """Fetch a single order from Cakto and return it."""
    token = await get_access_token()
    async with httpx.AsyncClient() as client:
        resp = await client.get(
            f"{CAKTO_BASE}/public_api/orders/{order_id}/",
            headers={"Authorization": f"Bearer {token}"},
            timeout=15.0,
        )
        resp.raise_for_status()
        return resp.json()


def is_paid(order: dict) -> bool:
    return order.get("status") in ("paid", "authorized")


def build_checkout_url(session_id: str) -> str:
    """Append utm_content=session_id to the pre-configured Cakto checkout URL."""
    base = settings.cakto_checkout_url.rstrip("?&")
    sep = "&" if "?" in base else "?"
    return f"{base}{sep}utm_content={session_id}"
