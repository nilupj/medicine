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
import { medicineData } from "./data/medicines";
import { PostgresStorage } from "./db-storage";

// Structure for interaction results with medicine details
export interface DrugInteractionDetail extends DrugInteraction {
  medicine1: Medicine;
  medicine2: Medicine;
}

export interface IStorage {
  // Medicine operations
  getMedicines(limit?: number, offset?: number): Promise<Medicine[]>;
  getMedicineById(id: number): Promise<Medicine | undefined>;
  getMedicineByName(name: string): Promise<Medicine | undefined>;
  getMedicineByDrugCode(drugCode: string): Promise<Medicine | undefined>;
  searchMedicines(query: string, limit?: number): Promise<Medicine[]>;
  createMedicine(medicine: InsertMedicine): Promise<Medicine>;

  // Category operations
  getCategories(): Promise<Category[]>;
  getCategoryById(id: number): Promise<Category | undefined>;
  createCategory(category: InsertCategory): Promise<Category>;

  // Recent search operations
  getRecentSearches(limit?: number): Promise<RecentSearch[]>;
  addRecentSearch(search: InsertRecentSearch): Promise<RecentSearch>;
  
  // Drug interaction operations
  getInteractions(medicineId: number): Promise<DrugInteractionDetail[]>;
  checkInteractions(medicineIds: number[]): Promise<DrugInteractionDetail[]>;
  addInteraction(interaction: InsertDrugInteraction): Promise<DrugInteraction>;
  updateInteraction(id: number, interaction: Partial<InsertDrugInteraction>): Promise<DrugInteraction | undefined>;
  deleteInteraction(id: number): Promise<boolean>;
  
