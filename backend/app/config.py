from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "Comedy Ticket Booking Platform"
    debug: bool = True

    database_url: str
    redis_url: str

    jwt_secret_key: str
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 60

    seat_hold_minutes: int = 10

    app_timezone: str = "Asia/Kolkata"
    cors_origins: str

    smtp_host: str
    smtp_port: int = 587
    smtp_username: str
    smtp_password: str
    smtp_from_email: str
    frontend_base_url: str = "http://localhost:5173"
    email_verification_expire_minutes: int = 30

    model_config = SettingsConfigDict(
            env_file=".env",
            case_sensitive=False,
        )

settings = Settings()