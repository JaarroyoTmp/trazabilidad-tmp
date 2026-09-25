/* ============================================================
   TMP · Generador de PDF oficial de calibración
   Versión reforzada para formato documental de laboratorio
   Base: ISO/IEC 17025 · Regla de decisión ILAC-G8
   Dependencias: pdfmake + vfs_fonts + Supabase js
============================================================ */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.5";
import pdfMake from "https://cdn.jsdelivr.net/npm/pdfmake@0.2.9/build/pdfmake.min.js";
import pdfFonts from "https://cdn.jsdelivr.net/npm/pdfmake@0.2.9/build/vfs_fonts.js";

pdfMake.vfs = pdfFonts.pdfMake.vfs;

/* ========= CONFIG SUPABASE ========= */
const SUPABASE_URL = "https://uukxdslfmxesufuxjzvt.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV1a3hkc2xmbXhlc3VmdXhqenZ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjExMjg5MjksImV4cCI6MjA3NjcwNDkyOX0.7bmDUEQTfl6Y5jdzORyFZUFtOs7GM0dNdfp1zsURkWw";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/* ============================================================
   FUNCIÓN PRINCIPAL
   Recibe:
   - datosInstrumento
   - datosCondiciones
   - resultados
   - resumenGlobal
   - trazabilidad
   - firmaURL
   - pdfNumero
   - uidCalibracion
============================================================ */

