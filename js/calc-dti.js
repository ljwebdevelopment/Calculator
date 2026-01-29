import { num, clampMin } from "./app.js";

const form = document.getElementById("form");
const incomeEl = document.getElementById("income");
const debtEl = document.getElementById("debt");
const out = document.getElementById("out");
const dtiEl = document.getElementById("dti");
const ratingEl = document.getElementById("rating");
const detailsEl = document.getElementById("details");
const err = document.getElementById("err");
const resetBtn = document.getElementById("reset");

form.addEventListener("submit", e => {
  e.preventDefault();
  err.textContent = "";

  const income = clampMin(num(incomeEl.value), 0);
  const debt = clampMin(num(debtEl.value), 0);

  if (income <= 0) {
    err.textContent = "Enter a valid monthly income.";
    out.hidden = true;
    return;
  }

  const dti = (debt / income) * 100;
  dtiEl.textContent = `DTI: ${dti.toFixed(1)}%`;

  let rating = "High risk";
  if (dti <= 36) rating = "Excellent";
  else if (dti <= 43) rating = "Acceptable";
  else if (dti <= 50) rating = "Risky";

  ratingEl.textContent = `Lender view: ${rating}`;
  detailsEl.textContent =
    "Most lenders prefer DTI under 36%. FHA loans may allow up to ~43–50%.";

  out.hidden = false;
});

resetBtn.addEventListener("click", () => {
  incomeEl.value = "";
  debtEl.value = "";
  err.textContent = "";
  out.hidden = true;
});
