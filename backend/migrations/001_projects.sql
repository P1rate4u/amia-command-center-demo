-- Phase 1 / PostgreSQL. Run once as database migration operator.
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS projects (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    client_name varchar(100) NOT NULL,
    project_name varchar(120) NOT NULL,
    owner_user_id varchar(160) NOT NULL,
    due_date date NOT NULL,
    stage varchar(32) NOT NULL DEFAULT 'Intake' CHECK(stage IN ('Intake','Documents','Analysis','Expert Review','Delivered')),
    status varchar(32) NOT NULL DEFAULT 'On Track' CHECK(status IN ('On Track','At Risk','Blocked','Completed')),
    progress_pct smallint NOT NULL DEFAULT 0 CHECK (progress_pct BETWEEN 0 AND 100),
    blocker varchar(500) NOT NULL DEFAULT '',
    next_action varchar(500) NOT NULL DEFAULT '',
    version integer NOT NULL DEFAULT 1,
    updated_by varchar(160) NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS project_audit (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    project_id uuid NOT NULL REFERENCES projects(id),
    action varchar(16) NOT NULL CHECK (action IN ('created', 'updated')),
    actor_user_id varchar(160) NOT NULL,
    snapshot jsonb NOT NULL,
    occurred_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_projects_due ON projects(due_date);
CREATE INDEX IF NOT EXISTS idx_projects_owner ON projects(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_project_audit_project ON project_audit(project_id, occurred_at DESC);
