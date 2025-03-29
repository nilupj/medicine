import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Main medicine table
export const medicines = pgTable("medicines", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  aliases: text("aliases"),
  description: text("description").notNull(),
  category: text("category").notNull(),
  composition: text("composition"),
  uses: text("uses"),
  sideEffects: text("side_effects"),
  dosage: text("dosage"),
  forms: text("forms"),
  warnings: text("warnings"),
  otcRx: text("otc_rx"),
  lastUpdated: timestamp("last_updated").defaultNow(),
});

// Category tags for medicines
export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description"),
});

// User's recent searches
export const recentSearches = pgTable("recent_searches", {
  id: serial("id").primaryKey(),
  searchTerm: text("search_term").notNull(),
  timestamp: timestamp("timestamp").defaultNow(),
});

// Drug interactions table
export const drugInteractions = pgTable("drug_interactions", {
  id: serial("id").primaryKey(),
  medicine1Id: integer("medicine1_id").notNull().references(() => medicines.id),
  medicine2Id: integer("medicine2_id").notNull().references(() => medicines.id),
  severity: text("severity").notNull(),
  description: text("description").notNull(),
  effects: text("effects").notNull(),
  management: text("management"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Insert schemas
export const insertMedicineSchema = createInsertSchema(medicines).omit({
  id: true,
  lastUpdated: true,
});

export const insertCategorySchema = createInsertSchema(categories).omit({
  id: true,
});

export const insertRecentSearchSchema = createInsertSchema(recentSearches).omit({
  id: true,
  timestamp: true,
});

export const insertDrugInteractionSchema = createInsertSchema(drugInteractions)
  .omit({
    id: true,
    createdAt: true,
  })
  .extend({
    severity: z.enum(['Minor', 'Moderate', 'Major']),
  });

// Types for our application
export type Medicine = typeof medicines.$inferSelect;
export type InsertMedicine = z.infer<typeof insertMedicineSchema>;

export type Category = typeof categories.$inferSelect;
export type InsertCategory = z.infer<typeof insertCategorySchema>;

export type RecentSearch = typeof recentSearches.$inferSelect;
export type InsertRecentSearch = z.infer<typeof insertRecentSearchSchema>;

export type DrugInteraction = typeof drugInteractions.$inferSelect;
export type InsertDrugInteraction = z.infer<typeof insertDrugInteractionSchema>;
