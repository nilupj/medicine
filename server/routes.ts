import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertRecentSearchSchema, 
  insertDrugInteractionSchema,
  extendedUserSchema,
  insertMedicationScheduleSchema,
  extendedScheduleFrequencySchema, 
  insertReminderTimeSchema,
  extendedMedicationLogSchema
} from "@shared/schema";
import { z } from "zod";
import { WebSocketServer, WebSocket } from "ws";
import { importDrugsFromList } from "./importDrugs";
import path from "path";
import bcrypt from "bcryptjs";

// Authentication middleware
const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  // For now, a very simple auth check using session-based authentication
  if (!req.session?.userId) {
    return res.status(401).json({ 
      error: 'Unauthorized', 
      message: 'You must be logged in to access this resource' 
    });
  }
  next();
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Get all medicines (paginated)
  app.get("/api/medicines", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const offset = parseInt(req.query.offset as string) || 0;
      
      const medicines = await storage.getMedicines(limit, offset);
      return res.json(medicines);
    } catch (error) {
      return res.status(500).json({ message: "Failed to retrieve medicines" });
    }
  });

  // Get a specific medicine by ID
  app.get("/api/medicines/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const medicine = await storage.getMedicineById(id);
      
      if (!medicine) {
        return res.status(404).json({ message: "Medicine not found" });
      }
      
      return res.json(medicine);
    } catch (error) {
      return res.status(500).json({ message: "Failed to retrieve medicine" });
    }
  });

  // Search for medicines
  app.get("/api/medicines/search/:query", async (req, res) => {
    try {
      const query = req.params.query;
      const limit = parseInt(req.query.limit as string) || 10;
      
      if (!query || query.length < 2) {
        return res.status(400).json({ message: "Search query must be at least 2 characters" });
      }
      
      const results = await storage.searchMedicines(query, limit);
      
      // Add to recent searches if it's a valid query
      if (query.length >= 2) {
        try {
          await storage.addRecentSearch({ searchTerm: query });
        } catch (error) {
          // We don't want to fail the entire request if this fails
          console.error("Failed to save recent search:", error);
        }
      }
      
      return res.json(results);
    } catch (error) {
      return res.status(500).json({ message: "Failed to search medicines" });
    }
  });

  // Get medicine categories
  app.get("/api/categories", async (req, res) => {
    try {
      const categories = await storage.getCategories();
      return res.json(categories);
    } catch (error) {
      return res.status(500).json({ message: "Failed to retrieve categories" });
    }
  });

  // Get recent searches
  app.get("/api/recent-searches", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 5;
      const searches = await storage.getRecentSearches(limit);
      return res.json(searches);
    } catch (error) {
      return res.status(500).json({ message: "Failed to retrieve recent searches" });
    }
  });

  // Add a recent search
  app.post("/api/recent-searches", async (req, res) => {
    try {
      const validatedData = insertRecentSearchSchema.parse(req.body);
      const search = await storage.addRecentSearch(validatedData);
      return res.status(201).json(search);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid search data", errors: (error as z.ZodError).errors });
      }
      return res.status(500).json({ message: "Failed to save search" });
    }
  });

  // Get drug interactions for a specific medicine
  app.get("/api/interactions/medicine/:id", async (req, res) => {
    try {
      const medicineId = parseInt(req.params.id);
      
      if (isNaN(medicineId)) {
        return res.status(400).json({ message: "Invalid medicine ID" });
      }
      
      const interactions = await storage.getInteractions(medicineId);
      return res.json(interactions);
    } catch (error) {
      console.error("Error fetching interactions:", error);
      return res.status(500).json({ message: "Failed to retrieve drug interactions" });
    }
  });
  
  // Check for interactions between multiple medicines
  app.post("/api/interactions/check", async (req, res) => {
    try {
      // Validate input
      const schema = z.object({
        medicineIds: z.array(z.number())
      });
      
      const validatedData = schema.parse(req.body);
      const { medicineIds } = validatedData;
      
      if (medicineIds.length < 2) {
        return res.status(400).json({ 
          message: "At least two medicines must be provided to check for interactions" 
        });
      }
      
      const interactions = await storage.checkInteractions(medicineIds);
      return res.json(interactions);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Invalid request data", 
          errors: (error as z.ZodError).errors 
        });
      }
      console.error("Error checking interactions:", error);
      return res.status(500).json({ message: "Failed to check drug interactions" });
    }
  });
  
  // Add a new drug interaction
  app.post("/api/interactions", async (req, res) => {
    try {
      const validatedData = insertDrugInteractionSchema.parse(req.body);
      const interaction = await storage.addInteraction(validatedData);
      return res.status(201).json(interaction);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Invalid interaction data", 
          errors: (error as z.ZodError).errors 
        });
      }
      console.error("Error adding interaction:", error);
      return res.status(500).json({ message: "Failed to add drug interaction" });
    }
  });
  
  // Update an existing drug interaction
  app.patch("/api/interactions/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid interaction ID" });
      }
      
      // Partial validation
      const schema = insertDrugInteractionSchema.partial();
      const validatedData = schema.parse(req.body);
      
      const updatedInteraction = await storage.updateInteraction(id, validatedData);
      
      if (!updatedInteraction) {
        return res.status(404).json({ message: "Interaction not found" });
      }
      
      return res.json(updatedInteraction);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Invalid interaction data", 
          errors: (error as z.ZodError).errors 
        });
      }
      console.error("Error updating interaction:", error);
      return res.status(500).json({ message: "Failed to update drug interaction" });
    }
  });
  
  // Delete a drug interaction
  app.delete("/api/interactions/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid interaction ID" });
      }
      
      const success = await storage.deleteInteraction(id);
      
      if (!success) {
        return res.status(404).json({ message: "Interaction not found" });
      }
      
      return res.status(204).end();
    } catch (error) {
      console.error("Error deleting interaction:", error);
      return res.status(500).json({ message: "Failed to delete drug interaction" });
    }
  });
  
  // Import drugs from txt file
  app.post("/api/admin/import-drugs", async (req, res) => {
    try {
      // This route should be protected in production
      const dataFilePath = path.join(__dirname, "data", "druglist.txt");
      console.log(`Starting drug import from ${dataFilePath}`);
      
      // Run the import asynchronously so we don't block the response
      importDrugsFromList(dataFilePath)
        .then(() => {
          console.log("Drug import completed successfully");
        })
        .catch((error) => {
          console.error("Error in drug import process:", error);
        });
      
      // Return immediately to client with a processing message
      return res.status(202).json({ 
        message: "Drug import process started. Check server logs for details."
      });
    } catch (error) {
      console.error("Error initiating drug import:", error);
      return res.status(500).json({ message: "Failed to start drug import process" });
    }
  });
  
  // User Registration
  app.post("/api/auth/register", async (req, res) => {
    try {
      // Validate the request body
      const userData = extendedUserSchema.parse(req.body);
      
      // Check if username already exists
      const existingUser = await storage.getUserByUsername(userData.username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }
      
      // Hash the password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(userData.password, salt);
      
      // Create user
      const user = await storage.createUser({
        ...userData,
        password: hashedPassword // In our storage we're using the password field directly
      });
      
      // Remove password from response
      const { passwordHash, ...userResponse } = user;
      
      // Set the user as logged in
      if (req.session) {
        req.session.userId = user.id;
      }
      
      return res.status(201).json(userResponse);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Invalid user data", 
          errors: (error as z.ZodError).errors 
        });
      }
      console.error("Error registering user:", error);
      return res.status(500).json({ message: "Failed to register user" });
    }
  });
  
  // User Login
  app.post("/api/auth/login", async (req, res) => {
    try {
      // Validate the request body
      const schema = z.object({
        username: z.string(),
        password: z.string()
      });
      
      const { username, password } = schema.parse(req.body);
      
      // Find the user
      const user = await storage.getUserByUsername(username);
      if (!user) {
        return res.status(400).json({ message: "Invalid credentials" });
      }
      
      // Check password
      const isMatch = await bcrypt.compare(password, user.passwordHash);
      if (!isMatch) {
        return res.status(400).json({ message: "Invalid credentials" });
      }
      
      // Set the user as logged in
      if (req.session) {
        req.session.userId = user.id;
      }
      
      // Remove password from response
      const { passwordHash, ...userResponse } = user;
      
      return res.json(userResponse);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Invalid login data", 
          errors: (error as z.ZodError).errors 
        });
      }
      console.error("Error logging in:", error);
      return res.status(500).json({ message: "Failed to log in" });
    }
  });
  
  // User Logout
  app.post("/api/auth/logout", (req, res) => {
    if (req.session) {
      req.session.destroy((err) => {
        if (err) {
          return res.status(500).json({ message: "Failed to log out" });
        }
        res.clearCookie("connect.sid"); // Clear the session cookie
        return res.json({ message: "Logged out successfully" });
      });
    } else {
      return res.json({ message: "Not logged in" });
    }
  });
  
  // Get current logged in user
  app.get("/api/auth/me", requireAuth, async (req, res) => {
    try {
      const userId = req.session?.userId;
      const user = await storage.getUserById(userId as number);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Remove password from response
      const { passwordHash, ...userResponse } = user;
      
      return res.json(userResponse);
    } catch (error) {
      console.error("Error getting current user:", error);
      return res.status(500).json({ message: "Failed to get user data" });
    }
  });
  
  // Medication Schedule Routes
  
  // Create a new medication schedule
  app.post("/api/schedules", requireAuth, async (req, res) => {
    try {
      const userId = req.session?.userId as number;
      
      // Validate schedule data
      const scheduleData = insertMedicationScheduleSchema.parse({
        ...req.body,
        userId // Ensure the schedule is associated with the logged-in user
      });
      
      // Create the schedule
      const schedule = await storage.createMedicationSchedule(scheduleData);
      
      return res.status(201).json(schedule);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Invalid schedule data", 
          errors: (error as z.ZodError).errors 
        });
      }
      console.error("Error creating medication schedule:", error);
      return res.status(500).json({ message: "Failed to create medication schedule" });
    }
  });
  
  // Get all medication schedules for the current user
  app.get("/api/schedules", requireAuth, async (req, res) => {
    try {
      const userId = req.session?.userId as number;
      const schedules = await storage.getMedicationSchedulesForUser(userId);
      return res.json(schedules);
    } catch (error) {
      console.error("Error getting medication schedules:", error);
      return res.status(500).json({ message: "Failed to retrieve medication schedules" });
    }
  });
  
  // Get a specific medication schedule
  app.get("/api/schedules/:id", requireAuth, async (req, res) => {
    try {
      const userId = req.session?.userId as number;
      const scheduleId = parseInt(req.params.id);
      
      if (isNaN(scheduleId)) {
        return res.status(400).json({ message: "Invalid schedule ID" });
      }
      
      const schedule = await storage.getMedicationScheduleById(scheduleId);
      
      if (!schedule) {
        return res.status(404).json({ message: "Schedule not found" });
      }
      
      // Ensure the user owns this schedule
      if (schedule.userId !== userId) {
        return res.status(403).json({ message: "Not authorized to access this schedule" });
      }
      
      return res.json(schedule);
    } catch (error) {
      console.error("Error getting medication schedule:", error);
      return res.status(500).json({ message: "Failed to retrieve medication schedule" });
    }
  });
  
  // Update a medication schedule
  app.patch("/api/schedules/:id", requireAuth, async (req, res) => {
    try {
      const userId = req.session?.userId as number;
      const scheduleId = parseInt(req.params.id);
      
      if (isNaN(scheduleId)) {
        return res.status(400).json({ message: "Invalid schedule ID" });
      }
      
      // Get the existing schedule
      const existingSchedule = await storage.getMedicationScheduleById(scheduleId);
      
      if (!existingSchedule) {
        return res.status(404).json({ message: "Schedule not found" });
      }
      
      // Check ownership
      if (existingSchedule.userId !== userId) {
        return res.status(403).json({ message: "Not authorized to update this schedule" });
      }
      
      // Validate update data
      const updateSchema = insertMedicationScheduleSchema.partial();
      const updateData = updateSchema.parse(req.body);
      
      // Update the schedule
      const updatedSchedule = await storage.updateMedicationSchedule(scheduleId, updateData);
      
      return res.json(updatedSchedule);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Invalid schedule data", 
          errors: (error as z.ZodError).errors 
        });
      }
      console.error("Error updating medication schedule:", error);
      return res.status(500).json({ message: "Failed to update medication schedule" });
    }
  });
  
  // Delete a medication schedule
  app.delete("/api/schedules/:id", requireAuth, async (req, res) => {
    try {
      const userId = req.session?.userId as number;
      const scheduleId = parseInt(req.params.id);
      
      if (isNaN(scheduleId)) {
        return res.status(400).json({ message: "Invalid schedule ID" });
      }
      
      // Get the existing schedule
      const existingSchedule = await storage.getMedicationScheduleById(scheduleId);
      
      if (!existingSchedule) {
        return res.status(404).json({ message: "Schedule not found" });
      }
      
      // Check ownership
      if (existingSchedule.userId !== userId) {
        return res.status(403).json({ message: "Not authorized to delete this schedule" });
      }
      
      // Delete the schedule (this will cascade delete related records)
      const success = await storage.deleteMedicationSchedule(scheduleId);
      
      if (!success) {
        return res.status(500).json({ message: "Failed to delete schedule" });
      }
      
      return res.status(204).end();
    } catch (error) {
      console.error("Error deleting medication schedule:", error);
      return res.status(500).json({ message: "Failed to delete medication schedule" });
    }
  });
  
  // Schedule Frequency Routes
  
  // Create a schedule frequency
  app.post("/api/schedules/:scheduleId/frequency", requireAuth, async (req, res) => {
    try {
      const userId = req.session?.userId as number;
      const scheduleId = parseInt(req.params.scheduleId);
      
      if (isNaN(scheduleId)) {
        return res.status(400).json({ message: "Invalid schedule ID" });
      }
      
      // Check schedule exists and belongs to user
      const schedule = await storage.getMedicationScheduleById(scheduleId);
      
      if (!schedule) {
        return res.status(404).json({ message: "Schedule not found" });
      }
      
      if (schedule.userId !== userId) {
        return res.status(403).json({ message: "Not authorized to modify this schedule" });
      }
      
      // Validate frequency data
      const frequencyData = extendedScheduleFrequencySchema.parse({
        ...req.body,
        scheduleId
      });
      
      // Create the frequency
      const frequency = await storage.createScheduleFrequency(frequencyData);
      
      return res.status(201).json(frequency);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Invalid frequency data", 
          errors: (error as z.ZodError).errors 
        });
      }
      console.error("Error creating schedule frequency:", error);
      return res.status(500).json({ message: "Failed to create schedule frequency" });
    }
  });
  
  // Get frequency for a schedule
  app.get("/api/schedules/:scheduleId/frequency", requireAuth, async (req, res) => {
    try {
      const userId = req.session?.userId as number;
      const scheduleId = parseInt(req.params.scheduleId);
      
      if (isNaN(scheduleId)) {
        return res.status(400).json({ message: "Invalid schedule ID" });
      }
      
      // Check schedule exists and belongs to user
      const schedule = await storage.getMedicationScheduleById(scheduleId);
      
      if (!schedule) {
        return res.status(404).json({ message: "Schedule not found" });
      }
      
      if (schedule.userId !== userId) {
        return res.status(403).json({ message: "Not authorized to access this schedule" });
      }
      
      // Get the frequency
      const frequency = await storage.getScheduleFrequencyForSchedule(scheduleId);
      
      if (!frequency) {
        return res.status(404).json({ message: "Frequency not found for this schedule" });
      }
      
      return res.json(frequency);
    } catch (error) {
      console.error("Error getting schedule frequency:", error);
      return res.status(500).json({ message: "Failed to retrieve schedule frequency" });
    }
  });
  
  // Reminder Time Routes
  
  // Create a reminder time
  app.post("/api/schedules/:scheduleId/reminders", requireAuth, async (req, res) => {
    try {
      const userId = req.session?.userId as number;
      const scheduleId = parseInt(req.params.scheduleId);
      
      if (isNaN(scheduleId)) {
        return res.status(400).json({ message: "Invalid schedule ID" });
      }
      
      // Check schedule exists and belongs to user
      const schedule = await storage.getMedicationScheduleById(scheduleId);
      
      if (!schedule) {
        return res.status(404).json({ message: "Schedule not found" });
      }
      
      if (schedule.userId !== userId) {
        return res.status(403).json({ message: "Not authorized to modify this schedule" });
      }
      
      // Validate reminder data
      const reminderData = insertReminderTimeSchema.parse({
        ...req.body,
        scheduleId
      });
      
      // Create the reminder
      const reminder = await storage.createReminderTime(reminderData);
      
      return res.status(201).json(reminder);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Invalid reminder data", 
          errors: (error as z.ZodError).errors 
        });
      }
      console.error("Error creating reminder time:", error);
      return res.status(500).json({ message: "Failed to create reminder time" });
    }
  });
  
  // Get all reminder times for a schedule
  app.get("/api/schedules/:scheduleId/reminders", requireAuth, async (req, res) => {
    try {
      const userId = req.session?.userId as number;
      const scheduleId = parseInt(req.params.scheduleId);
      
      if (isNaN(scheduleId)) {
        return res.status(400).json({ message: "Invalid schedule ID" });
      }
      
      // Check schedule exists and belongs to user
      const schedule = await storage.getMedicationScheduleById(scheduleId);
      
      if (!schedule) {
        return res.status(404).json({ message: "Schedule not found" });
      }
      
      if (schedule.userId !== userId) {
        return res.status(403).json({ message: "Not authorized to access this schedule" });
      }
      
      // Get the reminders
      const reminders = await storage.getReminderTimesForSchedule(scheduleId);
      
      return res.json(reminders);
    } catch (error) {
      console.error("Error getting reminder times:", error);
      return res.status(500).json({ message: "Failed to retrieve reminder times" });
    }
  });
  
  // Delete a reminder time
  app.delete("/api/reminders/:id", requireAuth, async (req, res) => {
    try {
      const userId = req.session?.userId as number;
      const reminderId = parseInt(req.params.id);
      
      if (isNaN(reminderId)) {
        return res.status(400).json({ message: "Invalid reminder ID" });
      }
      
      // We need to first get the reminder to check the schedule ownership
      // This would be more efficient with a JOIN, but we'll do it in multiple steps for simplicity
      
      // Get the reminders for all user's schedules and find this one
      const userSchedules = await storage.getMedicationSchedulesForUser(userId);
      const scheduleIds = userSchedules.map(schedule => schedule.id);
      
      // Check if user owns any schedules with this reminder
      let reminderBelongsToUser = false;
      for (const scheduleId of scheduleIds) {
        const reminders = await storage.getReminderTimesForSchedule(scheduleId);
        if (reminders.some(reminder => reminder.id === reminderId)) {
          reminderBelongsToUser = true;
          break;
        }
      }
      
      if (!reminderBelongsToUser) {
        return res.status(403).json({ message: "Not authorized to delete this reminder" });
      }
      
      // Delete the reminder
      const success = await storage.deleteReminderTime(reminderId);
      
      if (!success) {
        return res.status(404).json({ message: "Reminder not found" });
      }
      
      return res.status(204).end();
    } catch (error) {
      console.error("Error deleting reminder time:", error);
      return res.status(500).json({ message: "Failed to delete reminder time" });
    }
  });
  
  // Medication Log Routes
  
  // Log a medication event
  app.post("/api/schedules/:scheduleId/logs", requireAuth, async (req, res) => {
    try {
      const userId = req.session?.userId as number;
      const scheduleId = parseInt(req.params.scheduleId);
      
      if (isNaN(scheduleId)) {
        return res.status(400).json({ message: "Invalid schedule ID" });
      }
      
      // Check schedule exists and belongs to user
      const schedule = await storage.getMedicationScheduleById(scheduleId);
      
      if (!schedule) {
        return res.status(404).json({ message: "Schedule not found" });
      }
      
      if (schedule.userId !== userId) {
        return res.status(403).json({ message: "Not authorized to log for this schedule" });
      }
      
      // Validate log data
      const logData = extendedMedicationLogSchema.parse({
        ...req.body,
        scheduleId,
        takenAt: new Date()
      });
      
      // Create the log
      const log = await storage.createMedicationLog(logData);
      
      return res.status(201).json(log);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Invalid log data", 
          errors: (error as z.ZodError).errors 
        });
      }
      console.error("Error creating medication log:", error);
      return res.status(500).json({ message: "Failed to create medication log" });
    }
  });
  
  // Get medication logs for a schedule
  app.get("/api/schedules/:scheduleId/logs", requireAuth, async (req, res) => {
    try {
      const userId = req.session?.userId as number;
      const scheduleId = parseInt(req.params.scheduleId);
      const limit = parseInt(req.query.limit as string) || 100;
      
      if (isNaN(scheduleId)) {
        return res.status(400).json({ message: "Invalid schedule ID" });
      }
      
      // Check schedule exists and belongs to user
      const schedule = await storage.getMedicationScheduleById(scheduleId);
      
      if (!schedule) {
        return res.status(404).json({ message: "Schedule not found" });
      }
      
      if (schedule.userId !== userId) {
        return res.status(403).json({ message: "Not authorized to access logs for this schedule" });
      }
      
      // Get the logs
      const logs = await storage.getMedicationLogsForSchedule(scheduleId, limit);
      
      return res.json(logs);
    } catch (error) {
      console.error("Error getting medication logs:", error);
      return res.status(500).json({ message: "Failed to retrieve medication logs" });
    }
  });
  
  // Get all logs for the current user
  app.get("/api/logs", requireAuth, async (req, res) => {
    try {
      const userId = req.session?.userId as number;
      const limit = parseInt(req.query.limit as string) || 30;
      
      // Get all logs for this user's schedules
      const logs = await storage.getMedicationLogsForUser(userId, limit);
      
      return res.json(logs);
    } catch (error) {
      console.error("Error getting user's medication logs:", error);
      return res.status(500).json({ message: "Failed to retrieve medication logs" });
    }
  });

  // Create HTTP server
  const httpServer = createServer(app);
  
  // Set up WebSocket server for real-time drug interaction checking
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  wss.on('connection', (ws) => {
    console.log('Client connected to WebSocket');
    
    ws.on('message', async (message) => {
      try {
        // Parse the message
        const data = JSON.parse(message.toString());
        
        if (data.type === 'check_interactions') {
          // Validate medicine IDs
          if (!Array.isArray(data.medicineIds) || data.medicineIds.length < 2) {
            ws.send(JSON.stringify({ 
              type: 'error', 
              message: 'At least two valid medicine IDs are required' 
            }));
            return;
          }
          
          // Get interactions
          const interactions = await storage.checkInteractions(data.medicineIds);
          
          // Send back the results
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ 
              type: 'interactions_result', 
              interactions 
            }));
          }
        }
      } catch (error) {
        console.error('WebSocket error:', error);
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ 
            type: 'error', 
            message: 'Error processing request' 
          }));
        }
      }
    });
    
    ws.on('close', () => {
      console.log('Client disconnected from WebSocket');
    });
  });
  
  return httpServer;
}
