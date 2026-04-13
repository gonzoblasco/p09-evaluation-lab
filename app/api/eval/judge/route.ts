import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'

const MODEL = 'claude-sonnet-4-6'
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function getAnthropicClient(): Anthropic {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY is not set.')
  }
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

interface JudgeOutput {
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

function validateJudgeOutput(raw: unknown): JudgeOutput {
  if (!raw || typeof raw !== 'object') throw new Error('Not an object')
  const obj = raw as Record<string, unknown>

  const { score, reasoning, criteria } = obj
  if (typeof score !== 'number') throw new Error('score must be a number')
  if (typeof reasoning !== 'string') throw new Error('reasoning must be a string')
  if (!criteria || typeof criteria !== 'object') throw new Error('criteria must be an object')

  const c = criteria as Record<string, unknown>
  if (typeof c.accuracy !== 'number') throw new Error('criteria.accuracy must be a number')
  if (typeof c.completeness !== 'number') throw new Error('criteria.completeness must be a number')
  if (typeof c.tone !== 'number') throw new Error('criteria.tone must be a number')

  return {
    score: clamp(score),
    reasoning,
    criteria: {
      accuracy: clamp(c.accuracy),
      completeness: clamp(c.completeness),
      tone: clamp(c.tone),
    },
  }
}

export async function POST(req: NextRequest) {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 })
  }

  const { eval_result_id, expected_response, actual_response, buyer_question } =
    body as Record<string, unknown>

  if (!eval_result_id || typeof eval_result_id !== 'string' || !UUID_RE.test(eval_result_id)) {
    return NextResponse.json({ error: 'eval_result_id must be a valid UUID.' }, { status: 400 })
  }
  if (!expected_response || typeof expected_response !== 'string') {
    return NextResponse.json({ error: 'expected_response is required.' }, { status: 400 })
  }
  if (!actual_response || typeof actual_response !== 'string') {
    return NextResponse.json({ error: 'actual_response is required.' }, { status: 400 })
  }
  if (!buyer_question || typeof buyer_question !== 'string') {
    return NextResponse.json({ error: 'buyer_question is required.' }, { status: 400 })
  }

  let anthropic: Anthropic
  try {
    anthropic = getAnthropicClient()
  } catch (err) {
    const detail = err instanceof Error ? err.message : 'Anthropic client init error.'
    return NextResponse.json({ error: detail }, { status: 500 })
  }

  const userMessage = `## Pregunta del comprador
${buyer_question}

## Respuesta esperada (referencia)
${expected_response}

## Respuesta a evaluar
${actual_response}`

  let rawText: string
  try {
    const message = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 512,
      system: JUDGE_SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userMessage }],
    })
    rawText = message.content[0]?.type === 'text' ? message.content[0].text : ''
  } catch (err) {
    const detail = err instanceof Error ? err.message : 'Anthropic API error.'
    return NextResponse.json({ error: detail }, { status: 502 })
  }

  let judgeOutput: JudgeOutput
  try {
    const parsed = JSON.parse(rawText.trim())
    judgeOutput = validateJudgeOutput(parsed)
  } catch (err) {
    const detail = err instanceof Error ? err.message : 'Parse error'
    return NextResponse.json(
      { error: `Judge returned invalid JSON: ${detail}`, raw_response: rawText },
      { status: 502 }
    )
  }

  // Recalculate score as average of criteria to avoid model drift
  const recalcScore = clamp(
    (judgeOutput.criteria.accuracy + judgeOutput.criteria.completeness + judgeOutput.criteria.tone) / 3
  )
  judgeOutput.score = parseFloat(recalcScore.toFixed(3))

  const supabase = await createClient()
  const { error: updateError } = await supabase
    .from('eval_results')
    .update({
      judge_score: judgeOutput.score,
      judge_reasoning: judgeOutput.reasoning,
    })
    .eq('id', eval_result_id)

  if (updateError) {
    return NextResponse.json(
      {
        ...judgeOutput,
        _warning: `Score not persisted: ${updateError.message}`,
      },
      { status: 200 }
    )
  }

  return NextResponse.json(judgeOutput)
}
