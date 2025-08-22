import pg from 'pg';
const { Client } = pg;

// Configuration de la connexion
const client = new Client({
  connectionString: 'postgresql://postgres:Apollonf@vi92@db.ubxbnrsflatmbnipqmah.supabase.co:5432/postgres',
  ssl: {
    rejectUnauthorized: false
  }
});

async function testConnection() {
  try {
    console.log('🔄 Connexion à la base de données Supabase PostgreSQL...');
    await client.connect();
    console.log('✅ Connexion réussie!');
    
    // Test de requête simple
    const result = await client.query('SELECT NOW()');
    console.log('⏰ Heure serveur:', result.rows[0].now);
    
    // Vérifier les tables existantes
    const tables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);
    
    console.log('\n📋 Tables existantes:');
    if (tables.rows.length > 0) {
      tables.rows.forEach(row => {
        console.log(`  - ${row.table_name}`);
      });
    } else {
      console.log('  Aucune table trouvée');
    }
    
    // Vérifier la version PostgreSQL
    const version = await client.query('SELECT version()');
    console.log('\n📦 Version PostgreSQL:', version.rows[0].version.split(',')[0]);
    
  } catch (error) {
    console.error('❌ Erreur de connexion:', error.message);
    process.exit(1);
  } finally {
    await client.end();
    console.log('\n👋 Connexion fermée');
  }
}

testConnection();
