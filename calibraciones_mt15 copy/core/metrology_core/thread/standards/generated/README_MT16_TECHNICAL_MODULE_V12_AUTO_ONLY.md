# TMP MT16 V12 - Módulo técnico automático

## Cambios sobre V11

- Eliminada opción manual de autorización de recalibración vigente.
- La vigencia se calcula automáticamente:
  - Vigente: bloquea MT16.
  - Caducado: permite MT16.
  - Sin fecha de próxima calibración: bloquea MT16.
- La próxima calibración nueva se calcula automáticamente a 12 meses.
- El operario no decide método, vigencia, incertidumbre ni autorización.

## Sustituir

core/metrology_core/thread/thread_mt16_workflow_test.html
