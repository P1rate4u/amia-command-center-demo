/**
 * Amia Investor Dashboard — spreadsheet-bound Apps Script.
 * Deploy as: Execute as "User accessing the web app".
 * Every viewer must already have permission to read the PERA spreadsheet.
 * Script Property ALLOWED_EMAILS is required (comma-separated approved accounts).
 * Never deploy "Execute as me": that bypasses individual Sheets access.
 */
const AMIA_SHEETS = Object.freeze({
  ledger: "Outreach Ledger",
  approvals: "19 Follow-ups - Louis Approval",
  research: "Unverified Data",
  newInvestors: "New Investors",
  snapshot: "PERA Dashboard"
});
function requireAccess_() {
  const email = String(Session.getActiveUser().getEmail() || "").trim().toLowerCase();
  const allowed = String(PropertiesService.getScriptProperties().getProperty("ALLOWED_EMAILS") || "")
    .split(",").map(x => x.trim().toLowerCase()).filter(Boolean);
  if (!email || allowed.length === 0 || !allowed.includes(email)) {
    throw new Error("Access denied. Sign in with an approved Amia Google account.");
  }
  return email;
}
function doGet() {
  requireAccess_();
  return HtmlService.createTemplateFromFile("Index").evaluate()
    .setTitle("Amia | Private Investor Dashboard")
    .addMetaTag("viewport", "width=device-width, initial-scale=1");
}
function include(filename) {
  if (!["Styles","Client"].includes(filename)) throw new Error("Invalid template.");
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}
function rows_(book, name, startRow, columnCount) {
  const sheet = book.getSheetByName(name);
  if (!sheet) throw new Error("Required PERA tab missing: " + name);
  const last = sheet.getLastRow();
  if (last < startRow) return [];
  if (last - startRow + 1 > 1000) throw new Error("Investor dataset exceeds supported review limit.");
  return sheet.getRange(startRow, 1, last-startRow+1, columnCount).getDisplayValues();
}
function cell_(row, index) { return String(row[index] || "").trim(); }
function reply_(s) { return /^replied/i.test(s); }
function declined_(s) { return /not interested|unsubscribe|declined/i.test(s); }
function sentFollowup_(s) { return /follow-up sent/i.test(s); }
function workflow_(s) { return /^(staged|hold|exclude)\b/i.test(s); }
function numeric_(s) { const n = Number(String(s || "").replace(/[$,%\s,]/g,"")); return Number.isFinite(n) && n >= 0 ? n : 0; }

