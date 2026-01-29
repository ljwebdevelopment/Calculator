import { money, num, clampMin } from "./app.js";

const KEY = "lumocalc_debts_v1";

const debtsEl = document.getElementById("debts");
const addDebtBtn = document.getElementById("addDebt");
const calcBtn = document.getElementById("calc");
const err = document.getElementById("err");

const strategyEl = document.getElementById("strategy");
const budgetEl = document.getElementById("budget");

const minModeEl = document.getElementById("minMode");
const minCfg = document.getElementById("minCfg");
const minPctEl = document.getElementById("minPct");
const minFloorEl = document.getElementById("minFloor");

const out = document.getElementById("out");
const headline = document.getElementById("headline");
const summary1 = document.getElementById("summary1");
const summary2 = document.getElementById("summary2");

const tbody = document.getElementById("tbody");

let debts = loadDebts();

function loadDebts(){
  try{
    const raw = localStorage.getItem(KEY);
    if (!raw) return [
      { name:"Card A", balance: 1200, apr: 24.99, minPay: 35 },
      { name:"Loan B", balance: 6500, apr: 8.5, minPay: 140 },
    ];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  }catch{
    return [];
  }
}
function saveDebts(){
  localStorage.setItem(KEY, JSON.stringify(debts));
}

function rowTemplate(d, idx){
  return `
    <div class="result" style="margin-top:12px;">
      <div class="row">
        <div class="field">
          <label>Name</label>
          <input data-k="name" data-i="${idx}" value="${escapeHtml(d.name ?? "")}" />
        </div>
        <div class="field">
          <label>Balance</label>
          <input data-k="balance" data-i="${idx}" inputmode="decimal" value="${d.balance ?? ""}" />
        </div>
      </div>
      <div class="row">
        <div class="field">
          <label>APR (%)</label>
          <input data-k="apr" data-i="${idx}" inputmode="decimal" value="${d.apr ?? ""}" />
        </div>
        <div class="field">
          <label>Minimum payment</label>
          <input data-k="minPay" data-i="${idx}" inputmode="decimal" value="${d.minPay ?? ""}" ${minModeEl.value==="percent" ? "disabled" : ""} />
        </div>
      </div>
      <div class="row">
        <button class="btn" type="button" data-del="${idx}">Remove</button>
      </div>
    </div>
  `;
}

function escapeHtml(s){
  return String(s).replace(/[&<>"']/g, (c) => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"
  }[c]));
}

function render(){
  debtsEl.innerHTML = debts.map(rowTemplate).join("");

  // bind inputs
  debtsEl.querySelectorAll("input[data-k]").forEach(inp => {
    inp.addEventListener("input", () => {
      const i = Number(inp.dataset.i);
      const k = inp.dataset.k;
      if (!debts[i]) return;

      if (k === "name") debts[i][k] = inp.value;
      else debts[i][k] = num(inp.value);

      saveDebts();
    });
  });

  // remove buttons
  debtsEl.querySelectorAll("button[data-del]").forEach(btn => {
    btn.addEventListener("click", () => {
      const i = Number(btn.dataset.del);
      debts.splice(i, 1);
      saveDebts();
      render();
    });
  });
}

minModeEl.addEventListener("change", () => {
  minCfg.hidden = (minModeEl.value !== "percent");
  render();
});

addDebtBtn.addEventListener("click", () => {
  debts.push({ name:`Debt ${debts.length+1}`, balance: 0, apr: 0, minPay: 0 });
  saveDebts();
  render();
});

function computeMin(balance){
  const pct = clampMin(num(minPctEl.value), 0) / 100;
  const floor = clampMin(num(minFloorEl.value), 0);
  return Math.max(floor, balance * pct);
}

function sortDebts(ds, strategy){
  const alive = ds.filter(d => d.balance > 0.005);
  if (strategy === "avalanche"){
    alive.sort((a,b) => (b.apr - a.apr) || (a.balance - b.balance));
  } else {
    alive.sort((a,b) => (a.balance - b.balance) || (b.apr - a.apr));
  }
  return alive;
}

