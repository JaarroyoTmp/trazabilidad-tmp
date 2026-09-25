# TMP MT16 V10 - Listado calibrable + bloqueo vigencia

## Cambios

- Añade listado visible de roscas que puede tratar el motor MT16.
- El listado sale desde thread_iso1502_database.js.
- Bloquea calibración si el equipo está vigente.
- Bloquea calibración si no se puede determinar la vigencia.
- Bloquea lecturas si la rosca no está soportada.
- Mantiene búsqueda real en Supabase.

## Sustituir

core/metrology_core/thread/thread_mt16_workflow_test.html
