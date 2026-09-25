# P1.4 - Pie de Rey: pauta automática y patrones

## Objetivo

Validar el flujo experto del motor Pie de Rey:

1. Buscar equipo real en Supabase.
2. Leer del alta del equipo: tipo, rango y resolución.
3. Preguntar solo funciones a calibrar: exteriores, interiores, profundidad y escalón.
4. Generar pauta automática.
5. Proponer patrones/accesorios y guía de montaje.

## Criterio de arquitectura

El motor no debe preguntar datos técnicos permanentes del equipo si pertenecen al alta:

- Tipo digital/analógico.
- Rango.
- Resolución.
- Familia.

Si faltan, se debe completar el alta del instrumento. El procedimiento solo pregunta qué funciones se calibran en esa intervención.

## Prueba

Abrir con Live Server:

```text
trazabilidad-tmp/calibraciones_mt15 copy/core/metrology_core/validation/pie_de_rey_supabase_panel.html
```

## Estado

Panel de validación. No modifica MT15 ni MT16.
