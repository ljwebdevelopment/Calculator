export function money(n){
  if (!isFinite(n)) return "$0.00";
  return n.toLocaleString(undefined, { style:"currency", currency:"USD" });
}

export function num(v){
  const x = Number(v);
  return isFinite(x) ? x : 0;
}

export function clampMin(x, min){
  return x < min ? min : x;
}
