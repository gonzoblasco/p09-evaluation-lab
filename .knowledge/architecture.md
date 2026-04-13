# Architecture

## Stack

- Next.js 16 App Router + TypeScript
- Supabase (Auth, Postgres, RLS)
- Tailwind + shadcn/ui
- Server Actions para mutations

## Estructura

- /app/(auth)/ — rutas públicas
- /app/(dashboard)/ — rutas protegidas
- /lib/supabase/ — cliente server y browser
- /lib/actions/ — mutations

## Notas de versión

- Next.js 16: el archivo de middleware se llama `proxy.ts` (no `middleware.ts`)
- Next.js 16: la función exportada debe llamarse `proxy` (no `middleware`)

## P03 — AI Writing Studio

- Streaming: /api/ai/generate con @anthropic-ai/sdk
- Auth check en API routes: createClient().auth.getUser() antes de procesar
- Model: claude-sonnet-4-6 (constante MODEL en route.ts)
- Historial de versiones: in-memory con useState, no persistido

## P04 — Semantic Dashboard

- Embeddings: OpenAI text-embedding-3-small, vector(1536)
- Tabla: support_items con columna embedding
- RPC: match_support_items (query_embedding, match_threshold, match_count)
- Similarity search: cosine distance via pgvector

## P05 — Docs Chat

- RAG pipeline: ingest → chunk → embed → store → retrieve → generate
- Tablas: documents, document_chunks (embedding vector(1536))
- Chunking: RecursiveCharacterTextSplitter, chunk_size=1000, overlap=200
- Embeddings: OpenAI text-embedding-3-small (misma key que P04)
- Generation: claude-sonnet-4-6 con contexto de chunks
- Streaming: SSE via @anthropic-ai/sdk (patrón P03)
- RPC: match_document_chunks(query_embedding, match_threshold, match_count, document_ids)
- Threshold default: 0.7 (configurable via MATCH_THRESHOLD env var)
- Source attribution: cada respuesta incluye chunks usados con similarity score
- Rutas protegidas: /app/(dashboard)/documents/ y /app/(dashboard)/chat/
- Auth check en API routes: createClient().auth.getUser() antes de procesar

## P08 — Content Pipeline

- Pipeline secuencial: 6 agentes encadenados (idea → research → draft → edit → seo → publish)
- Cada agente: función async run(input: StageInput): Promise<StageOutput>
- Handoff: el output.content de cada stage se pasa como previousOutput al siguiente
- Orquestador: itera STAGES en secuencia, captura errores por stage sin abortar el pipeline
- Persistencia: runs guardados en output/{runId}.json (output/ en .gitignore)
- Streaming: SSE via ReadableStream nativo (sin @anthropic-ai/sdk streaming)
- onProgress callback: permite emitir eventos SSE por stage al frontend
- react-markdown: requiere prop `components` explícita para estilos — sin @tailwindcss/typography
- markdownComponents: extraído a módulo compartido (components/markdown-components.tsx)
- publishContent: capturar en evento SSE de stage 'publish', no en evento 'done'

## P09 — Evaluation Lab

### Flujo completo de evaluación

```
Usuario (dashboard)
  └─ selecciona variants + test cases + run_name
       │
       ▼
POST /api/eval/batch
  └─ INSERT eval_runs { status: 'pending' }
  └─ after(() => runBatch())          ← respuesta inmediata al cliente
       │
       ▼
runBatch() [fuera del request context]
  └─ UPDATE eval_runs { status: 'running' }
  └─ SELECT test_cases WHERE id IN [...]
  └─ Promise.allSettled(N×M pares):
       │
       ├─ por cada par (prompt_variant_id, test_case_id):
       │    │
       │    ▼
       │  runSingleEval()                    [lib/eval/single-evaluator.ts]
       │    ├─ Promise.allSettled: fetch variant + test_case
       │    ├─ interpola {{buyer_question}} y {{seller_context}} en system_prompt
       │    ├─ POST Anthropic API (claude-sonnet-4-6, max_tokens: 1024)
       │    ├─ mide latency_ms = Date.now() diff
       │    ├─ INSERT eval_results { actual_response, latency_ms, tokens_used }
       │    └─ retorna { eval_result_id, actual_response, ... }
       │         │
       │         ▼
       │  runJudge()                          [lib/eval/llm-judge.ts]
       │    ├─ POST Anthropic API (claude-sonnet-4-6, max_tokens: 512)
       │    │    system: JUDGE_SYSTEM_PROMPT (3 dimensiones: accuracy, completeness, tone)
       │    │    user:   buyer_question + expected_response + actual_response
       │    ├─ JSON.parse + validateAndNormalize()
       │    ├─ score = (accuracy + completeness + tone) / 3  ← recalculado server-side
       │    └─ UPDATE eval_results { judge_score, judge_reasoning }
       │
       └─ si todos fallan → status='failed'
          si ≥1 ok     → status='completed'
               │
               ▼
Dashboard (cliente)
  └─ router.refresh() cada 2s mientras status='running'
  └─ RunDetail (client component) muestra tabla + skeleton rows
  └─ /metrics calcula: score prom, latencia p95, tokens, win rate, breakdown por categoría
```

