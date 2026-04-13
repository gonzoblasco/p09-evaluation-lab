import { createClient } from '@/lib/supabase/server'
import { PromptVariantsList } from './prompt-variants-list'

export const metadata = { title: 'Prompt Variants — Evaluation Lab' }

export default async function PromptVariantsPage() {
  const supabase = await createClient()
  const { data: variants, error } = await supabase
    .from('prompt_variants')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    return (
      <main className="max-w-5xl mx-auto px-4 py-10">
        <p className="text-red-600 text-sm">Error cargando variantes: {error.message}</p>
      </main>
    )
  }

  return (
    <main className="max-w-5xl mx-auto px-4 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Prompt Variants</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Variantes de system prompt para comparar en evaluaciones. Usá{' '}
          <code className="bg-muted px-1 rounded text-xs">{'{{buyer_question}}'}</code> y{' '}
          <code className="bg-muted px-1 rounded text-xs">{'{{seller_context}}'}</code> como variables.
        </p>
      </div>

      <PromptVariantsList variants={variants ?? []} />
    </main>
  )
}
