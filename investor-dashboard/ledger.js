// PERA import logic; CSV is parsed locally in the browser and not uploaded.
export function parseCsv(input) {
  const rows = []; let row = [], field = "", quoted = false;
  for (let i=0; i<input.length; i++) {
    const c = input[i];
    if (quoted) {
      if (c === '"' && input[i+1] === '"') { field += '"'; i++; }
      else if (c === '"') quoted = false;
      else field += c;
    } else if (c === '"' && field === "") quoted = true;
    else if (c === ",") { row.push(field); field=""; }
    else if (c === "\r" || c === "\n") {
      if (c === "\r" && input[i+1] === "\n") i++;
      row.push(field); if (row.some(v=>v.trim())) rows.push(row);
      row=[]; field="";
    } else field += c;
  }
  if (quoted) throw new Error("Incomplete quoted CSV field.");
  row.push(field); if(row.some(v=>v.trim())) rows.push(row);
  return rows;
}
export function readInvestorLedger(csv) {
  const rows=parseCsv(csv.replace(/^\uFEFF/, ""));
  const headerIndex=rows.findIndex(r=>r[0]?.trim()==="Investor" && r.includes("Email") && r.includes("Send status"));
  if(headerIndex<0) throw new Error("Export the PERA Outreach Ledger tab as CSV.");
  const headers=rows[headerIndex].map(v=>v.trim().toLowerCase());
  const get=(row,key)=>String(row[headers.indexOf(key)]??"").trim();
  const seen=new Set(), investors=[];
  for(const row of rows.slice(headerIndex+1)){
    const email=get(row,"email").toLowerCase();
    if(!email || !email.includes("@") || seen.has(email) || !get(row,"send status").startsWith("Sent")) continue;
    seen.add(email);
    const amountRaw=get(row,"committed amount ($)").replace(/[$,\s]/g,"");
    const amount=amountRaw ? Number(amountRaw) : 0;
    if(!Number.isFinite(amount) || amount<0) throw new Error("Invalid commitment amount in ledger.");
    investors.push({
      name:get(row,"investor"),firm:get(row,"firm"),email,
      firstSent:get(row,"first sent date"),reviewDate:get(row,"follow-up review date"),
      reply:get(row,"reply status"),interest:get(row,"interest status"),
      verification:get(row,"commitment verification"),amount,
      action:get(row,"follow-up action")
    });
  }
  if(!investors.length) throw new Error("No confirmed initial outreach found in this CSV.");
  return investors;
}
export const isReply=r=>/^Replied/i.test(r.reply);
export const isDeclined=r=>r.interest==="Not interested" || /not interested/i.test(r.reply);
export const isFollowupSent=r=>/follow-up SENT/i.test(r.action);
export const isDue=(r,today)=>!!r.reviewDate && /^\d{4}-\d{2}-\d{2}$/.test(r.reviewDate) && r.reviewDate<=today && !isFollowupSent(r) && !isReply(r) && !isDeclined(r);
export const isVerified=r=>r.verification==="Verified" && r.amount>0;

export function readResearchQueue(csv) {
  const rows=parseCsv(csv.replace(/^\uFEFF/, ""));
  const index=rows.findIndex(r=>r[0]?.trim()==="Investor" && r.some(c=>/^PERA status$/i.test(c.trim())));
  if(index<0)throw new Error("Export the Tomorrow - Research Queue tab as CSV.");
  const headers=rows[index].map(x=>x.trim().toLowerCase());
  const at=(row,name)=>String(row[headers.indexOf(name)]??"").trim();
  const items=[],seen=new Set();
  for(const row of rows.slice(index+1)){
    const name=at(row,"investor"),firm=at(row,"firm");
    if(!name||!firm)continue;
    const key=(name+"|"+firm).toLowerCase();
    if(seen.has(key))continue;
    seen.add(key);
    items.push({name,firm,email:at(row,"verified email (apollo)"),score:at(row,"fit score (estimated)"),
      status:at(row,"pera status"),notes:at(row,"important notes")});
  }
  if(!items.length)throw new Error("No candidates found in this CSV.");
  return items;
}
