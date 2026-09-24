# TMP Calibraciones MT15 - Refactor v2

Esta versión no reconstruye la pantalla: parte de `TMP_Calibraciones_Lab.html` y separa:

- `index.html`: estructura HTML.
- `css/calibraciones.css`: estilos extraídos.
- `core/app.js`: lógica actual extraída.
- `core/mt15_engine.js`: motor MT15 base preparado para la siguiente fase.
- `procedimientos/catalogo_mt15.js`: catálogo inicial de familias MT15.

## Cómo probar

1. Copia la carpeta `calibraciones_mt15` dentro de tu carpeta `trazabilidad-tmp`.
2. Abre `calibraciones_mt15/index.html` con Live Server.
3. Comprueba que carga visualmente como `TMP_Calibraciones_Lab.html`.
4. Prueba carga de instrumento, patrón, puntos, medición y PDF.

## Importante

No sustituye todavía `TMP_Calibraciones_Lab.html`. Es una copia modular para pruebas locales.
