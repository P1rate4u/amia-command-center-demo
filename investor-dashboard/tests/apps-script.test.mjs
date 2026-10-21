import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
const source = fs.readFileSync(new URL("../apps-script/Code.gs", import.meta.url), "utf8");

function testContext({user="louis@amia.ai", allow="louis@amia.ai,team@amia.ai", sheetId="PERA_TEST", configuredId="PERA_TEST"}={}){
  const ledgerRows=[
    ["Investor","Score","Firm","Email","Message","Send status","First sent","Review","Reply","Notes","Action","Interest","Amount","Verification","Last reply","Workflow"],
    ["Alex","87%","Gradient","alex@example.test","id1","Sent - Apollo completed","2026-10-14","2026-10-17","Not checked","","Review follow-up","","","","","STAGED - Louis review"],
    ["Blair","62%","Geek Ventures","blair@example.test","id2","Sent - Apollo completed","2026-10-14","2026-10-17","Not checked","","Review follow-up","","","","","EXCLUDE - low fit"],
    ["Casey","80%","Other VC","casey@example.test","id3","Sent - Apollo completed","2026-10-14","2026-10-17","Not checked","","Follow-up SENT 2026-10-19","","","","","HOLD"],
    ["Devon","76%","Response VC","devon@example.test","id4","Sent - Apollo completed","2026-10-14","2026-10-17","Replied - declined","","","","","","","",""],
    ["Alex","87%","Gradient","alex@example.test","id1","Sent - Apollo completed","2026-10-14","2026-10-17","Not checked","","Review follow-up","","","","","STAGED"]
  ];
  const approvalRows=[
    ["Rank","Investor","Firm","Email","Email status","Caveat","First touch","Review","Prior","Action","Approval","Apollo","ID","Fit","Unique firm","Eligibility"],
    ["1","Alex","Gradient","alex@example.test","verified","User managed","2026-10-14","2026-10-17","","Review reply","PENDING - no sending"],
    ["2","Blair","Geek Ventures","blair@example.test","verified","","2026-10-14","2026-10-17","","Review","PENDING - no sending"]
  ];
  const snapshotRows=[
    ["CURRENT SNAPSHOT — 2026-10-20",""],
    ["Historical first touches","48"],["Active ledger first touches","46"]
  ];
  const makeSheet=(prefix, data)=>({
    getLastRow:()=>prefix+data.length-1,
    getRange:(start, col, numRows)=>({getDisplayValues:()=>data.slice(start-prefix,start-prefix+numRows)})
  });
  const sheets={
    "Outreach Ledger":makeSheet(4,ledgerRows),
    "19 Follow-ups - Louis Approval":makeSheet(3,approvalRows),
    "Unverified Data":makeSheet(2,[["Kim","Example VC","NOT VERIFIED"],["Kim","Example VC","NOT VERIFIED"],["Pat","Other VC","pat@example.test"]]),
    "New Investors":makeSheet(1,[["NEW INVESTORS | CURRENT ROUND"],["Note"],["Firm"],["Everywhere Ventures"],["NEW INVESTOR FIRST-TOUCH READY","0"]]),
    "PERA Dashboard":makeSheet(27,snapshotRows)
  };
  const scriptProps={ALLOWED_EMAILS:allow,PERA_SPREADSHEET_ID:configuredId};
  const context={
    Session:{getActiveUser:()=>({getEmail:()=>user}),getScriptTimeZone:()=>"Etc/UTC"},
    PropertiesService:{getScriptProperties:()=>({getProperty:k=>scriptProps[k]})},
    SpreadsheetApp:{getActiveSpreadsheet:()=>({getId:()=>sheetId,getSheetByName:k=>sheets[k]})},
    Utilities:{formatDate:()=> "2026-10-20 12:00:00 UTC"},
    HtmlService:{createTemplateFromFile:()=>({evaluate:()=>({setTitle(){return this},addMetaTag(){return this}})})}
  };
  vm.createContext(context);
  vm.runInContext(source,context);
  return context;
}

test("private dashboard denies unknown viewers and missing allowlist",()=>{
  assert.throws(()=>testContext({user:"outsider@gmail.com"}).getDashboardData(),/Access denied/);
  assert.throws(()=>testContext({allow:""}).getDashboardData(),/Access denied/);
});
test("private dashboard rejects wrong PERA spreadsheet identity",()=>{
  assert.throws(()=>testContext({configuredId:"WRONG"}).getDashboardData(),/identity/);
});
test("live dashboard deduplicates records and enforces approval suppression",()=>{
  const result=testContext().getDashboardData();
  assert.equal(result.metrics.active,4);
  assert.equal(result.metrics.historical,6);
  assert.equal(result.metrics.replies,1);
  assert.equal(result.metrics.followupSent,1);
  assert.equal(result.metrics.awaitingApproval,1);
  assert.equal(result.metrics.unassignedDue,0);
  assert.equal(result.metrics.research,3);
  assert.equal(result.metrics.newInvestorReady,0);
  assert.equal(result.metrics.unverified,2);
  assert.equal(result.approvals[0].name,"Alex");
  assert.equal(result.approvals.length,1);
});