### Capas del sistema

#### `app/api/eval/` — Thin wrappers HTTP

Tres rutas delgadas que solo se encargan de:
- Parsear y validar el body (`body as Record<string, unknown>`)
- Mapear errores con prefijo (`NOT_FOUND:`, `PARSE_ERROR:`, `DB_ERROR:`) a HTTP status codes
- Delegar toda la lógica a las funciones de `lib/eval/`

| Archivo | Responsabilidad |
|---------|----------------|
| `single/route.ts` | Valida IDs, resuelve o crea `eval_run`, llama `runSingleEval()` |
| `judge/route.ts` | Valida UUIDs y strings requeridos, llama `runJudge()` |
| `batch/route.ts` | Valida arrays, crea `eval_run`, dispara `runBatch()` via `after()` |

#### `lib/eval/` — Lógica de negocio

| Archivo | Responsabilidad |
|---------|----------------|
| `single-evaluator.ts` | Fetch variant+testcase, interpola prompt, llama Anthropic, persiste resultado |
| `llm-judge.ts` | Llama Anthropic con JUDGE_SYSTEM_PROMPT, valida JSON, persiste score |

Lanzan errores con prefijos tipados (`NOT_FOUND:`, `PARSE_ERROR:`, `DB_ERROR:`) para que las rutas los mapeen a HTTP codes sin lógica de negocio en el transporte.

#### `lib/supabase/` — Clientes de base de datos

| Archivo | Cuándo usar |
|---------|------------|
| `server.ts` | En Server Components y Route Handlers dentro del request context (lee cookies) |
| `service.ts` | En `after()` callbacks y lib functions donde las cookies no están disponibles (usa service role key) |

### Patrones clave

| Patrón | Implementación | Por qué |
|--------|----------------|---------|
| `after()` | `batch/route.ts:127` | Respuesta inmediata al cliente, batch corre post-response |
| `Promise.allSettled` | `batch/route.ts:46`, `single-evaluator.ts:43` | Un fallo no cancela el resto |
| Lazy init Anthropic | `getAnthropicClient()` en cada lib | Evita error en module load si no hay API key |
| Thin wrappers | Routes delegan a lib functions | Lógica testeable sin HTTP; routes solo mapean errores |
| Service client | `createServiceClient()` | No depende de cookies → funciona en `after()` y cron |
| Prefijos de error | `NOT_FOUND:`, `PARSE_ERROR:`, `DB_ERROR:` | Contrato tipado entre lib y route sin acoplamiento |
| `dynamic = 'force-dynamic'` | `runs/[id]/page.tsx` | Garantiza datos frescos en cada refresh del polling |
| Polling RSC | `router.refresh()` cada 2s | No requiere WebSocket ni endpoint de status dedicado |

### Schema de base de datos

```
test_cases
  id, title, buyer_question, seller_context, expected_response, category, created_at

prompt_variants
  id, name, system_prompt, version, is_active, created_at

eval_runs
  id, name, status (pending|running|completed|failed), created_at

eval_results
  id, run_id (FK→eval_runs), test_case_id (FK→test_cases),
  prompt_variant_id (FK→prompt_variants),
  actual_response, judge_score NUMERIC(4,3), judge_reasoning,
  latency_ms, tokens_used, created_at
```

### Métricas calculadas server-side (`/dashboard/runs/[id]/metrics`)

- **Score promedio**: `avg(judge_score)` por variante
- **Latencia p95**: `sorted[Math.floor(n * 0.95)]` de `latency_ms`
- **Costo estimado**: `(tokens_used / 1_000_000) * 9` (blended $9/MTok para claude-sonnet-4-6)
- **Win rate**: por test case, la variante con mayor score gana 1 punto (empate → 0.5 cada una)
- **Breakdown por categoría**: avg score por `test_cases.category` × variante
