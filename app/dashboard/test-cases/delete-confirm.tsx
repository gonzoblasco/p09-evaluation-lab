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
import { deleteTestCase } from '@/lib/actions/test-cases'

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
        await deleteTestCase(id)
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
          <DialogTitle>Eliminar test case</DialogTitle>
          <DialogDescription>
            Esta acción no se puede deshacer. El test case será eliminado permanentemente.
          </DialogDescription>
        </DialogHeader>
        {error && (
          <p className="text-sm text-red-600 px-1">{error}</p>
        )}
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
