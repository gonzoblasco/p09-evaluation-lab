import Anthropic from '@anthropic-ai/sdk'
import { createServiceClient } from '@/lib/supabase/service'

const MODEL = 'claude-sonnet-4-6'

function getAnthropicClient(): Anthropic {
  if (!process.env.ANTHROPIC_API_KEY) throw new Error('ANTHROPIC_API_KEY is not set.')
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
}

function interpolate(template: string, vars: Record<string, string>): string {
  return template
    .replace(/\{\{buyer_question\}\}/g, vars.buyer_question ?? '')
    .replace(/\{\{seller_context\}\}/g, vars.seller_context ?? '')
}

export interface SingleEvalInput {
  prompt_variant_id: string
  test_case_id: string
  run_id: string
}

export interface SingleEvalOutput {
  actual_response: string
  latency_ms: number
  tokens_used: number
  model: string
  eval_result_id: string | null
}

/**
 * Runs a single evaluation: fetches variant + test case, calls Anthropic,
 * inserts result in eval_results.
 *
 * Throws 'NOT_FOUND:prompt_variant_id' or 'NOT_FOUND:test_case_id' if IDs
 * don't exist so the caller can map to 400.
 * Throws on Anthropic errors so the caller can map to 502.
 */
export async function runSingleEval(input: SingleEvalInput): Promise<SingleEvalOutput> {
  const { prompt_variant_id, test_case_id, run_id } = input
  const supabase = createServiceClient()

  const [variantResult, testCaseResult] = await Promise.allSettled([
    supabase.from('prompt_variants').select('*').eq('id', prompt_variant_id).single(),
    supabase.from('test_cases').select('*').eq('id', test_case_id).single(),
  ])

  if (variantResult.status === 'rejected' || variantResult.value.error || !variantResult.value.data) {
    throw new Error('NOT_FOUND:prompt_variant_id')
  }
  if (testCaseResult.status === 'rejected' || testCaseResult.value.error || !testCaseResult.value.data) {
    throw new Error('NOT_FOUND:test_case_id')
  }

  const variant = variantResult.value.data
  const testCase = testCaseResult.value.data

  const systemPrompt = interpolate(variant.system_prompt, {
    buyer_question: testCase.buyer_question,
    seller_context: testCase.seller_context,
  })

  const anthropic = getAnthropicClient()
  const startMs = Date.now()

  const message = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 1024,
    system: systemPrompt,
    messages: [{ role: 'user', content: testCase.buyer_question }],
  })

  const latency_ms = Date.now() - startMs
  const actual_response = message.content[0]?.type === 'text' ? message.content[0].text : ''
  const tokens_used = (message.usage?.input_tokens ?? 0) + (message.usage?.output_tokens ?? 0)

  const { data: evalResult, error: insertError } = await supabase
    .from('eval_results')
    .insert({ run_id, test_case_id, prompt_variant_id, actual_response, latency_ms, tokens_used })
    .select('id')
    .single()

  return {
    actual_response,
    latency_ms,
    tokens_used,
    model: MODEL,
    eval_result_id: insertError ? null : (evalResult?.id ?? null),
  }
}
