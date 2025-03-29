import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { medicines, categories, recentSearches } from '@shared/schema';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Get database URL from environment variable
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error('DATABASE_URL environment variable not set');
  process.exit(1);
}

// Create neon client
const sql = neon(databaseUrl);

// Create drizzle client
export const db = drizzle(sql, { schema: { medicines, categories, recentSearches } });

// Initialize the database
export async function initDatabase() {
  try {
    console.log('Initializing database...');
    
    // Try to run the DB push script to create tables using Drizzle Kit
    try {
      console.log('Checking if database tables exist...');
      
      // Try to count categories - this will throw an error if table doesn't exist
      try {
        const countResult = await sql`SELECT COUNT(*) FROM categories`;
        const count = parseInt(countResult[0].count);
        
        if (count > 0) {
          console.log(`Database already contains ${count} categories.`);
          
          // Check medicines
          const medCountResult = await sql`SELECT COUNT(*) FROM medicines`;
          const medCount = parseInt(medCountResult[0].count);
          
          if (medCount > 0) {
            console.log(`Database already contains ${medCount} medicines.`);
            return; // Database is already populated
          }
        }
      } catch (tableErr) {
        console.log('Tables do not exist yet, will create and seed them.');
        // Create tables via direct query since we need to seed them
        await sql`
          CREATE TABLE IF NOT EXISTS categories (
            id SERIAL PRIMARY KEY,
            name TEXT NOT NULL,
            description TEXT
          )
        `;
        
        await sql`
          CREATE TABLE IF NOT EXISTS medicines (
            id SERIAL PRIMARY KEY,
            name TEXT NOT NULL,
            aliases TEXT,
            description TEXT NOT NULL,
            category TEXT NOT NULL,
            uses TEXT,
            side_effects TEXT,
            dosage TEXT,
            forms TEXT,
            warnings TEXT,
            otc_rx TEXT,
            last_updated TIMESTAMP WITH TIME ZONE
          )
        `;
        
        await sql`
          CREATE TABLE IF NOT EXISTS recent_searches (
            id SERIAL PRIMARY KEY,
            search_term TEXT NOT NULL,
            timestamp TIMESTAMP WITH TIME ZONE
          )
        `;
      }
    } catch (err) {
      console.log('Error checking/creating database tables:', err);
    }
    
    console.log('Seeding database with initial data...');
    await seedDatabase();
  } catch (error) {
    console.error('Error initializing database:', error);
  }
}

// Seed the database with initial data
async function seedDatabase() {
  // Import the medicine data
  const { medicineData } = await import('./data/medicines');
  
  try {
    // Create categories
    const categoryNames = [
      'Pain Relief', 'Anti-inflammatory', 'Fever Reducer', 'Antibiotics', 
      'Antivirals', 'Cardiovascular', 'Diabetes', 'Respiratory', 
      'Gastrointestinal', 'Mental Health', 'Allergies'
    ];
    
    const categoryMap: Record<string, number> = {};
    
    // Insert categories
    for (const name of categoryNames) {
      const description = `Medications for ${name.toLowerCase()}`;
      const result = await db.insert(categories).values({ name, description }).returning();
      
      if (result[0]) {
        categoryMap[name] = result[0].id;
      }
    }
    
    // Insert medicines
    for (const med of medicineData) {
      await db.insert(medicines).values({
        name: med.name,
        aliases: med.aliases,
        description: med.description,
        category: med.category,
        uses: med.uses,
        sideEffects: med.sideEffects,
        dosage: med.dosage,
        forms: med.forms,
        warnings: med.warnings,
        otcRx: med.otcRx,
        lastUpdated: new Date()
      });
    }
    
    console.log('Database seeded successfully.');
  } catch (error) {
    console.error('Error seeding database:', error);
    throw error;
  }
}