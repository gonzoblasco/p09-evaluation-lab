import { notFound } from 'next/navigation'
import Link from 'next/link'
import { buttonVariants } from '@/components/ui/button-variants'
import { createClient } from '@/lib/supabase/server'
import { ScoreBarChart } from './score-bar-chart'

export const dynamic = 'force-dynamic'

type ResultRow = {
  id: string
  test_case_id: string
  prompt_variant_id: string
  judge_score: number | null
  latency_ms: number | null
  tokens_used: number | null
  test_cases: { id: string; title: string; category: string } | null
  prompt_variants: { id: string; name: string } | null
}

function avg(values: number[]): number | null {
  if (values.length === 0) return null
  return values.reduce((a, b) => a + b, 0) / values.length
}

function p95(values: number[]): number | null {
  if (values.length === 0) return null
  const sorted = [...values].sort((a, b) => a - b)
  return sorted[Math.floor(sorted.length * 0.95)]
}

export default async function MetricsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const [runResult, resultsResult] = await Promise.allSettled([
    supabase.from('eval_runs').select('id, name, status').eq('id', id).single(),
    supabase
      .from('eval_results')
      .select(
        'id, test_case_id, prompt_variant_id, judge_score, latency_ms, tokens_used, test_cases(id, title, category), prompt_variants(id, name)'
      )
      .eq('run_id', id),
  ])

  if (runResult.status === 'rejected' || runResult.value.error || !runResult.value.data) {
    notFound()
  }

  const run = runResult.value.data
  const rawResults = (
    resultsResult.status === 'fulfilled' ? (resultsResult.value.data ?? []) : []
  ) as unknown as ResultRow[]

  const scored = rawResults.filter((r) => r.judge_score !== null)

  // Build variant map: id → name
  const variantMap = new Map<string, string>()
  for (const r of rawResults) {
    if (r.prompt_variants) variantMap.set(r.prompt_variant_id, r.prompt_variants.name)
  }
  const variantIds = [...variantMap.keys()]

  // Per-variant metrics
  const variantMetrics = variantIds.map((variantId) => {
    const variantScored = scored.filter((r) => r.prompt_variant_id === variantId)
    const scores = variantScored.map((r) => r.judge_score as number)
    const latencies = variantScored
      .filter((r) => r.latency_ms != null)
      .map((r) => r.latency_ms as number)
    const totalTokens = rawResults
      .filter((r) => r.prompt_variant_id === variantId && r.tokens_used != null)
      .reduce((sum, r) => sum + (r.tokens_used as number), 0)

    return {
      variantId,
      variantName: variantMap.get(variantId) ?? variantId.slice(0, 8),
      avgScore: avg(scores),
      avgLatency: avg(latencies),
      p95Latency: p95(latencies),
      totalTokens,
      estimatedCostUsd: (totalTokens / 1_000_000) * 9,
      wins: 0,
      totalTestCases: 0,
    }
  })

  // Win rate: per test case, highest scorer wins (0.5 each if tie)
  const testCaseIds = [...new Set(scored.map((r) => r.test_case_id))]
  const winMap = new Map<string, number>()

  for (const tcId of testCaseIds) {
    const tcResults = scored.filter((r) => r.test_case_id === tcId)
    if (tcResults.length === 0) continue
    const maxScore = Math.max(...tcResults.map((r) => r.judge_score as number))
    const winners = tcResults.filter((r) => r.judge_score === maxScore)
    const winValue = winners.length > 1 ? 0.5 : 1
    for (const w of winners) {
      winMap.set(w.prompt_variant_id, (winMap.get(w.prompt_variant_id) ?? 0) + winValue)
    }
  }

  for (const vm of variantMetrics) {
    vm.wins = winMap.get(vm.variantId) ?? 0
    vm.totalTestCases = testCaseIds.length
  }

  // Category breakdown: category → variantName → avgScore
  const categories = [
    ...new Set(
      rawResults.filter((r) => r.test_cases).map((r) => r.test_cases!.category)
    ),
  ].sort()

  const categoryBreakdown = categories.map((cat) => {
    const row: Record<string, number | null | string> = { category: cat }
    for (const [variantId, variantName] of variantMap) {
      const catScores = scored
        .filter((r) => r.test_cases?.category === cat && r.prompt_variant_id === variantId)
        .map((r) => r.judge_score as number)
      row[variantName] = avg(catScores)
    }
    return row
  })

  // Chart data
  const chartData = variantMetrics.map((vm) => ({
    name: vm.variantName,
    score: vm.avgScore != null ? parseFloat(vm.avgScore.toFixed(3)) : 0,
  }))

  return (
    <div className="max-w-5xl mx-auto px-4 py-10 space-y-10">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href={`/dashboard/runs/${id}`}
          className={buttonVariants({ variant: 'outline' })}
        >
          ← Volver al run
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Métricas</h1>
          <p className="text-sm text-muted-foreground">{run.name}</p>
        </div>
      </div>

      {scored.length === 0 ? (
        <div className="border rounded-lg p-12 text-center text-muted-foreground">
          <p className="text-lg font-medium mb-2">Sin datos</p>
          <p className="text-sm">
            No hay resultados evaluados para este run. Esperá a que el batch finalice.
          </p>
        </div>
      ) : (
        <>
          {/* Score bar chart */}
          <section>
            <h2 className="text-lg font-semibold mb-4">Score promedio por variante</h2>
            <div className="border rounded-lg p-6">
              <ScoreBarChart data={chartData} />
            </div>
          </section>

          {/* Per-variant metrics table */}
          <section>
            <h2 className="text-lg font-semibold mb-4">Métricas por variante</h2>
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium">Variante</th>
                    <th className="px-4 py-3 text-right font-medium">Score prom.</th>
                    <th className="px-4 py-3 text-right font-medium">Lat. prom.</th>
                    <th className="px-4 py-3 text-right font-medium">Lat. p95</th>
                    <th className="px-4 py-3 text-right font-medium">Tokens</th>
                    <th className="px-4 py-3 text-right font-medium">Costo est.</th>
                    <th className="px-4 py-3 text-right font-medium">Win rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {variantMetrics.map((vm) => (
                    <tr key={vm.variantId} className="hover:bg-muted/20">
                      <td className="px-4 py-3 font-medium">{vm.variantName}</td>
                      <td className="px-4 py-3 text-right font-mono">
                        {vm.avgScore != null ? vm.avgScore.toFixed(3) : '—'}
                      </td>
                      <td className="px-4 py-3 text-right text-muted-foreground">
                        {vm.avgLatency != null ? `${Math.round(vm.avgLatency)} ms` : '—'}
                      </td>
                      <td className="px-4 py-3 text-right text-muted-foreground">
                        {vm.p95Latency != null ? `${vm.p95Latency} ms` : '—'}
                      </td>
                      <td className="px-4 py-3 text-right text-muted-foreground">
                        {vm.totalTokens.toLocaleString('es-AR')}
                      </td>
                      <td className="px-4 py-3 text-right text-muted-foreground">
                        ${vm.estimatedCostUsd.toFixed(4)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {vm.totalTestCases > 0
                          ? `${vm.wins}/${vm.totalTestCases} (${Math.round((vm.wins / vm.totalTestCases) * 100)}%)`
                          : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Category breakdown */}
          {categoryBreakdown.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold mb-4">Breakdown por categoría</h2>
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="px-4 py-3 text-left font-medium">Categoría</th>
                      {variantMetrics.map((vm) => (
                        <th key={vm.variantId} className="px-4 py-3 text-right font-medium">
                          {vm.variantName}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {categoryBreakdown.map((row) => (
                      <tr key={String(row.category)} className="hover:bg-muted/20">
                        <td className="px-4 py-3 capitalize">{row.category}</td>
                        {variantMetrics.map((vm) => {
                          const score = row[vm.variantName]
                          return (
                            <td key={vm.variantId} className="px-4 py-3 text-right font-mono">
                              {typeof score === 'number' ? score.toFixed(3) : '—'}
                            </td>
                          )
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}
        </>
      )}
    </div>
  )
}
