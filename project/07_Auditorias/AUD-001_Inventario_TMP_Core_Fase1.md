# AUD-001 — Inventario técnico TMP Core · Fase 1

**Fecha:** 23/07/2026  
**Fuente analizada:** `trazabilidad-tmp-main(1).zip`  
**Tipo de revisión:** solo lectura; no se ha modificado ningún archivo del proyecto.

## 1. Hallazgo principal

El proyecto contiene **más de un núcleo metrológico y más de una raíz de aplicación**. No debe crearse ningún motor nuevo hasta determinar qué versión está activa y qué aplicaciones consumen cada raíz.

La estructura relevante observada es:

```text
trazabilidad-tmp/
├── core/metrology_core/                         # Núcleo reciente MC-02
├── calibraciones_mt15 copy/core/metrology_core/ # Núcleo amplio MT15/MT16
└── trazabilidad-tmp/
    ├── core/metrology_core/                     # Núcleo MC-01 v4
    └── calibraciones_mt15 copy/core/metrology_core/
```

Esto confirma que el riesgo actual no es la falta de motores, sino **la coexistencia de copias y rutas activas distintas**.

## 2. Hallazgo crítico en MC-02

`App_MC02_Actualizar_Calibracion_Patron.html` mezcla dos raíces diferentes en sus importaciones:

```js
import { ensureSupabase }
  from './trazabilidad-tmp/core/metrology_core/supabase_client.js';

import {
  createDraftVersion,
  replaceVersionResults,
  approveVersion,
  registerImport
} from './core/metrology_core/engines/pattern_lifecycle_engine.js';

import { mountPatternResultEditor }
  from './core/metrology_core/editors/pattern_result_editors.js';
```

Esto explica los problemas recientes de rutas y demuestra que **no conviene mover carpetas ni unificar nada todavía**. Primero hay que establecer cuál es la raíz publicada por Vercel y qué archivos existen realmente en esa ruta.

## 3. Motores de patrón ya existentes en la raíz de MC-02

```text
core/metrology_core/
├── editors/
│   └── pattern_result_editors.js
└── engines/
    ├── pattern_combination_engine.js
    ├── pattern_lifecycle_engine.js
    ├── pattern_metrology_resolver.js
    └── pattern_selector_engine_v5.js
```

Por tanto, MC-02 ya dispone de:

- ciclo de vida y versionado;
- edición de resultados por familia;
- resolución metrológica;
- combinaciones de patrones discretos;
- selección de patrones.

## 4. Núcleo general ya desarrollado

En `calibraciones_mt15 copy/core/metrology_core/` se han localizado 115 archivos hasta profundidad 2, entre ellos:

### Ejecución y cálculo

- `calibration_execution_engine.js`
- `calibration_strategy_rules.js`
- `uncertainty_engine.js`
- `uncertainty_models_matrix.js`
- `decision_engine.js`
- `metrology_engine.js`
- `reference_value_resolver.js`
- `reference_point_resolver.js`

### Patrones

- `pattern_selector.js`
- `pattern_matcher.js`
- `pattern_options_engine.js`
- `pattern_correction_resolver.js`
- `pattern_capabilities.js`
- `engines/pattern_selection_engine.js`

### Trazabilidad, guardado e informes

- `audit_trace_engine.js`
- `calibration_save_helper.js`
- `report_engine.js`
- módulo completo `certificates/`

### Normativa y procedimientos

- `normative_registry.js`
- `standards_catalog.js`
- `metrology_rules_repository.js`
- `procedure_builder.js`
- reglas específicas para pie de rey, micrómetros, comparadores, balanzas, dinamométricas, tampones lisos y tampones roscados.

## 5. MT16 está muy desarrollado

Existe un bloque específico de roscas con parser, geometría, ISO 724, ISO 965, ISO 1502, selección de rodillos, cálculo Trimos, incertidumbre, decisión y trazabilidad.

Conclusión: **MT16 no necesita una reconstrucción conceptual**. Debe considerarse un módulo desarrollado que solo necesita certificación, consolidación de rutas y pruebas de regresión.

## 6. MC-01 también tiene varias generaciones

Se han localizado:

- `App_Patrones_MC01.html`
- `App_Patrones_MC01_v2.html`
- `App_Patrones_MC01_v3.html`
- `App_Patrones_MC01_v4.html`
- repositorios `master_pattern_repository.js`, `v2`, `v3` y `v4`.

La versión v4 carga:

```html
<script type="module"
  src="./core/metrology_core/engines/master_pattern_repository_v4.js">
</script>
```

Pero dicho archivo está dentro de la raíz anidada `trazabilidad-tmp/trazabilidad-tmp/`, no en la misma raíz que el MC-02 actual. Esto confirma que actualmente conviven, al menos, **dos árboles funcionales diferentes**.

## 7. Decisiones de seguridad

Hasta cerrar la fase 2:

1. No borrar, mover ni renombrar carpetas.
2. No crear motores nuevos.
3. No ejecutar SQL estructural.
4. No modificar motores compartidos.
5. No intentar todavía unificar las distintas raíces.
6. Todo cambio deberá realizarse sobre una copia y en un único archivo cada vez.

## 8. Siguiente trabajo técnico

La fase 2 debe identificar la **ruta activa real** mediante el flujo publicado:

```text
Página de entrada
→ enlace de calibración
→ MC-01 / MC-02 / MT15 / MT16 / MT17
→ scripts importados
→ motores llamados
→ tablas Supabase utilizadas
```

El primer punto concreto será seguir desde el HTML que realmente abre el usuario en Vercel, no desde nombres de carpetas asumidos.

## 9. Conclusión de fase 1

El proyecto tiene ya una base de motores muy extensa. La prioridad correcta no es construir más, sino:

```text
identificar árbol activo
→ documentar dependencias
→ corregir solo fallos confirmados
→ probar regresión
→ consolidar sin perder funcionalidad
```