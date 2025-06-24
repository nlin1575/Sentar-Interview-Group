import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

export const supa = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
);

// Step 03
export async function fetchRecent(limit = 5) {
  return supa
    .from('entries')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);
}

// Step 10  ➜ single INSERT
export async function saveEntry(row: Record<string, any>) {
  return supa
    .from('entries')
    .insert(row)
    .select('id')
    .single();
}
