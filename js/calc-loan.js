import { money, num, clampMin } from "./app.js";

const form = document.getElementById("form");
const amountEl = document.getElementById("amount");
const aprEl = document.getElementById("apr");
const yearsEl = document.getElementById("years");
const extraEl = document.getElementById("extra");

const err = document.getElementById("err");
const out = document.getElementById("out");
const paymentEl = document.getElementById("payment");
const summaryEl = document.getElementById("summary");
const summary2El = document.getElementById("summary2");
const resetBtn = document.getElementById("reset");

function amortizedPayment(P, aprPct, months){
  const r = (aprPct / 100) / 12;
  if (r === 0) return P / months;
  return P * (r * Math.pow(1 + r, months)) / (Math.pow(1 + r, months) - 1);
}

function payoffWithExtra(P, aprPct, basePayment, extraPayment){
  const r = (aprPct / 100) / 12;
  const pay = basePayment + extraPayment;

  // If payment doesn't cover interest, it will never pay off.
  if (r > 0 && pay <= P * r) {
    return { months: Infinity, totalInterest: Infinity, totalPaid: Infinity };
  }

  let balance = P;
  let months = 0;
  let totalInterest = 0;

  // Safety cap so we never infinite-loop
  const CAP = 1200; // 100 years

  while (balance > 0.005 && months < CAP){
    const interest = balance * r;
    let principal = pay - interest;

    if (r === 0) {
      principal = pay;
    }

    if (principal <= 0) {
      return { months: Infinity, totalInterest: Infinity, totalPaid: Infinity };
    }

    // Last payment adjustment
    if (principal > balance) {
      principal = balance;
    }

    balance -= principal;
    totalInterest += interest;
    months++;
  }

  const totalPaid = (basePayment + extraPayment) * (months - 1) + (r === 0
    ? Math.min(basePayment + extraPayment, P - (basePayment + extraPayment) * (months - 1))
    : null);

  // The totalPaid above gets messy with last-payment adjustments.
  // We'll recompute totalPaid more cleanly by simulating a second time and tracking actual payments.
  balance = P;
  months = 0;
  totalInterest = 0;
  let paid = 0;

  while (balance > 0.005 && months < CAP){
    const interest = (r === 0) ? 0 : balance * r;
    let payment = pay;

    let principal = payment - interest;
    if (principal > balance) {
      principal = balance;
      payment = principal + interest;
    }

    balance -= principal;
    totalInterest += interest;
    paid += payment;
    months++;
  }

  return { months, totalInterest, totalPaid: paid };
}

function calc(){
  err.textContent = "";

  const P = clampMin(num(amountEl.value), 0);
  const apr = clampMin(num(aprEl.value), 0);
  const years = clampMin(num(yearsEl.value), 0);
  const extra = clampMin(num(extraEl.value), 0);

  const months = Math.round(years * 12);

  if (P <= 0 || months <= 0){
    out.hidden = true;
    err.textContent = "Enter a valid loan amount and term (years).";
    return;
  }

  const base = amortizedPayment(P, apr, months);
  const totalBasePaid = base * months;
  const totalBaseInterest = totalBasePaid - P;

  paymentEl.textContent = `${money(base)} / month`;

  summaryEl.textContent =
    `Standard payment: ${money(base)} for ${months} months • Total interest: ${money(totalBaseInterest)} • Total paid: ${money(totalBasePaid)}`;

  if (extra > 0){
    const withExtra = payoffWithExtra(P, apr, base, extra);

    if (!isFinite(withExtra.months)){
      summary2El.textContent =
        `With extra ${money(extra)}/mo: payment is too low to ever pay off at this APR. Increase the payment.`;
    } else {
      const years2 = Math.floor(withExtra.months / 12);
      const months2 = withExtra.months % 12;

      const timeStr = years2 > 0 ? `${years2}y ${months2}m` : `${months2}m`;

      summary2El.textContent =
        `With extra ${money(extra)}/mo: payoff in ${timeStr} (${withExtra.months} months) • Interest: ${money(withExtra.totalInterest)} • Total paid: ${money(withExtra.totalPaid)}`;
    }
  } else {
    summary2El.textContent = `Tip: add an extra monthly payment to see payoff speed and interest savings.`;
  }

  out.hidden = false;
}

form.addEventListener("submit", (e) => {
  e.preventDefault();
  calc();
});

resetBtn.addEventListener("click", () => {
  amountEl.value = "";
  aprEl.value = "";
  yearsEl.value = "5";
  extraEl.value = "0";
  err.textContent = "";
  out.hidden = true;
});

