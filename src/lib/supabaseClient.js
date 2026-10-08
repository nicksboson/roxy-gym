import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://rkagdmdxqsjxkaiyjere.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJrYWdkbWR4cXNqeGthaXlqZXJlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA1MjY3ODUsImV4cCI6MjEwNjEwMjc4NX0.aVu9zMkdt7kkQBeBlalntO20t12P091MUk6Up6pRPXI';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  global: {
    fetch: async (url, options = {}) => {
      // Get Clerk token for every REST request
      let authToken = supabaseAnonKey;
      try {
        if (window.Clerk?.session) {
          const clerkToken = await window.Clerk.session.getToken({ template: 'supabase' });
          if (clerkToken) authToken = clerkToken;
        }
      } catch (e) {
        console.warn('Could not get Clerk token:', e);
      }

      const headers = new Headers(options.headers);
      headers.set('apikey', supabaseAnonKey);
      headers.set('Authorization', `Bearer ${authToken}`);
      return fetch(url, { ...options, headers });
    }
  },
  realtime: {
    // Realtime auth: use anon key initially, refreshed below
    params: { apikey: supabaseAnonKey }
  },
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  }
});

// Refresh realtime auth token with Clerk token once Clerk is ready
async function refreshRealtimeAuth() {
  try {
    if (window.Clerk?.session) {
      const token = await window.Clerk.session.getToken({ template: 'supabase' });
      if (token) {
        supabase.realtime.setAuth(token);
        return;
      }
    }
  } catch (e) {
    console.warn('Could not set Clerk token for Realtime:', e);
  }
  supabase.realtime.setAuth(supabaseAnonKey);
}

// Call once Clerk is available (Clerk fires __clerk_loaded on window)
if (window.Clerk) {
  refreshRealtimeAuth();
} else {
  window.addEventListener('__clerk_loaded', refreshRealtimeAuth, { once: true });
}

export const supabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  supabaseAnonKey !== 'placeholder' &&
  !supabaseAnonKey.includes('your-')
);
