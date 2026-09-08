# TMP MT16 V14 - Patrones reales Supabase

## Archivos

Sustituir / añadir:

core/metrology_core/thread/thread_mt16_workflow_test.html
core/metrology_core/thread/engines/thread_pattern_resolver.js

## Qué añade

- Motor thread_pattern_resolver.js.
- Búsqueda automática de banco Trimos.
- Búsqueda automática de rodillos.
- Búsqueda automática de patrón de rosca.
- Lectura de certificados vigentes.
- Correcciones reales desde certificado.
- Incertidumbres reales desde certificado.
- Bloqueo de certificado final si falta trazabilidad real.

## Importante

El resolver intenta adaptarse a columnas habituales:
codigo, codigo_equipo, descripcion, rango, instrumento_id, certificado,
fecha_calibracion, proxima_calibracion, incertidumbre, correccion, k, resolucion.

Si tus tablas tienen otros nombres, ajustar sólo:
TMP_THREAD_PATTERN_TABLES en thread_pattern_resolver.js