export async function generarPDF_OFICIAL({
  datosInstrumento = {},
  datosCondiciones = {},
  resultados = [],
  resumenGlobal = {},
  trazabilidad = "",
  firmaURL = "",
  pdfNumero = "CC-SIN-NUMERO",
  uidCalibracion = ""
}) {
  try {
    const logoTMP = await cargarLogoTMP();
    const fechaHoy = formatearFechaES(new Date());

    const instrumento = normalizarInstrumento(datosInstrumento);
    const condiciones = normalizarCondiciones(datosCondiciones);
    const resultadosNorm = normalizarResultados(resultados);
    const resumen = normalizarResumenGlobal(resumenGlobal, resultadosNorm);
    const patrones = extraerPatrones(datosCondiciones, trazabilidad);

    const content = [
      { text: " ", margin: [0, 70, 0, 0] },

      sectionTitle("1. Identificación del instrumento"),
      tablaSimple([
        ["Código interno", instrumento.codigo],
        ["Descripción", instrumento.descripcion],
        ["Fabricante / Tipo", instrumento.fabTipo],
        ["Rango", instrumento.rango],
        ["Unidad base", instrumento.unidad],
        ["Última calibración", instrumento.fechaUltima],
        ["Próxima calibración", instrumento.fechaProxima]
      ]),

      { text: "", margin: [0, 8] },

      sectionTitle("2. Información de la calibración"),
      tablaSimple([
        ["Fecha de calibración", condiciones.fecha],
        ["Operario / técnico", condiciones.operario],
        ["Lugar de calibración", condiciones.lugar],
        ["Procedimiento aplicado", condiciones.procedimiento],
        ["Regla de decisión", "ILAC-G8"]
      ]),

      { text: "", margin: [0, 8] },

      sectionTitle("3. Condiciones ambientales"),
      tablaSimple([
        ["Temperatura (°C)", condiciones.temperatura],
        ["Humedad relativa (%)", condiciones.humedad],
        ["Observaciones", condiciones.obs]
      ]),

      { text: "", margin: [0, 8] },

      sectionTitle("4. Patrones y trazabilidad metrológica"),
      {
        text:
          typeof trazabilidad === "string" && trazabilidad.trim()
            ? trazabilidad
            : "La trazabilidad metrológica se garantiza mediante el uso de patrones calibrados y controlados conforme al sistema de gestión metrológica del laboratorio.",
        margin: [0, 2, 0, 6],
        fontSize: 9,
        alignment: "justify"
      },
      tablaPatrones(patrones),

      { text: "", margin: [0, 8] },

      sectionTitle("5. Método de calibración"),
      {
        text:
          "La calibración se ha realizado mediante comparación de las indicaciones del instrumento con valores de referencia materializados por patrones trazables. " +
          "Para cada punto se determina el error E = I − R, siendo I la indicación media e R la referencia aplicada. " +
          "La incertidumbre expandida U se expresa con factor de cobertura k = 2, equivalente aproximadamente a un nivel de confianza del 95 %. " +
          "La conformidad se evalúa aplicando la regla de decisión ILAC-G8 indicada en este certificado.",
        margin: [0, 2, 0, 8],
        fontSize: 9,
        alignment: "justify"
      },

      sectionTitle("6. Resultados de calibración"),
      construirTablaResultadosAudit(resultadosNorm),

      { text: "", margin: [0, 8] },

      sectionTitle("7. Declaración de conformidad"),
      decisionBox(resumen),

      { text: "", margin: [0, 8] },

      sectionTitle("8. Observaciones y limitaciones"),
      {
        ul: [
          "Los resultados indicados se refieren exclusivamente al instrumento calibrado.",
          "La incertidumbre expandida informada se expresa para k = 2.",
          "La conformidad se ha evaluado aplicando la regla de decisión indicada en este certificado.",
          "Este certificado no debe reproducirse parcialmente sin autorización del laboratorio."
        ],
        margin: [0, 2, 0, 8],
        fontSize: 9
      },

      sectionTitle("9. Validación"),
      bloqueFirma({
        firmaURL,
        fechaHoy,
        operario: condiciones.operario,
        fechaProxima: instrumento.fechaProxima
      })
    ];

    const doc = {
      pageSize: "A4",
      pageMargins: [40, 55, 40, 70],

      defaultStyle: {
        fontSize: 9,
        lineHeight: 1.25,
        color: "#111111"
      },

      header: function () {
        return {
          margin: [40, 20, 40, 0],
          stack: [
            {
              columns: [
                {
                  width: 85,
                  image: logoTMP
                },
                {
                  width: "*",
                  stack: [
                    { text: "TALLERES MECÁNICOS PARAMIO", style: "labName" },
                    { text: "LABORATORIO DE CALIBRACIÓN", style: "labSub" },
                    { text: "CERTIFICADO DE CALIBRACIÓN", style: "mainTitle" }
                  ]
                },
                {
                  width: 155,
                  table: {
                    widths: ["*"],
                    body: [[
                      {
                        stack: [
                          { text: `Nº Certificado: ${pdfNumero}`, style: "certBoxTitle" },
                          { text: `Fecha de emisión: ${fechaHoy}`, style: "certBoxText" },
                          { text: `ID calibración: ${uidCalibracion || "—"}`, style: "certBoxText" }
                        ],
                        margin: [6, 6, 6, 6]
                      }
                    ]]
                  },
                  layout: {
                    hLineWidth: () => 1,
                    vLineWidth: () => 1,
                    hLineColor: () => "#666666",
                    vLineColor: () => "#666666"
                  }
                }
              ]
            },
            {
              margin: [0, 8, 0, 0],
              canvas: [
                { type: "line", x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 1, lineColor: "#666666" }
              ]
            }
          ]
        };
      },

      footer: function (current, total) {
        return {
          margin: [40, 8, 40, 16],
          stack: [
            {
              canvas: [
                { type: "line", x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 0.8, lineColor: "#888888" }
              ]
            },
            {
              margin: [0, 6, 0, 0],
              columns: [
                {
                  width: "*",
                  text:
                    "TMP · Sistema de calidad conforme a ISO/IEC 17025 · La reproducción parcial de este certificado no está permitida sin autorización.",
                  fontSize: 7,
                  color: "#555555"
                },
                {
                  width: 80,
                  text: `Página ${current} / ${total}`,
                  alignment: "right",
                  fontSize: 7,
                  color: "#555555"
                }
              ]
            }
          ]
        };
      },

      content,

      styles: {
        labName: { fontSize: 13, bold: true, color: "#111111" },
        labSub: { fontSize: 9, color: "#444444", margin: [0, 1, 0, 1] },
        mainTitle: { fontSize: 14, bold: true, color: "#000000", margin: [0, 4, 0, 0] },
        certBoxTitle: { fontSize: 9, bold: true, alignment: "left" },
        certBoxText: { fontSize: 8, alignment: "left" },
        section: { fontSize: 10, bold: true, color: "#000000" }
      }
    };

    /* ========= GENERAR PDF ========= */
    const pdfDoc = pdfMake.createPdf(doc);

    /* ========= DESCARGA LOCAL ========= */
    pdfDoc.download(`${pdfNumero}.pdf`);

    /* ========= CONVERTIR A BLOB ========= */
    const blob = await pdfBlob(pdfDoc);

    /* ========= SUBIR A SUPABASE STORAGE ========= */
    const filePath = `certificados/${pdfNumero}.pdf`;

    const { error: uploadError } = await supabase.storage
      .from("pdfs")
      .upload(filePath, blob, {
        upsert: true,
        contentType: "application/pdf"
      });

    if (uploadError) {
      console.error("Error subiendo PDF a Storage:", uploadError);
      throw uploadError;
    }

    const { data: publicURLData } = supabase.storage
      .from("pdfs")
      .getPublicUrl(filePath);

    const publicUrl = publicURLData?.publicUrl || null;

    /* ========= GUARDAR EN TABLA CERTIFICADOS ========= */
    const { error: certError } = await supabase.from("certificados").upsert({
      numero: pdfNumero,
      calibracion_uid: uidCalibracion,
      decision_global: resumen.decision,
      regla_decision: "ILAC-G8",
      certificado_pdf_url: publicUrl
    });

    if (certError) {
      console.error("Error guardando registro en certificados:", certError);
      throw certError;
    }

    return publicUrl;
  } catch (err) {
    console.error("Error en generarPDF_OFICIAL:", err);
    throw err;
  }
}

