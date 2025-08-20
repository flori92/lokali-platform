import { createClient } from '@supabase/supabase-js';

// Configuration Supabase avec fallback pour la production
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://ubxbnrsflatmbnipqmah.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVieGJucnNmbGF0bWJuaXBxbWFoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU1NDgwODQsImV4cCI6MjA3MTEyNDA4NH0._NAvgKso5MMBHg3ZsWLooxA_kR5VpVfwUJHNi6KTDVA';

// Validation avec logging pour debug
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Configuration Supabase manquante:', { supabaseUrl: !!supabaseUrl, supabaseAnonKey: !!supabaseAnonKey });
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});

// Configuration pour la connexion directe PostgreSQL
export const DATABASE_CONFIG = {
  connectionString: 'postgresql://postgres:Apollonf@vi92@db.ubxbnrsflatmbnipqmah.supabase.co:5432/postgres',
  host: 'db.ubxbnrsflatmbnipqmah.supabase.co',
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: 'Apollonf@vi92'
};
