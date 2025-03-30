import { pgTable, text, serial, integer, boolean, timestamp, numeric, time, date } from "drizzle-orm/pg-core";
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
  // New fields from drug list
  drugCode: text("drug_code"),
  formulation: text("formulation"),
  strength: text("strength"),
  countNumber: integer("count_number"),
  l1Rate: numeric("l1_rate", { precision: 10, scale: 2 }),
  l1Lab: text("l1_lab"),
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

// Users table for reminder functionality
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email").unique(),
  passwordHash: text("password_hash").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Medication schedules
export const medicationSchedules = pgTable("medication_schedules", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  medicineId: integer("medicine_id").notNull().references(() => medicines.id),
  name: text("name").notNull(),
  dosage: text("dosage").notNull(),
  dosageUnit: text("dosage_unit").notNull().default("mg"),
  instructions: text("instructions"),
  startDate: date("start_date").notNull(),
  endDate: date("end_date"),
  notes: text("notes"),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Schedule frequency types: daily, specific days of week, etc.
export const scheduleFrequency = pgTable("schedule_frequency", {
  id: serial("id").primaryKey(),
  scheduleId: integer("schedule_id").notNull().references(() => medicationSchedules.id),
  frequencyType: text("frequency_type").notNull(), // 'daily', 'weekly', 'monthly', 'as_needed'
  daysOfWeek: text("days_of_week"), // Comma-separated list of days (0-6, where 0 is Sunday)
  dayOfMonth: integer("day_of_month"), // Day of month (1-31)
  interval: integer("interval").default(1), // For every X days/weeks/etc.
  createdAt: timestamp("created_at").defaultNow(),
});

// Reminder times for each schedule
export const reminderTimes = pgTable("reminder_times", {
  id: serial("id").primaryKey(),
  scheduleId: integer("schedule_id").notNull().references(() => medicationSchedules.id),
  time: time("time").notNull(),
  label: text("label"), // e.g., "Morning", "With lunch", etc.
  createdAt: timestamp("created_at").defaultNow(),
});

// Completed medication logs
export const medicationLogs = pgTable("medication_logs", {
  id: serial("id").primaryKey(),
  scheduleId: integer("schedule_id").notNull().references(() => medicationSchedules.id),
  reminderTimeId: integer("reminder_time_id").references(() => reminderTimes.id),
  takenAt: timestamp("taken_at").notNull(),
  scheduled: timestamp("scheduled"),
  status: text("status").notNull(), // 'taken', 'skipped', 'late'
  notes: text("notes"),
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

// Add insert schemas for new tables
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertMedicationScheduleSchema = createInsertSchema(medicationSchedules).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertScheduleFrequencySchema = createInsertSchema(scheduleFrequency).omit({
  id: true,
  createdAt: true,
});

export const insertReminderTimeSchema = createInsertSchema(reminderTimes).omit({
  id: true,
  createdAt: true,
});

export const insertMedicationLogSchema = createInsertSchema(medicationLogs).omit({
  id: true,
  createdAt: true,
});

// Extend schemas with validations
export const extendedUserSchema = insertUserSchema.extend({
  email: z.string().email().optional(),
  password: z.string().min(8),
});

export const extendedScheduleFrequencySchema = insertScheduleFrequencySchema.extend({
  frequencyType: z.enum(['daily', 'weekly', 'monthly', 'as_needed']),
});

export const extendedMedicationLogSchema = insertMedicationLogSchema.extend({
  status: z.enum(['taken', 'skipped', 'late']),
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

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type CreateUserInput = z.infer<typeof extendedUserSchema> & { password: string };

export type MedicationSchedule = typeof medicationSchedules.$inferSelect;
export type InsertMedicationSchedule = z.infer<typeof insertMedicationScheduleSchema>;

export type ScheduleFrequency = typeof scheduleFrequency.$inferSelect;
export type InsertScheduleFrequency = z.infer<typeof extendedScheduleFrequencySchema>;

export type ReminderTime = typeof reminderTimes.$inferSelect;
export type InsertReminderTime = z.infer<typeof insertReminderTimeSchema>;

export type MedicationLog = typeof medicationLogs.$inferSelect;
export type InsertMedicationLog = z.infer<typeof extendedMedicationLogSchema>;
