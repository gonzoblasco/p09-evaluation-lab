'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { buttonVariants } from '@/components/ui/button'
import { StatusBadge } from '@/app/dashboard/status-badge'
import { ComparisonPanel } from './comparison-panel'
import type { Tables } from '@/types/database'

type ResultRow = Tables<'eval_results'> & {
  test_cases: Pick<Tables<'test_cases'>, 'id' | 'title' | 'buyer_question' | 'expected_response'> | null
  prompt_variants: Pick<Tables<'prompt_variants'>, 'id' | 'name'> | null
}

interface RunDetailProps {
  run: Tables<'eval_runs'>
  results: ResultRow[]
}

function ScoreCell({ score }: { score: number | null }) {
  if (score === null) return <span className="text-muted-foreground">—</span>
  const pct = Math.round(score * 100)
  const color = pct >= 80 ? 'bg-green-100 text-green-800' : pct >= 50 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
  return <Badge variant="outline" className={color}>{score.toFixed(2)}</Badge>
}

function SkeletonRow() {
  return (
    <TableRow>
      {[...Array(5)].map((_, i) => (
        <TableCell key={i}>
          <div className="h-4 bg-muted rounded animate-pulse" />
        </TableCell>
      ))}
    </TableRow>
  )
}

export function RunDetail({ run, results }: RunDetailProps) {
  const router = useRouter()
  const isRunning = run.status === 'running' || run.status === 'pending'

  useEffect(() => {
    if (!isRunning) return
    const timer = setInterval(() => {
      router.refresh()
    }, 2000)
    return () => clearInterval(timer)
  }, [isRunning, router])

  return (
    <div className="max-w-6xl mx-auto px-4 py-10 space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">{run.name}</h1>
            <StatusBadge status={run.status} />
          </div>
          <p className="text-sm text-muted-foreground">
            {results.length} resultado{results.length !== 1 ? 's' : ''} ·{' '}
            Iniciado {new Date(run.created_at).toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' })}
          </p>
        </div>
        <Link href={`/dashboard/runs/${run.id}/metrics`} className={buttonVariants({ variant: 'outline' })}>Ver métricas</Link>
      </div>

      {/* Results table */}
      <section>
        <h2 className="text-lg font-semibold mb-3">Resultados</h2>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[220px]">Test case</TableHead>
                <TableHead className="w-[160px]">Variante</TableHead>
                <TableHead className="w-[100px]">Score</TableHead>
                <TableHead className="w-[100px]">Latencia</TableHead>
                <TableHead>Reasoning (juez)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {results.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="align-top font-medium text-sm">
                    {r.test_cases?.title ?? r.test_case_id.slice(0, 8)}
                  </TableCell>
                  <TableCell className="align-top text-sm">
                    {r.prompt_variants?.name ?? r.prompt_variant_id.slice(0, 8)}
                  </TableCell>
                  <TableCell className="align-top">
                    <ScoreCell score={r.judge_score} />
                  </TableCell>
                  <TableCell className="align-top text-sm text-muted-foreground">
                    {r.latency_ms != null ? `${r.latency_ms} ms` : '—'}
                  </TableCell>
                  <TableCell className="align-top text-sm text-muted-foreground">
                    {r.judge_reasoning
                      ? r.judge_reasoning.length > 100
                        ? r.judge_reasoning.slice(0, 100) + '…'
                        : r.judge_reasoning
                      : '—'}
                  </TableCell>
                </TableRow>
              ))}
              {isRunning && (
                <>
                  <SkeletonRow />
                  <SkeletonRow />
                  <SkeletonRow />
                </>
              )}
              {!isRunning && results.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    Sin resultados. El run puede haber fallado.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </section>

      {/* Side-by-side comparison */}
      {results.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold mb-3">Comparación</h2>
          <ComparisonPanel results={results} />
        </section>
      )}
    </div>
  )
}
