import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertRecentSearchSchema } from "@shared/schema";
import { z } from "zod";

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

  // Create HTTP server
  const httpServer = createServer(app);
  return httpServer;
}
