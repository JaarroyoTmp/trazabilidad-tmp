# P1.3 - Pie de Rey · Pauta automática real

## Objetivo

Corregir el flujo del panel de Pie de Rey para que el operario no tenga que introducir manualmente datos técnicos que deben venir del alta del equipo.

## Criterio TMP

Los siguientes datos deben venir de Supabase:

- Familia: PIE_DE_REY.
- Tipo: digital / analógico / reloj.
- Rango máximo.
- Resolución.
- Descripción, fabricante, modelo y serie.

El procedimiento solo debe preguntar qué funciones se calibran en esa intervención:

- Exteriores.
- Interiores.
- Profundidad.
- Escalón.

## Comportamiento

1. El usuario introduce el código.
2. TMP busca el equipo en Supabase.
3. TMP detecta tipo, rango y resolución.
4. Si faltan datos obligatorios, bloquea la pauta y pide corregir el alta del equipo.
5. Si los datos son completos, muestra solo la selección de funciones.
6. Genera la pauta automática.

## Archivos

- `core/metrology_core/validation/pie_de_rey_supabase_panel.html`
- `core/metrology_core/procedure_rules/pie_de_rey_experto.js`
- `core/metrology_core/calibration/pie_de_rey_equipment_resolver.js`
- `core/metrology_core/data/pie_de_rey_knowledge.js`

## Estado

Panel aislado de validación. No modifica MT15 ni MT16.
