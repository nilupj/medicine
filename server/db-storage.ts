import { db } from './database';
import { eq, like, desc, sql, and, or, inArray } from 'drizzle-orm';
import { 
  medicines, 
  categories, 
  recentSearches,
  drugInteractions,
  users,
  medicationSchedules,
  scheduleFrequency,
  reminderTimes,
  medicationLogs,
  type Medicine, 
  type InsertMedicine,
  type Category,
  type InsertCategory,
  type RecentSearch,
  type InsertRecentSearch,
  type DrugInteraction,
  type InsertDrugInteraction,
  type User,
  type InsertUser,
  type CreateUserInput,
  type MedicationSchedule,
  type InsertMedicationSchedule,
  type ScheduleFrequency,
  type InsertScheduleFrequency,
  type ReminderTime,
  type InsertReminderTime,
  type MedicationLog,
  type InsertMedicationLog
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
  
  // User authentication methods
  async createUser(userInput: CreateUserInput): Promise<User> {
    const { password, ...userData } = userInput;
    
    // In a real app, you would hash the password here
    // For now, we're storing it directly for simplicity
    const result = await db.insert(users)
      .values({
        ...userData,
        passwordHash: password, // In production, this should be hashed!
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning();
    
    return result[0];
  }
  
  async getUserById(id: number): Promise<User | undefined> {
    const results = await db.select().from(users).where(eq(users.id, id));
    return results[0];
  }
  
  async getUserByUsername(username: string): Promise<User | undefined> {
    const results = await db.select().from(users)
      .where(eq(users.username, username));
    return results[0];
  }
  
  async updateUser(id: number, userData: Partial<InsertUser>): Promise<User | undefined> {
    const result = await db.update(users)
      .set({
        ...userData,
        updatedAt: new Date()
      })
      .where(eq(users.id, id))
      .returning();
    
    return result[0];
  }
  
  // Medication schedule methods
  async createMedicationSchedule(scheduleData: InsertMedicationSchedule): Promise<MedicationSchedule> {
    const result = await db.insert(medicationSchedules)
      .values({
        ...scheduleData,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning();
    
    return result[0];
  }
  
  async getMedicationScheduleById(id: number): Promise<MedicationSchedule | undefined> {
    const results = await db.select().from(medicationSchedules)
      .where(eq(medicationSchedules.id, id));
    return results[0];
  }
  
  async getMedicationSchedulesForUser(userId: number): Promise<MedicationSchedule[]> {
    return db.select().from(medicationSchedules)
      .where(eq(medicationSchedules.userId, userId))
      .orderBy(desc(medicationSchedules.updatedAt));
  }
  
  async getMedicationSchedulesForMedicine(medicineId: number): Promise<MedicationSchedule[]> {
    return db.select().from(medicationSchedules)
      .where(eq(medicationSchedules.medicineId, medicineId))
      .orderBy(desc(medicationSchedules.updatedAt));
  }
  
  async updateMedicationSchedule(id: number, scheduleData: Partial<InsertMedicationSchedule>): Promise<MedicationSchedule | undefined> {
    const result = await db.update(medicationSchedules)
      .set({
        ...scheduleData,
        updatedAt: new Date()
      })
      .where(eq(medicationSchedules.id, id))
      .returning();
    
    return result[0];
  }
  
  async deleteMedicationSchedule(id: number): Promise<boolean> {
    // First delete related records in child tables
    await db.delete(reminderTimes).where(eq(reminderTimes.scheduleId, id));
    await db.delete(scheduleFrequency).where(eq(scheduleFrequency.scheduleId, id));
    await db.delete(medicationLogs).where(eq(medicationLogs.scheduleId, id));
    
    // Then delete the schedule itself
    const result = await db.delete(medicationSchedules)
      .where(eq(medicationSchedules.id, id))
      .returning();
    
    return result.length > 0;
  }
  
  // Schedule frequency methods
  async createScheduleFrequency(frequencyData: InsertScheduleFrequency): Promise<ScheduleFrequency> {
    const result = await db.insert(scheduleFrequency)
      .values({
        ...frequencyData,
        createdAt: new Date()
      })
      .returning();
    
    return result[0];
  }
  
  async getScheduleFrequencyForSchedule(scheduleId: number): Promise<ScheduleFrequency | undefined> {
    const results = await db.select().from(scheduleFrequency)
      .where(eq(scheduleFrequency.scheduleId, scheduleId));
    return results[0];
  }
  
  async updateScheduleFrequency(id: number, frequencyData: Partial<InsertScheduleFrequency>): Promise<ScheduleFrequency | undefined> {
    const result = await db.update(scheduleFrequency)
      .set(frequencyData)
      .where(eq(scheduleFrequency.id, id))
      .returning();
    
    return result[0];
  }
  
  // Reminder times methods
  async createReminderTime(reminderData: InsertReminderTime): Promise<ReminderTime> {
    const result = await db.insert(reminderTimes)
      .values({
        ...reminderData,
        createdAt: new Date()
      })
      .returning();
    
    return result[0];
  }
  
  async getReminderTimesForSchedule(scheduleId: number): Promise<ReminderTime[]> {
    return db.select().from(reminderTimes)
      .where(eq(reminderTimes.scheduleId, scheduleId))
      .orderBy(reminderTimes.time);
  }
  
  async updateReminderTime(id: number, reminderData: Partial<InsertReminderTime>): Promise<ReminderTime | undefined> {
    const result = await db.update(reminderTimes)
      .set(reminderData)
      .where(eq(reminderTimes.id, id))
      .returning();
    
    return result[0];
  }
  
  async deleteReminderTime(id: number): Promise<boolean> {
    const result = await db.delete(reminderTimes)
      .where(eq(reminderTimes.id, id))
      .returning();
    
    return result.length > 0;
  }
  
  // Medication logs methods
  async createMedicationLog(logData: InsertMedicationLog): Promise<MedicationLog> {
    const result = await db.insert(medicationLogs)
      .values({
        ...logData,
        createdAt: new Date()
      })
      .returning();
    
    return result[0];
  }
  
  async getMedicationLogsForSchedule(scheduleId: number, limit: number = 100): Promise<MedicationLog[]> {
    return db.select().from(medicationLogs)
      .where(eq(medicationLogs.scheduleId, scheduleId))
      .orderBy(desc(medicationLogs.takenAt))
      .limit(limit);
  }
  
  async getMedicationLogsForUser(userId: number, limit: number = 30): Promise<MedicationLog[]> {
    // First get all schedules for this user
    const userSchedules = await this.getMedicationSchedulesForUser(userId);
    const scheduleIds = userSchedules.map(schedule => schedule.id);
    
    if (scheduleIds.length === 0) {
      return [];
    }
    
    // Then get logs for these schedules
    return db.select().from(medicationLogs)
      .where(inArray(medicationLogs.scheduleId, scheduleIds))
      .orderBy(desc(medicationLogs.takenAt))
      .limit(limit);
  }
  
  async updateMedicationLog(id: number, logData: Partial<InsertMedicationLog>): Promise<MedicationLog | undefined> {
    const result = await db.update(medicationLogs)
      .set(logData)
      .where(eq(medicationLogs.id, id))
      .returning();
    
    return result[0];
  }
  
  async deleteMedicationLog(id: number): Promise<boolean> {
    const result = await db.delete(medicationLogs)
      .where(eq(medicationLogs.id, id))
      .returning();
    
    return result.length > 0;
  }
}