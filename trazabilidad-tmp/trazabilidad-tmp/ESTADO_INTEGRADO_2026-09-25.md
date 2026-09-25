# TMP Metrología - Base integrada 25/09/2026

Esta carpeta es una base única y coherente del proyecto `trazabilidad-tmp`.

## Base utilizada

- Se tomó la versión más reciente contenida en `GitHub(1).zip` que coincide con el `home.html` validado visualmente por el usuario.
- Se eliminó del paquete de entrega la copia recursiva accidental `trazabilidad-tmp/trazabilidad-tmp` y la metadata `.git`; no forman parte de la ejecución de la aplicación.
- `home.html` se conserva byte a byte igual al archivo `home(1).html` validado.

## MT16 integrado

- Selector de rodillos métricos por tabla física TMP, sin aproximación para pasos métricos no soportados.
- Trimos certificado como patrón trazable principal.
- Rodillos/hilos como accesorios de medición; no se exige certificado individual para la trazabilidad MT16.
- Patrón de rosca independiente no requerido por este procedimiento.
- Corrección trazable adicional: solo la del banco Trimos.
- Incertidumbre: banco Trimos + repetibilidad + resolución + ambiente. Rodillos y patrón de rosca no aportan una incertidumbre certificada independiente.
- `U(k=2)` se publica en el resumen del master y llega a la UI/documentación.
- Objetivos PASA / NO PASA del Trimos se publican con nombres únicos y compatibles con el certificado.
- El botón de certificado solo se habilita cuando `can_emit_full_certificate` es verdadero.
- El motor documental vuelve a comprobar la autorización; no genera un certificado APTO por un simple fallo visual de la interfaz.

## Seguridad normativa

El repositorio actual contiene tablas ISO 1502 marcadas explícitamente como parciales / pendientes de validación final. Por ello:

- MT16 puede calcular geometría, rodillo, objetivos, lecturas, incertidumbre y resultado técnico para los casos cargados.
- El certificado oficial queda bloqueado mientras la fuente ISO 1502 siga marcada `BETA`, `PENDING` o `VALIDATION`.
- No se han inventado ni sustituido tablas normativas que no están presentes en las fuentes del proyecto.

## Caso de validación ejecutado

Equipo: `75148`  
Designación: `M12 x 1.25 - 6H`

Resultado de prueba de integración:

- Rodillo TMP: `0.725 mm`
- Objetivo PASA Trimos: `12.292468245 mm`
- Objetivo NO PASA Trimos: `12.460468245 mm`
- Banco trazable: `1288`
- U banco estándar resuelta: `0.000740534 mm`
- U(k=2) PASA con las lecturas de prueba: `0.002089712 mm`
- U(k=2) NO PASA con las lecturas de prueba: `0.001663399 mm`
- Decisión técnica de las lecturas de prueba: `OK`
- Certificado oficial: bloqueado correctamente por validación normativa ISO 1502 pendiente.

## Próximo cierre técnico

Para declarar MT16 plenamente certificable hay que completar/validar la tabla ISO 1502 y sus fórmulas/cláusulas aplicables con una fuente normativa autorizada. La aplicación ya queda preparada para desbloquear el certificado cuando esa capa pase de pendiente a validada.
