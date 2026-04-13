'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { PromptVariantForm } from './prompt-variant-form'
import { DeleteConfirm } from './delete-confirm'
import { togglePromptVariantActive } from '@/lib/actions/prompt-variants'
import type { PromptVariant } from '@/types/database'

interface PromptVariantsListProps {
  variants: PromptVariant[]
}

function ToggleButton({ variant }: { variant: PromptVariant }) {
  const [pending, startTransition] = useTransition()

  function handleToggle() {
    startTransition(async () => {
      await togglePromptVariantActive(variant.id, !variant.is_active)
    })
  }

  return (
    <Button
      size="sm"
      variant="ghost"
      onClick={handleToggle}
      disabled={pending}
      className="px-2"
    >
      {pending ? '…' : variant.is_active ? 'Desactivar' : 'Activar'}
    </Button>
  )
}

export function PromptVariantsList({ variants }: PromptVariantsListProps) {
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<PromptVariant | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  function openCreate() {
    setEditing(null)
    setFormOpen(true)
  }

  function openEdit(v: PromptVariant) {
    setEditing(v)
    setFormOpen(true)
  }

  function closeForm() {
    setFormOpen(false)
    setEditing(null)
  }

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <span className="text-sm text-muted-foreground">
          {variants.length} variante{variants.length !== 1 ? 's' : ''}
        </span>
        <Button onClick={openCreate}>+ Nueva variante</Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[220px]">Nombre</TableHead>
              <TableHead className="w-[90px]">Versión</TableHead>
              <TableHead className="w-[100px]">Estado</TableHead>
              <TableHead>System Prompt (preview)</TableHead>
              <TableHead className="w-[200px] text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {variants.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-10">
                  No hay variantes todavía.
                </TableCell>
              </TableRow>
            )}
            {variants.map((v) => (
              <TableRow key={v.id} className={v.is_active ? '' : 'opacity-60'}>
                <TableCell className="font-medium align-top">{v.name}</TableCell>
                <TableCell className="align-top">
                  <Badge variant="outline">v{v.version}</Badge>
                </TableCell>
                <TableCell className="align-top">
                  <Badge
                    className={
                      v.is_active
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-600'
                    }
                    variant="outline"
                  >
                    {v.is_active ? 'Activa' : 'Inactiva'}
                  </Badge>
                </TableCell>
                <TableCell className="align-top text-xs text-muted-foreground font-mono line-clamp-2 max-w-xs">
                  {v.system_prompt}
                </TableCell>
                <TableCell className="align-top text-right">
                  <div className="flex justify-end gap-1">
                    <ToggleButton variant={v} />
                    <Button size="sm" variant="outline" onClick={() => openEdit(v)}>
                      Editar
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => setDeletingId(v.id)}
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

      <PromptVariantForm open={formOpen} initial={editing} onClose={closeForm} />
      <DeleteConfirm id={deletingId} onClose={() => setDeletingId(null)} />
    </>
  )
}
