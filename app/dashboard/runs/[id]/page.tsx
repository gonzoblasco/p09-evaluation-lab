import { createClient } from '@/lib/supabase/server'
import { RunDetail } from './run-detail'
import type { Tables } from '@/types/database'

export const dynamic = 'force-dynamic'

type ResultRow = Tables<'eval_results'> & {
  test_cases: Pick<Tables<'test_cases'>, 'id' | 'title' | 'buyer_question' | 'expected_response'> | null
  prompt_variants: Pick<Tables<'prompt_variants'>, 'id' | 'name'> | null
}

export default async function RunDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const [runResult, resultsResult] = await Promise.allSettled([
    supabase.from('eval_runs').select('*').eq('id', id).single(),
    supabase
      .from('eval_results')
      .select(
        'id, run_id, test_case_id, prompt_variant_id, actual_response, judge_score, judge_reasoning, latency_ms, tokens_used, created_at, test_cases(id, title, buyer_question, expected_response), prompt_variants(id, name)'
      )
      .eq('run_id', id)
      .order('created_at', { ascending: true }),
  ])

  if (
    runResult.status === 'rejected' ||
    runResult.value.error ||
    !runResult.value.data
  ) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-10">
        <p className="text-red-600">Run no encontrado.</p>
      </div>
    )
  }

  const run = runResult.value.data
  const results = (
    resultsResult.status === 'fulfilled' ? (resultsResult.value.data ?? []) : []
  ) as unknown as ResultRow[]

  return <RunDetail run={run} results={results} />
}
