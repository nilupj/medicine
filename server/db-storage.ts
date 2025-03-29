import { db } from './database';
import { eq, like, desc, sql } from 'drizzle-orm';
import { 
  medicines, 
  categories, 
  recentSearches, 
  type Medicine, 
  type InsertMedicine,
  type Category,
  type InsertCategory,
  type RecentSearch,
  type InsertRecentSearch
} from "@shared/schema";
import { IStorage } from './storage';

export class PostgresStorage implements IStorage {
  // Medicine methods
  async getMedicines(limit: number = 100, offset: number = 0): Promise<Medicine[]> {
    return db.select().from(medicines).limit(limit).offset(offset);
  }

  async getMedicineById(id: number): Promise<Medicine | undefined> {
    const results = await db.select().from(medicines).where(eq(medicines.id, id));
    return results[0];
  }

  async getMedicineByName(name: string): Promise<Medicine | undefined> {
    const results = await db.select().from(medicines)
      .where(eq(sql`LOWER(${medicines.name})`, name.toLowerCase()));
    return results[0];
  }

  async searchMedicines(query: string, limit: number = 10): Promise<Medicine[]> {
    const lowerQuery = query.toLowerCase();
    return db.select().from(medicines)
      .where(
        sql`LOWER(${medicines.name}) LIKE ${`%${lowerQuery}%`} OR 
            LOWER(${medicines.aliases}) LIKE ${`%${lowerQuery}%`}`
      )
      .limit(limit);
  }

  async createMedicine(insertMedicine: InsertMedicine): Promise<Medicine> {
    const result = await db.insert(medicines)
      .values({
        ...insertMedicine,
        lastUpdated: new Date()
      })
      .returning();
    
    return result[0];
  }

  // Category methods
  async getCategories(): Promise<Category[]> {
    return db.select().from(categories);
  }

  async getCategoryById(id: number): Promise<Category | undefined> {
    const results = await db.select().from(categories).where(eq(categories.id, id));
    return results[0];
  }

  async createCategory(insertCategory: InsertCategory): Promise<Category> {
    const result = await db.insert(categories)
      .values(insertCategory)
      .returning();
    
    return result[0];
  }

  // Recent searches methods
  async getRecentSearches(limit: number = 5): Promise<RecentSearch[]> {
    return db.select().from(recentSearches)
      .orderBy(desc(recentSearches.timestamp))
      .limit(limit);
  }

  async addRecentSearch(insertSearch: InsertRecentSearch): Promise<RecentSearch> {
    const result = await db.insert(recentSearches)
      .values({
        ...insertSearch,
        timestamp: new Date()
      })
      .returning();
    
    return result[0];
  }
}