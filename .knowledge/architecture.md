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
