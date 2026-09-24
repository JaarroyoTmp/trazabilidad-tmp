# ISO 724:1993 - Extracción TMP MT16

## Estado

FASE 1 - Fórmulas normativas y estructura de datos.

ISO 724 define las dimensiones básicas de roscas métricas ISO de uso general en milímetros.

## Uso en TMP

ISO 724 alimenta:

- `thread_geometry_engine.js`
- `thread_basic_dimensions_engine.js`
- `thread_tolerance_engine.js`
- `thread_trimos_engine.js`
- `thread_gauge_limits_engine.js`

## Regla de proyecto

El operario no introduce D2 ni D1.

TMP calcula las dimensiones básicas desde:

- Diámetro nominal D
- Paso P
- Perfil ISO 68

## Fórmulas archivadas

- D2 = D - 0.6495 * P
- D1 = D - 1.0825 * P
- H = 0.8660254038 * P

Los resultados de tabla ISO 724 se redondean a 0.001 mm.

## Pendiente

- Cargar tabla ISO 724 completa de combinaciones nominal/paso.
- Marcar como estándar o no estándar cada combinación.
- Usar ISO 261 para plan general de pasos cuando se incorpore.
