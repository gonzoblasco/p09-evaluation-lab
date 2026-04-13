import { Badge } from '@/components/ui/badge'
import type { EvalRunStatus } from '@/types/database'

const STATUS_STYLES: Record<EvalRunStatus, string> = {
  pending: 'bg-gray-100 text-gray-700',
  running: 'bg-blue-100 text-blue-700',
  completed: 'bg-green-100 text-green-800',
  failed: 'bg-red-100 text-red-800',
}

const STATUS_LABELS: Record<EvalRunStatus, string> = {
  pending: 'Pendiente',
  running: 'Ejecutando',
  completed: 'Completado',
  failed: 'Fallido',
}

export function StatusBadge({ status }: { status: string }) {
  const s = status as EvalRunStatus
  const style = STATUS_STYLES[s] ?? STATUS_STYLES.pending
  const label = STATUS_LABELS[s] ?? status
  return (
    <Badge
      variant="outline"
      className={`${style} ${s === 'running' ? 'animate-pulse' : ''}`}
    >
      {label}
    </Badge>
  )
}
