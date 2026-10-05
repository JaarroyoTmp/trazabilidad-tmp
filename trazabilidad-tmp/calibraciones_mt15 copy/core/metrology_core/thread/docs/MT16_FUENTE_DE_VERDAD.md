# MT16 - FUENTE DE VERDAD ACTIVA

**Version:** 2026-10-05  
**Estado:** regla de arquitectura activa

## Ruta activa

La pantalla MT16 activa importa:

`thread/thread_mt16_workflow_test.html` -> `thread/core/mt16_master_engine.js`

Los calculos certificables deben pasar por el master anterior y por sus motores `thread/core/*`.

## Reglas que SI valen

1. ISO metrica: ISO 724 -> ISO 965 -> ISO 1502 -> Trimos.
2. Rodillo metrico: tabla TMP validada por paso en `thread/core/mt16_authoritative_rules.js`.
3. Para metrica certificable NO existe fallback a "rodillo comercial mas cercano".
4. Banco Trimos certificado = patron trazable principal.
5. Rodillos/hilos = accesorio/util de medicion; no bloquean certificado por no existir como patron certificado en Supabase.
6. Patron/maestro roscado = opcional salvo procedimiento especifico documentado.
7. Correccion total de lectura = correccion geometrica de rodillos + correccion certificada del banco Trimos.
8. La incertidumbre activa no contiene `u_rollers=0.0003` ni otra contribucion accesoria fija sin modelo validado.
9. La decision la emite el motor, no el operario.
10. ISO 1502 y sus tablas/formulas son la fuente de limites del calibre metrico. No sustituir por tablas historicas aproximadas.

## Reglas antiguas que NO deben gobernar MT16 activo

- `thread/engines/thread_trimos_engine.js`: motor historico/compatibilidad. No usar como fuente normativa.
- `thread/thread_mt16_workflow.js`: workflow historico.
- `metrology_core/core/mt16_master_engine.js`: master anterior fuera de la ruta `thread/core` activa.
- Seleccion de rodillo por "nearest commercial" para rosca metrica certificable.
- Exigir rodillos certificados como condicion de certificado.
- Exigir patron/maestro roscado por defecto como condicion de certificado.
- Sumar correcciones de rodillos o maestro a la correccion certificada del banco sin procedimiento especifico.
- Introducir `u_rollers_mm = 0.0003` por defecto.

## Caso test de control

`M12 x 1.25 6H` -> rodillo TMP **0.725 mm**.

Cualquier cambio que produzca otro rodillo para ese paso debe considerarse regresion y revisarse antes de desplegar.
