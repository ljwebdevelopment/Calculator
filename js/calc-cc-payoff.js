import { money, num, clampMin } from "./app.js";

const form = document.getElementById("form");
const balanceEl = document.getElementById("balance");
const aprEl = document.getElementById("apr");
const paymentEl = document.getElementById("payment");
const extraEl = document.getElementById("extra");

const err = document.getElementById("err");
const out = document.getElementById("out");
const timeEl = document.getElementById("time");
const line1 = document.getElementById("line1");
const line2 = document.getElementById("line2");
const resetBtn = document.getElementById("reset");

function payoff(balance, aprPct, monthlyPay){
  const r = (aprPct / 100) / 12;

  // If payment doesn't cover interest, it never pays off.
  if (r > 0 && monthlyPay <= balance * r){
    return { months: Infinity, interest: Infinity, totalPaid: Infinity };
  }

  let b = balance;
  let months = 0;
  let interest = 0;
  let paid = 0;

  const CAP = 1200; // 100 years safety cap

  while (b > 0.005 && months < CAP){
    const i = (r === 0) ? 0 : b * r;
    let pay = monthlyPay;

    let principal = pay - i;
    if (principal > b){
      principal = b;
      pay = principal + i;
    }

    b -= principal;
    interest += i;
    paid += pay;
    months++;
  }

  return { months, interest, totalPaid: paid };
}

function fmtTime(months){
  const y = Math.floor(months / 12);
  const m = months % 12;
  if (y <= 0) return `${m} months`;
  if (m === 0) return `${y} years`;
  return `${y} years ${m} months`;
}

function calc(){
  err.textContent = "";

  const balance = clampMin(num(balanceEl.value), 0);
  const apr = clampMin(num(aprEl.value), 0);
  const pay = clampMin(num(paymentEl.value), 0);
  const extra = clampMin(num(extraEl.value), 0);

  if (balance <= 0 || pay <= 0){
    out.hidden = true;
    err.textContent = "Enter a valid balance and monthly payment.";
    return;
  }

  const basePayoff = payoff(balance, apr, pay);

  if (!isFinite(basePayoff.months)){
    out.hidden = true;
    err.textContent =
      "Your payment is too low to reduce the balance at this APR (it doesn’t cover monthly interest). Increase the payment.";
    return;
  }

  const totalMonthly = pay + extra;
  const withExtra = extra > 0 ? payoff(balance, apr, totalMonthly) : null;

  timeEl.textContent = `Payoff time: ${fmtTime(basePayoff.months)} (${basePayoff.months} months)`;
  line1.textContent = `At ${money(pay)}/mo: Interest paid: ${money(basePayoff.interest)} • Total paid: ${money(basePayoff.totalPaid)}`;

  if (withExtra && isFinite(withExtra.months)){
    const savedMonths = basePayoff.months - withExtra.months;
    const savedInterest = basePayoff.interest - withExtra.interest;

    line2.textContent =
      `With extra ${money(extra)}/mo (total ${money(totalMonthly)}/mo): Payoff in ${fmtTime(withExtra.months)} • Save ${savedMonths} months and ${money(savedInterest)} in interest.`;
  } else if (extra > 0 && withExtra && !isFinite(withExtra.months)){
    line2.textContent = `With extra ${money(extra)}/mo: still not enough to pay down principal at this APR.`;
  } else {
    line2.textContent = `Tip: add an extra monthly amount to see how much time and interest you can save.`;
  }

  out.hidden = false;
}

form.addEventListener("submit", (e) => {
  e.preventDefault();
  calc();
});

resetBtn.addEventListener("click", () => {
  balanceEl.value = "";
  aprEl.value = "";
  paymentEl.value = "";
  extraEl.value = "0";
  err.textContent = "";
  out.hidden = true;
});
