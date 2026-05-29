import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/**
 * Returns a Supabase client when SUPABASE_URL + SUPABASE_SECRET_KEY are set, else null.
 * Server-only: uses the secret key, which bypasses RLS — never import this into client code.
 */
export function getSupabaseClient(): SupabaseClient | null {
	const url = process.env.SUPABASE_URL;
	const key = process.env.SUPABASE_SECRET_KEY;
	if (!url || !key) return null;
	return createClient(url, key, { auth: { persistSession: false } });
}
