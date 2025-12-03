//---------------------------------------------------------
// CARGADOR DINÁMICO ULTRA SENCILLO TMP
//---------------------------------------------------------

// Obtener parámetro ?id=XXXX
function getParametro(nombre) {
    const url = new URL(window.location.href);
    return url.searchParams.get(nombre);
}

const certID = getParametro("id") || "CC-2025-0001";

//---------------------------------------------------------
// DATOS SIMULADOS (como si fueran de base de datos)
//---------------------------------------------------------
const baseSimulada = {

    "CC-2025-0001": {
        cert: {
            codigo: "CC-2025-0001",
            revision: "01",
            fecha: "2025-02-10"
        },

        inst: {
            nombre: "Calibre universal 0–150 mm",
            modelo: "Mitutoyo 530-104",
            serie: "C-123456",
            rango: "0–150 mm",
            resolucion: "0.01 mm",
            fechaCal: "2025-02-10",
            fechaProx: "2026-02-10",
            condiciones: "20.0 °C · 49 %HR"
        },

        cliente: {
            nombre: "Industrias ACME S.A.",
            ubicacion: "Línea 3 producción"
        },

        trazabilidad: {
            descripcion:
                "La calibración se ha realizado conforme a procedimientos internos TMP basados en ISO/IEC 17025 e ILAC-G8, utilizando patrones trazables a patrones nacionales e internacionales.",
            incertidumbre:
                "La incertidumbre expandida U(k=2) corresponde a un nivel de confianza del 95 %."
        },

        resultados: [
            {
                titulo: "Exteriores (mm)",
                filas: [
                    { nominal: "0.00", patron: "0.000", lectura: "0.001", correccion: "-0.001", error: "-0.001", U: "0.004", decision: "Conforme" },
                    { nominal: "25.00", patron: "25.000", lectura: "25.003", correccion: "-0.003", error: "-0.003", U: "0.004", decision: "Conforme" },
                    { nominal: "50.00", patron: "50.000", lectura: "49.997", correccion: "0.003", error: "0.003", U: "0.004", decision: "Conforme" }
                ]
            }
        ],

        observaciones: "Sin observaciones adicionales.",

        firmas: {
            tecnico: { nombre: "Juan Pérez", fecha: "2025-02-10" },
            revision: { nombre: "Laura Rodríguez", fecha: "2025-02-10" },
            aprobacion: { nombre: "Carlos Gómez", fecha: "2025-02-10" }
        }
    }
};


//---------------------------------------------------------
// Seleccionar el certificado
//---------------------------------------------------------
const datos = baseSimulada[certID];

if (!datos) {
    alert("Certificado no encontrado: " + certID);
    throw new Error("Certificado no existe");
}


//---------------------------------------------------------
// Rellenar información del certificado
//---------------------------------------------------------
document.getElementById("certCodigo").innerText = datos.cert.codigo;
document.getElementById("certRevision").innerText = datos.cert.revision;
document.getElementById("certFechaEmision").innerText = datos.cert.fecha;


//---------------------------------------------------------
// Instrumento
//---------------------------------------------------------
document.getElementById("instNombre").innerText = datos.inst.nombre;
document.getElementById("instModelo").innerText = datos.inst.modelo;
document.getElementById("instSerie").innerText = datos.inst.serie;
document.getElementById("instRango").innerText = datos.inst.rango;
document.getElementById("instResolucion").innerText = datos.inst.resolucion;

document.getElementById("fecCalibracion").innerText = datos.inst.fechaCal;
document.getElementById("fecProxima").innerText = datos.inst.fechaProx;
document.getElementById("condAmb").innerText = datos.inst.condiciones;


//---------------------------------------------------------
// Cliente
//---------------------------------------------------------
document.getElementById("cliNombre").innerText = datos.cliente.nombre;
document.getElementById("cliUbicacion").innerText = datos.cliente.ubicacion;


//---------------------------------------------------------
// Trazabilidad
//---------------------------------------------------------
document.getElementById("trazaDescripcion").innerText = datos.trazabilidad.descripcion;
document.getElementById("trazaIncertidumbre").innerText = datos.trazabilidad.incertidumbre;


//---------------------------------------------------------
// Observaciones
//---------------------------------------------------------
document.getElementById("obsTexto").innerText = datos.observaciones;


//---------------------------------------------------------
// Firmas
//---------------------------------------------------------
document.getElementById("tecnicoNombre").innerText = datos.firmas.tecnico.nombre;
document.getElementById("tecnicoFecha").innerText = datos.firmas.tecnico.fecha;

document.getElementById("revisionNombre").innerText = datos.firmas.revision.nombre;
document.getElementById("revisionFecha").innerText = datos.firmas.revision.fecha;

document.getElementById("aprobNombre").innerText = datos.firmas.aprobacion.nombre;
document.getElementById("aprobFecha").innerText = datos.firmas.aprobacion.fecha;


//---------------------------------------------------------
// Crear la tabla de resultados
//---------------------------------------------------------
const contenedor = document.getElementById("tablaResultados");
contenedor.innerHTML = ""; // limpiar

datos.resultados.forEach(bloque => {

    // título del bloque
    const titulo = document.createElement("h3");
    titulo.textContent = bloque.titulo;
    titulo.style.marginTop = "15px";
    titulo.style.marginBottom = "5px";
    contenedor.appendChild(titulo);

    // tabla
    const tabla = document.createElement("table");
    tabla.innerHTML = `
        <thead>
            <tr>
                <th>Nominal</th>
                <th>Patrón</th>
                <th>Lectura</th>
                <th>Corrección</th>
                <th>Error</th>
                <th>U(k=2)</th>
                <th>Decisión</th>
            </tr>
        </thead>
        <tbody>
            ${bloque.filas.map(f => `
                <tr>
                    <td>${f.nominal}</td>
                    <td>${f.patron}</td>
                    <td>${f.lectura}</td>
                    <td>${f.correccion}</td>
                    <td>${f.error}</td>
                    <td>${f.U}</td>
                    <td>${f.decision}</td>
                </tr>
            `).join("")}
        </tbody>
    `;

    contenedor.appendChild(tabla);
});
