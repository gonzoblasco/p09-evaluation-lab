import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'

const MODEL = 'claude-sonnet-4-6'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

function interpolate(template: string, vars: Record<string, string>): string {
  return template
    .replace(/\{\{buyer_question\}\}/g, vars.buyer_question ?? '')
    .replace(/\{\{seller_context\}\}/g, vars.seller_context ?? '')
}

export async function POST(req: NextRequest) {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 })
  }

  const { prompt_variant_id, test_case_id, run_id } = body as Record<string, unknown>

  if (!prompt_variant_id || typeof prompt_variant_id !== 'string') {
    return NextResponse.json({ error: 'prompt_variant_id is required.' }, { status: 400 })
  }
  if (!test_case_id || typeof test_case_id !== 'string') {
    return NextResponse.json({ error: 'test_case_id is required.' }, { status: 400 })
  }

  const supabase = await createClient()

  // Fetch variant and test case in parallel
  const [variantResult, testCaseResult] = await Promise.allSettled([
    supabase.from('prompt_variants').select('*').eq('id', prompt_variant_id).single(),
    supabase.from('test_cases').select('*').eq('id', test_case_id).single(),
  ])

  if (variantResult.status === 'rejected' || variantResult.value.error || !variantResult.value.data) {
    return NextResponse.json({ error: 'prompt_variant_id not found.' }, { status: 400 })
  }
  if (testCaseResult.status === 'rejected' || testCaseResult.value.error || !testCaseResult.value.data) {
    return NextResponse.json({ error: 'test_case_id not found.' }, { status: 400 })
  }

  const variant = variantResult.value.data
  const testCase = testCaseResult.value.data

  const systemPrompt = interpolate(variant.system_prompt, {
    buyer_question: testCase.buyer_question,
    seller_context: testCase.seller_context,
  })

  const startMs = Date.now()

  let message: Anthropic.Message
  try {
    message = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 1024,
      system: systemPrompt,
      messages: [{ role: 'user', content: testCase.buyer_question }],
    })
  } catch (err) {
    const detail = err instanceof Error ? err.message : 'Anthropic API error.'
    return NextResponse.json({ error: detail }, { status: 502 })
  }

  const latency_ms = Date.now() - startMs
  const actual_response =
    message.content[0]?.type === 'text' ? message.content[0].text : ''
  const tokens_used =
    (message.usage?.input_tokens ?? 0) + (message.usage?.output_tokens ?? 0)

  // Resolve run_id: use the provided one (from batch runner) or create a standalone run
  let resolvedRunId: string | null = null

  if (run_id && typeof run_id === 'string') {
    resolvedRunId = run_id
  } else {
    const { data: standaloneRun, error: runError } = await supabase
      .from('eval_runs')
      .insert({ name: 'standalone', status: 'completed' })
      .select('id')
      .single()
    if (!runError && standaloneRun) {
      resolvedRunId = standaloneRun.id
    }
  }

  let eval_result_id: string | null = null

  if (resolvedRunId) {
    const { data: evalResult, error: insertError } = await supabase
      .from('eval_results')
      .insert({
        run_id: resolvedRunId,
        test_case_id,
        prompt_variant_id,
        actual_response,
        latency_ms,
        tokens_used,
      })
      .select('id')
      .single()

    if (insertError) {
      console.error('eval_results insert error:', insertError.message)
    } else {
      eval_result_id = evalResult?.id ?? null
    }
  }

  return NextResponse.json({
    actual_response,
    latency_ms,
    tokens_used,
    model: MODEL,
    eval_result_id,
  })
}
