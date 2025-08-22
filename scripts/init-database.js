import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const { Client } = pg;
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Configuration de la connexion
const client = new Client({
  connectionString: 'postgresql://postgres:Apollonf@vi92@db.ubxbnrsflatmbnipqmah.supabase.co:5432/postgres',
  ssl: {
    rejectUnauthorized: false
  }
});

async function initDatabase() {
  try {
    console.log('🔄 Connexion à la base de données...');
    await client.connect();
    console.log('✅ Connecté avec succès\n');
    
    // Lire le script SQL
    const sqlScript = fs.readFileSync(path.join(__dirname, 'init-database.sql'), 'utf8');
    
    // Diviser le script en commandes individuelles
    const commands = sqlScript
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0 && !cmd.startsWith('--'));
    
    console.log(`📝 Exécution de ${commands.length} commandes SQL...\n`);
    
    for (let i = 0; i < commands.length; i++) {
      const command = commands[i] + ';';
      
      // Extraire le nom de la table/objet créé
      const match = command.match(/CREATE\s+(TABLE|INDEX|TRIGGER|FUNCTION|EXTENSION|POLICY)\s+(?:IF\s+NOT\s+EXISTS\s+)?["']?(\w+)["']?/i);
      const objectName = match ? `${match[1]} ${match[2]}` : `Commande ${i + 1}`;
      
      try {
        await client.query(command);
        console.log(`✅ ${objectName}`);
      } catch (error) {
        if (error.message.includes('already exists')) {
          console.log(`⚠️  ${objectName} existe déjà`);
        } else if (error.message.includes('extension "postgis"')) {
          console.log(`⚠️  Extension PostGIS non disponible (optionnelle)`);
        } else {
          console.error(`❌ Erreur pour ${objectName}:`, error.message);
        }
      }
    }
    
    // Vérifier les tables créées
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `);
    
    console.log('\n📊 Tables créées dans la base de données:');
    tablesResult.rows.forEach(row => {
      console.log(`  ✅ ${row.table_name}`);
    });
    
    console.log('\n🎉 Initialisation de la base de données terminée avec succès!');
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  } finally {
    await client.end();
    console.log('\n👋 Connexion fermée');
  }
}

initDatabase();
