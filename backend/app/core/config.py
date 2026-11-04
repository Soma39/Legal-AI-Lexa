import os
from typing import List, Union
from pydantic import AnyHttpUrl, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore"
    )

    PROJECT_NAME: str = "LegalAI – AI-Driven Personalized Legal Assistance"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    ENVIRONMENT: str = "development"
    DEBUG: bool = True

    # Security & JWT
    SECRET_KEY: str = "supersecret_legalai_jwt_signing_key_change_in_production_32char_min"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours

    # Database
    DATABASE_URL: str = "sqlite:///./legalai.db"

    # LLM Settings
    LLM_PROVIDER: str = "demo"  # "demo", "gemini", "openai", "anthropic"
    LLM_API_KEY: str = ""
    LLM_MODEL: str = "gemini-1.5-flash"
    DEMO_MODE_NOTICE: str = "Operating in demonstration mode with verified Indian legal statutes."

    # Absolute directories anchored to backend directory
    BASE_DIR: str = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
    VECTOR_STORE_DIR: str = os.path.join(os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")), "data", "vector_store")
    DOCUMENT_UPLOAD_DIR: str = os.path.join(os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")), "data", "uploads")

    # CORS
    BACKEND_CORS_ORIGINS: Union[List[str], str] = [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000"
    ]

    @field_validator("BACKEND_CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",") if i.strip()]
        elif isinstance(v, list):
            return v
        return ["*"]

    # Initial Admin Seed
    FIRST_SUPERUSER_EMAIL: str = "admin@legalai.in"
    FIRST_SUPERUSER_PASSWORD: str = "AdminSecurePassword123!"


settings = Settings()

# Ensure necessary directories exist
os.makedirs(settings.VECTOR_STORE_DIR, exist_ok=True)
os.makedirs(settings.DOCUMENT_UPLOAD_DIR, exist_ok=True)
os.makedirs("./data/legal_corpus", exist_ok=True)
