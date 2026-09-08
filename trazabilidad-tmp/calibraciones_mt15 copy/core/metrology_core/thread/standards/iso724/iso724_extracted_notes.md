# ISO724 - Notas extraídas para TMP MT16

## 1. Alcance

ISO 724 especifica las dimensiones básicas, en milímetros, de roscas métricas ISO conforme al plan ISO 261 y al perfil básico ISO 68.

Aplicación TMP:
- El motor MT16 no debe copiar diámetros desde informes.
- Debe calcular D2 y D1 desde nominal y paso.

## 2. Símbolos principales

- D: diámetro mayor básico de rosca interna, diámetro nominal.
- d: diámetro mayor básico de rosca externa, diámetro nominal.
- D2 / d2: diámetro medio básico.
- D1 / d1: diámetro menor básico.
- P: paso.
- H: altura del triángulo fundamental.

## 3. Fórmulas principales

ISO 724 indica que los valores de D2/d2 y D1/d1 se calculan desde el perfil básico:

- D2 = D - 0.6495 * P
- d2 = d - 0.6495 * P
- D1 = D - 1.0825 * P
- d1 = d - 1.0825 * P

Aplicación TMP:
- `thread_basic_dimensions_engine.js` calcula estos valores.
- `thread_geometry_engine.js` puede delegar en esta fuente ISO724.
- El motor debe redondear salida visible a 0.001 mm cuando compare con tabla ISO 724.

## 4. Ejemplos de comprobación

- M14x2:
  - D2 = 12.701 mm
  - D1 = 11.835 mm

- M16x1.5:
  - D2 = 15.026 mm
  - D1 = 14.376 mm

- M33x2:
  - D2 = 31.701 mm
  - D1 = 30.835 mm

## 5. Advertencia sobre paso no cargado

Si nominal y paso se pueden calcular pero la combinación no está cargada aún en la tabla ISO724:
- calcular dimensiones básicas por fórmula,
- devolver warning `PITCH_NOT_IN_LOADED_ISO724_TABLE`,
- no bloquear geometría,
- sí bloquear decisión final si ISO965/ISO1502 no están completos.
