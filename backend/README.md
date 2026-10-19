# Phase 1 backend (development only)

A private FastAPI/PostgreSQL service for Amia Command Center project management.
No deployment or live Amia data connection has been configured.

## Structure
- app/config.py: mandatory environment configuration; fail closed
- app/auth.py: verify OIDC RS256 bearer tokens and allowed organization
- app/schemas.py: validation contracts and allowed project stages/statuses
- app/database.py: PostgreSQL SQLAlchemy session
- app/main.py: API routes and optimistic locking for concurrent edits
- migrations/001_projects.sql: projects and audit log schema

## Setup after an owner approves hosting and identity provider
1. Provision a PRIVATE PostgreSQL database; configure encrypted connectivity, backups and least-privilege roles.
2. Run the migration with a restricted schema-owner account; do not give the API schema-edit permissions.
3. Set the variables from .env.example only in the hosting secret manager.
4. Install `pip install -r backend/requirements.txt` in an isolated environment.
5. Run `uvicorn app.main:app --app-dir backend` for local development; bind behind a secured proxy for any deployment.
6. Configure trusted identity provider OIDC JWKS, API audience and Amia organization claim.
7. Add project-level roles/permissions and test before granting real client data access.
8. Integrate the frontend via a protected backend proxy; DO NOT place secrets in the GitHub Pages HTML.

## Current endpoints
- GET /health: public liveness only
- GET /v1/projects: authorized organization project list (max 500)
- GET /v1/projects/summary: authorized aggregate counts
- POST /v1/projects: create project with audit snapshot
- PUT /v1/projects/{id}: edit using version check and audit snapshot

## Security release blockers
- Authentication configuration has not been provisioned or integration-tested.
- Organization-only check does not implement per-client/per-project authorization. All authenticated Amia org users currently receive all project rows. Restrict this before handling actual confidential client data.
- Define retention, access logging, approved CORS/proxy topology, input rate limits, error monitoring, and disaster recovery.
- DB migration and API tests must run against a disposable test database before any release.
- Slack integration is not implemented. No Slack monitoring or token consumption occurs here.
- Only demo/test information; no real client data or live launch.

## Token use
These API routes use deterministic database queries and make **zero LLM API requests**.
