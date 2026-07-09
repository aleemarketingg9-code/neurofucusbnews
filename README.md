# Bienestar Diario

Una PWA personal para planificar y mejorar tu día a día: sueño, calorías,
actividad física y nutrición. Registra tus datos en menos de un minuto y
recibe recomendaciones diarias en español, generadas por reglas simples (sin
IA ni llamadas externas) a partir de tu sueño, tu actividad reciente y tu
perfil.

## Pantallas

- **Hoy** — registro rápido del día (sueño, calorías, actividad, peso,
  ánimo) + recomendaciones diarias.
- **Dashboard** — resumen del día y gráficos de tendencia (sueño, calorías
  in/out, peso, correlación sueño-energía) en los últimos 7/30 días.
- **Historial** — lista de todos los días registrados.
- **Perfil** — datos personales, objetivo y metas; también sirve como
  pantalla de onboarding la primera vez que abres la app.

Navegación por barra inferior, pensada para uso con una mano en el celular.

## Cómo correrlo localmente

```bash
npm install
npm run dev
```

Abre la URL que imprime Vite (por defecto `http://localhost:5173`) en tu
navegador. Para probar el modo PWA / "Agregar a pantalla de inicio" en tu
teléfono, corre `npm run build && npm run preview` y abre la URL de preview
desde el navegador del celular (en la misma red, usando la IP local).

```bash
npm run build      # build de producción (incluye el service worker)
npm run preview    # sirve el build de producción localmente
```

## Estado del proyecto: Fase 1 (solo almacenamiento local)

Esta es la **fase 1** del proyecto: un prototipo 100% funcional que guarda
todo en el `localStorage` del navegador. No hay backend, cuentas de usuario
ni sincronización entre dispositivos — todo lo que registras vive únicamente
en el teléfono/navegador donde lo usas.

Toda la lectura/escritura de datos pasa por una única capa de abstracción:

- `src/lib/storage.ts` — el único módulo que toca `localStorage`
  directamente (claves versionadas, serialización JSON, valores por defecto
  cuando no hay nada guardado todavía).
- `src/lib/dataService.ts` — la API de dominio que usa el resto de la app
  (`getProfile`, `saveProfile`, `getAllLogs`, `upsertLog`, etc.). Todos sus
  métodos devuelven `Promise`, aunque hoy resuelven de forma síncrona contra
  `localStorage`.

### Fase 2 (planeada, no implementada aún): Supabase

La idea es que la **Fase 2** agregue sincronización en la nube y
autenticación con Supabase reemplazando los internos de
`src/lib/dataService.ts` por llamadas a Supabase, manteniendo la misma
interfaz (`Profile`, `DailyLog`, mismos métodos async). Como las pantallas
ya consumen `dataService` y no `localStorage` directamente, ese cambio no
debería requerir tocar ningún componente de UI.

## Stack técnico

- Vite + React + TypeScript
- Tailwind CSS (mobile-first, diseño con tarjetas redondeadas y barra de
  navegación inferior)
- Recharts para los gráficos de tendencia
- react-router-dom para la navegación entre pantallas
- vite-plugin-pwa para el manifest y el service worker (instalable con
  "Agregar a pantalla de inicio")

## Motor de recomendaciones

`src/lib/recommendations.ts` contiene una lista de reglas (`condición` +
`mensaje`), evaluadas en orden de prioridad y deduplicadas por categoría
(sueño, nutrición, actividad, ánimo, general). Agregar una recomendación
nueva es agregar un objeto más a esa lista — no hay lógica de IA ni llamadas
a APIs externas, y los mensajes están redactados como sugerencias de estilo
de vida, nunca como diagnóstico médico.