function getDashboardData() {
  requireAccess_();
  // A bound script uses the caller's Sheets permissions, never a stored key.
  const book = SpreadsheetApp.getActiveSpreadsheet();
  if (!book) throw new Error("Install this script from the PERA Google Sheet.");
  const expectedId = String(PropertiesService.getScriptProperties().getProperty("PERA_SPREADSHEET_ID") || "").trim();
  if (!expectedId || book.getId() !== expectedId)
    throw new Error("PERA spreadsheet identity has not been configured or does not match.");
  const seen = new Set();
  const investors = [];
  for (const r of rows_(book, AMIA_SHEETS.ledger, 5, 16)) {
    const email = cell_(r,3).toLowerCase();
    if (!email || !email.includes("@") || seen.has(email) || !/^sent\b/i.test(cell_(r,5))) continue;
    seen.add(email);
    const score = numeric_(cell_(r,1));
    investors.push({
      name:cell_(r,0), score, firm:cell_(r,2), email,
      firstSent:cell_(r,6), reviewDate:cell_(r,7),
      reply:cell_(r,8), action:cell_(r,10), interest:cell_(r,11),
      workflow:cell_(r,15),
      commitment:cell_(r,13).toLowerCase()==="verified" ? numeric_(cell_(r,12)) : 0
    });
  }
  const byEmail = new Map(investors.map(r => [r.email,r]));
  const approvals = [], firms = new Set();
  for (const r of rows_(book, AMIA_SHEETS.approvals, 4, 16)) {
    const email=cell_(r,3).toLowerCase(), matched=byEmail.get(email);
    if (!email || !matched || firms.has(matched.firm.toLowerCase())) continue;
    if (!/^pending/i.test(cell_(r,10))) continue;
    if (!/^staged\b/i.test(matched.workflow) || reply_(matched.reply) ||
        declined_(matched.reply) || sentFollowup_(matched.action)) continue;
    firms.add(matched.firm.toLowerCase());
    approvals.push({
      name:matched.name, firm:matched.firm, email,
      score:matched.score, firstSent:matched.firstSent,
      reviewDate:matched.reviewDate, action:cell_(r,9),
      approval:cell_(r,10), caveat:cell_(r,5)
    });
  }
  const now = new Date();
  const due = investors.filter(r =>
    !workflow_(r.workflow) && !reply_(r.reply) && !declined_(r.reply) &&
    !sentFollowup_(r.action) &&
    /^\d{4}-\d{2}-\d{2}$/.test(r.reviewDate) &&
    r.reviewDate <= Utilities.formatDate(now, Session.getScriptTimeZone(), "yyyy-MM-dd")
  );
  const research = rows_(book, AMIA_SHEETS.research, 2, 10).filter(r=>cell_(r,0));
  // Derive readiness from actual New Investors rows rather than a stale manual counter.
  // Require complete qualified data, an explicit READY status, no recorded first touch,
  // and no overlapping firm with earlier outreach or another ready candidate.
  const newInvestorRows = rows_(book, AMIA_SHEETS.newInvestors, 4, 11);
  const existingFirms = new Set(investors.map(r => r.firm.toLowerCase()));
  const readyFirms = new Set();
  const newInvestorReady = newInvestorRows.filter(r => {
    const firm=cell_(r,0), email=cell_(r,4).toLowerCase(),
          score=numeric_(cell_(r,2)), sent=cell_(r,5),
          status=cell_(r,8), decision=cell_(r,9);
    const unique=firm && !existingFirms.has(firm.toLowerCase()) &&
      !readyFirms.has(firm.toLowerCase());
    const qualified=unique && score>=65 && /^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$/.test(email) &&
      !sent && /^ready\b/i.test(status) && !/^(hold|reject|exclude|no)/i.test(decision);
    if (qualified) readyFirms.add(firm.toLowerCase());
    return qualified;
  }).length;
  const firstTouches=investors.length;
  // Two historical sends were removed from the active ledger. Read the reconciled
  // baseline from PERA instead of hardcoding private contact details or totals.
  const summary = new Map(rows_(book, AMIA_SHEETS.snapshot, 27, 2).map(r=>[cell_(r,0),numeric_(cell_(r,1))]));
  const baseHistorical = summary.get("Historical first touches");
  const baseActive = summary.get("Active ledger first touches");
  if (!Number.isFinite(baseHistorical) || !Number.isFinite(baseActive) || baseHistorical < baseActive)
    throw new Error("PERA reconciliation totals are missing or invalid.");
  const legacyExcluded = baseHistorical - baseActive;
  const reconciliationNote = baseHistorical===baseActive
    ? "PERA historical and active counts match."
    : "Historical total includes previously excluded first touches.";
  const replies=investors.filter(r=>reply_(r.reply)).length;
  const followupSent=investors.filter(r=>sentFollowup_(r.action)).length;
  const interested=investors.filter(r=>r.interest==="Interested").length;
  const committed=investors.reduce((n,r)=>n+r.commitment,0);
  const result = {
    asOf: Utilities.formatDate(now, Session.getScriptTimeZone(), "yyyy-MM-dd HH:mm:ss z"),
    metrics:{
      active:firstTouches, historical:firstTouches + legacyExcluded, replies, interested,
      followupSent, awaitingApproval:approvals.length, unassignedDue:due.length,
      research:research.length, newInvestorReady,
      unverified:research.filter(r=>cell_(r,2)==="NOT VERIFIED").length,
      committed, target:750000
    },
    investors, approvals,
    notice:"PERA is the source. Live read-only view; no Apollo sending. "+reconciliationNote
  };
  return result;
}
