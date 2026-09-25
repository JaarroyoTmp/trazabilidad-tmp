# Supabase en TMP

## Objetivo

Supabase es la fuente de datos para:

- instrumentos,
- patrones,
- calibraciones,
- lecturas,
- certificados,
- movimientos,
- histórico.

## Flujo objetivo de guardado

Al finalizar una calibración:

```text
Guardar calibración
  ↓
Guardar puntos
  ↓
Guardar lecturas
  ↓
Guardar incertidumbre y decisión
  ↓
Guardar payload técnico
  ↓
Actualizar instrumento
  ↓
Actualizar fecha próxima
  ↓
Actualizar estado
  ↓
Vincular certificado
```

## Próxima calibración

Debe calcularse como:

```text
fecha_calibracion + frecuencia_calibracion_meses
```

Si el resultado es NO APTO, el equipo no debe quedar como vigente.

## Pasaporte digital futuro

El QR del certificado podrá abrir una ficha pública/controlada del instrumento con:

- estado,
- histórico de calibraciones,
- movimientos,
- certificados,
- próxima calibración,
- incidencias.
