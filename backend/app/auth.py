"""Validate externally issued OIDC JWTs; never trust browser-supplied identity."""
from functools import lru_cache
from typing import Annotated

import jwt
from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from .config import settings

_bearer = HTTPBearer(auto_error=False)


@lru_cache
def _jwks_client(url: str):
    return jwt.PyJWKClient(url)


def current_user(credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(_bearer)]) -> str:
    if credentials is None or credentials.scheme.lower() != "bearer":
        raise HTTPException(status_code=401, detail="Authentication required")
    cfg = settings()
    try:
        key = _jwks_client(cfg["OIDC_JWKS_URL"]).get_signing_key_from_jwt(credentials.credentials).key
        claims = jwt.decode(
            credentials.credentials,
            key,
            algorithms=["RS256"],
            audience=cfg["OIDC_AUDIENCE"],
            issuer=cfg["OIDC_ISSUER"],
            options={"require": ["sub", "exp", "iss", "aud", "iat"]},
            leeway=30,
        )
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid access token") from None
    if claims.get("org_id") != cfg["ALLOWED_ORG_ID"]:
        raise HTTPException(status_code=403, detail="Organization access denied")
    return str(claims["sub"])
