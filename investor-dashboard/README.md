# Amia Investor Dashboard V1 — current fundraising round

Three-page read-only dashboard for Louis's $750,000 round. The existing animation / Command Center demo is unchanged.

## Pages

- **Overview:** PERA active contacts, replies, Hustle Fund application-stage, 19 follow-ups awaiting Louis approval, 10 sent follow-ups, and investor-level verified commitments.
- **Investor Tracker:** searchable, imported individual PERA investor records.
- **Follow-up Queue:** includes only staged candidates pending Louis approval or newly due unsuppressed records. Contacts marked STAGED / HOLD / EXCLUDE never appear as unassigned due; held and excluded investors never appear in the active follow-up queue.

## Current snapshot (2026-10-20)

- 48 historical first touches: 46 in the active ledger plus two excluded historical sends found and reconciled.
- 46 active-ledger first touches, 3 replies (two declines and one Hustle Fund application invitation), 10 follow-ups sent.
- 19 qualified follow-up candidates staged for Louis approval; 0 unassigned overdue follow-up reviews.
- 25 net-new research candidates in **Unverified Data**, with 23 email addresses unverified; 0 verified net-new first-touch candidates ready to send.
- Apollo sequence inactive; 0 currently scheduled sequence messages.
- $0 in **investor-level verified allocations recorded in PERA**; prior fundraising claims of $500K committed have not been independently documented investor by investor. This is not an assertion that no funds are committed.

## Use

1. Open the dashboard from a local HTTP server or approved deployment.
2. For individual investors, export **only the Outreach Ledger tab** from the PERA Google Sheet as CSV.
3. Choose **Import Outreach CSV**. Records remain in browser memory; the app does **not** upload, synchronize or store them remotely. Reload or choose **Clear import** to remove them.
4. The imported CSV's **Follow-up workflow status** (column P) controls STAGED, HOLD and EXCLUDE. Do not delete that column before exporting.
5. Follow-up dates mean **review dates**, never automatic emails.

## Local tests

From `investor-dashboard/`:

```sh
npm install
npm test
npx playwright install chromium
python3 -m http.server 8765
```

In a second terminal from the same directory:

```sh
npm run test:browser
```

The GitHub Actions workflow runs unit tests and a real Chromium smoke test, including anonymized CSV import, staged/held/excluded checks, desktop/mobile navigation and import reset.

## Privacy and release limits

This repository is public and the static site has no authentication. Do not commit PERA exports, private investor records, API keys or tokens. Never deploy real private investor CSV data publicly. The dashboard includes no API-based send actions and no live Apollo or Sheets synchronization. Deploy/share for Louis only after browser checks and explicit approval of the hosting arrangement. The PR remains a review build until approved.
