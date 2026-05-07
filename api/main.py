from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from config import settings
from routers import profile, branding, outreach, payment

app = FastAPI(
    title="LinkedIn Pro-Copilot API",
    description="API para otimização de perfil LinkedIn e geração de outreach com I.A.",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"https?://(?:localhost(:\d+)?|.*\.vercel\.app|frontend-datasquad\.vercel\.app)",
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(profile.router)
app.include_router(branding.router)
app.include_router(outreach.router)
app.include_router(payment.router)


@app.get("/health")
async def health():
    return {
        "status": "ok",
        "version": "0.1.0",
        "anthropic_configured": bool(settings.anthropic_api_key),
        "cakto_configured": bool(settings.cakto_checkout_url),
        "key_prefix": settings.anthropic_api_key[:12] + "..." if settings.anthropic_api_key else "EMPTY",
    }


@app.get("/health/anthropic")
async def health_anthropic():
    """Test live Anthropic API connectivity."""
    import anthropic as _anthropic
    try:
        client = _anthropic.AsyncAnthropic(api_key=settings.anthropic_api_key)
        msg = await client.messages.create(
            model="claude-haiku-4-5-20251001",
            max_tokens=10,
            messages=[{"role": "user", "content": "ping"}],
        )
        return {"status": "ok", "response": msg.content[0].text}
    except Exception as e:
        return {"status": "error", "detail": str(e), "type": type(e).__name__}
