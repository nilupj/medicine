import { pool, db } from './db';
import * as schema from '@shared/schema';
import { medicines, categories, users } from '@shared/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

/**
 * Initialize the database by creating tables and adding initial data
 */
export async function initDatabase() {
  try {
    console.log('Initializing database...');
    
    // Run the schema creation
    await createSchema();
    
    // Seed database with admin user if it doesn't exist
    await seedDatabase();
    
    console.log('Database initialization complete!');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
}

/**
 * Create database schema
 */
async function createSchema() {
  try {
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
    
    console.log('Database schema created successfully');
  } catch (error) {
    console.error('Error creating schema:', error);
    throw error;
  }
}

/**
 * Seed the database with initial data
 */
async function seedDatabase() {
  try {
    // Add admin user if it doesn't exist
    const existingAdmin = await db.select()
      .from(users)
      .where(eq(users.username, 'admin'))
      .limit(1);
      
    if (existingAdmin.length === 0) {
      const passwordHash = await bcrypt.hash('admin123', 10);
      
      await db.insert(users).values({
        username: 'admin',
        email: 'admin@example.com',
        passwordHash: passwordHash,
        role: 'admin'
      });
      
      console.log('Admin user created');
    }
    
    // Add basic categories if they don't exist
    const categories = [
      'Antibiotics', 
      'Pain Relief', 
      'Cardiovascular',
      'Respiratory',
      'Diabetes',
      'Allergy',
      'Mental Health',
      'Hormone',
      'Gastrointestinal',
      'Other'
    ];
    
    for (const category of categories) {
      try {
        await db.insert(schema.categories).values({
          name: category,
          description: `${category} medications`
        });
        console.log(`Added category: ${category}`);
      } catch (error: any) {
        // Ignore duplicate key errors
        if (error && error.message && !error.message.includes('duplicate key')) {
          console.error(`Error adding category ${category}:`, error);
        }
      }
    }
    
    console.log('Database seeding complete');
  } catch (error) {
    console.error('Error seeding database:', error);
    throw error;
  }
}