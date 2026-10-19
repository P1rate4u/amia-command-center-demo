"""Database session handling. Schema is maintained by SQL migrations."""
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from .config import settings

_engine = None
_session_factory = None


def get_session():
    global _engine, _session_factory
    if _session_factory is None:
        _engine = create_engine(settings()["DATABASE_URL"], pool_pre_ping=True)
        _session_factory = sessionmaker(_engine, autoflush=False, expire_on_commit=False)
    with _session_factory() as session:
        yield session
