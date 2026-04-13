---
name: batch-orchestrator
description: Usá este skill cuando necesites lanzar una evaluación batch de N variantes × M test cases. Documenta el patrón de orquestación de P09.
---

# Batch Orchestrator

Lanza una corrida de evaluación que corre N prompt variants × M test cases en paralelo, mide scores y persiste los resultados.

## Endpoint

```
POST /api/eval/batch
```

## Request

```json
{
  "run_name": "Test formalidad v2",
  "prompt_variant_ids": ["uuid1", "uuid2"],
  "test_case_ids": ["uuid1", "uuid2", "uuid3"]
}
```

## Response (200 — inmediato)

```json
{
  "run_id": "uuid",
  "status": "running",
  "total_evals": 6
}
```

La respuesta es **inmediata** — el batch corre en background vía `after()`.

## Validaciones

| Campo | Regla |
|-------|-------|
| `run_name` | string no vacío, requerido |
| `prompt_variant_ids` | array de strings, 1–10 elementos |
| `test_case_ids` | array de strings, 1–10 elementos |

## Errores posibles

| Status | Mensaje |
|--------|---------|
| 400 | `run_name is required.` |
| 400 | `prompt_variant_ids must be a non-empty array.` |
| 400 | `prompt_variant_ids cannot exceed 10 items.` |
| 400 | `test_case_ids must be a non-empty array.` |
| 400 | `test_case_ids cannot exceed 10 items.` |
| 500 | `Failed to create eval run: <detail>` |

## Patrón de implementación

```
POST /api/eval/batch
  → validar run_name, arrays (1-10 items, strings)
  → INSERT eval_runs { name, status: 'pending' } → run_id
  → after(() => runBatch(run_id, variantIds, testCaseIds))
  → return { run_id, status: 'running', total_evals: N×M }  ← inmediato

runBatch() [corre en after(), fuera del request context]:
  → UPDATE eval_runs SET status='running'
  → SELECT test_cases WHERE id IN testCaseIds   ← para expected_response
  → Promise.allSettled(todos los pares variant × testCase):
      por cada par:
        → runSingleEval({ prompt_variant_id, test_case_id, run_id })
        → si eval_result_id existe:
            → runJudge({ eval_result_id, expected_response, actual_response, buyer_question })
  → si todos fallaron → status='failed', si alguno ok → status='completed'
  → UPDATE eval_runs SET status=finalStatus
```

## Tolerancia a fallos

- `Promise.allSettled` garantiza que un par fallido no cancela el batch
- Si **todos** los pares fallan → `eval_run.status = 'failed'`
- Si **al menos uno** tuvo éxito → `eval_run.status = 'completed'`
- Los pares fallidos no generan `eval_result` — el dashboard los ve como ausentes

## Flujo de datos por par

```
(prompt_variant_id, test_case_id)
  → runSingleEval()
      - interpola system_prompt con buyer_question + seller_context
      - llama claude-sonnet-4-6 (max_tokens: 1024)
      - INSERT eval_results → eval_result_id, actual_response
  → runJudge()
      - evalúa actual_response vs expected_response
      - 3 dimensiones: accuracy, completeness, tone
      - score = promedio recalculado server-side
      - UPDATE eval_results SET judge_score, judge_reasoning
```

## Notas de implementación

- `after()` importado de `next/server` — no void, no background fetch
- `createServiceClient()` para DB en el batch — el servicio role client no depende de cookies y funciona fuera del request context
- Los test cases se buscan **una sola vez** al inicio del batch (no por cada par)
- Máximo 10 variantes × 10 test cases = 100 llamadas concurrentes a Anthropic

## Polling del estado

El cliente hace polling via `router.refresh()` en el dashboard (Next.js RSC), no via un endpoint dedicado.
La página `/dashboard/runs/[id]` tiene `dynamic = 'force-dynamic'` y el componente `RunDetail` llama a
`router.refresh()` cada 2 segundos mientras `status === 'running' || 'pending'`.

Estados del ciclo de vida: `pending` → `running` → `completed` | `failed`

## Ejemplo de uso manual

```bash
curl -X POST http://localhost:3000/api/eval/batch \
  -H "Content-Type: application/json" \
  -d '{
    "run_name": "Test formalidad v1",
    "prompt_variant_ids": ["uuid-variante-informal", "uuid-variante-formal"],
    "test_case_ids": ["uuid-caso-garantia", "uuid-caso-envio", "uuid-caso-devolucion"]
  }'
```
