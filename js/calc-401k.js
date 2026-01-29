import { num, clampMin, money } from "./app.js";

const form = document.getElementById("form");
const out = document.getElementById("out");
const err = document.getElementById("err");

form.addEventListener("submit", e => {
  e.preventDefault();
  err.textContent = "";

  const age = clampMin(num(document.getElementById("age").value), 0);
  const retire = clampMin(num(document.getElementById("retire").value), 0);
  const balance = clampMin(num(document.getElementById("balance").value), 0);
  const salary = clampMin(num(document.getElementById("salary").value), 0);
  const contrib = clampMin(num(document.getElementById("contrib").value), 0) / 100;
  const match = clampMin(num(document.getElementById("match").value), 0) / 100;
  const rate = clampMin(num(document.getElementById("return").value), 0) / 100;

  if (age <= 0 || retire <= age || salary <= 0) {
    err.textContent = "Enter valid ages and salary.";
    out.hidden = true;
    return;
  }

  const years = retire - age;
  let total = balance;

  for (let i = 0; i < years; i++) {
    const annualContrib = salary * (contrib + match);
    total = (total + annualContrib) * (1 + rate);
  }

  document.getElementById("total").textContent =
    `Estimated balance: ${money(total)}`;
  document.getElementById("years").textContent =
    `Time horizon: ${years} years`;
  document.getElementById("notes").textContent =
    "This is a simplified estimate and does not account for salary growth, taxes, or market volatility.";

  out.hidden = false;
});

document.getElementById("reset").addEventListener("click", () => {
  form.reset();
  out.hidden = true;
  err.textContent = "";
});
