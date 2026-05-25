from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    APP_NAME: str = "HarvestLink Backend"
    DATABASE_URL: str = "sqlite+aiosqlite:////tmp/harvestlink.db"
    SECRET_KEY: str = "change-this-secret-key"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440

    # Comma-separated list of allowed frontend origins.
    # The production frontend is included in the default so the app works
    # on Vercel even if this env var is not explicitly set.
    BACKEND_CORS_ORIGINS: str = (
        "http://localhost:5173,"
        "http://localhost:3000,"
        "http://127.0.0.1:5173,"
        "https://harvestlink-nu.vercel.app"
    )

    CLOUDINARY_CLOUD_NAME: str | None = None
    CLOUDINARY_API_KEY: str | None = None
    CLOUDINARY_API_SECRET: str | None = None

    RESEND_API_KEY: str | None = None
    EMAIL_FROM: str = "HarvestLink <noreply@harvestlink.trade>"
    FRONTEND_URL: str = "https://harvestlink-nu.vercel.app"

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    @property
    def cors_origins(self) -> list[str]:
        return [x.strip() for x in self.BACKEND_CORS_ORIGINS.split(",") if x.strip()]

settings = Settings()