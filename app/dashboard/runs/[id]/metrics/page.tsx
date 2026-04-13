import Link from 'next/link'
import { buttonVariants } from '@/components/ui/button'

export default async function MetricsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <div className="flex items-center gap-4 mb-8">
        <Link href={`/dashboard/runs/${id}`} className={buttonVariants({ variant: 'outline' })}>← Volver al run</Link>
        <h1 className="text-2xl font-bold">Métricas</h1>
      </div>
      <div className="border rounded-lg p-12 text-center text-muted-foreground">
        <p className="text-lg font-medium mb-2">Próximamente</p>
        <p className="text-sm">Las métricas agregadas se implementan en TASK 08.</p>
      </div>
    </div>
  )
}
