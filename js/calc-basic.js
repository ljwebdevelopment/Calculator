const display = document.getElementById("display");
const exprEl = document.getElementById("expr");

let current = "0";
let prev = null;
let op = null;
let justSolved = false;

function setDisplay(val){
  display.textContent = val;
}

function setExpr(){
  if (prev === null || op === null) exprEl.textContent = "";
  else exprEl.textContent = `${prev} ${op}`;
}

function cleanNumStr(s){
  if (s === "" || s === "-") return "0";
  if (s.includes(".")){
    // trim leading zeros
    s = s.replace(/^(-?)0+(\d)/, "$1$2");
  }else{
    s = String(parseFloat(s));
  }
  return s;
}

function inputNum(ch){
  if (justSolved){
    current = "0";
    prev = null;
    op = null;
    justSolved = false;
  }
  if (ch === "."){
    if (!current.includes(".")) current += ".";
    return;
  }
  if (current === "0") current = ch;
  else if (current === "-0") current = "-" + ch;
  else current += ch;
}

function toggleNeg(){
  if (current.startsWith("-")) current = current.slice(1);
  else current = "-" + current;
  current = cleanNumStr(current);
}

function backspace(){
  if (justSolved) return;
  if (current.length <= 1) current = "0";
  else current = current.slice(0, -1);
  if (current === "-") current = "0";
}

function clearAll(){
  current = "0";
  prev = null;
  op = null;
  justSolved = false;
}

function applyOp(a, b, op){
  if (op === "+") return a + b;
  if (op === "-") return a - b;
  if (op === "*") return a * b;
  if (op === "/") return b === 0 ? NaN : a / b;
  if (op === "%") return a * (b / 100); // "a % of b" style isn't standard; we use a*(b/100) when used as binary
  return b;
}

function chooseOp(nextOp){
  const curVal = parseFloat(current);

  if (op && prev !== null && !justSolved){
    const result = applyOp(prev, curVal, op);
    prev = result;
    current = "0";
  } else {
    prev = curVal;
    current = "0";
  }

  op = nextOp;
  justSolved = false;
}

function equals(){
  if (op === null || prev === null) return;
  const a = prev;
  const b = parseFloat(current);

  let result;
  if (op === "%"){
    // treat "a % b" as "a * (b/100)"
    result = a * (b / 100);
  } else {
    result = applyOp(a, b, op);
  }

  if (!isFinite(result)) {
    current = "Error";
  } else {
    current = String(Number(result.toFixed(12))); // reduce float noise
  }
  prev = null;
  op = null;
  justSolved = true;
}

document.addEventListener("click", (e) => {
  const btn = e.target.closest("button");
  if (!btn) return;

  const n = btn.dataset.num;
  const o = btn.dataset.op;
  const act = btn.dataset.act;

  if (n !== undefined){
    if (current === "Error") current = "0";
    inputNum(n);
  } else if (o){
    if (current === "Error") return;
    chooseOp(o);
  } else if (act){
    if (act === "clear") clearAll();
    if (act === "back") backspace();
    if (act === "neg") toggleNeg();
    if (act === "equals") equals();
  }

  setDisplay(current);
  setExpr();
});

setDisplay(current);
setExpr();
