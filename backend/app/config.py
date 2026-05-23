from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

BACKEND_DIR = Path(__file__).resolve().parents[1]


class Settings(BaseSettings):
    app_name: str = "AI Recovery & Post-Workout Feast Architect"
    environment: str = "development"
    database_url: str = "sqlite:///./recovery_feast.db"
    strava_client_id: str = ""
    strava_client_secret: str = ""
    strava_redirect_uri: str = "http://127.0.0.1:8000/auth/strava/callback"
    app_base_url: str = "http://127.0.0.1:8000"
    frontend_base_url: str = "http://localhost:5173"
    yelp_api_key: str = ""
    openai_api_key: str = ""
    openai_model: str = "gpt-4o-mini"

    model_config = SettingsConfigDict(
        env_file=BACKEND_DIR / ".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )


settings = Settings()


def get_cors_origins() -> list[str]:
    origins = {
        settings.frontend_base_url,
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    }
    return sorted(origin.rstrip("/") for origin in origins if origin)
