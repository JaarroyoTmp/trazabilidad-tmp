export function parseNum(v) {
  if (typeof v === "number") return v;
  if (v === null || v === undefined) return 0;
  const n = Number(String(v).trim().replace(",", "."));
  return Number.isFinite(n) ? n : 0;
}

export function media(valores) {
  const nums = valores.map(parseNum).filter(Number.isFinite);
  if (!nums.length) return 0;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

export function desviacionTipicaMuestral(valores) {
  const nums = valores.map(parseNum).filter(Number.isFinite);
  const n = nums.length;
  if (n < 2) return 0;

  const m = media(nums);
  const suma = nums.reduce((acc, x) => acc + Math.pow(x - m, 2), 0);
  return Math.sqrt(suma / (n - 1));
}

export function evaluarILAC(errorUm, uUm, toleranciaUm) {
  const absE = Math.abs(parseNum(errorUm));
  const U = parseNum(uUm);
  const T = parseNum(toleranciaUm);

  if (absE + U <= T) return "APTO";
  if (absE - U > T) return "NO APTO";
  return "INDETERMINADO";
}