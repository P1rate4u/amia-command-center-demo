"""Authenticated, auditable project endpoints for Phase 1."""
from datetime import date, timedelta
from typing import Annotated
from uuid import UUID

from fastapi import Depends, FastAPI, HTTPException
from sqlalchemy import text
from sqlalchemy.orm import Session

from .auth import current_user
from .database import get_session
from .schemas import ProjectEdit, ProjectInput, ProjectView

app = FastAPI(title="Amia Command Center API", docs_url=None, redoc_url=None)
Db = Annotated[Session, Depends(get_session)]
User = Annotated[str, Depends(current_user)]

_COLUMNS = """id, client_name, project_name, owner_user_id, due_date, stage, status,
progress_pct, blocker, next_action, version, updated_by, created_at, updated_at"""


def as_view(row):
    return ProjectView.model_validate(dict(row._mapping))


def write_audit(db: Session, project_id: UUID, actor: str, action: str):
    db.execute(text("""
        INSERT INTO project_audit (project_id, action, actor_user_id, snapshot)
        SELECT id, :action, :actor, to_jsonb(projects) FROM projects WHERE id=:id
    """), {"id": str(project_id), "action": action, "actor": actor})


@app.get("/health")
def health():
    # Does not reveal connection details or sensitive status.
    return {"service": "amia-phase1-api", "status": "running"}


@app.get("/v1/projects", response_model=list[ProjectView])
def list_projects(db: Db, user: User):
    rows = db.execute(text(f"SELECT {_COLUMNS} FROM projects ORDER BY due_date ASC, created_at DESC LIMIT 500"))
    return [as_view(row) for row in rows]


@app.get("/v1/projects/summary")
def project_summary(db: Db, user: User):
    row = db.execute(text("""
        SELECT
          COUNT(*) FILTER (WHERE status <> 'Completed') AS active,
          COUNT(*) FILTER (WHERE status='Blocked') AS blocked,
          COUNT(*) FILTER (WHERE status<>'Completed' AND due_date < CURRENT_DATE) AS overdue,
          COUNT(*) FILTER (WHERE status<>'Completed'
              AND due_date BETWEEN CURRENT_DATE AND CURRENT_DATE + 7) AS due_week
        FROM projects
    """)).one()
    return dict(row._mapping)


@app.post("/v1/projects", response_model=ProjectView, status_code=201)
def create_project(payload: ProjectInput, db: Db, user: User):
    values = payload.model_dump(mode="json") | {"actor": user}
    row = db.execute(text(f"""
        INSERT INTO projects (client_name, project_name, owner_user_id, due_date,
           stage, status, progress_pct, blocker, next_action, updated_by)
        VALUES (:client_name, :project_name, :owner_user_id, :due_date,
           :stage, :status, :progress_pct, :blocker, :next_action, :actor)
        RETURNING {_COLUMNS}
    """), values).one()
    item = as_view(row)
    write_audit(db, item.id, user, "created")
    db.commit()
    return item


@app.put("/v1/projects/{project_id}", response_model=ProjectView)
def update_project(project_id: UUID, payload: ProjectEdit, db: Db, user: User):
    values = payload.model_dump(mode="json") | {"actor": user, "id": str(project_id)}
    row = db.execute(text(f"""
        UPDATE projects
        SET client_name=:client_name, project_name=:project_name,
            owner_user_id=:owner_user_id, due_date=:due_date, stage=:stage,
            status=:status, progress_pct=:progress_pct, blocker=:blocker,
            next_action=:next_action, updated_by=:actor,
            updated_at=NOW(), version=version+1
        WHERE id=:id AND version=:version
        RETURNING {_COLUMNS}
    """), values).one_or_none()
    if row is None:
        exists = db.execute(text("SELECT 1 FROM projects WHERE id=:id"), {"id": str(project_id)}).one_or_none()
        raise HTTPException(status_code=409 if exists else 404,
                            detail="Project changed; refresh before editing" if exists else "Project not found")
    item = as_view(row)
    write_audit(db, item.id, user, "updated")
    db.commit()
    return item
