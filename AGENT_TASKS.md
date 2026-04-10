# AGENT_TASKS.md — P08 Content Pipeline

## Estado general

- Fase actual: 1 — Setup
- Última task completada: —
- Próxima task: T01

## Contexto del proyecto

Pipeline multi-agente secuencial: idea → research → draft → edit → SEO check → publish.
Cada agente recibe el output del anterior como input estructurado (handoff explícito).
UI: dashboard Next.js para triggear el pipeline y ver el progreso por etapa.
Output final: archivo markdown listo para publicar.

Stack: Next.js 16 · TypeScript · Tailwind · shadcn/ui · Anthropic API
Sin Supabase · Sin webhooks · Sin MCP externo

## Workflow de branches y PRs

Cada task se implementa en su propio branch:
git checkout -b task/T01-nombre
Commit + push + PR a main.
Correr pr-review skill antes de mergear.
Mergear solo cuando pr-review aprueba.

---

## FASE 1 — Scaffold + limpieza

### T01 — Limpieza de P07

- Eliminar `app/api/webhook/`
- Eliminar `lib/github.ts`, `lib/orchestrator.ts`, `lib/agents/`
- Limpiar `package.json`: quitar dependencias no usadas de P07
- Actualizar `.env.local.example` con solo `ANTHROPIC_API_KEY`
- Actualizar `CLAUDE.md` y `README.md` con contexto de P08
- Branch: `task/T01-scaffold`
- Status: [ ] pendiente

---

## FASE 2 — Core del pipeline

### T02 — Tipos y contratos de handoff

- Crear `lib/pipeline/types.ts`
- Definir `PipelineStage`, `StageInput`, `StageOutput`, `PipelineRun`
- Cada stage tiene: `name`, `input`, `output`, `status`, `error?`
- Branch: `task/T02-types`
- Status: [ ] pendiente

### T03 — Agentes del pipeline (6 agentes)

- Crear un archivo por agente en `lib/pipeline/agents/`:
  - `idea.ts` — expande el tema en ángulos y enfoque
  - `research.ts` — genera contexto y datos relevantes
  - `draft.ts` — redacta el contenido completo
  - `edit.ts` — mejora claridad, estructura y tono
  - `seo.ts` — evalúa y optimiza para búsqueda
  - `publish.ts` — genera artefacto final en markdown
- Cada agente: función async, recibe `StageInput`, retorna `StageOutput`
- Branch: `task/T03-agents`
- Status: [ ] pendiente

### T04 — Orquestador secuencial

- Crear `lib/pipeline/orchestrator.ts`
- Ejecuta los 6 agentes en secuencia, pasando output → input
- Emite eventos de progreso por stage (para SSE al frontend)
- Maneja errores por stage sin abortar el pipeline completo
- Branch: `task/T04-orchestrator`
- Status: [ ] pendiente

### T05 — API route del pipeline

- Crear `app/api/pipeline/route.ts`
- POST: recibe `{ topic: string }`, lanza el pipeline, retorna SSE con progreso
- GET: no aplica
- Branch: `task/T05-api`
- Status: [ ] pendiente

---

## FASE 3 — UI

### T06 — Dashboard principal

- `app/dashboard/page.tsx` — formulario de input + botón "Run pipeline"
- `app/dashboard/pipeline/[runId]/page.tsx` — vista de progreso por stage
- Componentes: `StageCard`, `PipelineProgress`, `OutputViewer`
- Streaming del progreso via SSE (mismo patrón de P03)
- Branch: `task/T06-ui`
- Status: [ ] pendiente

### T07 — Output viewer

- Mostrar el markdown final con preview renderizado
- Botón de descarga del archivo `.md`
- Branch: `task/T07-output`
- Status: [ ] pendiente

---

## FASE 4 — Skills + cierre

### T08 — Skill: content-pipeline

- Crear `.agents/skills/content-pipeline/SKILL.md`
- Documentar el patrón de pipeline secuencial con handoffs
- Branch: `task/T08-skill-pipeline`
- Status: [ ] pendiente

### T09 — Skill: seo-agent

- Crear `.agents/skills/seo-agent/SKILL.md`
- Branch: `task/T09-skill-seo`
- Status: [ ] pendiente

### T10 — PR Review final

- Invocar `@.agents/skills/pr-review/SKILL.md` sobre el estado completo del repo
- Resolver todos los issues bloqueantes antes de cerrar
- Branch: `task/T10-pr-review`
- Status: [ ] pendiente

### T11 — Commit de cierre

- Marcar todas las tasks como [x]
- Agregar sección de Cierre con fecha, estado, deuda documentada
- Branch: `task/T11-close`
- Status: [ ] pendiente

---

## Decisiones de arquitectura

- Pipeline secuencial (no paralelo) — el output de cada stage alimenta el siguiente
- SSE para streaming del progreso al frontend — mismo patrón que P03
- Sin persistencia en DB — los runs se guardan como archivos markdown en /output
- Errores por stage: el pipeline continúa con el output parcial disponible

## Deuda documentada desde P07

- Validación de env vars en startup — pendiente para P09
- User-Agent en clientes HTTP — pendiente para P09
