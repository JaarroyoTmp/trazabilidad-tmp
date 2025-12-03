// ==============================
// Generador PDF oficial TMP
// ==============================
// Requiere PDFMake + vfs_fonts.js
// <script src="pdfmake.min.js"></script>
// <script src="vfs_fonts.js"></script>

function generarPDF(datos) {

  const doc = {
    pageSize: "A4",
    pageMargins: [40, 60, 40, 60],

    footer: (page, pages) => {
      return {
        columns: [
          {
            text: `TMP · Certificado de Calibración · Revisión ${datos.cert.revision}`,
            fontSize: 7
          },
          {
            text: `Página ${page} de ${pages}`,
            alignment: "right",
            fontSize: 7
          }
        ],
        margin: [40, 0]
      };
    },

    content: [
      // ---------------------------------------------------
      // CABECERA
      // ---------------------------------------------------
      {
        columns: [
          { image: datos.logo, width: 100 },
          {
            alignment: "right",
            stack: [
              { text: "CERTIFICADO DE CALIBRACIÓN", fontSize: 10, bold: true },
              { text: datos.cert.codigo, fontSize: 18, bold: true, margin: [0, 5, 0, 0] },
              {
                text: `Revisión ${datos.cert.revision} · Fecha ${datos.cert.fecha}`,
                fontSize: 9
              }
            ]
          }
        ]
      },

      { text: "\n" },

      // ---------------------------------------------------
      // DATOS INSTRUMENTO / CLIENTE
      // ---------------------------------------------------
      {
        text: "1. Datos del instrumento y del cliente",
        style: "tituloSeccion"
      },

      {
        columns: [
          [
            { text: `Instrumento: ${datos.inst.nombre}` },
            { text: `Fabricante / Modelo: ${datos.inst.modelo}` },
            { text: `Nº Serie: ${datos.inst.serie}` },
            { text: `Rango: ${datos.inst.rango}` },
            { text: `Resolución: ${datos.inst.resolucion}` }
          ],
          [
            { text: `Cliente: ${datos.cliente.nombre}` },
            { text: `Ubicación: ${datos.cliente.ubicacion}` },
            { text: `Fecha calibración: ${datos.inst.fechaCal}` },
            { text: `Próxima calibración: ${datos.inst.fechaProx}` },
            { text: `Condiciones: ${datos.inst.condiciones}` }
          ]
        ]
      },

      { text: "\n" },

      // ---------------------------------------------------
      // TRAZABILIDAD
      // ---------------------------------------------------
      { text: "2. Trazabilidad e información metrológica", style: "tituloSeccion" },
      { text: datos.trazabilidad.descripcion, fontSize: 9, margin: [0, 2, 0, 5] },
      { text: datos.trazabilidad.incertidumbre, fontSize: 9 },

      { text: "\n" },

      // ---------------------------------------------------
      // RESULTADOS
      // ---------------------------------------------------
      { text: "3. Resultados de calibración", style: "tituloSeccion" },

      ...datos.resultados.map(bloque => {
        return [
          { text: `\n· ${bloque.titulo}`, bold: true },

          {
            table: {
              headerRows: 1,
              widths: ["auto", "auto", "auto", "auto", "auto", "auto", "*"],
              body: [
                ["Nominal", "Patrón", "Lectura", "Corrección", "Error", "U(k=2)", "Decisión"],
                ...bloque.filas.map(f =>
                  [f.nominal, f.patron, f.lectura, f.correccion, f.error, f.U, f.decision]
                )
              ]
            },
            fontSize: 8,
            layout: "lightHorizontalLines",
            margin: [0, 3, 0, 10]
          }
        ];
      }),

      // ---------------------------------------------------
      // OBSERVACIONES
      // ---------------------------------------------------
      { text: "4. Observaciones", style: "tituloSeccion" },
      { text: datos.observaciones, fontSize: 9 },

      { text: "\n" },

      // ---------------------------------------------------
      // FIRMAS
      // ---------------------------------------------------
      { text: "5. Firmas y aprobación", style: "tituloSeccion" },

      {
        columns: [
          firma("Técnico", datos.firmas.tecnico),
          firma("Revisión", datos.firmas.revision),
          firma("Aprobación", datos.firmas.aprobacion)
        ]
      }
    ],

    styles: {
      tituloSeccion: {
        fontSize: 10,
        bold: true,
        margin: [0, 5, 0, 5]
      }
    }
  };

  pdfMake.createPdf(doc).open();
}


// Componente de firma
function firma(titulo, data) {
  return {
    width: "33%",
    stack: [
      { text: titulo, bold: true },
      {
        image: data.img,
        width: 100,
        height: 50,
        margin: [0, 5]
      },
      { text: data.nombre },
      { text: `Fecha: ${data.fecha}`, fontSize: 8 }
    ]
  };
}
