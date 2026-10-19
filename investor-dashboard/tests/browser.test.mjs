import { chromium } from "playwright";
import assert from "node:assert/strict";

const base = process.env.DASHBOARD_URL || "http://127.0.0.1:8765";
const browser = await chromium.launch({headless: true, args: ["--no-sandbox"]});
const page = await browser.newPage({viewport:{width:1365,height:900}});
const failures = [];
page.on("pageerror", error => failures.push(error.message));
const headers = ["Investor","Fit Score","Firm","Email","Apollo message ID","Send status","First sent date","Follow-up review date","Reply status","Notes","Follow-up action","Interest status","Committed amount ($)","Commitment verification","Last reply review (date)","Follow-up workflow status"];
const mk = (name, workflow, action="", reply="Not checked") => [
 name,"78%","Example Ventures",name.toLowerCase()+"@example.test","id"+name,"Sent - Apollo completed","2026-10-14","2026-10-17",reply,"",action,"","","","",workflow
].join(",");
const csv=[headers.join(","),mk("Staged","STAGED - Louis approval"),mk("Held","HOLD - unsuitable"),mk("Excluded","EXCLUDE - below threshold"),mk("Followed","", "Follow-up SENT 2026-10-19"),mk("Replied","", "", "Replied - declined")].join("\n");
try {
 await page.goto(base,{waitUntil:"networkidle"});
 assert.equal(await page.locator("#metric-followups").innerText(),"19");
 await page.locator("#import-file").setInputFiles({name:"outreach-ledger.csv",mimeType:"text/csv",buffer:Buffer.from(csv)});
 assert.equal(await page.locator("#metric-contacted").innerText(),"5");
 assert.equal(await page.locator("#metric-followups").innerText(),"1");
 assert.equal(await page.locator("#metric-replies").innerText(),"1");
 await page.locator(".nav[data-view='followups']").click();
 assert.equal(await page.locator("#followups-body tr").count(),1);
 assert.match(await page.locator("#followups-body").innerText(),/Staged/);
 assert.doesNotMatch(await page.locator("#followups-body").innerText(),/Held|Excluded|Followed|Replied/);
 await page.locator(".nav[data-view='investors']").click();
 assert.equal(await page.locator("#investors-body tr").count(),5);
 await page.locator("#investor-search").fill("staged");
 assert.equal(await page.locator("#investors-body tr").count(),1);
 await page.locator("#clear-import").click();
 assert.equal(await page.locator("#metric-followups").innerText(),"19");
 assert.equal(await page.locator("#investors-body tr").count(),0);
 await page.setViewportSize({width:390,height:844});
 await page.locator(".nav[data-view='overview']").click();
 assert.equal(await page.locator("#metric-followups").innerText(),"19");
 assert.deepEqual(failures,[]);
 console.log("Browser smoke test PASSED: desktop/mobile navigation, PERA CSV import, stage exclusions, reset.");
} finally { await browser.close(); }
