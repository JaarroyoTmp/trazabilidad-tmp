import { resolveReferenceValue } from "./reference_value_resolver.js";

const valoresEjemplo = [
  { identificacion_elemento: "152256", nominal: 100, correccion: 0.05, incertidumbre: 0.18, variacion: 0.41, k: 2 },
  { identificacion_elemento: "184381", nominal: 50, correccion: 0.10, incertidumbre: 0.13, variacion: 0.37, k: 2 },
  { identificacion_elemento: "185341", nominal: 20, correccion: 0.03, incertidumbre: 0.10, variacion: 0.07, k: 2 },
  { identificacion_elemento: "183423", nominal: 15, correccion: -0.19, incertidumbre: 0.10, variacion: 0.06, k: 2 },
  { identificacion_elemento: "182126", nominal: 1, correccion: -0.04, incertidumbre: 0.08, variacion: 0.04, k: 2 },
  { identificacion_elemento: "180150", nominal: 1.02, correccion: 0.05, incertidumbre: 0.08, variacion: 0.00, k: 2 }
];

const result = await resolveReferenceValue({
  tipo_patron: "JUEGO_CALAS",
  nominal: 87,
  values: valoresEjemplo
});

console.log(result);