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
}

// Use PostgreSQL storage for persistence
export const storage = new PostgresStorage();
