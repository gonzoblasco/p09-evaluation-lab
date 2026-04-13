'use client'

import { useTransition, useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { createPromptVariant, updatePromptVariant } from '@/lib/actions/prompt-variants'
import type { PromptVariant, TablesInsert } from '@/types/database'

const EXAMPLE_BUYER_QUESTION = '¿Cuánto tiempo de garantía tiene el producto?'
const EXAMPLE_SELLER_CONTEXT =
  'Producto: Auriculares inalámbricos Bluetooth. Garantía: 12 meses por defectos de fabricación. Política: cambio o reembolso con foto del defecto.'

const EMPTY = {
  name: '',
  system_prompt: '',
  version: 1,
  is_active: true as boolean,
}

interface PromptVariantFormProps {
  open: boolean
  initial?: PromptVariant | null
  onClose: () => void
}

function interpolate(template: string): string {
  return template
    .replace(/\{\{buyer_question\}\}/g, EXAMPLE_BUYER_QUESTION)
    .replace(/\{\{seller_context\}\}/g, EXAMPLE_SELLER_CONTEXT)
}

export function PromptVariantForm({ open, initial, onClose }: PromptVariantFormProps) {
  const [form, setForm] = useState({ ...EMPTY })
  const [showPreview, setShowPreview] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  useEffect(() => {
    if (initial) {
      setForm({
        name: initial.name,
        system_prompt: initial.system_prompt,
        version: initial.version,
        is_active: initial.is_active,
      })
    } else {
      setForm({ ...EMPTY })
    }
    setError(null)
    setShowPreview(false)
  }, [initial, open])

  function set<K extends keyof typeof form>(field: K, value: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  function handleSubmit() {
    if (!form.name.trim() || !form.system_prompt.trim()) {
      setError('El nombre y el system prompt son obligatorios.')
      return
    }
    setError(null)
    startTransition(async () => {
      try {
        if (initial) {
          await updatePromptVariant(initial.id, form)
        } else {
          await createPromptVariant(form)
        }
        onClose()
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Error inesperado.')
      }
    })
  }

  const variableCount = (form.system_prompt.match(/\{\{(buyer_question|seller_context)\}\}/g) ?? []).length

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{initial ? 'Editar variante' : 'Nueva variante'}</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="name">Nombre</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => set('name', e.target.value)}
                placeholder="ej: Estilo Formal v2"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="version">Versión</Label>
              <Input
                id="version"
                type="number"
                min={1}
                value={form.version}
                onChange={(e) => set('version', parseInt(e.target.value, 10) || 1)}
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Label htmlFor="is_active">Activa</Label>
            <input
              id="is_active"
              type="checkbox"
              checked={form.is_active}
              onChange={(e) => set('is_active', e.target.checked)}
              className="h-4 w-4 rounded border-gray-300"
            />
            <span className="text-sm text-muted-foreground">
              Las variantes inactivas no aparecen en los selectores de evaluación
            </span>
          </div>

          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="system_prompt">System Prompt</Label>
              <div className="flex items-center gap-2">
                {variableCount > 0 && (
                  <Badge variant="outline" className="text-xs">
                    {variableCount} variable{variableCount !== 1 ? 's' : ''} detectada{variableCount !== 1 ? 's' : ''}
                  </Badge>
                )}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowPreview((v) => !v)}
                >
                  {showPreview ? 'Ocultar preview' : 'Ver preview'}
                </Button>
              </div>
            </div>
            <Textarea
              id="system_prompt"
              value={form.system_prompt}
              onChange={(e) => set('system_prompt', e.target.value)}
              placeholder={`Usá {{buyer_question}} y {{seller_context}} como variables.\n\nEjemplo:\nResponde la siguiente consulta:\n{{buyer_question}}\n\nContexto: {{seller_context}}`}
              rows={10}
              className="font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground">
              Variables disponibles:{' '}
              <code className="bg-muted px-1 rounded">{'{{buyer_question}}'}</code>{' '}
              <code className="bg-muted px-1 rounded">{'{{seller_context}}'}</code>
            </p>
          </div>

          {showPreview && (
            <div className="flex flex-col gap-1.5">
              <Label>Preview (con datos de ejemplo)</Label>
              <div className="rounded-md border bg-muted/50 p-4 text-sm whitespace-pre-wrap font-mono max-h-72 overflow-y-auto">
                {form.system_prompt
                  ? interpolate(form.system_prompt)
                  : <span className="text-muted-foreground italic">Escribí el system prompt para ver el preview.</span>
                }
              </div>
              <div className="text-xs text-muted-foreground space-y-0.5">
                <p><span className="font-medium">buyer_question:</span> {EXAMPLE_BUYER_QUESTION}</p>
                <p><span className="font-medium">seller_context:</span> {EXAMPLE_SELLER_CONTEXT}</p>
              </div>
            </div>
          )}

          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={pending}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={pending}>
            {pending ? 'Guardando…' : initial ? 'Guardar cambios' : 'Crear'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
