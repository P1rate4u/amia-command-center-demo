# Amia Investor Dashboard V1 — Louis review scope

This static review build follows Louis's revised scope: **only the current fundraising round**. The original public Command Center and its other modules are unchanged.

## Three screens

1. **Overview:** contacted, replies, interested/application-stage, follow-up reviews and investor-by-investor verified commitments within the $750K target.
2. **Investor Tracker:** browse investor names, firms, replies, stated interest status and verified allocations.
3. **Follow-up Queue:** due review dates; suppress records with replies, declines or prior follow-ups. **No messages are sent.**

## Current PERA snapshot

46 unique current-ledger first touches; 3 replies; 1 user-classified Interested/application-stage (Hustle Fund, which requested an application, not an investment commitment); 10 already-sent follow-ups; 29 requiring individual review. $500K was previously stated as committed toward $750K, but no investor-level commitment has yet been marked Verified in PERA. Do not interpret $0 recorded as $0 actually committed.

These are fixed snapshot counts until an **Outreach Ledger CSV** is imported. To import records, download only the `Outreach Ledger` tab from PERA as a CSV and use **Import Outreach CSV**. Data remains in browser memory for the current session and clears on reload. This version is *not* an automatic Sheets or Apollo sync.

## Testing

At repo root, run `python -m http.server 8000` and open `http://localhost:8000/investor-dashboard/`. From `investor-dashboard/`, run `npm test` to check the parser and duplicate/follow-up rules. A pull-request GitHub Actions workflow also runs syntax and regression checks when enabled. These tests do not replace a real browser walkthrough with an anonymized sample CSV.

## Data safety / release gate

This repository is **public**, and the static site has no user authentication. Do not commit PERA exports, investor emails, API keys or tokens. Do not deploy a full live investor tracker publicly. Before sharing real investor records with Louis/team, choose authenticated private hosting or a secure backend with restricted access, and validate browser behavior. The currently open GitHub pull request is a *draft* and should not be merged until those checks complete. No Apollo automated sequences or sending actions are enabled.
