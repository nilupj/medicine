import { drizzle } from 'drizzle-orm/neon-serverless';
import { migrate } from 'drizzle-orm/neon-serverless/migrator';
import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';
import * as schema from '@shared/schema';
import dotenv from 'dotenv';

dotenv.config();
neonConfig.webSocketConstructor = ws;

async function main() {
  console.log('Starting database schema push...');

  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL environment variable is not set.');
    process.exit(1);
  }

  // Create a connection pool
  const pool = new Pool({ 
    connectionString: process.env.DATABASE_URL
  });

  try {
    // Create database connection
    const db = drizzle(pool, { schema });

    console.log('Connected to database, pushing schema...');

    // Instead of using drizzle-kit, we'll manually create tables
    // This approach uses direct SQL which is more compatible with various PostgreSQL versions
    await pool.query(`
      -- Categories table
      CREATE TABLE IF NOT EXISTS categories (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        description TEXT
      );

      -- Medicines table
      CREATE TABLE IF NOT EXISTS medicines (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        aliases TEXT,
        description TEXT NOT NULL,
        category TEXT NOT NULL,
        composition TEXT,
        uses TEXT,
        side_effects TEXT,
        dosage TEXT,
        forms TEXT,
        warnings TEXT,
        otc_rx TEXT,
        drug_code TEXT,
        formulation TEXT,
        strength TEXT,
        count_number INTEGER,
        l1_rate NUMERIC(10, 2),
        l1_lab TEXT,
        last_updated TIMESTAMP DEFAULT NOW()
      );

      -- Recent searches table
      CREATE TABLE IF NOT EXISTS recent_searches (
        id SERIAL PRIMARY KEY,
        search_term TEXT NOT NULL,
        timestamp TIMESTAMP DEFAULT NOW()
      );

      -- Drug interactions table
      CREATE TABLE IF NOT EXISTS drug_interactions (
        id SERIAL PRIMARY KEY,
        medicine1_id INTEGER NOT NULL REFERENCES medicines(id),
        medicine2_id INTEGER NOT NULL REFERENCES medicines(id),
        severity TEXT NOT NULL,
        description TEXT NOT NULL,
        effects TEXT NOT NULL,
        management TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );

      -- Users table
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username TEXT NOT NULL UNIQUE,
        email TEXT UNIQUE,
        password_hash TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'user',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      -- Medication schedules table
      CREATE TABLE IF NOT EXISTS medication_schedules (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        medicine_id INTEGER NOT NULL REFERENCES medicines(id),
        name TEXT NOT NULL,
        dosage TEXT NOT NULL,
        dosage_unit TEXT NOT NULL DEFAULT 'mg',
        instructions TEXT,
        start_date DATE NOT NULL,
        end_date DATE,
        notes TEXT,
        active BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      -- Schedule frequency table
      CREATE TABLE IF NOT EXISTS schedule_frequency (
        id SERIAL PRIMARY KEY,
        schedule_id INTEGER NOT NULL REFERENCES medication_schedules(id),
        frequency_type TEXT NOT NULL,
        days_of_week TEXT,
        day_of_month INTEGER,
        interval INTEGER DEFAULT 1,
        created_at TIMESTAMP DEFAULT NOW()
      );

      -- Reminder times table
      CREATE TABLE IF NOT EXISTS reminder_times (
        id SERIAL PRIMARY KEY,
        schedule_id INTEGER NOT NULL REFERENCES medication_schedules(id),
        time TIME NOT NULL,
        label TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );

      -- Medication logs table
      CREATE TABLE IF NOT EXISTS medication_logs (
        id SERIAL PRIMARY KEY,
        schedule_id INTEGER NOT NULL REFERENCES medication_schedules(id),
        reminder_time_id INTEGER REFERENCES reminder_times(id),
        taken_at TIMESTAMP NOT NULL,
        scheduled TIMESTAMP,
        status TEXT NOT NULL,
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    console.log('Schema push completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error pushing schema:', error);
    process.exit(1);
  } finally {
    // Close the connection pool
    await pool.end();
  }
}

main().catch((err) => {
  console.error('Unhandled error:', err);
  process.exit(1);
});