/* ============================================================
   BLOQUES PDF
============================================================ */

function sectionTitle(txt) {
  return {
    table: {
      widths: ["*"],
      body: [[
        {
          text: txt,
          style: "section",
          fillColor: "#EAEAEA",
          margin: [6, 4, 6, 4]
        }
      ]]
    },
    layout: "noBorders",
    margin: [0, 2, 0, 4]
  };
}

function tablaSimple(rows) {
  return {
    table: {
      widths: ["34%", "*"],
      body: rows.map(([k, v]) => [
        {
          text: String(k ?? "—"),
          bold: true,
          fillColor: "#F3F3F3",
          margin: [4, 4, 4, 4]
        },
        {
          text: String(v ?? "—"),
          margin: [4, 4, 4, 4]
        }
      ])
    },
    layout: {
      hLineWidth: () => 0.8,
      vLineWidth: () => 0.8,
      hLineColor: () => "#888888",
      vLineColor: () => "#888888"
    }
  };
}

function tablaPatrones(patrones = []) {
  if (!Array.isArray(patrones) || patrones.length === 0) {
    return {
      text: "No se han informado patrones específicos en este certificado.",
      italics: true,
      fontSize: 9,
      margin: [0, 2, 0, 0]
    };
  }

  const body = [[
    { text: "Código", bold: true, fillColor: "#F3F3F3", margin: [3, 3, 3, 3] },
    { text: "Descripción", bold: true, fillColor: "#F3F3F3", margin: [3, 3, 3, 3] },
    { text: "U(k=2)", bold: true, fillColor: "#F3F3F3", margin: [3, 3, 3, 3] },
    { text: "Observaciones", bold: true, fillColor: "#F3F3F3", margin: [3, 3, 3, 3] }
  ]];

  patrones.forEach((p) => {
    body.push([
      { text: String(p.codigo || p.id || "—"), margin: [3, 3, 3, 3] },
      { text: String(p.descripcion || "—"), margin: [3, 3, 3, 3] },
      { text: String(p.u_k2 ?? "—"), margin: [3, 3, 3, 3] },
      { text: String(p.nota || p.observaciones || "—"), margin: [3, 3, 3, 3] }
    ]);
  });

  return {
    table: {
      headerRows: 1,
      widths: [70, "*", 55, 120],
      body
    },
    layout: {
      hLineWidth: () => 0.7,
      vLineWidth: () => 0.7,
      hLineColor: () => "#999999",
      vLineColor: () => "#999999"
    }
  };
}

