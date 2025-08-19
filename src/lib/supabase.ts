import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Variables d\'environnement Supabase manquantes');
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
