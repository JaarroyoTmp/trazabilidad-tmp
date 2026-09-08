# MC-02 v9 - Editor metrológico dinámico

## Instalación segura

Copiar únicamente estos elementos sobre la carpeta activa `trazabilidad-tmp/`:

- `App_MC02_Actualizar_Calibracion_Patron.html`
- `core/metrology_core/editors/pattern_result_editors.js`

No borrar, mover ni renombrar ninguna carpeta. No requiere ejecutar SQL adicional.

## Comprobación

1. Abrir MC-02 y recargar con Ctrl+F5.
2. Seleccionar el juego 180456: debe aparecer el editor de bloques patrón y cargar sus componentes.
3. Seleccionar 1288: debe aparecer el editor de Trimos.
4. Seleccionar un anillo: debe aparecer el editor de anillo.
5. Seleccionar una CMM: debe aparecer E0, E150 y R0.

Los resultados se guardan en `mc_patron_resultados_version` y la identificación del editor/modelo queda en `resumen_metrologico` de la versión.