function construirTablaResultadosAudit(resultados = []) {
  if (!Array.isArray(resultados) || resultados.length === 0) {
    return {
      text: "No hay resultados disponibles para este certificado.",
      italics: true,
      fontSize: 9
    };
  }

  const body = [[
    { text: "Nominal", bold: true, fillColor: "#F3F3F3", margin: [3, 3, 3, 3] },
    { text: "Media", bold: true, fillColor: "#F3F3F3", margin: [3, 3, 3, 3] },
    { text: "Error (µm)", bold: true, fillColor: "#F3F3F3", margin: [3, 3, 3, 3] },
    { text: "U (µm)", bold: true, fillColor: "#F3F3F3", margin: [3, 3, 3, 3] },
    { text: "T (µm)", bold: true, fillColor: "#F3F3F3", margin: [3, 3, 3, 3] },
    { text: "Decisión", bold: true, fillColor: "#F3F3F3", margin: [3, 3, 3, 3] }
  ]];

  resultados.forEach((r) => {
    const decision = String(r.decision ?? "—");
    const color =
      decision === "APTO"
        ? "#0A6B2D"
        : decision === "NO APTO"
        ? "#A10000"
        : "#8A6D00";

    body.push([
      { text: String(r.nominal ?? "—"), margin: [3, 3, 3, 3] },
      { text: String(r.media ?? "—"), margin: [3, 3, 3, 3] },
      { text: String(r.error ?? "—"), margin: [3, 3, 3, 3] },
      { text: String(r.U ?? "—"), margin: [3, 3, 3, 3] },
      { text: String(r.T ?? "—"), margin: [3, 3, 3, 3] },
      {
        text: decision,
        color,
        bold: true,
        margin: [3, 3, 3, 3]
      }
    ]);
  });

  return {
    table: {
      headerRows: 1,
      widths: [70, 70, 70, 60, 60, "*"],
      body
    },
    layout: {
      hLineWidth: () => 0.7,
      vLineWidth: () => 0.7,
      hLineColor: () => "#999999",
      vLineColor: () => "#999999"
    }
  };
}

function decisionBox(resumenGlobal = {}) {
  const decision = String(resumenGlobal.decision || "—");
  const color =
    decision === "APTO"
      ? "#DFF0D8"
      : decision === "NO APTO"
      ? "#F2DEDE"
      : "#FCF8E3";

  return {
    table: {
      widths: ["40%", "*"],
      body: [
        [
          { text: "Máx |E| (µm)", bold: true, fillColor: "#F3F3F3", margin: [4, 4, 4, 4] },
          { text: String(resumenGlobal.maxAbsError ?? "—"), margin: [4, 4, 4, 4] }
        ],
        [
          { text: "Máx (|E| + U) (µm)", bold: true, fillColor: "#F3F3F3", margin: [4, 4, 4, 4] },
          { text: String(resumenGlobal.maxAbsErrorPlusU ?? "—"), margin: [4, 4, 4, 4] }
        ],
        [
          { text: "Tolerancia (µm)", bold: true, fillColor: "#F3F3F3", margin: [4, 4, 4, 4] },
          { text: String(resumenGlobal.tolerancia ?? "—"), margin: [4, 4, 4, 4] }
        ],
        [
          { text: "Regla de decisión", bold: true, fillColor: "#F3F3F3", margin: [4, 4, 4, 4] },
          { text: "ILAC-G8", margin: [4, 4, 4, 4] }
        ],
        [
          { text: "Declaración de conformidad", bold: true, fillColor: color, margin: [4, 4, 4, 4] },
          { text: decision, bold: true, fillColor: color, margin: [4, 4, 4, 4] }
        ]
      ]
    },
    layout: {
      hLineWidth: () => 0.8,
      vLineWidth: () => 0.8,
      hLineColor: () => "#777777",
      vLineColor: () => "#777777"
    }
  };
}

