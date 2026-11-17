from functools import lru_cache

from pydantic import Field, SecretStr, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    app_name: str = "EnerPilot API"
    app_env: str = "development"
    database_url: str = "postgresql+psycopg://localhost/enerpilot"
    jwt_secret: SecretStr = SecretStr("")
    jwt_issuer: str = "enerpilot"
    jwt_access_token_minutes: int = Field(default=30, ge=1, le=1440)
    cors_origins: list[str] = ["http://localhost:3000", "http://localhost:5173"]
    ml_service_url: str | None = None
    energy_cost_per_kwh: float = Field(default=0, ge=0)
    co2_kg_per_kwh: float = Field(default=0, ge=0)
    rate_limit_per_minute: int = Field(default=120, ge=1, le=10000)
    max_request_bytes: int = Field(default=1_048_576, ge=1024, le=10_485_760)

    @field_validator("cors_origins", mode="before")
    @classmethod
    def split_origins(cls, value: str | list[str]) -> str | list[str]:
        if isinstance(value, str):
            return [origin.strip() for origin in value.split(",") if origin.strip()]
        return value

    def validate_security_configuration(self) -> None:
        secret = self.jwt_secret.get_secret_value()
        if self.app_env.lower() == "production" and len(secret) < 32:
            raise ValueError("JWT_SECRET must contain at least 32 characters in production")
        if "*" in self.cors_origins and self.app_env.lower() == "production":
            raise ValueError("Wildcard CORS origins are not allowed in production")


@lru_cache
def get_settings() -> Settings:
    settings = Settings()
    settings.validate_security_configuration()
    return settings
