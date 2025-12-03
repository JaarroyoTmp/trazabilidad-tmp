/* ============================================================
   TMP · Generador de PDF oficial de calibración
   Diseño: Blanco laboratorio 17025 · ILAC-G8 · Firma visible
   Dependencias: pdfmake + vfs_fonts + Supabase js
============================================================ */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.5";
import pdfMake from "https://cdn.jsdelivr.net/npm/pdfmake@0.2.9/build/pdfmake.min.js";
import pdfFonts from "https://cdn.jsdelivr.net/npm/pdfmake@0.2.9/build/vfs_fonts.js";

pdfMake.vfs = pdfFonts.pdfMake.vfs;

/* ========= CONFIG SUPABASE ========= */
const SUPABASE_URL = "https://uukxdslfmxesufuxjzvt.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV1a3hkc2xmbXhlc3VmdXhqenZ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjExMjg5MjksImV4cCI6MjA3NjcwNDkyOX0.7bmDUEQTfl6Y5jdzORyFZUFtOs7GM0dNdfp1zsURkWw";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/* ============================================================
   FUNCIÓN PRINCIPAL
   Recibe:
   - datosInstrumento
   - datosCondiciones
   - resultados
   - firmaURL (imagen base64 del canvas)
   - pdfNumero (CC-202X-XXXX)
   - uidCalibracion
============================================================ */

export async function generarPDF_OFICIAL({
  datosInstrumento,
  datosCondiciones,
  resultados,
  resumenGlobal,
  trazabilidad,
  firmaURL,
  pdfNumero,
  uidCalibracion
}) {

  /* =======================================================
     1. PREPARAR INFORMACIÓN
  ======================================================= */

  const logoTMP = await cargarLogoTMP();

  const tablaResultados = construirTablaResultados(resultados);

  const fechaHoy = new Date().toLocaleDateString("es-ES");

  /* =======================================================
     2. DEFINICIÓN DEL DOCUMENTO PDF
  ======================================================= */

  const doc = {
    pageMargins: [40, 48, 40, 60],
    defaultStyle: {
      fontSize: 9,
      lineHeight: 1.2
    },

    footer: function(current, total) {
      return {
        margin: [40, 0, 40, 10],
        fontSize: 8,
        layout: "noBorders",
        table: {
          widths: ["*", "*"],
          body: [
            [
              { text: "TMP · Trazabilidad metrológica · ISO/IEC 17025 · ILAC-G8", alignment: "left" },
              { text: `Página ${current} de ${total}`, alignment: "right" }
            ]
          ]
        }
      };
    },

    content: [

      /* =======================================================
         ENCABEZADO
      ======================================================= */
      {
        columns: [
          {
            image: logoTMP,
            width: 80
          },
          [
            { text: "TALLERES MECÁNICOS PARAMIO", style: "titulo" },
            { text: "Certificado de Calibración", style: "subtitulo" },
            { text: `Nº: ${pdfNumero}`, bold: true, margin: [0, 2, 0, 0] }
          ]
        ]
      },

      { text: "", margin: [0, 8] },

      /* =======================================================
         1. DATOS DEL INSTRUMENTO
      ======================================================= */
      { text: "1. Datos del instrumento", style: "seccion" },

      tablaSimple([
        ["Código", datosInstrumento.codigo],
        ["Descripción", datosInstrumento.descripcion],
        ["Fabricante / Tipo", datosInstrumento.fabTipo],
        ["Rango", datosInstrumento.rango],
        ["Unidad base", datosInstrumento.unidad],
        ["Última calibración", datosInstrumento.fechaUltima],
        ["Próxima calibración", datosInstrumento.fechaProxima]
      ]),

      { text: "", margin: [0, 10] },

      /* =======================================================
         2. CONDICIONES AMBIENTALES
      ======================================================= */
      { text: "2. Condiciones ambientales", style: "seccion" },

      tablaSimple([
        ["Fecha", datosCondiciones.fecha],
        ["Temperatura (°C)", datosCondiciones.temperatura],
        ["Humedad (%)", datosCondiciones.humedad],
        ["Observaciones", datosCondiciones.obs || "—"]
      ]),

      { text: "", margin: [0, 10] },

      /* =======================================================
         3. MÉTODO DE CALIBRACIÓN
      ======================================================= */
      { text: "3. Método de calibración (ILAC-G8)", style: "seccion" },
      {
        fontSize: 9,
        margin: [0, 2, 0, 8],
        text:
          "La calibración se realiza comparando las indicaciones del instrumento con los valores " +
          "nominales de un patrón trazable. Se calcula el error E = I − R, la incertidumbre combinada y " +
          "la incertidumbre expandida U(k=2). La conformidad se evalúa aplicando ILAC-G8:\n" +
          "APTO → |E| + U ≤ T ··· NO APTO → |E| − U > T ··· resto → INDETERMINADO."
      },

      /* =======================================================
         4. RESULTADOS DETALLADOS
      ======================================================= */
      { text: "4. Resultados", style: "seccion" },
      tablaResultados,

      { text: "", margin: [0, 10] },

      /* =======================================================
         5. DECISIÓN GLOBAL
      ======================================================= */
      { text: "5. Decisión global", style: "seccion" },
      tablaSimple([
        ["Máx |E| (µm)", resumenGlobal.maxAbsError],
        ["Máx (|E| + U) (µm)", resumenGlobal.maxAbsErrorPlusU],
        ["Tolerancia (µm)", resumenGlobal.tolerancia],
        ["Decisión", resumenGlobal.decision]
      ]),

      { text: "", margin: [0, 10] },

      /* =======================================================
         6. TRAZABILIDAD
      ======================================================= */
      { text: "6. Trazabilidad metrológica", style: "seccion" },
      {
        margin: [0, 2, 0, 8],
        text: trazabilidad || "—",
        fontSize: 9
      },

      /* =======================================================
         7. FIRMAS
      ======================================================= */
      { text: "7. Validación y firmas", style: "seccion" },
      {
        columns: [
          {
            text: `Fecha de emisión: ${fechaHoy}\nTécnico: ${datosCondiciones.operario || "—"}`,
            width: "*",
            fontSize: 9
          },
          {
            image: firmaURL || null,
            width: 150,
            height: 60
          }
        ]
      }
    ],

    /* ESTILOS */
    styles: {
      titulo: { fontSize: 14, bold: true },
      subtitulo: { fontSize: 11, color: "#444" },
      seccion: { fontSize: 11, bold: true, margin: [0, 8, 0, 4] }
    }
  };

  /* =======================================================
     3. GENERAR PDF
  ======================================================= */
  const pdfDoc = pdfMake.createPdf(doc);

  // Descargar local
  pdfDoc.download(`${pdfNumero}.pdf`);

  // Convertir a blob para Supabase
  const blob = await pdfBlob(pdfDoc);

  /* =======================================================
     4. SUBIR A SUPABASE (storage)
  ======================================================= */

  const filePath = `certificados/${pdfNumero}.pdf`;

  await supabase.storage.from("pdfs").upload(filePath, blob, {
    upsert: true,
    contentType: "application/pdf"
  });

  const { data: publicURL } = supabase.storage.from("pdfs").getPublicUrl(filePath);

  /* =======================================================
     5. GUARDAR EN TABLA CERTIFICADOS
  ======================================================= */
  await supabase.from("certificados").upsert({
    numero: pdfNumero,
    calibracion_uid: uidCalibracion,
    decision_global: resumenGlobal.decision,
    regla_decision: "ILAC-G8",
    certificado_pdf_url: publicURL.publicUrl
  });

  return publicURL.publicUrl;
}

