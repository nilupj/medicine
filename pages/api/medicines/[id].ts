import type { NextApiRequest, NextApiResponse } from "next";
import { neon } from "@neondatabase/serverless";
import { Medicine } from "../../../shared/schema";

type MedicineResponse = {
  medicine: Medicine | null;
  interactions: Array<{
    id: number;
    severity: string;
    description: string;
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
  }>;
};

type ErrorResponse = {
  error: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<MedicineResponse | ErrorResponse>
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { id } = req.query;
    
    if (!id || Array.isArray(id)) {
      return res.status(400).json({ error: "Invalid medicine ID" });
    }

    const medicineId = parseInt(id);
    
    if (isNaN(medicineId)) {
      return res.status(400).json({ error: "Invalid medicine ID" });
    }

    const sql = neon(process.env.DATABASE_URL || "");
    
    // Get medicine details
    const medicineResult = await sql`
      SELECT * FROM medicines WHERE id = ${medicineId}
    `;
    
    if (!medicineResult || medicineResult.length === 0) {
      return res.status(404).json({ 
        medicine: null,
        interactions: []
      });
    }

    const medicine = medicineResult[0];
    
    // Get drug interactions for this medicine
    const interactionsResult = await sql`
      SELECT di.id, di.severity, di.description, 
             m1.id as medicine1_id, m1.name as medicine1_name, m1.category as medicine1_category,
             m2.id as medicine2_id, m2.name as medicine2_name, m2.category as medicine2_category
      FROM drug_interactions di
      JOIN medicines m1 ON di.medicine1_id = m1.id
      JOIN medicines m2 ON di.medicine2_id = m2.id
      WHERE m1.id = ${medicineId} OR m2.id = ${medicineId}
    `;
    
    // Format the interactions
    const interactions = interactionsResult.map((row) => ({
      id: row.id,
      severity: row.severity,
      description: row.description,
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
    }));
    
    return res.status(200).json({
      medicine,
      interactions,
    });
  } catch (error) {
    console.error("Error fetching medicine details:", error);
    return res.status(500).json({ error: "Failed to fetch medicine details" });
  }
}