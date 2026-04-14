# AGENT_TASKS.md — P09 Evaluation Lab

## Contexto

Framework para testear y comparar variantes de prompts contra casos de prueba
orientados a SoporteML. Cada test case representa una interacción real:
pregunta de comprador + contexto del vendedor → respuesta esperada.

## Skills a crear en este proyecto

- `prompt-evaluator`: corre un prompt contra un test case, retorna resultado structured
- `llm-judge`: evalúa output vs expected usando LLM como juez
- `batch-orchestrator`: coordina N prompts × M test cases en paralelo

## Patrón de ejecución

Cada tarea: feature branch → implementar → commit → PR → pr-review skill → merge

---

## TASK 01 — Schema y migraciones Supabase

**Entregable:** Schema ejecutado en Supabase con todas las tablas base.

**Tablas:**

- `test_cases`: id, title, buyer_question, seller_context, expected_response, category, created_at
- `prompt_variants`: id, name, system_prompt, version, is_active, created_at
- `eval_runs`: id, name, status (pending/running/completed/failed), created_at
- `eval_results`: id, run_id, test_case_id, prompt_variant_id, actual_response, judge_score (0-1), judge_reasoning, latency_ms, tokens_used, created_at

**Criterio de aceptación:**

- Migraciones en `/supabase/migrations/`
- Tablas visibles en Supabase dashboard
- Types TypeScript generados en `/types/database.ts`

---

## TASK 02 — Test Cases CRUD

**Entregable:** UI para gestionar test cases con seed de datos de ejemplo.

**Features:**

- Listado de test cases con filtro por categoría
- Formulario crear/editar: buyer_question, seller_context, expected_response, category
- Delete con confirmación
- Seed: mínimo 10 test cases reales de SoporteML (garantía, envío, precio, disponibilidad)

**Ruta:** `/dashboard/test-cases`

**Criterio de aceptación:**

- CRUD completo funcionando contra Supabase
- Al menos 3 categorías en el seed (garantía, envío, devoluciones)

---

## TASK 03 — Prompt Variants CRUD

**Entregable:** UI para gestionar variantes de system prompt.

**Features:**

- Listado de variantes con badge de versión
- Editor de system prompt con preview de variables disponibles
- Toggle is_active
- Seed: 3 variantes iniciales con diferente nivel de formalidad/detalle

**Variables del sistema prompt:**

- `{{buyer_question}}` — pregunta del comprador
- `{{seller_context}}` — contexto del vendedor

**Ruta:** `/dashboard/prompt-variants`

**Criterio de aceptación:**

- CRUD completo funcionando
- Preview muestra cómo quedaría el prompt con variables interpoladas

---

## TASK 04 — Single Evaluator + skill `prompt-evaluator`

**Entregable:** Endpoint que corre un prompt variant contra un test case + skill documentado.

**API:** `POST /api/eval/single`

```json
// Request
{ "prompt_variant_id": "uuid", "test_case_id": "uuid" }

// Response
{
  "actual_response": "string",
  "latency_ms": 1240,
  "tokens_used": 312,
  "model": "claude-sonnet-4-6"
}
```

**Skill:** `.agents/skills/prompt-evaluator/SKILL.md`

**Criterio de aceptación:**

- Llama a Anthropic API con el system prompt interpolado
- Guarda resultado en `eval_results`
- Manejo de errores con status estructurado

---

## TASK 05 — LLM Judge + skill `llm-judge`

**Entregable:** Endpoint que evalúa un resultado con un segundo LLM como juez + skill documentado.

**API:** `POST /api/eval/judge`

```json
// Request
{
  "eval_result_id": "uuid",
  "expected_response": "string",
  "actual_response": "string",
  "buyer_question": "string"
}

// Response
{
  "score": 0.85,
  "reasoning": "La respuesta cubre el punto principal pero omite...",
  "criteria": {
    "accuracy": 0.9,
    "completeness": 0.8,
    "tone": 0.85
  }
}
```

**Criterio del juez (system prompt del judge):**
Evaluar en 3 dimensiones: precisión (¿responde la pregunta?), completitud (¿cubre todos los puntos?), tono (¿apropiado para soporte ML?).

**Skill:** `.agents/skills/llm-judge/SKILL.md`

**Criterio de aceptación:**

- Score entre 0 y 1
- Reasoning explicando el puntaje
- Score guardado en `eval_results.judge_score`

---

## TASK 06 — Batch Runner + skill `batch-orchestrator`

**Entregable:** Endpoint que ejecuta N prompt variants × M test cases en paralelo.

**API:** `POST /api/eval/batch`

```json
// Request
{
  "run_name": "Test formalidad v2",
  "prompt_variant_ids": ["uuid1", "uuid2"],
  "test_case_ids": ["uuid1", "uuid2", "uuid3"]
}

// Response (inmediato)
{ "run_id": "uuid", "status": "running", "total_evals": 6 }
```

**Comportamiento:**

- Respuesta inmediata con `run_id`
- Ejecución async con `after()` (patrón P07/P08)
- `Promise.allSettled` para no cancelar el batch si un eval falla
- Actualiza `eval_runs.status` al completar

**Skill:** `.agents/skills/batch-orchestrator/SKILL.md`

**Criterio de aceptación:**

- No bloquea el request
- Tolerante a fallos individuales
- Estado del run actualizado en tiempo real (polling cada 2s desde el cliente)

---

## TASK 07 — Dashboard de resultados

**Entregable:** UI para lanzar runs y ver resultados.

**Features:**

- Panel "Nueva evaluación": seleccionar variantes + test cases + nombre del run
- Listado de runs con status badge (pending/running/completed/failed)
- Vista de run: tabla con todos los resultados, score del judge, latencia
- Comparación side-by-side de 2 prompt variants para el mismo test case

**Ruta:** `/dashboard` (home) + `/dashboard/runs/[id]`

**Criterio de aceptación:**

- Polling automático mientras el run está en estado `running`
- Score promedio visible por variante
- Comparación muestra ambas respuestas + score + reasoning del judge

---

## TASK 08 — Métricas agregadas

**Entregable:** Sección de métricas por run con insights comparativos.

**Métricas a mostrar:**

- Score promedio por prompt variant
- Latencia promedio y p95
- Tokens usados (costo estimado en USD)
- Win rate: qué variante ganó más test cases
- Breakdown por categoría (garantía vs envío vs devoluciones)

**Ruta:** `/dashboard/runs/[id]/metrics`

**Criterio de aceptación:**

- Gráfico de barras comparando scores por variante
- Tabla de breakdown por categoría
- Costo estimado calculado con pricing actual de Claude 4.6 Sonnet

---

## TASK 09 — PR Review final + documentación

**Entregable:** Review completo del proyecto + knowledge base actualizada.

**Checklist:**

- [ ] Correr `pr-review` skill sobre el repo completo
- [ ] Resolver todos los findings
- [ ] Actualizar `.knowledge/architecture.md` con diagrama del flujo de evaluación
- [ ] Documentar los 3 skills creados con ejemplos de uso
- [ ] `README.md` con instrucciones de setup y uso
- [ ] Commit final con tag `v1.0.0`
