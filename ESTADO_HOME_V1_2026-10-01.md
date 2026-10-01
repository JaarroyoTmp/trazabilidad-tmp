# HOME V1 - 2026-10-01

Base: GitHub(3).zip recibido el 2026-10-01.

Cambios integrados exclusivamente en home.html:
- Eliminado del Home el bloque Alertas de calibracion.
- Eliminado del Home el bloque Calibracion guiada y toda su logica de enrutado MT15/MT16.
- Retirados del menu principal: Calibraciones Lab, Buscar duplicado, Tablas duplicado y Configuracion vacia.
- Equipos renombrado a Equipos / Buscar como acceso unico de ese grupo, pendiente de redisenar su pagina.
- KPI En taller / produccion visible.
- KPI Laboratorio/Taller calculados contra public.ubicaciones por ubicacion_id, con compatibilidad por texto.
- Equipos por maquina pasa a ser el bloque principal bajo KPIs.
- Se muestran tarjetas por maquina con numero de equipos y acceso directo al listado.
- Estado general deja de ser un donut decorativo y usa datos reales: OK >30 dias, Proximos, Fuera y Sin fecha.
- Calibraciones por mes deja de ser un SVG fijo y consulta public.calibraciones del ano actual.
- Se conservan movimientos y el resto de modulos sin modificar.

No se han modificado MT15, MT16, patrones, familias, criterios, informes ni Supabase.
