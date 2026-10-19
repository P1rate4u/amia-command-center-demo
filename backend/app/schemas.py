"""Validated project input/output contracts."""
from datetime import date, datetime
from enum import Enum
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class Stage(str, Enum):
    intake = "Intake"
    documents = "Documents"
    analysis = "Analysis"
    expert_review = "Expert Review"
    delivered = "Delivered"


class Status(str, Enum):
    on_track = "On Track"
    at_risk = "At Risk"
    blocked = "Blocked"
    completed = "Completed"


class ProjectInput(BaseModel):
    model_config = ConfigDict(extra="forbid")
    client_name: str = Field(min_length=1, max_length=100)
    project_name: str = Field(min_length=1, max_length=120)
    owner_user_id: str = Field(min_length=1, max_length=160)
    due_date: date
    stage: Stage = Stage.intake
    status: Status = Status.on_track
    progress_pct: int = Field(default=0, ge=0, le=100)
    blocker: str = Field(default="", max_length=500)
    next_action: str = Field(default="", max_length=500)


class ProjectEdit(ProjectInput):
    version: int = Field(ge=1)


class ProjectView(ProjectInput):
    id: UUID
    version: int
    updated_by: str
    created_at: datetime
    updated_at: datetime
