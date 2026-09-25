# TMP Metrology Platform

**Estado del proyecto:** Baseline 1.0 consolidada  
**Uso principal:** gestión, trazabilidad y calibración guiada de equipos de metrología TMP.

## Objetivo

TMP Metrology Platform es la plataforma interna para:

- identificar instrumentos,
- resolver su familia metrológica,
- ejecutar procedimientos guiados,
- calcular resultados e incertidumbre,
- aplicar regla de decisión,
- generar certificado CT-001,
- guardar histórico y trazabilidad en Supabase.

## Módulos consolidados

| Módulo | Estado | Observación |
|---|---:|---|
| Home laboratorio | Congelado | Dashboard, KPIs, alertas y accesos |
| Centro de calibración | Congelado | Selector inteligente de procedimiento |
| MT15 lisos P/NP | Finalizado | Motor conservado, UX unificada y dictamen único |
| MT16 roscados P/NP | Finalizado | Banco Trimos como patrón único |
| Certificate Engine CT-001 | Finalizado | Certificado común para la plataforma |
| Decision Engine | Finalizado | Dictamen final único: APTO / NO APTO / NO EVALUABLE |

## Regla principal

> No se rehacen módulos congelados. Solo se corrigen errores, se mejora rendimiento o se adaptan a nueva normativa.

## Carpeta activa

La carpeta de trabajo real del core metrológico es:

```text
trazabilidad-tmp/calibraciones_mt15 copy/
```

La carpeta `calibraciones_mt15` antigua queda como referencia histórica hasta limpieza final.
