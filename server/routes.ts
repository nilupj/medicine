import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertRecentSearchSchema, insertDrugInteractionSchema } from "@shared/schema";
import { z } from "zod";
import { WebSocketServer, WebSocket } from "ws";

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
