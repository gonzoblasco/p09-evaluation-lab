---
name: prompt-evaluator
description: Usá este skill cuando necesites evaluar un prompt variant contra un test case específico. Documentación del patrón de evaluación single de P09.
---

# Prompt Evaluator

Corre un `prompt_variant` contra un `test_case` y guarda el resultado en `eval_results`.

## Endpoint

```
POST /api/eval/single
```

## Request

```json
{
  "prompt_variant_id": "uuid",
  "test_case_id": "uuid",
  "run_id": "uuid"  // opcional — si se omite, se crea un eval_run standalone
}
```

## Response (200)

```json
{
  "actual_response": "string",
  "latency_ms": 1240,
  "tokens_used": 312,
  "model": "claude-sonnet-4-6",
  "eval_result_id": "uuid"
}
```

## Errores posibles

| Status | Mensaje |
|--------|---------|
| 400 | `prompt_variant_id is required.` |
| 400 | `test_case_id is required.` |
| 400 | `prompt_variant_id not found.` |
| 400 | `test_case_id not found.` |
| 502 | Error de Anthropic API (mensaje del SDK) |

## Patrón de implementación

```
request
  → validar IDs presentes y tipo string
  → buscar variant + test_case en paralelo (Promise.allSettled)
  → retornar 400 si alguno no existe
  → interpolar {{buyer_question}} y {{seller_context}} en system_prompt
  → llamar Anthropic con system = prompt interpolado, user = buyer_question
  → medir latency_ms con Date.now() antes y después
  → resolver run_id:
      · si se proveyó run_id en el request → usarlo (modo batch)
      · si no → crear eval_run { name: 'standalone', status: 'completed' }
  → insertar en eval_results con el run_id resuelto
  → retornar { actual_response, latency_ms, tokens_used, model, eval_result_id }
```

## Variables del system prompt

| Variable | Fuente |
|----------|--------|
| `{{buyer_question}}` | `test_cases.buyer_question` |
| `{{seller_context}}` | `test_cases.seller_context` |

## Notas de implementación

- Modelo fijo: `claude-sonnet-4-6` (constante `MODEL` en el route)
- `max_tokens`: 1024 — suficiente para respuestas de soporte
- Los evals standalone usan `run_id = '00000000-0000-0000-0000-000000000000'` (UUID placeholder)
- Si el insert en `eval_results` falla, el endpoint igual retorna 200 con el resultado (no falla la evaluación por un error de persistencia)
- `tokens_used = input_tokens + output_tokens` (total de la llamada)

## Uso desde el batch orchestrator

El batch orchestrator (TASK 06) llama a este mismo endpoint para cada combinación `(prompt_variant_id, test_case_id)` de un run, pasando el `run_id` real en vez del placeholder.

## Ejemplo de uso manual

```bash
curl -X POST http://localhost:3000/api/eval/single \
  -H "Content-Type: application/json" \
  -d '{
    "prompt_variant_id": "uuid-de-la-variante",
    "test_case_id": "uuid-del-test-case"
  }'
```
