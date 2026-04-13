'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { TablesInsert, TablesUpdate } from '@/types/database'

export async function createPromptVariant(data: TablesInsert<'prompt_variants'>) {
  const supabase = await createClient()
  const { error } = await supabase.from('prompt_variants').insert(data)
  if (error) throw new Error(error.message)
  revalidatePath('/dashboard/prompt-variants')
}

export async function updatePromptVariant(id: string, data: TablesUpdate<'prompt_variants'>) {
  const supabase = await createClient()
  const { error } = await supabase.from('prompt_variants').update(data).eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/dashboard/prompt-variants')
}

export async function togglePromptVariantActive(id: string, is_active: boolean) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('prompt_variants')
    .update({ is_active })
    .eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/dashboard/prompt-variants')
}

export async function deletePromptVariant(id: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('prompt_variants').delete().eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/dashboard/prompt-variants')
}
