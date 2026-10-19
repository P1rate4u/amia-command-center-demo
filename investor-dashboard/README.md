# Amia Investor Dashboard V1

This is the scoped investor-only replacement for the former all-in-one Command Center concept.

## Open and test
Open `investor-dashboard/index.html` through a local HTTP server because the JavaScript modules require HTTP (e.g. at repository root run `python -m http.server 8000`, then open `http://localhost:8000/investor-dashboard/`).

For private investor-level records, download **only** the `Outreach Ledger` tab from the existing PERA Google Sheet as CSV. Use the Import PERA CSV control. The file is processed in-memory; it is not uploaded or persisted by this version. Reloading clears it.

## Screens
- Overview: contacted, replies, interested, follow-up reviews, verified commitments.
- Investor tracker: searchable and filterable records imported from the ledger.
- Follow-up queue: due dates filtered for replied, declined and already-followed-up investors.
- Fundraising: verified investor-level amount and remaining target.
- Activity: verified responses and data-reconciliation notes.

## Scope and limitations
- Aggregate-only initial snapshot: 46 unique completed first touches, 3 recorded replies, 29 follow-up reviews, 10 follow-ups sent, 0 verified investor allocations, $750K target. The prior $500K stated commitment is not reconciled by investor.
- The pre-import aggregates are a fixed snapshot and do not auto-refresh.
- The deployed static site is NOT an authenticated private app. Do not enter sensitive client information or publish the investor-level CSV in GitHub. If this is deployed to a publicly accessible host, treat it as a demo/review site.
- For actual team collaboration and automatic Apollo/PERA sync, add an authenticated server-side integration later.
- This site does not send email or activate any Apollo sequence. No secrets, email accounts or API tokens are used.
- Supabase and Render work for the previous Command Center scope remains paused.
- The main GitHub Pages `main` branch is not modified.

## File organization
- `index.html`: presentation and navigation
- `styles.css`: scoped dashboard styling
- `ledger.js`: CSV parsing and follow-up/verification rules
- `app.js`: in-memory state, UI wiring and local rendering

Review on `investor-dashboard-v1` branch before any merge or release.
