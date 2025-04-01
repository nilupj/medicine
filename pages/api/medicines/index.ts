import type { NextApiRequest, NextApiResponse } from "next";
import { neon } from "@neondatabase/serverless";
import { Medicine } from "../../../shared/schema";

type MedicinesResponse = {
  medicines: Medicine[];
  totalCount: number;
};

type ErrorResponse = {
  error: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<MedicinesResponse | ErrorResponse>
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { 
      query = "",
      category = "",
      limit = "20", 
      offset = "0" 
    } = req.query;

    const sql = neon(process.env.DATABASE_URL || "");
    
    // Build query conditions
    let conditions = [];
    let sqlQuery = `SELECT * FROM medicines`;
    let countQuery = `SELECT COUNT(*) as count FROM medicines`;
    
    // Add search filter if provided
    if (query && typeof query === "string" && query.trim() !== "") {
      conditions.push(`(name ILIKE '%${query.trim()}%' OR description ILIKE '%${query.trim()}%' OR category ILIKE '%${query.trim()}%')`);
    }
    
    // Add category filter if provided
    if (category && typeof category === "string" && category.trim() !== "") {
      conditions.push(`category = '${category.trim()}'`);
    }
    
    // Add WHERE clause if we have conditions
    if (conditions.length > 0) {
      const whereClause = ` WHERE ${conditions.join(' AND ')}`;
      sqlQuery += whereClause;
      countQuery += whereClause;
    }
    
    // Add ORDER BY and LIMIT/OFFSET to the main query
    sqlQuery += ` ORDER BY name LIMIT ${parseInt(limit as string)} OFFSET ${parseInt(offset as string)}`;
    
    // Execute the queries
    const medicines = await sql(sqlQuery);
    const countResult = await sql(countQuery);
    
    const totalCount = parseInt(countResult[0].count);
    
    // Record the search if it's a non-empty query
    if (query && typeof query === "string" && query.trim() !== "") {
      await sql(`INSERT INTO recent_searches (query, timestamp) VALUES ('${query.trim()}', NOW())`);
    }
    
    return res.status(200).json({
      medicines: medicines as Medicine[],
      totalCount,
    });
  } catch (error) {
    console.error("Error fetching medicines:", error);
    return res.status(500).json({ error: "Failed to fetch medicines" });
  }
}