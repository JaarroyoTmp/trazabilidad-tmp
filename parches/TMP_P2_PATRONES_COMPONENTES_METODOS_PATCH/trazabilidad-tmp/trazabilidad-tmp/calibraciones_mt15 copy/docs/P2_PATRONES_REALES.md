# P2 - Patrones reales TMP

## Objetivo
Crear una capa nueva para gestionar patrones reales sin romper MT15 ni MT16.

## Tablas nuevas

### patron_componentes
Representa piezas físicas dentro de un patrón compuesto:

- calas individuales dentro de un juego de bloques;
- anillos individuales dentro de un juego de anillos;
- masas individuales dentro de un juego de masas.

### patron_metodos
Define para qué sirve cada patrón:

- EXTERIORES;
- INTERIORES;
- PROFUNDIDAD;
- ESCALON;
- MICROMETRO;
- COMPARADOR;
- COLUMNA;
- etc.

## Regla de seguridad
No modifica `patrones` ni `patron_valores_certificado`.
MT15 y MT16 siguen funcionando como hasta ahora.

## Uso previsto en MT17
MT17 podrá seleccionar por punto:

- Banco Trimos para exteriores;
- anillo concreto para interiores;
- calas individuales o combinación de calas para profundidad/escalón.

## Siguiente paso
Crear una pantalla de gestión para cargar componentes sin usar Supabase manualmente.
