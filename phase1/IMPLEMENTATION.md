# Amia Command Center — Phase 1 data and integration plan

Approved scope: (1) main dashboard, (2) tools integration, (3) client project management. Team reminders and investor outreach dashboards are deferred.

## Current operating reality
Real project updates currently arrive via Slack or manual team communications. The existing GitHub Pages demo uses browser-only localStorage and fictional examples. It is not an approved production system or shared database.

## Proposed shared project record
- id: generated immutable identifier
- client_name: required, access-controlled
- project_name: required
- owner_user_id: required, reference to authorized team user
- stage: Intake | Documents | Analysis | Expert Review | Delivered
- status: On Track | At Risk | Blocked | Completed
- due_date: ISO date
- progress_pct: integer 0–100
- blocker: short description, restricted and optional
- next_action: short description, optional
- source: Manual Update | Slack Reference | Client Meeting
- source_reference: optional Slack message permalink; never copy confidential Slack text without permission
- created_at, updated_at: server-assigned timestamps
- updated_by: authenticated team member
- version: monotonically increasing number for conflict detection

## First release workflows
1. Authorized team member creates a new project from manual Slack-derived update.
2. Validated project is stored in shared authenticated database.
3. Dashboard reads live project totals: active, due in 7 days, blocked, overdue.
4. Authorized users edit status, owner, due date or blocker; audit history preserves changes.
5. Slack integration is read-only initially, or limited to specific approved channels and events. Do not ingest all Slack messages indiscriminately.
6. Optional notification of project changes only after explicit team configuration.

## Non-negotiable safety / operations
- Never put credentials, private Slack messages, client documents, or personal investor data into the public GitHub Pages repository.
- Browser-local preview is for fictional/non-sensitive test records only.
- Store server-side connector credentials, not in browser JavaScript.
- Authentication and project-level authorization before live client records.
- Explicit mapping between Slack source and Amia project; no AI required for routine status updates.
- Never auto-send messages, client deliverables, or regulatory approvals.
- Log failures and retries and make integration health visible.
- API usage budgets: normal dashboard views should make no LLM calls.

## Release gates
- Confirm database/hosting choice and access permissions.
- Implement secure backend and migrations for the project schema.
- Add authenticated create/read/update flows.
- Connect dashboard counters to backend, not localStorage.
- Pilot with fictional test projects, verify team-to-team synchronization.
- Validate Slack scopes, then test opt-in ingestion of a narrow channel.
- Release a private V1 for Louis's review before enabling more capabilities.

This plan describes intended behavior, not live or deployed integrations.
