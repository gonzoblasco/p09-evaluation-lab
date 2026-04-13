---
name: llm-judge
description: Usá este skill cuando necesites evaluar la calidad de una respuesta de soporte usando un LLM como juez. Documenta el patrón de evaluación de P09.
---

# LLM Judge

Evalúa una respuesta de soporte comparándola con la respuesta esperada en 3 dimensiones usando Claude como juez.

## Endpoint

```
POST /api/eval/judge
```

## Request

```json
{
  "eval_result_id": "uuid",
  "expected_response": "La respuesta ideal al caso",
  "actual_response": "La respuesta generada por el prompt variant",
  "buyer_question": "¿Cuánto tiempo tiene de garantía?"
}
```

## Response (200)

```json
{
  "score": 0.867,
  "reasoning": "La respuesta cubre el punto principal de garantía pero omite mencionar el proceso de reclamo. El tono es adecuado y empático.",
  "criteria": {
    "accuracy": 0.9,
    "completeness": 0.8,
    "tone": 0.9
  }
}
```

## Criterios de evaluación

| Dimensión | Descripción |
|-----------|-------------|
| `accuracy` | ¿La respuesta responde correctamente la pregunta? ¿La información es correcta? |
| `completeness` | ¿Cubre todos los puntos importantes de la respuesta esperada? |
| `tone` | ¿El tono es empático, profesional y resolutivo para soporte ML? |

- Escala: 0.0 (completamente incorrecto) → 1.0 (perfecto)
- `score` = promedio de las 3 dimensiones (recalculado server-side para evitar drift del modelo)

## Errores posibles

| Status | Mensaje |
|--------|---------|
| 400 | `eval_result_id must be a valid UUID.` |
| 400 | `expected_response is required.` |
| 400 | `actual_response is required.` |
| 400 | `buyer_question is required.` |
| 500 | `ANTHROPIC_API_KEY is not set.` |
| 502 | `Judge returned invalid JSON: <detail>` + `raw_response` para debug |
| 502 | Error de Anthropic API |

## Patrón de implementación

```
request
  → validar eval_result_id (UUID), expected_response, actual_response, buyer_question
  → getAnthropicClient() — lazy init, falla con 500 si no hay API key
  → construir user message con las 3 partes (pregunta, esperada, actual)
  → llamar Anthropic con JUDGE_SYSTEM_PROMPT + user message
  → parsear JSON de la respuesta con try/catch
  → si parse falla → 502 con raw_response para debugging
  → validateJudgeOutput() — valida tipos y clampea 0-1
  → recalcular score como promedio de criteria (server-side)
  → UPDATE eval_results SET judge_score, judge_reasoning WHERE id = eval_result_id
  → si 0 filas actualizadas → throw 'NOT_FOUND:eval_result_id' → 400
  → si error de DB → throw 'DB_ERROR:<msg>' → 502
  → retornar { score, reasoning, criteria }
```

## System prompt del juez

El juez recibe:
1. La **pregunta del comprador** — para entender qué se preguntó
2. La **respuesta esperada** — como referencia de calidad
3. La **respuesta a evaluar** — lo que generó el prompt variant

El system prompt instruye al modelo a devolver **únicamente JSON** sin markdown ni texto adicional.

## Notas de implementación

- Modelo: `claude-sonnet-4-6` — misma versión que el evaluador para consistencia
- `max_tokens: 512` — suficiente para el JSON de evaluación
- `score` es recalculado server-side como `(accuracy + completeness + tone) / 3` — no se confía en el score del modelo para evitar inconsistencias
- Los criterios son clampados a `[0, 1]` por `validateJudgeOutput()`
- Si el UPDATE afecta 0 filas (ID no existe) → lanza `NOT_FOUND:eval_result_id` → route mapea a 400
- Si hay error de DB → lanza `DB_ERROR:<msg>` → route mapea a 502

## Uso desde el batch orchestrator

El batch orchestrator (TASK 06) llama a `runJudge()` directamente (no via HTTP) después de cada `runSingleEval()` para puntuar automáticamente cada resultado.

```
batch run
  → /api/eval/single → { eval_result_id, actual_response }
  → /api/eval/judge  → { score, reasoning, criteria }
```

## Ejemplo de uso manual

```bash
curl -X POST http://localhost:3000/api/eval/judge \
  -H "Content-Type: application/json" \
  -d '{
    "eval_result_id": "uuid-del-resultado",
    "expected_response": "Hola! El producto tiene 12 meses de garantía...",
    "actual_response": "La garantía es de un año desde la compra.",
    "buyer_question": "¿Cuánto tiempo tiene de garantía?"
  }'
```
