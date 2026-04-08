# AGENT_TASKS.md — P07 AI Code Reviewer

## Estado general

- Fase actual: 1 — Setup
- Última task completada: T01
- Próxima task: T02

## Contexto del proyecto

Bot de GitHub que analiza PRs con subagents paralelos y comenta resultados automáticamente.
Trigger: GitHub Webhook en eventos de PR (opened, synchronize).
Orquestación: Codex CLI lanza 3 subagents en paralelo — security-audit, test-coverage, conventions.
Output: comentario consolidado en el PR via MCP GitHub.

Stack: Next.js 16 · TypeScript · Tailwind · shadcn/ui · Anthropic API · Codex CLI · MCP GitHub
Sin Supabase — no hay persistencia en este proyecto.

---

## FASE 1 — Webhook + scaffold

### T01 — Limpieza de P06

- Eliminar `/mcp-server` (directorio completo)
- Eliminar rutas específicas de P06: `app/dashboard/*`, `app/api/analyze-error`
- Limpiar `package.json`: quitar dependencias de express, @modelcontextprotocol/sdk
- Actualizar `.env.local.example` con vars de P07 (sin N8N_API_KEY, sin MCP_SERVER_URL)
- Status: [x] completo

### T02 — Webhook handler

- Crear `app/api/webhook/route.ts`
- Validar firma HMAC con `GITHUB_WEBHOOK_SECRET`
- Filtrar solo eventos `pull_request` con action `opened` o `synchronize`
- Extraer: repo owner, repo name, PR number, head SHA
- Responder 200 inmediatamente (el análisis corre async)
- Status: [ ] pendiente

### T03 — GitHub client

- Crear `lib/github.ts`
- Funciones: `getPRDiff(owner, repo, prNumber)` y `postComment(owner, repo, prNumber, body)`
- Auth: `GITHUB_TOKEN` via Authorization header
- Status: [ ] pendiente

---

## FASE 2 — Subagents

### T04 — Orchestrator

- Crear `lib/orchestrator.ts`
- Recibe el diff del PR
- Lanza los 3 subagents en paralelo via `Promise.all`
- Consolida resultados en un único string markdown
- Status: [ ] pendiente

### T05 — Subagent: security-audit

- Crear `lib/agents/security-audit.ts`
- System prompt: rol de security reviewer — detecta inyecciones, secrets hardcodeados, inputs sin sanitizar, deps vulnerables
- Input: diff completo del PR
- Output: lista de issues con severidad (critical / warning / info) o "✅ Sin issues"
- Status: [ ] pendiente

### T06 — Subagent: test-coverage

- Crear `lib/agents/test-coverage.ts`
- System prompt: rol de QA reviewer — evalúa si los cambios tienen tests, detecta casos edge no cubiertos
- Input: diff completo del PR
- Output: evaluación de cobertura + casos sugeridos o "✅ Cobertura adecuada"
- Status: [ ] pendiente

### T07 — Subagent: conventions

- Crear `lib/agents/conventions.ts`
- System prompt: rol de code reviewer — verifica naming, estructura de archivos, imports, patrones del proyecto
- Input: diff completo del PR
- Output: lista de desviaciones o "✅ Convenciones respetadas"
- Status: [ ] pendiente

---

## FASE 3 — Integración end-to-end

### T08 — Conectar webhook → orchestrator → comentario

- En el webhook handler, llamar `getPRDiff` → `orchestrator` → `postComment`
- Formato del comentario: secciones separadas por subagent con emojis de estado
- Agregar header fijo: `## 🤖 AI Code Review`
- Status: [ ] pendiente

### T09 — Dashboard mínimo (opcional)

- `app/dashboard/page.tsx` — lista los últimos PRs analizados (en memoria / array estático)
- Solo si queda tiempo — no es el entregable principal
- Status: [ ] pendiente

---

## FASE 4 — Skills + cierre

### T10 — Skill: security-audit

- Crear `.agents/skills/security-audit/SKILL.md`
- Documentar el system prompt, input/output esperado, y cómo invocarlo
- Status: [ ] pendiente

### T11 — Skill: test-coverage

- Crear `.agents/skills/test-coverage/SKILL.md`
- Status: [ ] pendiente

### T12 — Skill: conventions

- Crear `.agents/skills/conventions/SKILL.md`
- Status: [ ] pendiente

### T13 — PR Review

- Invocar `@.agents/skills/pr-review/SKILL.md`
- Resolver todos los issues bloqueantes antes de cerrar
- Status: [ ] pendiente

### T14 — Commit final y cierre

- Conventional commit por fase
- Actualizar curriculum map (P07 → completo)
- Status: [ ] pendiente

---

## Decisiones de arquitectura

- Los subagents son funciones async simples (no procesos separados) — Codex CLI los orquesta via Promise.all
- El webhook responde 200 antes de que termine el análisis para evitar timeout de GitHub (10s límite)
- El diff completo se pasa a cada subagent — no se fragmenta (PRs grandes pueden requerir truncado en iteraciones futuras)
- Sin base de datos — el historial de análisis no persiste en esta versión
- GITHUB_TOKEN necesita permisos: `repo` (read) + `pull_requests` (write)

---

## Deuda documentada desde P06

- SSE parsing duplicado identificado en P06 — candidato a `lib/mcp-client.ts` si se usa MCP en fases futuras