/* ============================================================
   UTILS
============================================================ */

function tablaSimple(rows){
  return {
    layout: "lightHorizontalLines",
    table: {
      widths: ["35%", "*"],
      body: rows.map(r => [
        { text: r[0], bold: true },
        { text: r[1] }
      ])
    }
  };
}

function construirTablaResultados(resultados){
  const body = [
    [
      { text: "Nominal (mm)", bold: true },
      { text: "Media (mm)", bold: true },
      { text: "Error (µm)", bold: true },
      { text: "U (µm)", bold: true },
      { text: "T (µm)", bold: true },
      { text: "Decisión", bold: true }
    ]
  ];

  resultados.forEach(r=>{
    body.push([
      r.nominal,
      r.media,
      r.error,
      r.U,
      r.T,
      r.decision
    ]);
  });

  return {
    layout: "lightHorizontalLines",
    table: {
      widths: ["*", "*", "*", "*", "*", "*"],
      body
    }
  };
}

function pdfBlob(pdfDoc){
  return new Promise(resolve=>{
    pdfDoc.getBlob(blob => resolve(blob));
  });
}

async function cargarLogoTMP(){
  const svg = `
    <svg width="300" height="80" xmlns="http://www.w3.org/2000/svg">
      <rect width="300" height="80" fill="white"/>
      <text x="20" y="48" font-size="40" font-family="Arial" fill="#111">TMP</text>
    </svg>
  `;
  return "data:image/svg+xml;base64," + btoa(svg);
}
