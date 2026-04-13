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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { createTestCase, updateTestCase } from '@/lib/actions/test-cases'
import type { TestCase, TablesInsert } from '@/types/database'

type TestCaseInput = TablesInsert<'test_cases'>

const CATEGORIES = ['garantía', 'envío', 'devoluciones', 'precio', 'disponibilidad', 'otro']

const EMPTY: TestCaseInput = {
  title: '',
  buyer_question: '',
  seller_context: '',
  expected_response: '',
  category: '',
}

interface TestCaseFormProps {
  open: boolean
  initial?: TestCase | null
  onClose: () => void
}

export function TestCaseForm({ open, initial, onClose }: TestCaseFormProps) {
  const [form, setForm] = useState<TestCaseInput>(EMPTY)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  useEffect(() => {
    setForm(initial ? { ...initial } : EMPTY)
    setError(null)
  }, [initial, open])

  function set(field: keyof TestCaseInput, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  function handleSubmit() {
    if (!form.title || !form.buyer_question || !form.seller_context || !form.expected_response || !form.category) {
      setError('Todos los campos son obligatorios.')
      return
    }
    setError(null)
    startTransition(async () => {
      try {
        if (initial) {
          await updateTestCase(initial.id, form)
        } else {
          await createTestCase(form)
        }
        onClose()
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Error inesperado.')
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{initial ? 'Editar test case' : 'Nuevo test case'}</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="title">Título</Label>
            <Input
              id="title"
              value={form.title}
              onChange={(e) => set('title', e.target.value)}
              placeholder="Descripción breve del caso"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="category">Categoría</Label>
            <Select value={form.category} onValueChange={(v) => v && set('category', v)}>
              <SelectTrigger id="category">
                <SelectValue placeholder="Seleccioná una categoría" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="buyer_question">Pregunta del comprador</Label>
            <Textarea
              id="buyer_question"
              value={form.buyer_question}
              onChange={(e) => set('buyer_question', e.target.value)}
              placeholder="¿Qué preguntó el comprador?"
              rows={3}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="seller_context">Contexto del vendedor</Label>
            <Textarea
              id="seller_context"
              value={form.seller_context}
              onChange={(e) => set('seller_context', e.target.value)}
              placeholder="Información disponible para el vendedor (producto, garantía, estado del pedido…)"
              rows={4}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="expected_response">Respuesta esperada</Label>
            <Textarea
              id="expected_response"
              value={form.expected_response}
              onChange={(e) => set('expected_response', e.target.value)}
              placeholder="¿Cuál sería la respuesta ideal?"
              rows={4}
            />
          </div>

          {error && (
            <p className="text-sm text-red-600">{error}</p>
          )}
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
