'use client'

import { useTransition, useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import { deletePromptVariant } from '@/lib/actions/prompt-variants'

interface DeleteConfirmProps {
  id: string | null
  onClose: () => void
}

export function DeleteConfirm({ id, onClose }: DeleteConfirmProps) {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function handleConfirm() {
    if (!id) return
    setError(null)
    startTransition(async () => {
      try {
        await deletePromptVariant(id)
        onClose()
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Error al eliminar.')
      }
    })
  }

  return (
    <Dialog open={!!id} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Eliminar variante</DialogTitle>
          <DialogDescription>
            Esta acción no se puede deshacer. La variante y todos sus resultados asociados serán eliminados.
          </DialogDescription>
        </DialogHeader>
        {error && <p className="text-sm text-red-600 px-1">{error}</p>}
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={pending}>
            Cancelar
          </Button>
          <Button variant="destructive" onClick={handleConfirm} disabled={pending}>
            {pending ? 'Eliminando…' : 'Eliminar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
