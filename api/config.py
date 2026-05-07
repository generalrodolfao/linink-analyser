from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    anthropic_api_key: str = ""
    openai_api_key: str = ""
    proxycurl_api_key: str = ""
    replicate_api_token: str = ""
    supabase_url: str = ""
    supabase_service_role_key: str = ""
    ai_provider: str = "anthropic"
    cors_origins: str = "http://localhost:3000"

    # Cakto payment
    cakto_client_id: str = ""
    cakto_client_secret: str = ""
    cakto_checkout_url: str = ""   # ex: https://pay.cakto.com.br/OFFER_ID
    cakto_analysis_price: str = "29.90"
    cakto_webhook_secret: str = ""


settings = Settings()

# Strip whitespace/newlines from keys that may be pasted with formatting
settings.anthropic_api_key = "".join(settings.anthropic_api_key.split())
