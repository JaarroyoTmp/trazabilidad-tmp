# P1 - Motor experto Pie de Rey

## Estado

Preparacion inicial. No sustituye ningun motor existente.

## Objetivo

Crear el primer motor nacido sobre la plataforma TMP 1.0, usando el flujo comun:

1. Equipo
2. Inspeccion previa
3. Caracteristicas
4. Pauta automatica
5. Patrones
6. Lecturas
7. Resultado
8. Certificado CT-001
9. Guardado

## Criterio tecnico acordado

- El motor debe ser experto y guiado.
- No debe mezclar UI con calculo metrologico.
- Debe reutilizar Decision Engine, Uncertainty Engine, Certificate Engine CT-001 y guardado existente.
- El operario debe recibir una pauta generada automaticamente segun rango, resolucion y funciones del pie de rey.

## Alcance inicial

- Pie de rey digital o analogico.
- Exteriores.
- Interiores.
- Profundidad.
- Escalon opcional.
- Rango tipico 0-150, 0-200, 0-300 mm.
- 5 lecturas por punto.

## Archivos anadidos

- `core/metrology_core/data/pie_de_rey_knowledge.js`
- `core/metrology_core/procedure_rules/pie_de_rey_experto.js`
- `core/metrology_core/validation/pie_de_rey_test_panel.html`

## Como probar

Abrir con Live Server:

`calibraciones_mt15 copy/core/metrology_core/validation/pie_de_rey_test_panel.html`

Desde ese panel se puede validar:

- rango,
- resolucion,
- funciones disponibles,
- puntos generados,
- accesorios requeridos,
- checklist previo,
- JSON tecnico.

## Siguiente paso

Cuando la pauta sea validada, integrar el motor en el Centro de Calibracion y en la interfaz comun TMP.
