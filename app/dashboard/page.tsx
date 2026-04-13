import { createClient } from '@/lib/supabase/server'
import { NewEvalPanel } from './new-eval-panel'
import { RunsList } from './runs-list'

export default async function DashboardPage() {
  const supabase = await createClient()

  const [variantsResult, testCasesResult, runsResult] = await Promise.allSettled([
    supabase
      .from('prompt_variants')
      .select('id, name, version')
      .eq('is_active', true)
      .order('name'),
    supabase
      .from('test_cases')
      .select('id, title, category')
      .order('category')
      .order('title'),
    supabase
      .from('eval_runs')
      .select('*')
      .neq('name', 'standalone')
      .order('created_at', { ascending: false })
      .limit(20),
  ])

  const variants =
    variantsResult.status === 'fulfilled' ? (variantsResult.value.data ?? []) : []
  const testCases =
    testCasesResult.status === 'fulfilled' ? (testCasesResult.value.data ?? []) : []
  const runs =
    runsResult.status === 'fulfilled' ? (runsResult.value.data ?? []) : []

  return (
    <div className="max-w-5xl mx-auto px-4 py-10 space-y-10">
      <div>
        <h1 className="text-2xl font-bold">Evaluation Lab</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Compará variantes de prompts contra casos de prueba de SoporteML.
        </p>
      </div>

      <NewEvalPanel variants={variants} testCases={testCases} />

      <section>
        <h2 className="text-lg font-semibold mb-4">Runs recientes</h2>
        <RunsList runs={runs} />
      </section>
    </div>
  )
}
