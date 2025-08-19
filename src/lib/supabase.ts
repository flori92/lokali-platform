import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/database';

const supabaseUrl = 'https://ubxbnrsflatmbnipqmah.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVieGJucnNmbGF0bWJuaXBxbWFoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzc0NTQ0NjAsImV4cCI6MjA1MzAzMDQ2MH0.X8kGbEQKZyQBvJgJvJgJvJgJvJgJvJgJvJgJvJgJvJg';

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

// Configuration pour la connexion directe PostgreSQL
export const DATABASE_CONFIG = {
  connectionString: 'postgresql://postgres:Apollonf@vi92@db.ubxbnrsflatmbnipqmah.supabase.co:5432/postgres',
  host: 'db.ubxbnrsflatmbnipqmah.supabase.co',
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: 'Apollonf@vi92'
};
