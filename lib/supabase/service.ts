import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

/**
 * Service role client — no cookie dependency, safe to use in after() callbacks
 * and other non-request contexts. Only use server-side; never expose to the client.
 */
export function createServiceClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}
