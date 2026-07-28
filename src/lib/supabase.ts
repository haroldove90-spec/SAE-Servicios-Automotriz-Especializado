import { createClient } from '@supabase/supabase-js';

const meta = import.meta as any;
const supabaseUrl = meta.env?.VITE_SUPABASE_URL || 'https://ebzsczwvurlwakfepkhf.supabase.co';
const supabaseAnonKey = meta.env?.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVienNjend2dXJsd2FrZmVwa2hmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ1NTk0OTMsImV4cCI6MjEwMDEzNTQ5M30.IlSEDNmNaGy4U3rdHnXqzBo_766GwyqOJlsCFvTHK58';

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
