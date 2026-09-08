/* TMP EXAMPLE - Calibration Router */

import { resolveCalibrationProcedure, canStartCalibration } from "../engines/calibration_router.js";

const equipos = [
  { codigo: "11217", descripcion: "Tampón liso P/NP", rango: "Ø8.5 H8" },
  { codigo: "154490012", descripcion: "Tampón de Rosca P/NP", rango: "M18 x 1.5 - 6H" },
  { codigo: "0401531", descripcion: "Reloj Comparador Milésimal", rango: "0-10mm", precision: "0.001mm" },
  { codigo: "MIC-001", descripcion: "Micrómetro exteriores 0-25", rango: "0-25mm" }
];

for (const equipo of equipos) {
  const route = resolveCalibrationProcedure(equipo);
  console.log(equipo.codigo, route, canStartCalibration(route));
}
