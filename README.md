# Amia Command Center - Interactive Client Review Demo

A light-theme, connected interactive walkthrough with fictional data for Louis and the Amia team.

## Open
Double-click `index.html` in Chrome or Edge, or publish the repository root to GitHub Pages.

## Suggested 5-minute walkthrough
1. **Overview:** click `Active projects` or a client row to open its detail page.
2. **Westbridge Bio:** select the linked `Safety Dataset` checklist record. Mark it received, then follow the project link back and move the project to the next stage.
3. **Team tasks:** open a task, change it to `Done`, save, and go back. The dashboard open-task count changes.
4. **Investor tracker:** open a fictional investor record, change the status to `Replied`, save, and view the updated pipeline. This does not email anyone.
5. **Add a sample project or task**, use global search, and click Reset demo to restore the original data.
6. **Workflow log:** run a sample check and examine the illustrative failure entry.

## What is and isn't operational
- The interface, buttons, links, editable task/investor/document statuses, project stage progression, status counters, simulated events, browser storage, search and reset are operational.
- Data and changes persist only in each reviewer's browser; they do not sync between reviewers.
- All client and investor names are fictional. Team example assignments include Jeet, Brandon, Hussnain and Louis, but are **not statements about real job responsibilities**.
- No live connection to Apollo, MedNova, Gmail, Slack, Google Sheets, or regulatory document systems. No emails are sent, regulatory reports are delivered, or expert approvals are issued.
- In the demo, required missing checklist items prevent advancing through document collection; expert signoff is a simulated confirmation only.

## Publish to GitHub
1. Open the folder containing this `index.html` in VS Code.
2. Copy the updated `index.html` and `README.md` into the **root** of your existing `amia-command-center-demo` repository.
3. Run `git add index.html README.md && git commit -m "Make demo pages interactive" && git push origin main` in that repo.
4. In GitHub Pages, publish the `main` branch from `/(root)`.

**For concept review only — not for sensitive or production use.**
