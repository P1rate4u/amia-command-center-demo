"""Fail-closed configuration for the private Phase 1 API."""
import os
from functools import lru_cache


@lru_cache
def settings() -> dict[str, str]:
    keys = ("DATABASE_URL", "OIDC_ISSUER", "OIDC_AUDIENCE", "OIDC_JWKS_URL", "ALLOWED_ORG_ID")
    values = {key: os.environ.get(key, "").strip() for key in keys}
    missing = [key for key, value in values.items() if not value]
    if missing:
        raise RuntimeError("Missing required configuration: " + ", ".join(missing))
    if not values["DATABASE_URL"].startswith("postgresql+psycopg://"):
        raise RuntimeError("DATABASE_URL must use PostgreSQL with psycopg")
    if not values["OIDC_JWKS_URL"].startswith("https://"):
        raise RuntimeError("OIDC_JWKS_URL must use HTTPS")
    if not values["OIDC_ISSUER"].startswith("https://"):
        raise RuntimeError("OIDC_ISSUER must use HTTPS")
    return values
