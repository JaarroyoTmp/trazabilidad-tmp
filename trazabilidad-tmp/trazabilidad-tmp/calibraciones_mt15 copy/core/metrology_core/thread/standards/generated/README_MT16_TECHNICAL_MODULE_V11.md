# TMP MT16 V11 - Módulo técnico limpio sin buscador general

## Objetivo

Separar responsabilidades:
- MT16 queda como módulo técnico puro.
- El buscador general se hará después en otro HTML.
- MT16 puede recibir datos por URL o por formulario técnico.

## Apertura desde buscador futuro

Ejemplo:
thread_mt16_workflow_test.html?codigo=75148&descripcion=Tampón%20de%20Rosca%20P/NP&rango=M12%20x%201.25%20-%206H

También acepta:
- ultima_calibracion
- proxima_calibracion

## Qué mantiene

- Parser de rosca
- ISO724
- ISO965
- ISO1502 beta/gate
- Rodillo Trimos automático
- Corrección C
- Aviso de montaje
- Incertidumbre automática
- Decisión con banda de guarda
- Bloqueo por vigencia salvo autorización
- Preparación de paquete técnico para guardado

## Sustituir

core/metrology_core/thread/thread_mt16_workflow_test.html
