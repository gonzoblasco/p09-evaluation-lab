import { NextRequest, NextResponse, after } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { runSingleEval } from '@/lib/eval/single-evaluator'
import { runJudge } from '@/lib/eval/llm-judge'

const MAX_ITEMS = 10

async function runBatch(
  runId: string,
  variantIds: string[],
  testCaseIds: string[]
): Promise<void> {
  const supabase = createServiceClient()

  try {
    await runBatchInner(supabase, runId, variantIds, testCaseIds)
  } catch {
    await supabase.from('eval_runs').update({ status: 'failed' }).eq('id', runId)
  }
}

async function runBatchInner(
  supabase: ReturnType<typeof createServiceClient>,
  runId: string,
  variantIds: string[],
  testCaseIds: string[]
): Promise<void> {
  await supabase
    .from('eval_runs')
    .update({ status: 'running' })
    .eq('id', runId)

  // Fetch all test cases upfront for expected_response and buyer_question
  const { data: testCases } = await supabase
    .from('test_cases')
    .select('id, buyer_question, expected_response')
    .in('id', testCaseIds)

  const testCaseMap = new Map((testCases ?? []).map((tc) => [tc.id, tc]))

  // Build all (variant, testCase) pairs
  const pairs = variantIds.flatMap((prompt_variant_id) =>
    testCaseIds.map((test_case_id) => ({ prompt_variant_id, test_case_id }))
  )

  const results = await Promise.allSettled(
    pairs.map(async ({ prompt_variant_id, test_case_id }) => {
      const testCase = testCaseMap.get(test_case_id)
      if (!testCase) throw new Error(`test_case_id ${test_case_id} not in result set`)

      const evalOutput = await runSingleEval({ prompt_variant_id, test_case_id, run_id: runId })

      if (evalOutput.eval_result_id && evalOutput.actual_response) {
        await runJudge({
          eval_result_id: evalOutput.eval_result_id,
          expected_response: testCase.expected_response,
          actual_response: evalOutput.actual_response,
          buyer_question: testCase.buyer_question,
        })
      }
    })
  )

  const allFailed = results.every((r) => r.status === 'rejected')
  const finalStatus = allFailed ? 'failed' : 'completed'

  await supabase
    .from('eval_runs')
    .update({ status: finalStatus })
    .eq('id', runId)
}

export async function POST(req: NextRequest) {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 })
  }

  const { run_name, prompt_variant_ids, test_case_ids } = body as Record<string, unknown>

  if (!run_name || typeof run_name !== 'string' || !run_name.trim()) {
    return NextResponse.json({ error: 'run_name is required.' }, { status: 400 })
  }
  if (!Array.isArray(prompt_variant_ids) || prompt_variant_ids.length === 0) {
    return NextResponse.json({ error: 'prompt_variant_ids must be a non-empty array.' }, { status: 400 })
  }
  if (prompt_variant_ids.length > MAX_ITEMS) {
    return NextResponse.json(
      { error: `prompt_variant_ids cannot exceed ${MAX_ITEMS} items.` },
      { status: 400 }
    )
  }
  if (!Array.isArray(test_case_ids) || test_case_ids.length === 0) {
    return NextResponse.json({ error: 'test_case_ids must be a non-empty array.' }, { status: 400 })
  }
  if (test_case_ids.length > MAX_ITEMS) {
    return NextResponse.json(
      { error: `test_case_ids cannot exceed ${MAX_ITEMS} items.` },
      { status: 400 }
    )
  }
  if (prompt_variant_ids.some((id) => typeof id !== 'string')) {
    return NextResponse.json({ error: 'prompt_variant_ids must be an array of strings.' }, { status: 400 })
  }
  if (test_case_ids.some((id) => typeof id !== 'string')) {
    return NextResponse.json({ error: 'test_case_ids must be an array of strings.' }, { status: 400 })
  }

  const supabase = createServiceClient()
  const { data: evalRun, error: runError } = await supabase
    .from('eval_runs')
    .insert({ name: run_name.trim(), status: 'pending' })
    .select('id')
    .single()

  if (runError || !evalRun) {
    return NextResponse.json(
      { error: `Failed to create eval run: ${runError?.message ?? 'unknown'}` },
      { status: 500 }
    )
  }

  const total_evals = prompt_variant_ids.length * test_case_ids.length

  after(async () => {
    await runBatch(evalRun.id, prompt_variant_ids as string[], test_case_ids as string[])
  })

  return NextResponse.json({
    run_id: evalRun.id,
    status: 'running',
    total_evals,
  })
}
