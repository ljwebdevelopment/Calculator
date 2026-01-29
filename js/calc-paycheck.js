import { money, num, clampMin } from "./app.js";

const form = document.getElementById("form");
const modeEl = document.getElementById("mode");
const freqEl = document.getElementById("freq");

const hourlyBox = document.getElementById("hourlyBox");
const salaryBox = document.getElementById("salaryBox");

const rateEl = document.getElementById("rate");
const hoursEl = document.getElementById("hours");
const otOnEl = document.getElementById("otOn");
const otThresholdEl = document.getElementById("otThreshold");
const otMultEl = document.getElementById("otMult");
const hoursPerWeekEl = document.getElementById("hoursPerWeek");

const salaryEl = document.getElementById("salary");
const salaryExtraEl = document.getElementById("salaryExtra");

const err = document.getElementById("err");
const out = document.getElementById("out");
const paycheckEl = document.getElementById("paycheck");
const detail1 = document.getElementById("detail1");
const detail2 = document.getElementById("detail2");
const resetBtn = document.getElementById("reset");

function paysPerYear(freq){
  switch(freq){
    case "weekly": return 52;
    case "biweekly": return 26;
    case "semimonthly": return 24;
    case "monthly": return 12;
    default: return 26;
  }
}

function weeksInPayPeriod(freq){
  // Approximate weeks per pay period
  switch(freq){
    case "weekly": return 1;
    case "biweekly": return 2;
    case "semimonthly": return 52/24; // ~2.1667
    case "monthly": return 52/12;     // ~4.3333
    default: return 2;
  }
}

function setModeUI(){
  const mode = modeEl.value;
  if (mode === "hourly"){
    hourlyBox.hidden = false;
    salaryBox.hidden = true;
  } else {
    hourlyBox.hidden = true;
    salaryBox.hidden = false;
  }
  out.hidden = true;
  err.textContent = "";
}

modeEl.addEventListener("change", setModeUI);

function calc(){
  err.textContent = "";
  const freq = freqEl.value;
  const ppy = paysPerYear(freq);

  if (modeEl.value === "salary"){
    const annual = clampMin(num(salaryEl.value), 0);
    const extra = clampMin(num(salaryExtraEl.value), 0);

    if (annual <= 0){
      out.hidden = true;
      err.textContent = "Enter a valid annual salary.";
      return;
    }

    const per = (annual / ppy) + extra;

    paycheckEl.textContent = `${money(per)} (gross)`;
    detail1.textContent = `Annual: ${money(annual)} • Paychecks/year: ${ppy} • Base per paycheck: ${money(annual/ppy)}`;
    detail2.textContent = extra > 0 ? `Extra per paycheck: ${money(extra)} • Total per paycheck: ${money(per)}` : `Tip: add extra per paycheck if you have bonuses/allowances.`;

    out.hidden = false;
    return;
  }

  // HOURLY
  const rate = clampMin(num(rateEl.value), 0);
  const hours = clampMin(num(hoursEl.value), 0);

  if (rate <= 0 || hours <= 0){
    out.hidden = true;
    err.textContent = "Enter a valid hourly rate and hours per pay period.";
    return;
  }

  let gross = rate * hours;
  let breakdown = `Hourly: ${hours.toFixed(2)} hrs × ${money(rate)} = ${money(gross)}`;

  if (otOnEl.value === "yes"){
    const w = weeksInPayPeriod(freq);
    const perWeek = clampMin(num(hoursPerWeekEl.value), 0);
    const threshold = clampMin(num(otThresholdEl.value), 0);
    const mult = clampMin(num(otMultEl.value), 1);

    if (perWeek <= 0){
      out.hidden = true;
      err.textContent = "OT is on — enter hours per week (for OT calc), or switch OT off.";
      return;
    }

    const regH = Math.min(perWeek, threshold);
    const otH = Math.max(0, perWeek - threshold);

    const regPayW = regH * rate;
    const otPayW = otH * rate * mult;
    const weekPay = regPayW + otPayW;

    gross = weekPay * w;

    breakdown =
      `Weekly: Regular ${regH.toFixed(2)}h + OT ${otH.toFixed(2)}h @ ${money(rate*mult)} → ${money(weekPay)} / week • ` +
      `× ${w.toFixed(3)} weeks/pay period = ${money(gross)}`;
  }

  paycheckEl.textContent = `${money(gross)} (gross)`;
  detail1.textContent = breakdown;
  detail2.textContent = `Estimated yearly gross (approx): ${money(gross * ppy)}`;

  out.hidden = false;
}

form.addEventListener("submit", (e) => {
  e.preventDefault();
  calc();
});

resetBtn.addEventListener("click", () => {
  modeEl.value = "hourly";
  freqEl.value = "biweekly";

  rateEl.value = "";
  hoursEl.value = "";
  otOnEl.value = "no";
  otThresholdEl.value = "40";
  otMultEl.value = "1.5";
  hoursPerWeekEl.value = "";

  salaryEl.value = "";
  salaryExtraEl.value = "0";

  setModeUI();
});
setModeUI();
