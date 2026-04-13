import Anthropic from '@anthropic-ai/sdk'
import { createServiceClient } from '@/lib/supabase/service'

const MODEL = 'claude-sonnet-4-6'

function getAnthropicClient(): Anthropic {
  if (!process.env.ANTHROPIC_API_KEY) throw new Error('ANTHROPIC_API_KEY is not set.')
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
}

const JUDGE_SYSTEM_PROMPT = `Sos un evaluador experto de respuestas de soporte al cliente para Mercado Libre Argentina.

Tu tarea es evaluar una respuesta de soporte comparándola con la respuesta esperada en tres dimensiones:

1. **accuracy** (precisión): ¿La respuesta responde correctamente la pregunta del comprador? ¿La información es correcta?
2. **completeness** (completitud): ¿La respuesta cubre todos los puntos importantes de la respuesta esperada?
3. **tone** (tono): ¿El tono es apropiado para soporte de Mercado Libre? (empático, profesional, resolutivo)

Cada dimensión se puntúa de 0 a 1 (floats con hasta 2 decimales).
- 0.0: completamente incorrecto/ausente
- 0.5: parcialmente correcto
- 1.0: perfecto

Respondé ÚNICAMENTE con JSON válido, sin texto adicional, sin markdown, sin backticks:

{
  "score": <promedio de las 3 dimensiones, float 0-1>,
  "reasoning": "<explicación concisa en español de máximo 3 oraciones>",
  "criteria": {
    "accuracy": <float 0-1>,
    "completeness": <float 0-1>,
    "tone": <float 0-1>
  }
}`

export interface JudgeInput {
  eval_result_id: string
  expected_response: string
  actual_response: string
  buyer_question: string
}

export interface JudgeOutput {
  score: number
  reasoning: string
  criteria: {
    accuracy: number
    completeness: number
    tone: number
  }
}

function clamp(n: number): number {
  return Math.min(1, Math.max(0, n))
}

function validateAndNormalize(raw: unknown): JudgeOutput {
  if (!raw || typeof raw !== 'object') throw new Error('Not an object')
  const obj = raw as Record<string, unknown>
  const { reasoning, criteria } = obj

  if (typeof reasoning !== 'string') throw new Error('reasoning must be a string')
  if (!criteria || typeof criteria !== 'object') throw new Error('criteria must be an object')
  const c = criteria as Record<string, unknown>
  if (typeof c.accuracy !== 'number') throw new Error('criteria.accuracy must be a number')
  if (typeof c.completeness !== 'number') throw new Error('criteria.completeness must be a number')
  if (typeof c.tone !== 'number') throw new Error('criteria.tone must be a number')

  const accuracy = clamp(c.accuracy)
  const completeness = clamp(c.completeness)
  const tone = clamp(c.tone)
  const score = parseFloat(((accuracy + completeness + tone) / 3).toFixed(3))

  return { score, reasoning, criteria: { accuracy, completeness, tone } }
}

/**
 * Evaluates an actual_response against expected_response using Claude as judge.
 * Updates eval_results.judge_score and judge_reasoning on success.
 *
 * Throws 'PARSE_ERROR:<detail>\n<raw>' if the model returns invalid JSON.
 * Throws 'NOT_FOUND:eval_result_id' if the UPDATE affects 0 rows.
 * Throws on Anthropic errors.
 */
export async function runJudge(input: JudgeInput): Promise<JudgeOutput> {
  const { eval_result_id, expected_response, actual_response, buyer_question } = input

  const anthropic = getAnthropicClient()

  const userMessage = `## Pregunta del comprador\n${buyer_question}\n\n## Respuesta esperada (referencia)\n${expected_response}\n\n## Respuesta a evaluar\n${actual_response}`

  const message = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 512,
    system: JUDGE_SYSTEM_PROMPT,
    messages: [{ role: 'user', content: userMessage }],
  })

  const rawText = message.content[0]?.type === 'text' ? message.content[0].text : ''

  let judgeOutput: JudgeOutput
  try {
    judgeOutput = validateAndNormalize(JSON.parse(rawText.trim()))
  } catch (err) {
    const detail = err instanceof Error ? err.message : 'parse error'
    throw new Error(`PARSE_ERROR:${detail}\n${rawText}`)
  }

  const supabase = createServiceClient()
  const { data: updated, error: updateError } = await supabase
    .from('eval_results')
    .update({ judge_score: judgeOutput.score, judge_reasoning: judgeOutput.reasoning })
    .eq('id', eval_result_id)
    .select('id')

  if (updateError) throw new Error(`DB_ERROR:${updateError.message}`)
  if (!updated || updated.length === 0) throw new Error('NOT_FOUND:eval_result_id')

  return judgeOutput
}
