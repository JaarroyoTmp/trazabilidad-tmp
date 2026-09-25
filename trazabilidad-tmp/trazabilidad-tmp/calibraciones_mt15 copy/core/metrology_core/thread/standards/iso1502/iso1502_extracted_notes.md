# ISO1502 - Notas extraídas para TMP MT16

## 1. Alcance

La norma se aplica a calibres para comprobar roscas métricas ISO de uso general con perfil básico ISO 68.

Aplicación TMP:
- MT16 debe usar ISO 1502 como norma principal para tampón roscado PASA / NO PASA métrico ISO.
- La norma prevalece sobre certificados históricos o cálculos antiguos.

## 2. Principio general GO / NOT GO

Para comprobar límites de rosca debe realizarse control con calibre PASA y NO PASA.

Aplicación TMP:
- En calibración MT16 deben existir como mínimo dos funciones:
  - PASA
  - NO PASA

## 3. Roscas internas - calibres recomendados

Para roscas internas se recomiendan:
- GO screw plug gauge
- NOT GO screw plug gauge
- plain GO plug gauge
- plain NOT GO plug gauge

Aplicación TMP:
- En tampón roscado P/NP interno, el equipo principal del módulo es:
  - tampón roscado PASA
  - tampón roscado NO PASA
- El diámetro menor se verifica con calibres lisos cuando aplique, no con el mismo motor de flancos.

## 4. Temperatura de referencia

La temperatura de referencia dimensional es 20 °C.

Aplicación TMP:
- El informe MT16 debe registrar condiciones ambientales.
- Si patrón y equipo son de materiales equivalentes, la desviación térmica puede no afectar de forma relevante si están a la misma temperatura.
- Si hay materiales diferentes o condiciones fuera de control, se debe considerar corrección/incertidumbre térmica.

## 5. GO screw plug gauge - rosca interna

El calibre PASA roscado comprueba el tamaño virtual de la rosca interna y debe entrar en toda la longitud útil sin fuerza excesiva.

Aplicación TMP:
- Regla funcional en uso:
  - PASA debe roscar completamente.
- En calibración dimensional con Trimos:
  - se evalúa diámetro de flancos / diámetro medio según límites normativos.
- En inspección de uso:
  - si PASA no entra completo, la pieza/equipo no cumple su función.

## 6. NOT GO screw plug gauge - rosca interna

El calibre NO PASA comprueba si el diámetro medio real supera el tamaño máximo especificado. Puede entrar por ambos extremos, pero no más de dos vueltas de rosca.

Aplicación TMP:
- Regla funcional:
  - NO PASA puede iniciar.
  - NO PASA no debe entrar más de 2 vueltas.
- Esta regla debe aparecer en la pauta de calibración/uso.
- La decisión dimensional se resolverá por límites ISO 1502 cuando se extraigan las tablas.

## 7. Desgaste

La norma define control de desgaste para calibres roscados. Para el GO plug gauge, el desgaste admisible se obtiene por medición. La cláusula 12 contiene las tolerancias y desgaste permitidos para diámetros de paso/flancos.

Aplicación TMP:
- Debemos implementar:
  - desgaste PASA
  - desgaste NO PASA
  - tolerancia de calibre
- Pero los valores numéricos de tablas 4 a 9 NO están disponibles en el PDF de 12 páginas.
- Hasta tener esas tablas:
  - el motor no debe calcular desgaste normativo final.
  - debe devolver TABLA_ISO1502_NO_CARGADA.

## 8. Símbolos críticos detectados

Símbolos relevantes para los motores:
- D / d: diámetro mayor básico
- D2: diámetro medio básico
- P: paso
- EI / es: desviaciones fundamentales
- TD1 / TD2 / Td / Td2: tolerancias de rosca
- TPL: tolerancia diámetro medio de tapones roscados PASA/NO PASA
- TR: tolerancia diámetro medio de anillos roscados PASA/NO PASA
- WGO: desgaste admisible calibre PASA
- WNG: desgaste admisible calibre NO PASA
- ZPL / ZR: desplazamientos de zonas de tolerancia

## 9. Pendiente obligatorio

Falta extraer de ISO 1502 completa:
- Figuras 1 y 2
- Tablas 4 a 9
- Cláusula 12 completa
- Cláusula 13 completa
- Fórmulas de cálculo de límites de calibre

Sin eso no se debe cerrar thread_gauge_limits_engine.js.
