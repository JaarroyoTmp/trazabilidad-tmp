/* ===========================================================
   TMP UNCERTAINTY ENGINE V1
   -----------------------------------------------------------
   Motor genérico de incertidumbre TMP.

   Regla TMP V1:
   - Por defecto, 5 registros por punto.
   - u_repetibilidad = s / sqrt(n)
   - u_resolucion = resolucion / sqrt(12)
   - u_patron = U_patron / k_patron
   - u_c = sqrt(sum(ui^2))
   - U = k * u_c

   Unidades:
   - El motor trabaja internamente en mm salvo que se indique otra unidad.
   - Si el patrón viene en µm, se convierte a mm.
   =========================================================== */

export const TMP_DEFAULT_REPETITIONS = 5;
export const TMP_DEFAULT_K = 2;

export function parseNum(value, fallback = 0) {
  if (typeof value === "number") return Number.isFinite(value) ? value : fallback;
  if (value === null || value === undefined || value === "") return fallback;
  const n = Number(String(value).replace(",", ".").trim());
  return Number.isFinite(n) ? n : fallback;
}

export function roundTo(value, decimals = 9) {
  const n = parseNum(value);
  const f = Math.pow(10, decimals);
  return Math.round(n * f) / f;
}

export function mean(values = []) {
  const nums = values.map((v) => parseNum(v, NaN)).filter(Number.isFinite);
  if (!nums.length) return 0;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

export function sampleStd(values = []) {
  const nums = values.map((v) => parseNum(v, NaN)).filter(Number.isFinite);
  const n = nums.length;
  if (n < 2) return 0;
  const m = mean(nums);
  const sum = nums.reduce((acc, x) => acc + Math.pow(x - m, 2), 0);
  return Math.sqrt(sum / (n - 1));
}

export function rss(values = []) {
  return Math.sqrt(
    values.map((v) => parseNum(v)).reduce((acc, v) => acc + Math.pow(v, 2), 0)
  );
}

export function umToMm(valueUm) {
  return parseNum(valueUm) / 1000;
}

export function normalizeUncertainty(value, unidad = "mm") {
  const u = String(unidad || "mm").toLowerCase();

  if (u === "um" || u === "µm" || u === "micra" || u === "micras" || u === "micrometro" || u === "micrometros") {
    return umToMm(value);
  }

  return parseNum(value);
}

/* ===========================================================
   Componentes básicas
   =========================================================== */

export function componentPattern(input = {}) {
  const expanded = normalizeUncertainty(
    input.U ?? input.incertidumbre ?? input.u_patron ?? 0,
    input.unidad ?? input.incertidumbre_unidad ?? "mm"
  );

  const k = parseNum(input.k ?? input.factor_k ?? input.factor_cobertura, TMP_DEFAULT_K);
  const standard = k > 0 ? expanded / k : expanded / TMP_DEFAULT_K;

  return {
    key: "patron_referencia",
    nombre: "Incertidumbre del patrón",
    tipo: "B",
    distribucion: "normal",
    valor_expandido: roundTo(expanded),
    k,
    u: roundTo(standard)
  };
}

export function componentResolution(input = {}) {
  const resolution = normalizeUncertainty(
    input.resolucion ?? input.resolucion_equipo ?? 0,
    input.unidad ?? "mm"
  );

  const standard = resolution / Math.sqrt(12);

  return {
    key: "resolucion",
    nombre: "Resolución del equipo",
    tipo: "B",
    distribucion: "rectangular",
    resolucion: roundTo(resolution),
    u: roundTo(standard)
  };
}

export function componentRepeatability(lecturas = []) {
  const nums = lecturas.map((v) => parseNum(v, NaN)).filter(Number.isFinite);
  const n = nums.length || TMP_DEFAULT_REPETITIONS;
  const s = sampleStd(nums);
  const standard = n > 0 ? s / Math.sqrt(n) : 0;

  return {
    key: "repetibilidad",
    nombre: "Repetibilidad",
    tipo: "A",
    distribucion: "normal",
    n,
    media: roundTo(mean(nums)),
    s: roundTo(s),
    u: roundTo(standard)
  };
}

export function componentTemperature(input = {}) {
  const enabled = input.aplica === true || input.enabled === true;

  if (!enabled) {
    return {
      key: "temperatura",
      nombre: "Temperatura",
      tipo: "B",
      distribucion: "rectangular",
      aplicado: false,
      u: 0
    };
  }

  const L = parseNum(input.longitud ?? input.nominal ?? 0);
  const alpha = parseNum(input.coef_expansion ?? input.alpha ?? 11.5e-6);
  const deltaT = parseNum(input.delta_t ?? input.deltaT ?? 0);

  const standard = Math.abs(L * alpha * deltaT / Math.sqrt(3));

  return {
    key: "temperatura",
    nombre: "Temperatura / dilatación",
    tipo: "B",
    distribucion: "rectangular",
    aplicado: true,
    longitud: L,
    alpha,
    deltaT,
    u: roundTo(standard)
  };
}

/* ===========================================================
   Combinación
   =========================================================== */

export function combineComponents(components = [], options = {}) {
  const k = parseNum(options.k, TMP_DEFAULT_K);
  const validComponents = components.filter((c) => c && Number.isFinite(parseNum(c.u)));

  const uc = rss(validComponents.map((c) => c.u));
  const U = k * uc;

  return {
    ok: true,
    k,
    uc: roundTo(uc),
    U: roundTo(U),
    unidad: options.unidad || "mm",
    componentes: validComponents.map((c) => ({
      ...c,
      u: roundTo(c.u)
    }))
  };
}

/* ===========================================================
   Motor genérico por punto
   =========================================================== */

export function calculateGenericPointUncertainty(input = {}) {
  const lecturas = input.lecturas || input.registros || [];

  const components = [];

  if (input.patron || input.referencia || input.incertidumbre_patron !== undefined) {
    const p = input.patron || input.referencia || {};
    components.push(componentPattern({
      U: input.incertidumbre_patron ?? p.incertidumbre_total_mm ?? p.incertidumbre ?? p.U,
      unidad: input.incertidumbre_patron_unidad ?? p.incertidumbre_unidad ?? p.unidad_incertidumbre ?? "mm",
      k: input.k_patron ?? p.k ?? TMP_DEFAULT_K
    }));
  }

  if (input.resolucion !== undefined || input.resolucion_equipo !== undefined) {
    components.push(componentResolution({
      resolucion: input.resolucion ?? input.resolucion_equipo,
      unidad: input.unidad_resolucion ?? input.unidad ?? "mm"
    }));
  }

  if (lecturas.length) {
    components.push(componentRepeatability(lecturas));
  }

  if (input.temperatura) {
    components.push(componentTemperature({
      ...input.temperatura,
      nominal: input.nominal,
      longitud: input.nominal
    }));
  }

  if (Array.isArray(input.componentes_extra)) {
    for (const extra of input.componentes_extra) {
      const u = normalizeUncertainty(extra.u ?? extra.valor ?? 0, extra.unidad ?? input.unidad ?? "mm");
      components.push({
        key: extra.key || "extra",
        nombre: extra.nombre || extra.key || "Componente adicional",
        tipo: extra.tipo || "B",
        distribucion: extra.distribucion || "normal",
        u: roundTo(u),
        datos: extra
      });
    }
  }

  const combined = combineComponents(components, {
    k: input.k ?? TMP_DEFAULT_K,
    unidad: input.unidad || "mm"
  });

  return {
    ...combined,
    nominal: input.nominal ?? null,
    media_lecturas: lecturas.length ? roundTo(mean(lecturas)) : null,
    repeticiones: lecturas.length || TMP_DEFAULT_REPETITIONS
  };
}

/* ===========================================================
   Modelos específicos V1
   =========================================================== */

export function calculateDimensionalUncertainty(input = {}) {
  return calculateGenericPointUncertainty({
    ...input,
    unidad: input.unidad || "mm"
  });
}

export function calculateTorqueUncertainty(input = {}) {
  return calculateGenericPointUncertainty({
    ...input,
    unidad: input.unidad || "Nm"
  });
}

export function calculateMassUncertainty(input = {}) {
  return calculateGenericPointUncertainty({
    ...input,
    unidad: input.unidad || "g"
  });
}

/* ===========================================================
   Entrada principal
   =========================================================== */

export function calculateUncertainty(input = {}) {
  const family = String(input.family || input.familia || input.familia_equipo || "").toUpperCase();

  if (family === "LLAVE_DINAMOMETRICA") {
    return calculateTorqueUncertainty(input);
  }

  if (family === "BALANZA") {
    return calculateMassUncertainty(input);
  }

  return calculateDimensionalUncertainty(input);
}

/* ===========================================================
   Ejemplo:
   calculateUncertainty({
     family: "MICROMETRO_EXTERIOR",
     nominal: 25,
     lecturas: [25.001, 25.001, 25.000, 25.001, 25.000],
     resolucion: 0.001,
     patron: {
       incertidumbre: 0.00013,
       incertidumbre_unidad: "mm",
       k: 2
     },
     k: 2
   })
   =========================================================== */
