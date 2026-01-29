const exprInput = document.getElementById("expr");
const err = document.getElementById("err");
const out = document.getElementById("out");
const ans = document.getElementById("ans");

document.querySelectorAll("[data-ins]").forEach(b => {
  b.addEventListener("click", () => {
    insertAtCursor(exprInput, b.dataset.ins);
    exprInput.focus();
  });
});

document.getElementById("clear").addEventListener("click", () => {
  exprInput.value = "";
  err.textContent = "";
  out.hidden = true;
});

document.getElementById("calc").addEventListener("click", () => {
  err.textContent = "";
  out.hidden = true;

  try{
    const val = evaluate(exprInput.value);
    if (!isFinite(val)) throw new Error("Result is not a finite number.");
    ans.textContent = String(Number(val.toFixed(12)));
    out.hidden = false;
  }catch(e){
    err.textContent = e.message || "Invalid expression.";
  }
});

function insertAtCursor(input, text){
  const start = input.selectionStart ?? input.value.length;
  const end = input.selectionEnd ?? input.value.length;
  const v = input.value;
  input.value = v.slice(0, start) + text + v.slice(end);
  input.selectionStart = input.selectionEnd = start + text.length;
}

/* -------- Safe parser (no eval) -------- */
function evaluate(src){
  const tokens = tokenize(src);
  const rpn = toRPN(tokens);
  return evalRPN(rpn);
}

function tokenize(s){
  s = s.trim();
  if (!s) throw new Error("Enter an expression.");

  const re = /\s*([0-9]*\.?[0-9]+|pi|e|sin|cos|tan|sqrt|ln|log|\+|\-|\*|\/|\^|\(|\))\s*/gy;
  const out = [];
  let i = 0;
  while (i < s.length){
    re.lastIndex = i;
    const m = re.exec(s);
    if (!m) throw new Error(`Unexpected character near: "${s.slice(i, i+10)}"`);
    out.push(m[1]);
    i = re.lastIndex;
  }
  // handle unary minus by inserting 0 where needed: (-x) or start -x
  const fixed = [];
  for (let j=0;j<out.length;j++){
    const t = out[j];
    if (t === "-" && (j === 0 || ["+","-","*","/","^","("].includes(out[j-1]))){
      fixed.push("0");
      fixed.push("-");
    } else fixed.push(t);
  }
  return fixed;
}

function prec(op){
  if (op === "^") return 4;
  if (op === "*" || op === "/") return 3;
  if (op === "+" || op === "-") return 2;
  return 0;
}
function rightAssoc(op){ return op === "^"; }

function isFunc(t){ return ["sin","cos","tan","sqrt","ln","log"].includes(t); }
function isOp(t){ return ["+","-","*","/","^"].includes(t); }

function toRPN(tokens){
  const out = [];
  const stack = [];

  for (const t of tokens){
    if (isNumber(t) || t === "pi" || t === "e"){
      out.push(t);
    } else if (isFunc(t)){
      stack.push(t);
    } else if (isOp(t)){
      while (stack.length){
        const top = stack[stack.length-1];
        if (isFunc(top)) { out.push(stack.pop()); continue; }
        if (isOp(top) && ((rightAssoc(t) && prec(t) < prec(top)) || (!rightAssoc(t) && prec(t) <= prec(top)))){
          out.push(stack.pop());
          continue;
        }
        break;
      }
      stack.push(t);
    } else if (t === "("){
      stack.push(t);
    } else if (t === ")"){
      while (stack.length && stack[stack.length-1] !== "("){
        out.push(stack.pop());
      }
      if (!stack.length) throw new Error("Mismatched parentheses.");
      stack.pop(); // remove "("
      if (stack.length && isFunc(stack[stack.length-1])) out.push(stack.pop());
    } else {
      throw new Error(`Unknown token: ${t}`);
    }
  }

  while (stack.length){
    const t = stack.pop();
    if (t === "(" || t === ")") throw new Error("Mismatched parentheses.");
    out.push(t);
  }
  return out;
}

function isNumber(t){
  return /^[0-9]*\.?[0-9]+$/.test(t);
}

function evalRPN(rpn){
  const st = [];
  const deg = (x) => x * Math.PI / 180;

  for (const t of rpn){
    if (isNumber(t)) st.push(parseFloat(t));
    else if (t === "pi") st.push(Math.PI);
    else if (t === "e") st.push(Math.E);
    else if (isOp(t)){
      const b = st.pop(); const a = st.pop();
      if (a === undefined || b === undefined) throw new Error("Invalid expression.");
      if (t === "+") st.push(a+b);
      if (t === "-") st.push(a-b);
      if (t === "*") st.push(a*b);
      if (t === "/") st.push(b === 0 ? NaN : a/b);
      if (t === "^") st.push(Math.pow(a,b));
    } else if (isFunc(t)){
      const a = st.pop();
      if (a === undefined) throw new Error("Invalid function usage.");
      if (t === "sin") st.push(Math.sin(deg(a)));
      if (t === "cos") st.push(Math.cos(deg(a)));
      if (t === "tan") st.push(Math.tan(deg(a)));
      if (t === "sqrt") st.push(a < 0 ? NaN : Math.sqrt(a));
      if (t === "ln") st.push(a <= 0 ? NaN : Math.log(a));
      if (t === "log") st.push(a <= 0 ? NaN : Math.log10(a));
    } else {
      throw new Error(`Unknown token: ${t}`);
    }
  }

  if (st.length !== 1) throw new Error("Invalid expression.");
  return st[0];
}
