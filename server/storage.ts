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
import { medicineData } from "./data/medicines";

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
     'Gastrointestinal', 'Mental Health', 'Allergies'].forEach(name => {
      const category = this.createCategory({ name, description: `Medications for ${name.toLowerCase()}` });
      categoryMap[name] = category.id;
    });
    
    // Seed medicine data
    medicineData.forEach(med => {
      this.createMedicine({
        name: med.name,
        aliases: med.aliases,
        description: med.description,
        category: med.category,
        uses: med.uses,
        sideEffects: med.sideEffects,
        dosage: med.dosage,
        forms: med.forms,
        warnings: med.warnings,
        otcRx: med.otcRx
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
    const medicine: Medicine = { 
      ...insertMedicine, 
      id,
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
    const category: Category = { ...insertCategory, id };
    this.categories.set(id, category);
    return category;
  }

  // Recent searches methods
  async getRecentSearches(limit: number = 5): Promise<RecentSearch[]> {
    return Array.from(this.searches.values())
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
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
}

export const storage = new MemStorage();