function bloqueFirma({ firmaURL, fechaHoy, operario, fechaProxima }) {
  const bloqueDerecho = firmaURL
    ? {
        stack: [
          { text: "Firma", bold: true, alignment: "center", margin: [0, 0, 0, 6] },
          { image: firmaURL, width: 130, height: 50, alignment: "center" }
        ],
        margin: [6, 8, 6, 8]
      }
    : {
        stack: [
          { text: "Firma", bold: true, alignment: "center", margin: [0, 0, 0, 6] },
          { text: "—", alignment: "center", margin: [0, 16, 0, 16] }
        ],
        margin: [6, 8, 6, 8]
      };

  return {
    table: {
      widths: ["*", 170],
      body: [[
        {
          stack: [
            { text: `Técnico responsable: ${operario || "—"}`, margin: [0, 0, 0, 4] },
            { text: `Fecha de emisión: ${fechaHoy}`, margin: [0, 0, 0, 4] },
            { text: `Próxima calibración recomendada: ${fechaProxima || "—"}` }
          ],
          margin: [6, 8, 6, 8]
        },
        bloqueDerecho
      ]]
    },
    layout: {
      hLineWidth: () => 1,
      vLineWidth: () => 1,
      hLineColor: () => "#666666",
      vLineColor: () => "#666666"
    }
  };
}

/* ============================================================
   NORMALIZADORES
============================================================ */

function normalizarInstrumento(src = {}) {
  return {
    codigo: valorSeguro(src.codigo),
    descripcion: valorSeguro(src.descripcion),
    fabTipo: valorSeguro(src.fabTipo || src.fabricante_tipo || src.fabricanteTipo),
    rango: valorSeguro(src.rango),
    unidad: valorSeguro(src.unidad || src.unidad_base),
    fechaUltima: valorSeguro(
      formatearFechaFlexible(src.fechaUltima || src.fecha_calibracion || src.fecha_ultima_cal)
    ),
    fechaProxima: valorSeguro(
      formatearFechaFlexible(src.fechaProxima || src.fecha_proxima_calibracion)
    )
  };
}

function normalizarCondiciones(src = {}) {
  return {
    fecha: valorSeguro(formatearFechaFlexible(src.fecha || src.fecha_calibracion)),
    temperatura: valorSeguro(src.temperatura),
    humedad: valorSeguro(src.humedad),
    obs: valorSeguro(src.obs || src.observaciones, "Sin observaciones relevantes"),
    operario: valorSeguro(src.operario || src.tecnico || src.responsable),
    lugar: valorSeguro(src.lugar || src.lugar_calibracion, "Laboratorio TMP"),
    procedimiento: valorSeguro(
      src.procedimiento,
      "Procedimiento interno de calibración por comparación"
    )
  };
}

function normalizarResultados(resultados = []) {
  if (!Array.isArray(resultados)) return [];

  return resultados.map((r) => ({
    nominal: valorSeguro(r.nominal),
    media: valorSeguro(r.media),
    error: valorSeguro(r.error),
    U: valorSeguro(r.U),
    T: valorSeguro(r.T),
    decision: valorSeguro(r.decision)
  }));
}

