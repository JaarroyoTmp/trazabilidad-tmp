# MC-01 v7 · Nominales y combinaciones disponibles

## Instalación

Copiar el contenido del ZIP sobre la carpeta real:

`trazabilidad-tmp/trazabilidad-tmp/`

Debe quedar:

- `App_MC01_Combinaciones_Patron.html`
- `core/metrology_core/engines/pattern_combination_engine.js`
- `sql/MC01_11_COMBINACIONES_PATRONES_DISCRETOS.sql`

## Orden

1. Ejecutar `sql/MC01_11_COMBINACIONES_PATRONES_DISCRETOS.sql` en Supabase.
2. Abrir `App_MC01_Combinaciones_Patron.html`.
3. Elegir el juego `180456`.
4. Definir el intervalo que se quiere listar, por ejemplo 0–200 mm.
5. Generar la tabla.
6. Elegir una fila o abrir sus alternativas.
7. Guardar el catálogo solo cuando se haya revisado.

## Reglas

- Un elemento físico no se reutiliza dentro de una combinación.
- Se prioriza menor número de elementos.
- A igualdad, menor incertidumbre combinada.
- Después, menor corrección absoluta.
- Máximo inicial recomendado: 6 elementos.
- Se conservan hasta 5 alternativas por nominal.
- El intervalo es un filtro de cálculo, no el nominal que usará el operario.
