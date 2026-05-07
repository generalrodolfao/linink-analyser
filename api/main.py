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
    allow_origin_regex=r"http://localhost(:\d+)?",
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
    return {"status": "ok", "version": "0.1.0"}
