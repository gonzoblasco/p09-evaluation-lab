import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { runSingleEval } from '@/lib/eval/single-evaluator'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

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
  if (run_id !== undefined && (typeof run_id !== 'string' || !UUID_RE.test(run_id))) {
    return NextResponse.json({ error: 'run_id must be a valid UUID.' }, { status: 400 })
  }

  // Resolve run_id: use provided (batch mode) or create a standalone run
  let resolvedRunId: string | null = typeof run_id === 'string' ? run_id : null

  if (!resolvedRunId) {
    const supabase = await createClient()
    const { data: standaloneRun, error } = await supabase
      .from('eval_runs')
      .insert({ name: 'standalone', status: 'completed' })
      .select('id')
      .single()
    if (!error && standaloneRun) resolvedRunId = standaloneRun.id
  }

  if (!resolvedRunId) {
    return NextResponse.json({ error: 'Failed to create eval run.' }, { status: 500 })
  }

  try {
    const result = await runSingleEval({
      prompt_variant_id,
      test_case_id,
      run_id: resolvedRunId,
    })
    return NextResponse.json(result)
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unexpected error.'
    if (msg.startsWith('NOT_FOUND:')) {
      const field = msg.split(':')[1]
      return NextResponse.json({ error: `${field} not found.` }, { status: 400 })
    }
    return NextResponse.json({ error: msg }, { status: 502 })
  }
}
