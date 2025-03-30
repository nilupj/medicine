import { db } from './database';
import { eq, like, desc, sql, and, or, inArray } from 'drizzle-orm';
import { 
  medicines, 
  categories, 
  recentSearches,
  drugInteractions,
  type Medicine, 
  type InsertMedicine,
  type Category,
  type InsertCategory,
  type RecentSearch,
  type InsertRecentSearch,
  type DrugInteraction,
  type InsertDrugInteraction
} from "@shared/schema";
import { IStorage, DrugInteractionDetail } from './storage';

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

  async getMedicineByDrugCode(drugCode: string): Promise<Medicine | undefined> {
    const results = await db.select().from(medicines)
      .where(eq(medicines.drugCode, drugCode));
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

  // Drug interaction methods
  async getInteractions(medicineId: number): Promise<DrugInteractionDetail[]> {
    // Get all interactions where this medicine is involved (either medicine1 or medicine2)
    const interactions = await db.select()
      .from(drugInteractions)
      .where(
        or(
          eq(drugInteractions.medicine1Id, medicineId),
          eq(drugInteractions.medicine2Id, medicineId)
        )
      );
    
    // For each interaction, fetch the details of both medicines
    const detailedInteractions: DrugInteractionDetail[] = [];
    
    for (const interaction of interactions) {
      const medicine1 = await this.getMedicineById(interaction.medicine1Id);
      const medicine2 = await this.getMedicineById(interaction.medicine2Id);
      
      if (medicine1 && medicine2) {
        detailedInteractions.push({
          ...interaction,
          medicine1,
          medicine2
        });
      }
    }
    
    return detailedInteractions;
  }

  async checkInteractions(medicineIds: number[]): Promise<DrugInteractionDetail[]> {
    if (medicineIds.length < 2) {
      return [];
    }
    
    // We need to find all interactions where both medicines are in the provided list
    // First, get all interactions involving any medicine in the list
    const interactions = await db.select()
      .from(drugInteractions)
      .where(
        or(
          inArray(drugInteractions.medicine1Id, medicineIds),
          inArray(drugInteractions.medicine2Id, medicineIds)
        )
      );
    
    // Filter to only include interactions where both medicines are in the list
    const relevantInteractions = interactions.filter(interaction => {
      return medicineIds.includes(interaction.medicine1Id) && 
             medicineIds.includes(interaction.medicine2Id);
    });
    
    // Add medicine details
    const detailedInteractions: DrugInteractionDetail[] = [];
    
    for (const interaction of relevantInteractions) {
      const medicine1 = await this.getMedicineById(interaction.medicine1Id);
      const medicine2 = await this.getMedicineById(interaction.medicine2Id);
      
      if (medicine1 && medicine2) {
        detailedInteractions.push({
          ...interaction,
          medicine1,
          medicine2
        });
      }
    }
    
    return detailedInteractions;
  }

  async addInteraction(interaction: InsertDrugInteraction): Promise<DrugInteraction> {
    // Always store with the lower medicine ID as medicine1Id to enforce ordering
    let medicine1Id = interaction.medicine1Id;
    let medicine2Id = interaction.medicine2Id;
    
    if (medicine1Id > medicine2Id) {
      [medicine1Id, medicine2Id] = [medicine2Id, medicine1Id];
    }
    
    const result = await db.insert(drugInteractions)
      .values({
        ...interaction,
        medicine1Id,
        medicine2Id,
        createdAt: new Date()
      })
      .returning();
    
    return result[0];
  }

  async updateInteraction(id: number, interaction: Partial<InsertDrugInteraction>): Promise<DrugInteraction | undefined> {
    // If both medicine IDs are being updated, ensure proper ordering
    if (interaction.medicine1Id !== undefined && interaction.medicine2Id !== undefined) {
      let medicine1Id = interaction.medicine1Id;
      let medicine2Id = interaction.medicine2Id;
      
      if (medicine1Id > medicine2Id) {
        [medicine1Id, medicine2Id] = [medicine2Id, medicine1Id];
      }
      
      interaction.medicine1Id = medicine1Id;
      interaction.medicine2Id = medicine2Id;
    }
    
    const result = await db.update(drugInteractions)
      .set(interaction)
      .where(eq(drugInteractions.id, id))
      .returning();
    
    return result[0];
  }

  async deleteInteraction(id: number): Promise<boolean> {
    const result = await db.delete(drugInteractions)
      .where(eq(drugInteractions.id, id))
      .returning();
    
    return result.length > 0;
  }
}