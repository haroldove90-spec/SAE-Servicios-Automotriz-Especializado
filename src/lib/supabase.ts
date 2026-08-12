import { createClient } from '@supabase/supabase-js';

const meta = import.meta as any;
const supabaseUrl = meta.env?.VITE_SUPABASE_URL || 'https://gydwduicwpxznmvngwlb.supabase.co';
const supabaseAnonKey = meta.env?.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd5ZHdkdWljd3B4em5tdm5nd2xiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY1NDk4NTEsImV4cCI6MjEwMjEyNTg1MX0.2HU-iZAa85RqYX71yZYuZBuQprJLEt06mJ45bxdAPYg';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Checks if the connection to Supabase is active
 */
export async function testSupabaseConnection(): Promise<boolean> {
  try {
    const { data, error } = await supabase.from('workshop_settings').select('id').limit(1);
    if (error) {
      console.warn('Supabase connection test warning:', error.message);
      // If table doesn't exist but we successfully reached Supabase, connection is fine, tables just need creation
      if (error.code === 'PGRST116' || error.code === '42P01') {
        return true; 
      }
      return false;
    }
    return true;
  } catch (err) {
    console.error('Supabase connection test failed:', err);
    return false;
  }
}