function normalizarResumenGlobal(resumen = {}, resultados = []) {
  const out = {
    maxAbsError: valorSeguro(resumen.maxAbsError),
    maxAbsErrorPlusU: valorSeguro(resumen.maxAbsErrorPlusU),
    tolerancia: valorSeguro(resumen.tolerancia),
    decision: valorSeguro(resumen.decision)
  };

  if (
    out.maxAbsError === "—" &&
    out.maxAbsErrorPlusU === "—" &&
    out.tolerancia === "—" &&
    out.decision === "—" &&
    Array.isArray(resultados) &&
    resultados.length
  ) {
    const errores = resultados
      .map((r) => Number(String(r.error).replace(",", ".")))
      .filter((n) => Number.isFinite(n))
      .map((n) => Math.abs(n));

    const erroresMasU = resultados
      .map((r) => {
        const e = Number(String(r.error).replace(",", "."));
        const u = Number(String(r.U).replace(",", "."));
        if (!Number.isFinite(e) || !Number.isFinite(u)) return null;
        return Math.abs(e) + u;
      })
      .filter((n) => Number.isFinite(n));

    const tolerancias = resultados
      .map((r) => Number(String(r.T).replace(",", ".")))
      .filter((n) => Number.isFinite(n));

    const decisiones = resultados.map((r) => String(r.decision || ""));

    out.maxAbsError =
      errores.length > 0 ? formatearNumero(Math.max(...errores), 1) : "—";
    out.maxAbsErrorPlusU =
      erroresMasU.length > 0 ? formatearNumero(Math.max(...erroresMasU), 1) : "—";
    out.tolerancia =
      tolerancias.length > 0 ? formatearNumero(Math.max(...tolerancias), 1) : "—";

    if (decisiones.includes("NO APTO")) out.decision = "NO APTO";
    else if (decisiones.includes("INDETERMINADO")) out.decision = "INDETERMINADO";
    else if (decisiones.includes("APTO")) out.decision = "APTO";
    else out.decision = "—";
  }

  return out;
}

function extraerPatrones(datosCondiciones = {}, trazabilidad = "") {
  if (Array.isArray(datosCondiciones.patrones) && datosCondiciones.patrones.length) {
    return datosCondiciones.patrones;
  }

  if (Array.isArray(trazabilidad?.patrones) && trazabilidad.patrones.length) {
    return trazabilidad.patrones;
  }

  return [];
}

/* ============================================================
   UTILS
============================================================ */

function valorSeguro(v, fallback = "—") {
  if (v === null || v === undefined) return fallback;
  const s = String(v).trim();
  return s ? s : fallback;
}

function formatearFechaFlexible(v) {
  if (!v) return "—";

  if (v instanceof Date && !Number.isNaN(v.getTime())) {
    return formatearFechaES(v);
  }

  const s = String(v).trim();
  if (!s) return "—";

  const d = new Date(s);
  if (!Number.isNaN(d.getTime())) {
    return formatearFechaES(d);
  }

  return s;
}

function formatearFechaES(date) {
  try {
    return new Intl.DateTimeFormat("es-ES").format(date);
  } catch {
    return String(date);
  }
}

function formatearNumero(n, dec = 1) {
  const num = Number(n);
  if (!Number.isFinite(num)) return "—";
  return num.toFixed(dec);
}

function pdfBlob(pdfDoc) {
  return new Promise((resolve) => {
    pdfDoc.getBlob((blob) => resolve(blob));
  });
}

async function cargarLogoTMP() {
  const svg = `
    <svg width="300" height="80" xmlns="http://www.w3.org/2000/svg">
      <rect width="300" height="80" fill="white"/>
      <rect x="6" y="10" width="70" height="60" rx="8" fill="#111"/>
      <text x="18" y="50" font-size="30" font-family="Arial" font-weight="bold" fill="white">TMP</text>
      <text x="90" y="32" font-size="15" font-family="Arial" fill="#111">Talleres Mecánicos</text>
      <text x="90" y="52" font-size="15" font-family="Arial" fill="#111">Paramio</text>
    </svg>
  `;
  return "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svg)));
}
