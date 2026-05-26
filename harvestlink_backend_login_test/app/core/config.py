from pydantic_settings import BaseSettings, SettingsConfigDict

ALWAYS_ALLOWED_CORS_ORIGINS = [
    "http://localhost:5173",
    "http://localhost:3000",
    "http://127.0.0.1:5173",
    "https://harvest-link.com",
    "https://www.harvest-link.com",
    "https://harvestlink-nu.vercel.app",
    "https://harvestlink-nu-git-main-vanaugs-projects.vercel.app",
]

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
    VERCEL_URL: str | None = None

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    @property
    def cors_origins(self) -> list[str]:
        origins = [x.strip() for x in self.BACKEND_CORS_ORIGINS.split(",") if x.strip()]

        for origin in ALWAYS_ALLOWED_CORS_ORIGINS:
            if origin not in origins:
                origins.append(origin)

        for origin in (self.FRONTEND_URL, self.vercel_origin):
            if origin and origin not in origins:
                origins.append(origin)

        return origins

    @property
    def vercel_origin(self) -> str | None:
        if not self.VERCEL_URL:
            return None
        return self.VERCEL_URL if self.VERCEL_URL.startswith("http") else f"https://{self.VERCEL_URL}"

settings = Settings()
