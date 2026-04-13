import Link from 'next/link'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { StatusBadge } from './status-badge'
import type { EvalRun } from '@/types/database'

export function RunsList({ runs }: { runs: EvalRun[] }) {
  if (runs.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-8 border rounded-md">
        No hay runs todavía. Creá una evaluación arriba.
      </p>
    )
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nombre</TableHead>
            <TableHead className="w-[130px]">Estado</TableHead>
            <TableHead className="w-[200px]">Fecha</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {runs.map((run) => (
            <TableRow key={run.id}>
              <TableCell>
                <Link
                  href={`/dashboard/runs/${run.id}`}
                  className="font-medium hover:underline text-blue-700"
                >
                  {run.name}
                </Link>
              </TableCell>
              <TableCell>
                <StatusBadge status={run.status} />
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {new Date(run.created_at).toLocaleString('es-AR', {
                  dateStyle: 'short',
                  timeStyle: 'short',
                })}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
