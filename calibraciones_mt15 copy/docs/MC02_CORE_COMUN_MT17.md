# MC-02 / MC-03 / MC-05 - Core común inicial para MT17

Este parche prepara una base común para el motor de Pie de Rey sin tocar MT15 ni MT16.

## Archivos añadidos

- `core/metrology_core/supabase_client.js`
  - Puente compatible para evitar errores de ruta/MIME.
  - Reutiliza el cliente oficial si existe.

- `core/metrology_core/engines/equipment_loader.js`
  - Carga equipos desde Supabase.
  - Normaliza código, descripción, rango, resolución y familia.

- `core/metrology_core/engines/procedure_builder_engine.js`
  - Utilidades para pautas bajo/medio/alto.

- `core/metrology_core/engines/measurement_engine.js`
  - Media, desviación, error y decisión básica por punto.

## Criterio

- El alta del equipo aporta tipo, rango y resolución.
- El procedimiento pregunta solo qué funciones se calibran.
- Los patrones se seleccionan por motor común, no escritos fijos en el procedimiento.

## Estado

Base prudente y reversible para seguir construyendo MT17.