function simulate(debtsIn, budget, strategy){
  const ds = debtsIn.map(d => ({
    name: String(d.name || "Debt"),
    balance: clampMin(num(d.balance), 0),
    apr: clampMin(num(d.apr), 0),
    minPay: clampMin(num(d.minPay), 0)
  })).filter(d => d.balance > 0.005);

  const usePercentMin = (minModeEl.value === "percent");
  const r = (aprPct) => (aprPct/100)/12;

  // Validate minimums if needed
  if (!usePercentMin){
    for (const d of ds){
      if (d.minPay <= 0){
        return { error: `Minimum payment missing for "${d.name}". Either enter minimums or switch to % rule.` };
      }
    }
  }

  let month = 0;
  let totalInterest = 0;
  let totalPaid = 0;

  const CAP = 1200;
  const preview = [];

  while (month < CAP){
    const remaining = ds.reduce((s,d)=>s+d.balance,0);
    if (remaining <= 0.01) break;

    // Order and pick focus
    const ordered = sortDebts(ds, strategy);
    const focus = ordered[0];

    // Minimum payments
    const mins = ds.map(d => {
      const m = usePercentMin ? computeMin(d.balance) : d.minPay;
      return Math.min(m, d.balance); // cannot exceed balance (before interest)
    });

    const minSum = mins.reduce((s,v)=>s+v,0);
    if (budget <= 0) return { error: "Enter a valid monthly budget." };
    if (minSum - budget > 0.01) {
      return { error: `Your budget (${money(budget)}) is lower than minimum payments (${money(minSum)}). Increase budget or adjust minimums.` };
    }

    // Interest accrues first (monthly compounding approximation)
    let monthInterest = 0;
    for (const d of ds){
      const i = d.balance * r(d.apr);
      d.balance += i;
      monthInterest += i;
    }
    totalInterest += monthInterest;

    // Pay minimums after interest
    let paidThisMonth = 0;
    for (let i=0;i<ds.length;i++){
      const d = ds[i];
      const pay = Math.min(mins[i], d.balance);
      d.balance -= pay;
      paidThisMonth += pay;
    }

    // Extra goes to focus (re-evaluate focus after mins)
    const extra = budget - paidThisMonth;
    if (extra > 0.005){
      // Determine current focus again (some debts may be paid off)
      const ordered2 = sortDebts(ds, strategy);
      const f = ordered2[0];
      const extraPay = Math.min(extra, f.balance);
      f.balance -= extraPay;
      paidThisMonth += extraPay;
    }

    totalPaid += paidThisMonth;
    month++;

    const remainingAfter = ds.reduce((s,d)=>s+d.balance,0);

    if (preview.length < 12){
      const focusName = sortDebts(ds, strategy)[0]?.name || "—";
      preview.push({
        month,
        focus: focusName,
        paid: paidThisMonth,
        interest: monthInterest,
        remaining: remainingAfter
      });
    }
  }

  if (month >= CAP) return { error: "This scenario didn't pay off within 100 years. Increase budget or check inputs." };

  return { months: month, totalInterest, totalPaid, preview };
}

function renderPreview(rows){
  tbody.innerHTML = rows.map(r => `
    <tr>
      <td style="padding:8px; border-bottom:1px solid rgba(255,255,255,.08);">${r.month}</td>
      <td style="padding:8px; border-bottom:1px solid rgba(255,255,255,.08);">${escapeHtml(r.focus)}</td>
      <td style="padding:8px; border-bottom:1px solid rgba(255,255,255,.08);">${money(r.paid)}</td>
      <td style="padding:8px; border-bottom:1px solid rgba(255,255,255,.08);">${money(r.interest)}</td>
      <td style="padding:8px; border-bottom:1px solid rgba(255,255,255,.08);">${money(r.remaining)}</td>
    </tr>
  `).join("");
}

calcBtn.addEventListener("click", () => {
  err.textContent = "";
  out.hidden = true;

  const budget = clampMin(num(budgetEl.value), 0);
  if (debts.length === 0){
    err.textContent = "Add at least one debt.";
    return;
  }

  const res = simulate(debts, budget, strategyEl.value);

  if (res.error){
    err.textContent = res.error;
    return;
  }

  const yrs = Math.floor(res.months / 12);
  const mos = res.months % 12;
  const timeStr = yrs > 0 ? `${yrs}y ${mos}m` : `${mos}m`;

  headline.textContent = `Estimated payoff time: ${timeStr} (${res.months} months)`;
  summary1.textContent = `Total interest paid (estimate): ${money(res.totalInterest)}`;
  summary2.textContent = `Total paid: ${money(res.totalPaid)} • Strategy: ${strategyEl.value === "snowball" ? "Snowball" : "Avalanche"}`;

  renderPreview(res.preview);
  out.hidden = false;
});

minCfg.hidden = true;
render();
