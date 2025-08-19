#!/usr/bin/env node

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// Configuration de connexion PostgreSQL
const client = new Client({
  connectionString: 'postgresql://postgres:Apollonf@vi92@db.ubxbnrsflatmbnipqmah.supabase.co:5432/postgres',
  ssl: {
    rejectUnauthorized: false
  }
});

async function setupDatabase() {
  try {
    console.log('🔗 Connexion à la base de données Supabase...');
    await client.connect();
    console.log('✅ Connexion établie');

    // Lecture et exécution du schéma
    console.log('📋 Création du schéma de base de données...');
    const schemaSQL = fs.readFileSync(path.join(__dirname, '../database/schema.sql'), 'utf8');
    await client.query(schemaSQL);
    console.log('✅ Schéma créé avec succès');

    // Lecture et exécution des données de test
    console.log('🌱 Insertion des données de test...');
    const seedSQL = fs.readFileSync(path.join(__dirname, '../database/seed.sql'), 'utf8');
    await client.query(seedSQL);
    console.log('✅ Données de test insérées');

    console.log('🎉 Base de données Lokali configurée avec succès !');
    
  } catch (error) {
    console.error('❌ Erreur lors de la configuration:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

setupDatabase();
