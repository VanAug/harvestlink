from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    APP_NAME: str = "HarvestLink Backend"
    DATABASE_URL: str = "sqlite+aiosqlite:////tmp/harvestlink.db"
    SECRET_KEY: str = "change-this-secret-key"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440

    # Comma-separated list of allowed frontend origins for CORS.
    # In development, the defaults cover localhost. In production on Vercel,
    # Vercel auto-injects the VERCEL_URL env var which we use here.
    # You can override this with the BACKEND_CORS_ORIGINS env var.
    BACKEND_CORS_ORIGINS: str = (
        "http://localhost:5173,"
        "http://localhost:3000,"
        "http://127.0.0.1:5173,"
        "https://harvest-link.com,"
        "https://www.harvest-link.com,"
        "https://harvestlink-nu.vercel.app,"
        "https://harvestlink-nu-git-main-vanaugs-projects.vercel.app"
    )

    CLOUDINARY_CLOUD_NAME: str | None = None
    CLOUDINARY_API_KEY: str | None = None
    CLOUDINARY_API_SECRET: str | None = None

    RESEND_API_KEY: str | None = None
    EMAIL_FROM: str = "HarvestLink <noreply@harvestlink.trade>"
    FRONTEND_URL: str = "https://harvest-link.com"

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    @property
    def cors_origins(self) -> list[str]:
        origins = [x.strip() for x in self.BACKEND_CORS_ORIGINS.split(",") if x.strip()]
        # Also allow the production FRONTEND_URL automatically
        if self.FRONTEND_URL and self.FRONTEND_URL not in origins:
            origins.append(self.FRONTEND_URL)
        return origins

settings = Settings()
