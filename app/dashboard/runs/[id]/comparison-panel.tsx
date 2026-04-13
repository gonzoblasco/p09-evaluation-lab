'use client'

import { useState } from 'react'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { Tables } from '@/types/database'

type ResultRow = Tables<'eval_results'> & {
  test_cases: Pick<Tables<'test_cases'>, 'id' | 'title' | 'buyer_question' | 'expected_response'> | null
  prompt_variants: Pick<Tables<'prompt_variants'>, 'id' | 'name'> | null
}

interface ComparisonPanelProps {
  results: ResultRow[]
}

function ScoreBar({ score }: { score: number | null }) {
  if (score === null) return <span className="text-muted-foreground text-sm">—</span>
  const pct = Math.round(score * 100)
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${pct >= 80 ? 'bg-green-500' : pct >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-sm font-mono w-8 text-right">{score.toFixed(2)}</span>
    </div>
  )
}

export function ComparisonPanel({ results }: ComparisonPanelProps) {
  const completedResults = results.filter((r) => r.judge_score !== null)

  // Unique test cases and variants in the results
  const testCaseMap = new Map<string, NonNullable<ResultRow['test_cases']>>()
  const variantMap = new Map<string, NonNullable<ResultRow['prompt_variants']>>()

  for (const r of completedResults) {
    if (r.test_cases) testCaseMap.set(r.test_case_id, r.test_cases)
    if (r.prompt_variants) variantMap.set(r.prompt_variant_id, r.prompt_variants)
  }

  const testCases = [...testCaseMap.values()]
  const variants = [...variantMap.values()]

  const [selectedTestCaseId, setSelectedTestCaseId] = useState<string>(testCases[0]?.id ?? '')
  const [variantAId, setVariantAId] = useState<string>(variants[0]?.id ?? '')
  const [variantBId, setVariantBId] = useState<string>(variants[1]?.id ?? '')

  if (testCases.length === 0 || variants.length < 2) {
    return (
      <div className="border rounded-lg p-6 text-sm text-muted-foreground">
        La comparación requiere al menos 2 variantes con resultados evaluados.
      </div>
    )
  }

  const resultA = completedResults.find(
    (r) => r.test_case_id === selectedTestCaseId && r.prompt_variant_id === variantAId
  )
  const resultB = completedResults.find(
    (r) => r.test_case_id === selectedTestCaseId && r.prompt_variant_id === variantBId
  )

  return (
    <div className="border rounded-lg p-6">
      <h3 className="font-semibold mb-4">Comparación side-by-side</h3>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="flex flex-col gap-1.5">
          <Label>Test case</Label>
          <Select value={selectedTestCaseId} onValueChange={(v) => v && setSelectedTestCaseId(v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {testCases.map((tc) => (
                <SelectItem key={tc.id} value={tc.id}>{tc.title}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Variante A</Label>
          <Select value={variantAId} onValueChange={(v) => v && setVariantAId(v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {variants.map((v) => (
                <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Variante B</Label>
          <Select value={variantBId} onValueChange={(v) => v && setVariantBId(v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {variants.map((v) => (
                <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[
          { label: variants.find((v) => v.id === variantAId)?.name, result: resultA },
          { label: variants.find((v) => v.id === variantBId)?.name, result: resultB },
        ].map(({ label, result }, i) => (
          <div key={i} className="border rounded-md p-4 flex flex-col gap-3">
            <p className="font-medium text-sm">{label ?? '—'}</p>
            {result ? (
              <>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Score del juez</p>
                  <ScoreBar score={result.judge_score} />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Respuesta generada</p>
                  <p className="text-sm bg-muted/50 rounded p-2 whitespace-pre-wrap">{result.actual_response}</p>
                </div>
                {result.judge_reasoning && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Reasoning del juez</p>
                    <p className="text-sm italic text-muted-foreground">{result.judge_reasoning}</p>
                  </div>
                )}
                <p className="text-xs text-muted-foreground">{result.latency_ms} ms · {result.tokens_used} tokens</p>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">Sin resultado para esta combinación.</p>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
