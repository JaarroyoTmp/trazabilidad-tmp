# TMP MT16 Decision Engine V1

## Objetivo

Crear el motor de decision MT16 usando incertidumbre y banda de guarda.

## Regla principal

OK solo si:

```text
medido - U >= limite inferior
y
medido + U <= limite superior
```

Si el intervalo medido +/- U invade un limite, el resultado es NOK.

## Archivos

- thread/engines/thread_decision_engine.js

## Estado

V1 tecnica.

Pendiente:
- Validar definitivamente ISO1502.
- Alimentar incertidumbres desde certificados reales.
- Conectar a pantalla MT16.
- Guardar decision en Supabase.
- Emitir PDF.