  // User operations
  createUser(userInput: CreateUserInput): Promise<User>;
  getUserById(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  updateUser(id: number, userData: Partial<InsertUser>): Promise<User | undefined>;
  
  // Medication schedule operations
  createMedicationSchedule(scheduleData: InsertMedicationSchedule): Promise<MedicationSchedule>;
  getMedicationScheduleById(id: number): Promise<MedicationSchedule | undefined>;
  getMedicationSchedulesForUser(userId: number): Promise<MedicationSchedule[]>;
  getMedicationSchedulesForMedicine(medicineId: number): Promise<MedicationSchedule[]>;
  updateMedicationSchedule(id: number, scheduleData: Partial<InsertMedicationSchedule>): Promise<MedicationSchedule | undefined>;
  deleteMedicationSchedule(id: number): Promise<boolean>;
  
  // Schedule frequency operations
  createScheduleFrequency(frequencyData: InsertScheduleFrequency): Promise<ScheduleFrequency>;
  getScheduleFrequencyForSchedule(scheduleId: number): Promise<ScheduleFrequency | undefined>;
  updateScheduleFrequency(id: number, frequencyData: Partial<InsertScheduleFrequency>): Promise<ScheduleFrequency | undefined>;
  
  // Reminder time operations
  createReminderTime(reminderData: InsertReminderTime): Promise<ReminderTime>;
  getReminderTimesForSchedule(scheduleId: number): Promise<ReminderTime[]>;
  updateReminderTime(id: number, reminderData: Partial<InsertReminderTime>): Promise<ReminderTime | undefined>;
  deleteReminderTime(id: number): Promise<boolean>;
  
  // Medication log operations
  createMedicationLog(logData: InsertMedicationLog): Promise<MedicationLog>;
  getMedicationLogsForSchedule(scheduleId: number, limit?: number): Promise<MedicationLog[]>;
  getMedicationLogsForUser(userId: number, limit?: number): Promise<MedicationLog[]>;
  updateMedicationLog(id: number, logData: Partial<InsertMedicationLog>): Promise<MedicationLog | undefined>;
  deleteMedicationLog(id: number): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private medicines: Map<number, Medicine>;
  private categories: Map<number, Category>;
  private searches: Map<number, RecentSearch>;
  
  private medicineCurrentId: number;
  private categoryCurrentId: number;
  private searchCurrentId: number;

  constructor() {
    this.medicines = new Map();
    this.categories = new Map();
    this.searches = new Map();
    
    this.medicineCurrentId = 1;
    this.categoryCurrentId = 1;
    this.searchCurrentId = 1;
    
    // Populate with initial data
    this.initializeData();
  }

  private initializeData() {
    // Seed categories
    const categoryMap: Record<string, number> = {};
    
    ['Pain Relief', 'Anti-inflammatory', 'Fever Reducer', 'Antibiotics', 
     'Antivirals', 'Cardiovascular', 'Diabetes', 'Respiratory', 
     'Gastrointestinal', 'Mental Health', 'Allergies'].forEach(async (name) => {
      const category = await this.createCategory({ name, description: `Medications for ${name.toLowerCase()}` });
      categoryMap[name] = category.id;
    });
    
    // Seed medicine data
    medicineData.forEach(async (med) => {
      await this.createMedicine({
        name: med.name,
        aliases: med.aliases || null,
        description: med.description,
        category: med.category,
        uses: med.uses || null,
        sideEffects: med.sideEffects || null,
        dosage: med.dosage || null,
        forms: med.forms || null,
        warnings: med.warnings || null,
        otcRx: med.otcRx || null
      });
    });
  }

  // Medicine methods
  async getMedicines(limit: number = 100, offset: number = 0): Promise<Medicine[]> {
    const medicines = Array.from(this.medicines.values());
    return medicines.slice(offset, offset + limit);
  }

  async getMedicineById(id: number): Promise<Medicine | undefined> {
    return this.medicines.get(id);
  }

  async getMedicineByName(name: string): Promise<Medicine | undefined> {
    name = name.toLowerCase();
    return Array.from(this.medicines.values()).find(
      medicine => medicine.name.toLowerCase() === name
    );
  }
  
  async getMedicineByDrugCode(drugCode: string): Promise<Medicine | undefined> {
    return Array.from(this.medicines.values()).find(
      medicine => medicine.drugCode === drugCode
    );
  }

  async searchMedicines(query: string, limit: number = 10): Promise<Medicine[]> {
    query = query.toLowerCase();
    return Array.from(this.medicines.values())
      .filter(medicine => {
        const nameMatch = medicine.name.toLowerCase().includes(query);
        const aliasMatch = medicine.aliases?.toLowerCase().includes(query);
        return nameMatch || aliasMatch;
      })
      .slice(0, limit);
  }

  async createMedicine(insertMedicine: InsertMedicine): Promise<Medicine> {
    const id = this.medicineCurrentId++;
    const now = new Date();
    
    // Ensure all nullable fields have proper null values instead of undefined
    const medicine: Medicine = { 
      id,
      name: insertMedicine.name, 
      description: insertMedicine.description,
      category: insertMedicine.category,
      aliases: insertMedicine.aliases ?? null,
      composition: insertMedicine.composition ?? null,
      uses: insertMedicine.uses ?? null,
      sideEffects: insertMedicine.sideEffects ?? null,
      dosage: insertMedicine.dosage ?? null,
      forms: insertMedicine.forms ?? null,
      warnings: insertMedicine.warnings ?? null,
      otcRx: insertMedicine.otcRx ?? null,
      // Drug list fields
      drugCode: insertMedicine.drugCode ?? null,
      formulation: insertMedicine.formulation ?? null,
      strength: insertMedicine.strength ?? null,
      countNumber: insertMedicine.countNumber ?? null,
      l1Rate: insertMedicine.l1Rate ?? null,
      l1Lab: insertMedicine.l1Lab ?? null,
      lastUpdated: now
    };
    this.medicines.set(id, medicine);
    return medicine;
  }

  // Category methods
  async getCategories(): Promise<Category[]> {
    return Array.from(this.categories.values());
  }

  async getCategoryById(id: number): Promise<Category | undefined> {
    return this.categories.get(id);
  }

  async createCategory(insertCategory: InsertCategory): Promise<Category> {
    const id = this.categoryCurrentId++;
    const category: Category = { 
      id,
      name: insertCategory.name,
      description: insertCategory.description ?? null
    };
    this.categories.set(id, category);
    return category;
  }

  // Recent searches methods
  async getRecentSearches(limit: number = 5): Promise<RecentSearch[]> {
    return Array.from(this.searches.values())
      .sort((a, b) => {
        // Handle possibly null timestamps
        const timeA = a.timestamp?.getTime() ?? 0;
        const timeB = b.timestamp?.getTime() ?? 0;
        return timeB - timeA;
      })
      .slice(0, limit);
  }

  async addRecentSearch(insertSearch: InsertRecentSearch): Promise<RecentSearch> {
    const id = this.searchCurrentId++;
    const now = new Date();
    const search: RecentSearch = { 
      ...insertSearch, 
      id,
      timestamp: now
    };
    this.searches.set(id, search);
    return search;
  }

  // Drug interaction methods (stub implementation for MemStorage)
  async getInteractions(medicineId: number): Promise<DrugInteractionDetail[]> {
    // Not implemented in in-memory storage
    return [];
  }

  async checkInteractions(medicineIds: number[]): Promise<DrugInteractionDetail[]> {
    // Not implemented in in-memory storage
    return [];
  }

  async addInteraction(interaction: InsertDrugInteraction): Promise<DrugInteraction> {
    throw new Error("Drug interactions not implemented in in-memory storage");
  }

  async updateInteraction(id: number, interaction: Partial<InsertDrugInteraction>): Promise<DrugInteraction | undefined> {
    throw new Error("Drug interactions not implemented in in-memory storage");
  }

  async deleteInteraction(id: number): Promise<boolean> {
    throw new Error("Drug interactions not implemented in in-memory storage");
  }
  
  // User methods (stub implementations)
  async createUser(userInput: CreateUserInput): Promise<User> {
    throw new Error("User management not implemented in in-memory storage");
  }
  
  async getUserById(id: number): Promise<User | undefined> {
    throw new Error("User management not implemented in in-memory storage");
  }
  
  async getUserByUsername(username: string): Promise<User | undefined> {
    throw new Error("User management not implemented in in-memory storage");
  }
  
  async updateUser(id: number, userData: Partial<InsertUser>): Promise<User | undefined> {
    throw new Error("User management not implemented in in-memory storage");
  }
  
  // Medication schedule methods (stub implementations)
  async createMedicationSchedule(scheduleData: InsertMedicationSchedule): Promise<MedicationSchedule> {
    throw new Error("Medication scheduling not implemented in in-memory storage");
  }
  
  async getMedicationScheduleById(id: number): Promise<MedicationSchedule | undefined> {
    throw new Error("Medication scheduling not implemented in in-memory storage");
  }
  
  async getMedicationSchedulesForUser(userId: number): Promise<MedicationSchedule[]> {
    throw new Error("Medication scheduling not implemented in in-memory storage");
  }
  
  async getMedicationSchedulesForMedicine(medicineId: number): Promise<MedicationSchedule[]> {
    throw new Error("Medication scheduling not implemented in in-memory storage");
  }
  
  async updateMedicationSchedule(id: number, scheduleData: Partial<InsertMedicationSchedule>): Promise<MedicationSchedule | undefined> {
    throw new Error("Medication scheduling not implemented in in-memory storage");
  }
  
  async deleteMedicationSchedule(id: number): Promise<boolean> {
    throw new Error("Medication scheduling not implemented in in-memory storage");
  }
  
  // Schedule frequency methods (stub implementations)
  async createScheduleFrequency(frequencyData: InsertScheduleFrequency): Promise<ScheduleFrequency> {
    throw new Error("Schedule frequency not implemented in in-memory storage");
  }
  
  async getScheduleFrequencyForSchedule(scheduleId: number): Promise<ScheduleFrequency | undefined> {
    throw new Error("Schedule frequency not implemented in in-memory storage");
  }
  
  async updateScheduleFrequency(id: number, frequencyData: Partial<InsertScheduleFrequency>): Promise<ScheduleFrequency | undefined> {
    throw new Error("Schedule frequency not implemented in in-memory storage");
  }
  
  // Reminder time methods (stub implementations)
  async createReminderTime(reminderData: InsertReminderTime): Promise<ReminderTime> {
    throw new Error("Reminder times not implemented in in-memory storage");
  }
  
  async getReminderTimesForSchedule(scheduleId: number): Promise<ReminderTime[]> {
    throw new Error("Reminder times not implemented in in-memory storage");
  }
  
  async updateReminderTime(id: number, reminderData: Partial<InsertReminderTime>): Promise<ReminderTime | undefined> {
    throw new Error("Reminder times not implemented in in-memory storage");
  }
  
  async deleteReminderTime(id: number): Promise<boolean> {
    throw new Error("Reminder times not implemented in in-memory storage");
  }
  
  // Medication log methods (stub implementations)
  async createMedicationLog(logData: InsertMedicationLog): Promise<MedicationLog> {
    throw new Error("Medication logs not implemented in in-memory storage");
  }
  
  async getMedicationLogsForSchedule(scheduleId: number, limit: number = 100): Promise<MedicationLog[]> {
    throw new Error("Medication logs not implemented in in-memory storage");
  }
  
  async getMedicationLogsForUser(userId: number, limit: number = 30): Promise<MedicationLog[]> {
    throw new Error("Medication logs not implemented in in-memory storage");
  }
  
  async updateMedicationLog(id: number, logData: Partial<InsertMedicationLog>): Promise<MedicationLog | undefined> {
    throw new Error("Medication logs not implemented in in-memory storage");
  }
  
  async deleteMedicationLog(id: number): Promise<boolean> {
    throw new Error("Medication logs not implemented in in-memory storage");
  }
}

// Use PostgreSQL storage for persistence
export const storage = new PostgresStorage();
