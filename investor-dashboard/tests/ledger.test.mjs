import test from "node:test";
import assert from "node:assert/strict";
import {readInvestorLedger,readResearchQueue,isDue,isStaged,isReply,isVerified,parseCsv} from "../ledger.js";
const headers=["Investor","Fit Score","Firm","Email","Apollo message ID","Send status","First sent date","Follow-up review date","Reply status","Notes","Follow-up action","Interest status","Committed amount ($)","Commitment verification","Last reply review (date)"];
const csv=[headers.join(","),["Ava","80%","Alpha","ava@example.org","id1","Sent - Apollo completed","2026-10-14","2026-10-17","Not checked","","Review follow-up","","","", ""].join(","),["Ben","80%","Beta","ben@example.org","id2","Sent - Apollo completed","2026-10-14","2026-10-17","Replied — Not interested","","Do not follow up","Not interested","","",""].join(","),["Ava","80%","Alpha","ava@example.org","id1","Sent - Apollo completed","2026-10-14","2026-10-17","Not checked","","Review follow-up"].join(","),["Cara","80%","Gamma","cara@example.org","id3","Scheduled","2026-10-14","2026-10-17","Not checked"].join(",")].join("\n");
test("CSV parsing preserves quoted commas and newlines",()=>{
 const rows=parseCsv('Investor,Notes\n"Lee, Pat","Follow-up\nneeded"\n');
 assert.equal(rows[1][0],"Lee, Pat");
 assert.equal(rows[1][1],"Follow-up\nneeded");
});
test("ledger importer includes sent contacts once and excludes scheduled",()=>{
 const people=readInvestorLedger(csv);
 assert.equal(people.length,2);
 assert.deepEqual(people.map(x=>x.name),["Ava","Ben"]);
 assert.equal(people.filter(x=>isDue(x,"2026-10-20")).length,1);
 assert.equal(people.filter(isReply).length,1);
});
test("verified commitments must be explicitly verified",()=>{
 const people=readInvestorLedger(csv);
 assert.equal(people.filter(isVerified).length,0);
});
test("research importer captures hold and email unverified",()=>{
 const input="Investor,Firm,Verified email (Apollo),Fit Score (estimated),PERA status,Important notes\nKim,Sample VC,NOT VERIFIED,70%,HOLD - CHECK SIZE,Check amount";
 const records=readResearchQueue(input);
 assert.equal(records.length,1);assert.equal(records[0].email,"NOT VERIFIED");
});
test("unexpected CSV fails closed",()=>{
 assert.throws(()=>readInvestorLedger("Name,Contact\nX,x@y.com"));
});

test("staged, held and excluded workflow statuses are not unassigned due follow-ups",()=>{
 const header=[...headers,"Follow-up workflow status"].join(",");
 const row=status=>["Taylor","80%","Test VC","taylor@example.org","id1","Sent - Apollo completed","2026-10-14","2026-10-17","Not checked","","Review follow-up","","","","",status].join(",");
 for(const status of ["STAGED — Louis approval","HOLD — check size","EXCLUDE — below score"]){
  const [person]=readInvestorLedger(header+"\n"+row(status));
  assert.equal(isDue(person,"2026-10-20"),false);
  assert.equal(isStaged(person),status.startsWith("STAGED"));
 }
 const [unassigned]=readInvestorLedger(header+"\n"+row(""));
 assert.equal(isDue(unassigned,"2026-10-20"),true);
});
