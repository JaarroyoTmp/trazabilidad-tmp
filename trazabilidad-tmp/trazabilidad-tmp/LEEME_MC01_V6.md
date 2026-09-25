# MC-01 v6 · Resolución por nominal

## Qué añade

- Modelos de resolución independientes para cada patrón.
- Patrones discretos: coincidencia exacta y combinaciones.
- Patrones continuos: puntos, tramos o ecuaciones.
- Bloqueo/revisión técnica para CMM y Trimos hasta aprobar su regla real.
- Registro congelado de la corrección e incertidumbre usadas en cada calibración.
- Simulador independiente para validar el comportamiento antes de integrar MT17.

## Instalación

1. Ejecutar `sql/MC01_10_MODELO_METROLOGICO_DINAMICO.sql` en Supabase.
2. Copiar `core/metrology_core/engines/pattern_metrology_resolver.js` respetando la ruta.
3. Copiar `App_MC01_Simulador_Patron.html` en la misma carpeta raíz que `App_Patrones_MC01_v4.html`.
4. Abrir `App_MC01_Simulador_Patron.html` con Live Server.

## Pruebas

### Juego de bloques 180456

- Nominal `75`: debe resolver la cala exacta.
- Nominal `63`: debe intentar una combinación de elementos certificados.
- Nominal imposible: debe bloquear.

### CMM

Debe responder `REVISION_TECNICA`, porque todavía no hemos aprobado qué orientación/ensayo y qué regla representan la corrección e incertidumbre de uso.

### Banco Trimos

Debe bloquear/requerir revisión hasta cargar su certificado con puntos, tramos o ecuación.

## Importante

La tabla `mc_patron_resoluciones_uso` congela los valores empleados. Aunque un certificado futuro cambie las correcciones, una calibración histórica conservará exactamente el patrón, certificado, combinación, corrección e incertidumbre que utilizó.
