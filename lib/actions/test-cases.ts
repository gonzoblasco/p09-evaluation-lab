'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { TablesInsert } from '@/types/database'

type TestCaseInput = TablesInsert<'test_cases'>

export async function createTestCase(data: TestCaseInput) {
  const supabase = await createClient()
  const { error } = await supabase.from('test_cases').insert(data)
  if (error) throw new Error(error.message)
  revalidatePath('/dashboard/test-cases')
}

export async function updateTestCase(id: string, data: Partial<TestCaseInput>) {
  const supabase = await createClient()
  const { error } = await supabase.from('test_cases').update(data).eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/dashboard/test-cases')
}

export async function deleteTestCase(id: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('test_cases').delete().eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/dashboard/test-cases')
}
