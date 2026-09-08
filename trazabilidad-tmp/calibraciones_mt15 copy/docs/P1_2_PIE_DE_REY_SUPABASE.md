# P1.2 - Pie de Rey desde Supabase

Objetivo: validar el flujo real del futuro motor Pie de Rey sin tocar MT15 ni MT16.

## Flujo validado

1. Introducir codigo de equipo.
2. Buscar en Supabase, tabla `instrumentos`.
3. Confirmar si el equipo pertenece a la familia Pie de Rey.
4. Leer automaticamente:
   - rango,
   - resolucion,
   - tipo,
   - descripcion.
5. Completar manualmente solo los datos que falten.
6. Generar pauta automatica.

## Archivo de prueba

Abrir con Live Server:

```text
trazabilidad-tmp/calibraciones_mt15 copy/core/metrology_core/validation/pie_de_rey_supabase_panel.html
```

## Importante

Este bloque no modifica motores cerrados. Es un panel de validacion para preparar la integracion real del Pie de Rey en TMP Calibration Platform.
