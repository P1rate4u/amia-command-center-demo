# Deploy the private, live Amia investor dashboard

## What is built

The `apps-script/` files implement a **read-only** dashboard that reads real PERA records on each refresh (automatically every 60 seconds while the tab is visible). It has Overview, Investor Tracker and Follow-up Queue.

- Google Sheets remains the source of truth. There is no second investor database, CSV upload or Apollo sending.
- Data includes names, email addresses, reply statuses, amounts explicitly verified in PERA and staged follow-up approvals.
- Read-only by design: no update, send, approval, or sequence actions exist.
- Only signed-in Google users listed in `ALLOWED_EMAILS`, **and with permission to open the original spreadsheet**, can view results.
- The script checks `PERA_SPREADSHEET_ID` against the bound spreadsheet to avoid serving a different workbook.
- The public GitHub repository stores **code only**, never the PERA data, credentials, or private app URL.

## Installation by PERA spreadsheet owner/editor

1. Open the actual PERA Google Sheet, then choose **Extensions → Apps Script**. Use a new Apps Script project **bound to that PERA sheet**, not a separate public webpage.
2. Paste `apps-script/Code.gs` into the project script file named `Code.gs`.
3. Create three Apps Script **HTML** files named `Index`, `Styles`, and `Client`, copying the matching `apps-script/*.html` source. Do not rename the include references.
4. In Apps Script **Project Settings → Script properties**, add:
   - `PERA_SPREADSHEET_ID` = the exact ID of the PERA workbook.
   - `ALLOWED_EMAILS` = comma-separated, individual Google account emails for **Louis and approved team members only**. Do not use wildcards or broad domains.
5. Make sure each approved user also has access to the PERA sheet. For view-only access, Google Sheets Viewer permission is sufficient to read the data; however, creating/editing the bound script requires appropriate editor access.
6. Choose **Deploy → New deployment → Web app**. Set:
   - **Execute as:** **User accessing the web app** (not **Me**).
   - **Who has access:** restrict to the **Amia Workspace domain** if available; otherwise the most restrictive available signed-in Google-account option. The allowlist still prevents unapproved users from reading data.
   - Do **not** choose anonymous/public access.
7. Authorize the Apps Script permissions separately for the deploying user, and have Louis and each approved team member sign in with the allowlisted account, complete the Google permissions flow and open the resulting private web-app URL.
8. Confirm a team member **not** in `ALLOWED_EMAILS` is rejected. Confirm an allowlisted account **without** PERA spreadsheet access cannot read investor data. Test a PERA status change and press **Refresh**: the corresponding metric should update.
9. Share the **private Apps Script web-app URL** directly with Louis and the approved team. Never post real investor information or the live private link in public GitHub issues.

## Release checklist

- Check the app shows 46 active investors, 3 replies, 10 follow-ups sent and 19 Louis-approval candidates against current PERA values before accepting the launch.
- Check the historical count includes the two previously excluded historical sends, read from PERA reconciled baseline.
- Confirm held/excluded contacts do not enter the active follow-up queue.
- Confirm application-stage interest is **not** treated as investment commitment.
- Verify `ALLOWED_EMAILS`, sheet permissions and **execute as user accessing** on every redeployment.
- Do not claim the dashboard is deployed or accessible until the owner completes these steps.

## Limitations

- This is a manual Apps Script installation from the connected Google Sheet. The GitHub connector does **not** deploy Google Apps Script or configure Google Workspace sharing.
- Sync is an on-demand sheet read and repeats every 60 seconds while visible; there are no push notifications or Apollo event callbacks.
- Data is subject to Google permission and Apps Script quotas. If the last sync fails, an error appears; do not assume displayed numbers are current.
- The 5 previously prioritized firms are already contacted and not new send-ready investors.
