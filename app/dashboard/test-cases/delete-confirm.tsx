'use client'

import { useTransition } from 'react'
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

  function handleConfirm() {
    if (!id) return
    startTransition(async () => {
      await deleteTestCase(id)
      onClose()
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
