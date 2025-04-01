import type { NextApiRequest, NextApiResponse } from "next";
import { neon } from "@neondatabase/serverless";

type CheckInteractionsRequest = {
  medicineIds: number[];
};

type InteractionResponse = {
  interactions: Array<{
    id: number;
    medicine1: {
      id: number;
      name: string;
      category: string;
    };
    medicine2: {
      id: number;
      name: string;
      category: string;
    };
    severity: string;
    description: string;
  }>;
};

type ErrorResponse = {
  error: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<InteractionResponse | ErrorResponse>
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Parse and validate the request body
    const { medicineIds } = req.body as CheckInteractionsRequest;
    
    if (!Array.isArray(medicineIds) || medicineIds.length < 2) {
      return res.status(400).json({
        error: "Please provide at least two medicine IDs to check for interactions",
      });
    }

    if (medicineIds.length > 5) {
      return res.status(400).json({
        error: "You can check interactions for a maximum of 5 medicines at once",
      });
    }

    const sql = neon(process.env.DATABASE_URL || "");
    
    // Verify all medicines exist
    const medicineCount = await sql`
      SELECT COUNT(*) as count FROM medicines 
      WHERE id IN (${medicineIds.join(',')})
    `;
    
    if (parseInt(medicineCount[0].count) !== medicineIds.length) {
      return res.status(400).json({
        error: "One or more of the provided medicine IDs are invalid",
      });
    }
    
    // Get all possible interactions between the provided medicines
    const interactionsResult = await sql`
      SELECT di.id, di.severity, di.description, 
             m1.id as medicine1_id, m1.name as medicine1_name, m1.category as medicine1_category,
             m2.id as medicine2_id, m2.name as medicine2_name, m2.category as medicine2_category
      FROM drug_interactions di
      JOIN medicines m1 ON di.medicine1_id = m1.id
      JOIN medicines m2 ON di.medicine2_id = m2.id
      WHERE 
        (m1.id IN (${medicineIds.join(',')}) AND m2.id IN (${medicineIds.join(',')}))
        AND m1.id != m2.id
    `;
    
    // Format the interactions
    const interactions = interactionsResult.map((row) => ({
      id: row.id,
      medicine1: {
        id: row.medicine1_id,
        name: row.medicine1_name,
        category: row.medicine1_category,
      },
      medicine2: {
        id: row.medicine2_id,
        name: row.medicine2_name,
        category: row.medicine2_category,
      },
      severity: row.severity,
      description: row.description,
    }));
    
    return res.status(200).json({ interactions });
  } catch (error) {
    console.error("Error checking interactions:", error);
    return res.status(500).json({ error: "Failed to check interactions" });
  }
}