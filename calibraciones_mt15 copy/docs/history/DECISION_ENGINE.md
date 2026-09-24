# Decision Engine TMP

## Principio oficial

TMP debe comunicar siempre un único dictamen final.

```text
APTO / NO APTO / NO EVALUABLE
```

## Prohibido

No mostrar dos resultados paralelos como:

```text
Resultado operativo: APTO
Resultado auditoría: INDETERMINADO
```

Esto genera duda operativa y documental.

## Evaluación metrológica

La incertidumbre, guard band e ILAC-G8 se documentan como explicación técnica.

Ejemplo correcto:

```text
DICTAMEN FINAL: APTO
Evaluación metrológica: ILAC-G8 / ISO 14253 aplicada. Incertidumbre considerada en la decisión.
```

## Uso de INDETERMINADO

Solo debe usarse cuando el dictamen final realmente no pueda resolverse.

Para uso operativo de taller, el flujo debe tender a:

- APTO: puede seguir en uso.
- NO APTO: retirar/bloquear/gestionar.
- NO EVALUABLE: falta información, patrón, datos o trazabilidad.
