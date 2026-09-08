# TMP MT16 V7 - ISO1502 Gate

## Objetivo

Crear una puerta estricta de validación ISO1502.

## Archivos

- thread/data/thread_iso1502_database.js
- thread/engines/thread_iso1502_engine.js
- thread/standards/generated/README_MT16_ISO1502_GATE_V7.md

## Qué cambia

- ISO1502 queda centralizado en una base.
- Si validated:false, el sistema permite prueba técnica.
- Si validated:false, el certificado final queda bloqueado.
- Para certificar, la fila debe pasar a validated:true tras validación normativa.

## Estado actual

M12x1.25-6H sigue como:

validated:false
validation_status:"ISO1502_BETA_LIMITS"

No cambiar a true hasta validar contra fuente oficial.
