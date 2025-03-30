import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

neonConfig.webSocketConstructor = ws;

// Provide detailed error messages for database connection issues
if (!process.env.DATABASE_URL) {
  console.error(`
  ===============================
  DATABASE CONNECTION ERROR
  ===============================
  
  DATABASE_URL environment variable is not set. 
  
  For local development: Make sure your .env file contains DATABASE_URL.
  For Railway deployment: Make sure to provision a PostgreSQL database and 
  Railway will automatically set the DATABASE_URL environment variable.
  
  ===============================
  `);
  
  throw new Error("DATABASE_URL must be set. Did you forget to provision a database?");
}

// Create database connection
const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  // Add connection configuration for better stability
  max: 20, // Maximum number of clients
  idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
  connectionTimeoutMillis: 5000, // Return an error after 5 seconds if connection not established
});

// Add a connection test
pool.on('error', (err) => {
  console.error('Unexpected error on idle database client', err);
  process.exit(-1);
});

// Test the connection
pool.query('SELECT NOW()', (err) => {
  if (err) {
    console.error('Database connection error:', err);
  } else {
    console.log('Database connection established successfully');
  }
});

const db = drizzle({ client: pool, schema });

export { pool, db };
