'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { TestCaseForm } from './test-case-form'
import { DeleteConfirm } from './delete-confirm'
import type { TestCase } from '@/types/database'

const CATEGORY_COLORS: Record<string, string> = {
  garantía: 'bg-blue-100 text-blue-800',
  envío: 'bg-green-100 text-green-800',
  devoluciones: 'bg-orange-100 text-orange-800',
  precio: 'bg-purple-100 text-purple-800',
  disponibilidad: 'bg-yellow-100 text-yellow-800',
  otro: 'bg-gray-100 text-gray-800',
}

interface TestCasesListProps {
  testCases: TestCase[]
  categories: string[]
}

export function TestCasesList({ testCases, categories }: TestCasesListProps) {
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<TestCase | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const filtered =
    categoryFilter === 'all'
      ? testCases
      : testCases.filter((tc) => tc.category === categoryFilter)

  function openCreate() {
    setEditing(null)
    setFormOpen(true)
  }

  function openEdit(tc: TestCase) {
    setEditing(tc)
    setFormOpen(true)
  }

  function closeForm() {
    setFormOpen(false)
    setEditing(null)
  }

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">Filtrar por categoría:</span>
          <Select value={categoryFilter} onValueChange={(v) => v && setCategoryFilter(v)}>
            <SelectTrigger className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              {categories.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span className="text-sm text-muted-foreground">
            {filtered.length} caso{filtered.length !== 1 ? 's' : ''}
          </span>
        </div>
        <Button onClick={openCreate}>+ Nuevo test case</Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[280px]">Título</TableHead>
              <TableHead className="w-[120px]">Categoría</TableHead>
              <TableHead>Pregunta del comprador</TableHead>
              <TableHead className="w-[120px] text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground py-10">
                  No hay test cases en esta categoría.
                </TableCell>
              </TableRow>
            )}
            {filtered.map((tc) => (
              <TableRow key={tc.id}>
                <TableCell className="font-medium align-top">{tc.title}</TableCell>
                <TableCell className="align-top">
                  <Badge
                    className={CATEGORY_COLORS[tc.category] ?? CATEGORY_COLORS.otro}
                    variant="outline"
                  >
                    {tc.category}
                  </Badge>
                </TableCell>
                <TableCell className="align-top text-sm text-muted-foreground line-clamp-2">
                  {tc.buyer_question}
                </TableCell>
                <TableCell className="align-top text-right">
                  <div className="flex justify-end gap-2">
                    <Button size="sm" variant="outline" onClick={() => openEdit(tc)}>
                      Editar
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => setDeletingId(tc.id)}
                    >
                      Eliminar
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <TestCaseForm open={formOpen} initial={editing} onClose={closeForm} />
      <DeleteConfirm id={deletingId} onClose={() => setDeletingId(null)} />
    </>
  )
}
