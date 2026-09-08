# TMP MT16 - Traceability Engine V1

## Archivos

Añadir:
core/metrology_core/thread/engines/thread_traceability_resolver.js

Sustituir:
core/metrology_core/thread/engines/thread_pattern_resolver.js

## Qué cambia

Este paquete mete una capa nueva y seria:

thread_traceability_resolver.js

Responsabilidad:
- Resolver Banco Trimos real.
- Resolver Rodillos reales.
- Resolver Patrón de rosca real.
- Leer certificados desde v_patron_valores_activos.
- Extraer corrección, incertidumbre, k, fecha, vencimiento y certificado.
- Crear un modelo de incertidumbre real.
- Bloquear certificado final si falta banco + rodillos + patrón.

## Ventaja

El HTML MT16 actual no hace falta tocarlo:
thread_pattern_resolver.js queda como puente compatible.

## Prueba

1. Copiar ambos archivos.
2. Ctrl+F5.
3. Abrir MT16.
4. Resolver MT16.
5. Pulsar Cargar patrones reales.
6. Revisar JSON técnico:
   real_patterns.traceability
