# MC-01 v5 - Migracion y selector comun

## Objetivo
Separar definitivamente los patrones de los instrumentos normales y convertir MC-01 en la fuente de verdad metrologica para MT15, MT16, MT17 y futuros motores.

## Contenido
- `sql/MC01_07_migracion_patrones_clasica_a_mc01.sql`: migra patrones existentes desde `public.patrones` a `public.mc_patrones` sin borrar datos.
- `sql/MC01_08_comprobacion_mc01.sql`: comprueba conteos y lista los patrones migrados.
- `core/metrology_core/engines/pattern_selector_engine_v5.js`: motor comun para consultar patrones/componentes vigentes y combinar componentes.

## Orden recomendado
1. Ejecutar `MC01_07_migracion_patrones_clasica_a_mc01.sql`.
2. Ejecutar `MC01_08_comprobacion_mc01.sql`.
3. Abrir `App_Patrones_MC01_v4.html` o la version actual del editor.
4. Revisar familias/tipos/frecuencias desde MC-01.

## Notas
La migracion es prudente: no borra patrones antiguos ni toca MT15/MT16/MT17.
