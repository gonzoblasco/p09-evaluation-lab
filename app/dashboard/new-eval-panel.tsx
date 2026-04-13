'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import type { Tables } from '@/types/database'

type VariantOption = Pick<Tables<'prompt_variants'>, 'id' | 'name' | 'version'>
type TestCaseOption = Pick<Tables<'test_cases'>, 'id' | 'title' | 'category'>

interface NewEvalPanelProps {
  variants: VariantOption[]
  testCases: TestCaseOption[]
}

function CheckList<T extends { id: string }>({
  items,
  selected,
  onToggle,
  renderLabel,
}: {
  items: T[]
  selected: Set<string>
  onToggle: (id: string) => void
  renderLabel: (item: T) => React.ReactNode
}) {
  return (
    <div className="max-h-48 overflow-y-auto border rounded-md divide-y">
      {items.length === 0 && (
        <p className="text-sm text-muted-foreground px-3 py-2">Sin elementos disponibles.</p>
      )}
      {items.map((item) => (
        <label
          key={item.id}
          className="flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-muted/50 text-sm"
        >
          <input
            type="checkbox"
            checked={selected.has(item.id)}
            onChange={() => onToggle(item.id)}
            className="h-4 w-4 rounded border-gray-300"
          />
          {renderLabel(item)}
        </label>
      ))}
    </div>
  )
}

export function NewEvalPanel({ variants, testCases }: NewEvalPanelProps) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [runName, setRunName] = useState('')
  const [selectedVariants, setSelectedVariants] = useState<Set<string>>(new Set())
  const [selectedTestCases, setSelectedTestCases] = useState<Set<string>>(new Set())
  const [error, setError] = useState<string | null>(null)

  function toggle(set: Set<string>, id: string): Set<string> {
    const next = new Set(set)
    next.has(id) ? next.delete(id) : next.add(id)
    return next
  }

  function handleSubmit() {
    if (!runName.trim()) { setError('Ingresá un nombre para el run.'); return }
    if (selectedVariants.size === 0) { setError('Seleccioná al menos un prompt variant.'); return }
    if (selectedTestCases.size === 0) { setError('Seleccioná al menos un test case.'); return }
    setError(null)

    startTransition(async () => {
      try {
        const res = await fetch('/api/eval/batch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            run_name: runName.trim(),
            prompt_variant_ids: [...selectedVariants],
            test_case_ids: [...selectedTestCases],
          }),
        })
        const data = await res.json()
        if (!res.ok) { setError(data.error ?? 'Error al iniciar el batch.'); return }
        router.push(`/dashboard/runs/${data.run_id}`)
      } catch {
        setError('Error de conexión.')
      }
    })
  }

  const total = selectedVariants.size * selectedTestCases.size

  return (
    <section className="border rounded-lg p-6">
      <h2 className="text-lg font-semibold mb-5">Nueva evaluación</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="flex flex-col gap-2">
          <Label>
            Prompt Variants{' '}
            <span className="text-muted-foreground font-normal">({selectedVariants.size} seleccionados)</span>
          </Label>
          <CheckList
            items={variants}
            selected={selectedVariants}
            onToggle={(id) => setSelectedVariants((prev) => toggle(prev, id))}
            renderLabel={(v) => (
              <span className="flex items-center gap-2 flex-1">
                {v.name}
                <Badge variant="outline" className="text-xs">v{v.version}</Badge>
              </span>
            )}
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label>
            Test Cases{' '}
            <span className="text-muted-foreground font-normal">({selectedTestCases.size} seleccionados)</span>
          </Label>
          <CheckList
            items={testCases}
            selected={selectedTestCases}
            onToggle={(id) => setSelectedTestCases((prev) => toggle(prev, id))}
            renderLabel={(tc) => (
              <span className="flex items-center gap-2 flex-1">
                <span className="flex-1 truncate">{tc.title}</span>
                <Badge variant="outline" className="text-xs shrink-0">{tc.category}</Badge>
              </span>
            )}
          />
        </div>
      </div>

      <div className="flex items-end gap-4">
        <div className="flex flex-col gap-1.5 flex-1 max-w-xs">
          <Label htmlFor="run-name">Nombre del run</Label>
          <Input
            id="run-name"
            value={runName}
            onChange={(e) => setRunName(e.target.value)}
            placeholder="ej: Test formalidad v1"
          />
        </div>
        <Button onClick={handleSubmit} disabled={pending}>
          {pending ? 'Iniciando…' : `Ejecutar${total > 0 ? ` (${total} eval${total !== 1 ? 's' : ''})` : ''}`}
        </Button>
      </div>

      {error && <p className="text-sm text-red-600 mt-3">{error}</p>}
    </section>
  )
}
