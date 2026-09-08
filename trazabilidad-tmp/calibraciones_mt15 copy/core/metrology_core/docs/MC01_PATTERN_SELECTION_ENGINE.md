# MC-01 Pattern Selection Engine

## Objetivo

Seleccionar el patrón más adecuado disponible en Supabase para cada punto o función de calibración, sin codificar patrones fijos dentro de los procedimientos.

## Criterio TMP

| Función | Prioridad |
|---|---|
| Pie de rey - Exteriores | Banco Trimos / banco horizontal |
| Pie de rey - Interiores | Anillos patrón |
| Pie de rey - Profundidad | Bloques patrón + superficie de referencia |
| Pie de rey - Escalón | Bloques patrón + superficie de referencia |

## Principios

1. El procedimiento define la necesidad metrológica.
2. Supabase contiene los patrones reales disponibles.
3. MC-01 filtra por tipo, rango, vigencia y prioridad.
4. El motor propone patrón recomendado y alternativas.
5. Esta versión no bloquea calibraciones; solo informa.

## Campos recomendados en Supabase para patrones

- `codigo`
- `descripcion`
- `tipo_patron`
- `rango_min`
- `rango_max`
- `unidad`
- `fecha_proxima_calibracion` o `fecha_vencimiento`
- `numero_certificado`
- `incertidumbre` o `u_k2`
- `prioridad_uso`
- `activo`

## Estado

MC-01 v1.0 se instala como motor auxiliar y reversible. No modifica MT15 ni MT16.
