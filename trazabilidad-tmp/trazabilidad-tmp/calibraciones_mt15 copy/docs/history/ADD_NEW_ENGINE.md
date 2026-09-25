# Cómo añadir un nuevo motor metrológico

## Regla principal

Un nuevo motor no debe crear una aplicación nueva. Debe conectarse a la plataforma TMP.

## Flujo común

```text
1. Equipo
2. Preguntas
3. Procedimiento / pauta
4. Patrones
5. Lecturas
6. Resultado
7. Certificado
8. Guardado
```

## Debe reutilizar

- Home.
- Centro de calibración.
- Certificate Engine CT-001.
- Decision Engine.
- Supabase.
- UX común.
- Estilo visual de MT15/MT16.

## Debe aportar

Solo el conocimiento específico del instrumento:

- procedimiento,
- puntos de calibración,
- patrones necesarios,
- cálculos,
- incertidumbre,
- criterios de aceptación.

## Checklist antes de cerrar un motor

- [ ] Busca equipo en Supabase.
- [ ] Resuelve familia correctamente.
- [ ] Genera pauta.
- [ ] Selecciona patrón.
- [ ] Registra lecturas.
- [ ] Calcula incertidumbre.
- [ ] Emite dictamen único.
- [ ] Genera certificado CT-001.
- [ ] Guarda calibración.
- [ ] Actualiza próxima fecha.
- [ ] No rompe MT15 ni MT16.
