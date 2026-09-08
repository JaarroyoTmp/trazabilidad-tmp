# TMP MT16 V8 - Real Search

## Objetivo

Convertir la pantalla MT16 de prueba simulada en un flujo con buscador real estilo MT15.

## Archivo principal

- thread/thread_mt16_workflow_test.html

## Qué hace

- Conecta a Supabase usando ../supabase_client.js
- Busca en tabla instrumentos
- Mapea código, descripción, rango, estado, ubicación y fechas
- Construye workflow MT16 desde el equipo real
- Mantiene:
  - Trimos
  - rodillos automáticos
  - control de montaje
  - incertidumbre automática
  - decisión con banda de guarda
  - bloqueo de certificado final hasta ISO1502/certificados reales

## Estado

V8 técnica. Lista para probar con códigos reales.
