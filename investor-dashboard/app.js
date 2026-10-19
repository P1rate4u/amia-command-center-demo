import {readInvestorLedger,readResearchQueue,isReply,isDeclined,isFollowupSent,isDue,isVerified} from "./ledger.js";

const BASE={contacted:46,replies:3,interested:1,followups:29,followupSent:10,committed:0,goal:750000};
let investors=null;
let research=null;
const el=id=>document.getElementById(id);
const formatUSD=n=>new Intl.NumberFormat("en-US",{style:"currency",currency:"USD",maximumFractionDigits:0}).format(n);
const localDate=()=>{const d=new Date();return [d.getFullYear(),String(d.getMonth()+1).padStart(2,"0"),String(d.getDate()).padStart(2,"0")].join("-")};
function metrics(){
 if(!investors)return BASE;
 return {contacted:investors.length,replies:investors.filter(isReply).length,interested:investors.filter(x=>x.interest==="Interested").length,
 followups:investors.filter(x=>isDue(x,localDate())).length,followupSent:investors.filter(isFollowupSent).length,
 committed:investors.filter(isVerified).reduce((sum,x)=>sum+x.amount,0),goal:BASE.goal};
}
function write(id,value){el(id).textContent=String(value)}
function addRow(body,values){
 const tr=document.createElement("tr");
 for(const value of values){const td=document.createElement("td");td.textContent=String(value??"");tr.appendChild(td)}
 body.appendChild(tr);
}
function lists(){
 const all=investors||[],q=el("investor-search").value.trim().toLowerCase(),filter=el("investor-filter").value;
 const matches=all.filter(x=>{
  if(q&&![x.name,x.firm,x.email].some(z=>z.toLowerCase().includes(q)))return false;
  if(filter==="replied")return isReply(x);
  if(filter==="interested")return x.interest==="Interested";
  if(filter==="declined")return isDeclined(x);
  if(filter==="review")return isDue(x,localDate())||x.interest==="Needs review";
  return true;
 });
 const table=el("investors-body");table.replaceChildren();
 for(const x of matches)addRow(table,[x.name,x.firm,x.firstSent,x.reply||"Not checked",x.interest||"Unknown",isVerified(x)?formatUSD(x.amount):"—"]);
 write("investor-count",investors?matches.length+" matching / "+all.length+" imported":"Import PERA CSV to view individual investors");
 el("investors-empty").hidden=matches.length>0;
 const f=el("followups-body");f.replaceChildren();
 const queue=all.filter(x=>isDue(x,localDate())).sort((a,b)=>a.reviewDate.localeCompare(b.reviewDate));
 for(const x of queue)addRow(f,[x.name,x.firm,x.reviewDate,x.action||"Review before contacting"]);
 el("followups-empty").hidden=queue.length>0;
 const c=el("commitment-body");c.replaceChildren();const verified=all.filter(isVerified);
 for(const x of verified)addRow(c,[x.name,x.firm,formatUSD(x.amount)]);
 el("commitment-empty").hidden=verified.length>0;
}
function renderResearch(){
 const all=research||[];
 const q=el("research-search").value.trim().toLowerCase(),filter=el("research-filter").value;
 const displayed=all.filter(x=>{
  if(q&&![x.name,x.firm].some(y=>y.toLowerCase().includes(q)))return false;
  if(filter==="hold")return /HOLD|DO NOT CONTACT/i.test(x.status);
  if(filter==="unverified")return x.email==="NOT VERIFIED";
  if(filter==="review")return !/HOLD|DO NOT CONTACT/i.test(x.status);
  return true;
 });
 const body=el("research-body");body.replaceChildren();
 for(const x of displayed)addRow(body,[x.name,x.firm,x.score,x.email==="NOT VERIFIED"?"No":"Hold / check",x.status]);
 write("research-count",research?displayed.length+" matching / "+all.length+" imported":"Import Research CSV for individual records");
 write("metric-research",research?all.length:25);
 write("metric-unverified",research?all.filter(x=>x.email==="NOT VERIFIED").length:23);
 el("research-empty").hidden=displayed.length>0;
}
function render(){
 const m=metrics();
 write("metric-contacted",m.contacted);write("metric-replies",m.replies);write("metric-interested",m.interested);
 write("metric-followups",m.followups);write("metric-commitments",formatUSD(m.committed));
 write("summary-sent",m.contacted);write("summary-followup-sent",m.followupSent);write("summary-replied",m.replies);
 write("progress-label",formatUSD(m.committed)+" allocated and verified");
 write("progress-pct",(m.committed/m.goal*100).toFixed(1)+"% confirmed");
 el("progress-bar").style.width=Math.min(100,m.committed/m.goal*100)+"%";
 write("fund-verified",formatUSD(m.committed));write("fund-remaining",formatUSD(Math.max(0,m.goal-m.committed)));
 const notes=[["Follow-up reviews",m.followups+" records need human reply checks before outreach."],
 ["Reply verification",m.replies+" recorded responses; an application invitation is not a commitment."],
 ["Funding confirmation","Previously stated $500K has no investor-by-investor verified allocation."],
 ["Record reconciliation","Legacy PERA summary had 48 contacts; ledger supports 46 unique confirmed."]];
 const block=el("priority-list");block.replaceChildren();
 for(const [title,note] of notes){const p=document.createElement("div");p.className="priority";
 const strong=document.createElement("b");strong.textContent=title;const small=document.createElement("span");small.textContent=note;p.append(strong,small);block.appendChild(p)}
 lists();
 renderResearch();
}
const titles={overview:"Fundraising overview",investors:"Investor tracker",followups:"Follow-up review queue",research:"Research queue",fundraising:"Fundraising progress",activity:"Activity & integrity"};
document.querySelectorAll(".nav").forEach(node=>node.addEventListener("click",()=>{
 const view=node.dataset.view;document.querySelectorAll(".nav").forEach(x=>x.classList.toggle("active",x===node));
 document.querySelectorAll(".view").forEach(x=>x.classList.toggle("active",x.dataset.panel===view));
 write("page-title",titles[view]);
}));
el("investor-search").addEventListener("input",lists);el("investor-filter").addEventListener("change",lists);
el("research-search").addEventListener("input",renderResearch);el("research-filter").addEventListener("change",renderResearch);
el("research-file").addEventListener("change",async event=>{
 const file=event.target.files?.[0];if(!file)return;
 try{
  if(file.size>2_000_000)throw new Error("CSV exceeds 2MB review limit.");
  research=readResearchQueue(await file.text());
  el("clear-import").hidden=false;
  renderResearch();
  write("data-notice","Research queue imported locally ("+research.length+" candidates). Import Outreach Ledger separately to see full outreach status. No data was sent to a server.");
 }catch(error){alert(error.message||"Could not import research CSV.");}
 event.target.value="";
});
el("import-file").addEventListener("change",async event=>{
 const file=event.target.files?.[0];if(!file)return;
 try{
  if(file.size>2_000_000)throw new Error("CSV is larger than the 2MB review limit.");
  const parsed=readInvestorLedger(await file.text());
  investors=parsed;el("clear-import").hidden=false;
  write("data-notice","Imported "+parsed.length+" unique sent contacts from "+file.name+". File data stays in browser memory until reload; not synced to Apollo or PERA.");
  render();
 }catch(error){alert(error.message||"Could not import CSV.");}
 event.target.value="";
});
el("clear-import").addEventListener("click",()=>{
 investors=null;research=null;el("clear-import").hidden=true;
 write("data-notice","Showing verified PERA aggregate snapshot. Import Outreach Ledger CSV to view individual investors. No private investor records are published in this repository.");
 render();
});
render();
