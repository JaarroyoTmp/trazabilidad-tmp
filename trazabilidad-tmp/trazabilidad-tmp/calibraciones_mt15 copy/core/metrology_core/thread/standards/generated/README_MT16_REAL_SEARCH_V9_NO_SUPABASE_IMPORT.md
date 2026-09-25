# TMP MT16 V9 - Real Search sin import local de Supabase

## Cambio principal

Se elimina:

import { ensureSupabase } from "../supabase_client.js";

La conexión Supabase queda dentro del HTML para evitar el error MIME provocado por rutas locales incorrectas.

## Archivos

- thread/thread_mt16_workflow_test.html
- thread/engines/thread_uncertainty_resolver.js

## Sustituir

- core/metrology_core/thread/thread_mt16_workflow_test.html
- core/metrology_core/thread/engines/thread_uncertainty_resolver.js
