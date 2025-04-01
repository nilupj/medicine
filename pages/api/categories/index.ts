import type { NextApiRequest, NextApiResponse } from "next";
import { neon } from "@neondatabase/serverless";

type CategoriesResponse = {
  categories: Array<{
    name: string;
    count: number;
  }>;
};

type ErrorResponse = {
  error: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<CategoriesResponse | ErrorResponse>
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const sql = neon(process.env.DATABASE_URL || "");
    
    // Get all categories with medicine counts
    const categoriesResult = await sql`
      SELECT category as name, COUNT(*) as count
      FROM medicines
      GROUP BY category
      ORDER BY count DESC, name ASC
    `;
    
    return res.status(200).json({
      categories: categoriesResult,
    });
  } catch (error) {
    console.error("Error fetching categories:", error);
    return res.status(500).json({ error: "Failed to fetch categories" });
  }
}