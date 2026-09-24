# Arquitectura oficial TMP

## Baseline 1.0

La plataforma queda organizada en tres niveles:

```text
HOME
  ↓
Centro de calibración
  ↓
Motor metrológico específico
```

## Estructura activa

```text
trazabilidad-tmp/
├── home.html
├── calibraciones.html
├── TMP_Calibraciones_MT15.html
├── calibraciones_mt15 copy/
│   └── core/
│       └── metrology_core/
│           ├── app_mt15.js
│           ├── calibration_execution_engine.js
│           ├── calibration_save_helper.js
│           ├── decision_engine.js
│           ├── uncertainty_engine.js
│           ├── audit_trace_engine.js
│           ├── certificates/
│           ├── procedure_rules/
│           ├── calibration/
│           ├── data/
│           ├── engines/
│           └── thread/
└── docs/
```

## Responsabilidad de cada capa

### Home

Centro de mando del laboratorio:

- KPIs,
- equipos vencidos,
- próximos a calibrar,
- movimientos,
- acceso rápido a calibración,
- acceso a histórico.

### Centro de calibración

Selector inteligente:

- recibe código, QR o designación,
- busca en Supabase,
- resuelve familia,
- abre el procedimiento correspondiente.

### Motor metrológico

Cada motor conoce únicamente su procedimiento técnico:

- MT15: tampones lisos P/NP,
- MT16: tampones/anillos roscados P/NP,
- futuros: pie de rey, micrómetros, comparadores, etc.

### Certificate Engine

Genera documentos CT-001 a partir del objeto de calibración. No debe depender visualmente de una pantalla concreta.

### Decision Engine

Debe emitir un único dictamen final:

```text
APTO / NO APTO / NO EVALUABLE
```

La incertidumbre y la regla ILAC-G8 se documentan como explicación técnica, no como segundo resultado paralelo.

## Regla de arquitectura

> El conocimiento metrológico debe estar separado de la interfaz, del certificado, del guardado y de la navegación.
