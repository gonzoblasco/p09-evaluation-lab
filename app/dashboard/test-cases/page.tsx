import { createClient } from '@/lib/supabase/server'
import { TestCasesList } from './test-cases-list'

export const metadata = { title: 'Test Cases — Evaluation Lab' }

export default async function TestCasesPage() {
  const supabase = await createClient()
  const { data: testCases, error } = await supabase
    .from('test_cases')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    return (
      <main className="max-w-5xl mx-auto px-4 py-10">
        <p className="text-red-600 text-sm">Error cargando test cases: {error.message}</p>
      </main>
    )
  }

  const categories = [...new Set((testCases ?? []).map((tc) => tc.category))].sort()

  return (
    <main className="max-w-5xl mx-auto px-4 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Test Cases</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Casos de prueba para evaluar variantes de prompts de SoporteML.
        </p>
      </div>

      <TestCasesList testCases={testCases ?? []} categories={categories} />
    </main>
  )
}
