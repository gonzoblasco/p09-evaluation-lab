# P09 — Evaluation Lab

Framework para testear y comparar variantes de prompts contra casos de prueba orientados a SoporteML (soporte al cliente de Mercado Libre). Permite medir calidad de respuestas con un LLM como juez, comparar variantes side-by-side y analizar métricas agregadas.

## Qué hace

- **Evalúa prompts**: corre un `prompt_variant` contra un `test_case`, mide latencia y tokens usados
- **Juez automático**: un segundo LLM evalúa cada respuesta en 3 dimensiones (precisión, completitud, tono) y asigna un score 0–1
- **Batch paralelo**: lanza N variantes × M test cases en paralelo, con respuesta inmediata y polling del estado
- **Dashboard**: visualiza resultados, compara variantes side-by-side y muestra métricas agregadas (score promedio, latencia p95, win rate, costo estimado)

## Stack

- **Next.js 16** (App Router) + TypeScript
- **Supabase** (Postgres)
- **Anthropic API** — `claude-sonnet-4-6` como evaluador y juez
- **Tailwind v4** + shadcn/ui + Recharts

## Setup

### 1. Variables de entorno

Copiá `.env.local.example` a `.env.local` y completá:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://<project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>

# Anthropic
ANTHROPIC_API_KEY=sk-ant-...
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Ejecutar migraciones

Con Supabase CLI:

```bash
supabase db push
```

O ejecutando manualmente en el SQL editor de Supabase:

```
supabase/migrations/20260413000001_create_eval_schema.sql   ← tablas base
supabase/migrations/20260413000002_seed_test_cases.sql      ← 10 test cases de SoporteML
supabase/migrations/20260413000003_seed_prompt_variants.sql ← 3 variantes de prompt
```

### 4. Levantar el servidor

```bash
npm run dev
```

Abrí [http://localhost:3000](http://localhost:3000) — redirige automáticamente a `/dashboard`.

## Uso

### Paso 1 — Crear test cases

Ir a `/dashboard/test-cases` → **Nuevo test case**.

Un test case representa una interacción real de soporte:
- **Pregunta del comprador** — lo que el usuario pregunta
- **Contexto del vendedor** — información adicional del seller
- **Respuesta esperada** — la respuesta ideal de referencia
- **Categoría** — `garantia`, `envio`, `devoluciones`, etc.

El seed incluye 10 test cases reales de SoporteML listos para usar.

### Paso 2 — Crear prompt variants

Ir a `/dashboard/prompt-variants` → **Nueva variante**.

El system prompt puede incluir las variables:
- `{{buyer_question}}` — se reemplaza con la pregunta del comprador
- `{{seller_context}}` — se reemplaza con el contexto del vendedor

El seed incluye 3 variantes con diferente nivel de formalidad y detalle.

### Paso 3 — Lanzar un run

En `/dashboard` (home):
1. Seleccioná las **variantes** a comparar
2. Seleccioná los **test cases** a evaluar
3. Poné un nombre al run
4. Hacé click en **Ejecutar**

El batch corre en paralelo. La página redirige al detalle del run con polling automático.

### Paso 4 — Ver resultados y métricas

- **`/dashboard/runs/{id}`** — tabla de resultados con scores, latencia y reasoning del juez. Comparación side-by-side de variantes.
- **`/dashboard/runs/{id}/metrics`** — score promedio por variante (gráfico de barras), latencia p95, tokens/costo estimado, win rate y breakdown por categoría.

## API

### `POST /api/eval/single`

Evalúa una variante contra un test case.

```bash
curl -X POST http://localhost:3000/api/eval/single \
  -H "Content-Type: application/json" \
  -d '{ "prompt_variant_id": "<uuid>", "test_case_id": "<uuid>" }'
```

### `POST /api/eval/judge`

Evalúa una respuesta existente con el LLM juez.

```bash
curl -X POST http://localhost:3000/api/eval/judge \
  -H "Content-Type: application/json" \
  -d '{
    "eval_result_id": "<uuid>",
    "expected_response": "Hola! El producto tiene 12 meses de garantía...",
    "actual_response": "La garantía es de un año desde la compra.",
    "buyer_question": "¿Cuánto tiempo tiene de garantía?"
  }'
```

### `POST /api/eval/batch`

Lanza un batch de N×M evaluaciones (respuesta inmediata, ejecución async).

```bash
curl -X POST http://localhost:3000/api/eval/batch \
  -H "Content-Type: application/json" \
  -d '{
    "run_name": "Test formalidad v1",
    "prompt_variant_ids": ["<uuid-variante-formal>", "<uuid-variante-informal>"],
    "test_case_ids": ["<uuid-garantia>", "<uuid-envio>", "<uuid-devolucion>"]
  }'
```

## Skills

Los skills documentan los patrones de implementación para uso desde agentes AI:

| Skill | Descripción |
|-------|-------------|
| [prompt-evaluator](.agents/skills/prompt-evaluator/SKILL.md) | Patrón de evaluación single: interpolación, llamada Anthropic, persistencia |
| [llm-judge](.agents/skills/llm-judge/SKILL.md) | Patrón de juicio: system prompt, validación JSON, cálculo de score |
| [batch-orchestrator](.agents/skills/batch-orchestrator/SKILL.md) | Patrón de batch: `after()`, `Promise.allSettled`, tolerancia a fallos |

## Estructura del proyecto

```
app/
  api/eval/
    single/route.ts     ← thin wrapper: valida + delega a lib/eval
    judge/route.ts
    batch/route.ts
  dashboard/
    page.tsx            ← home con panel de nueva evaluación y listado de runs
    runs/[id]/
      page.tsx          ← detalle del run (force-dynamic + polling)
      metrics/page.tsx  ← métricas agregadas calculadas server-side
lib/
  eval/
    single-evaluator.ts ← lógica del evaluador (interpolación + Anthropic + DB)
    llm-judge.ts        ← lógica del juez (Anthropic + validación JSON + DB)
  supabase/
    server.ts           ← cliente con cookies (request context)
    service.ts          ← cliente con service role (after() callbacks)
types/
  database.ts           ← tipos generados por Supabase CLI
supabase/
  migrations/           ← schema + seeds
.agents/skills/         ← documentación de skills para agentes
.knowledge/             ← arquitectura y convenciones del proyecto
```
