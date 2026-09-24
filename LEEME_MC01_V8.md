# MC-01/MC-02 v8 · Ciclo de vida y versionado metrológico

## Objetivo de esta entrega

Cerrar la base estructural que necesitan todos los MT:

- estados metrológicos propios;
- versiones metrológicas inmutables;
- certificados históricos;
- actualización manual de calibración externa;
- archivo PDF/Excel/XML asociado;
- revisión y aprobación;
- bloqueo automático si el resultado es NO CONFORME;
- auditoría mínima;
- función común `canUsePattern()`.

## Instalación

1. Copiar el contenido del ZIP sobre la raíz real del proyecto.
2. Ejecutar en Supabase:

   `sql/MC01_12_CICLO_VIDA_VERSIONADO.sql`

3. Abrir:

   `App_MC02_Actualizar_Calibracion_Patron.html`

## Prueba recomendada

1. Seleccionar el juego de calas `180456`.
2. Crear una actualización de prueba como `PENDIENTE_REVISION`.
3. Añadir dos o tres resultados metrológicos.
4. Adjuntar un PDF de prueba.
5. Aprobar la versión.
6. Confirmar que:
   - aparece en el histórico;
   - el patrón tiene `version_metrologica_vigente_id`;
   - las fechas se actualizan;
   - el certificado anterior no se elimina;
   - un resultado `NO_CONFORME` deja el patrón en `NO_CONFORME`.

## Importante

La extracción automática del contenido del certificado todavía no se aplica directamente. El archivo se guarda, se calcula su hash y queda vinculado a la versión. La revisión humana sigue siendo obligatoria.

## Siguiente paso

Integrar `canUsePattern()` y la `version_metrologica_vigente_id` en `pattern_metrology_resolver.js`, MC-03, MT15, MT16 y MT17, guardando en cada calibración una copia inmutable de los valores usados.
