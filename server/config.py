from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    DB_BACKEND: str = "firestore"        # firestore | (future) sql | memory
    FIREBASE_CRED_PATH: str | None = None

    class Config:
        env_file = ".env"

settings = Settings()
