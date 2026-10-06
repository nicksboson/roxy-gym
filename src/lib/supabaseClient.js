import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://rkagdmdxqsjxkaiyjere.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJrYWdkbWR4cXNqeGthaXlqZXJlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA1MjY3ODUsImV4cCI6MjEwNjEwMjc4NX0.aVu9zMkdt7kkQBeBlalntO20t12P091MUk6Up6pRPXI';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
export const supabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  supabaseAnonKey !== 'placeholder' &&
  !supabaseAnonKey.includes('your-')
);
