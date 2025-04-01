import type { NextApiRequest, NextApiResponse } from "next";
import { neon } from "@neondatabase/serverless";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]";

type RemindersResponse = {
  reminders: Array<{
    id: number;
    userId: number;
    medicineId: number;
    medicine: {
      id: number;
      name: string;
      category: string;
      description: string;
    };
    dosage: string;
    instructions: string;
    startDate: string;
    endDate: string | null;
    active: boolean;
    createdAt: string;
    reminderTimes: Array<{
      id: number;
      time: string;
      enabled: boolean;
    }>;
    frequency: {
      id: number;
      type: string;
      interval: number;
      daysOfWeek: string[] | null;
      specificDays: number[] | null;
    } | null;
  }>;
};

type ErrorResponse = {
  error: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<RemindersResponse | ErrorResponse>
) {
  // Check authentication
  const session = await getServerSession(req, res, authOptions);
  
  if (!session || !session.user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  // Handle GET request to fetch reminders
  if (req.method === "GET") {
    try {
      const { userId } = req.query;
      
      // Ensure userId is provided and is a number
      if (!userId || Array.isArray(userId)) {
        return res.status(400).json({ error: "Invalid user ID" });
      }
      
      // Check if the authenticated user is requesting their own data
      const sessionUserId = (session.user as any).id;
      if (sessionUserId.toString() !== userId && (session.user as any).role !== 'admin') {
        return res.status(403).json({ error: "Forbidden" });
      }

      const sql = neon(process.env.DATABASE_URL || "");
      
      // Get all medication schedules for the user
      const schedulesResult = await sql`
        SELECT 
          ms.id, ms.user_id, ms.medicine_id, ms.dosage, ms.instructions, 
          ms.start_date, ms.end_date, ms.active, ms.created_at,
          m.id as medicine_id, m.name as medicine_name, m.category as medicine_category, 
          m.description as medicine_description
        FROM medication_schedules ms
        JOIN medicines m ON ms.medicine_id = m.id
        WHERE ms.user_id = ${parseInt(userId)}
        ORDER BY ms.created_at DESC
      `;
      
      if (!schedulesResult || schedulesResult.length === 0) {
        return res.status(200).json({ reminders: [] });
      }
      
      // Get reminder times for each schedule
      const scheduleIds = schedulesResult.map(schedule => schedule.id);
      
      const reminderTimesResult = await sql`
        SELECT id, schedule_id, time, enabled
        FROM reminder_times
        WHERE schedule_id IN (${scheduleIds.join(',')})
      `;
      
      // Get frequency details for each schedule
      const frequencyResult = await sql`
        SELECT id, schedule_id, type, interval, days_of_week, specific_days
        FROM schedule_frequency
        WHERE schedule_id IN (${scheduleIds.join(',')})
      `;
      
      // Map frequency and reminder times to their respective schedules
      const reminders = schedulesResult.map(schedule => {
        const scheduleReminderTimes = reminderTimesResult.filter(
          rt => rt.schedule_id === schedule.id
        ).map(rt => ({
          id: rt.id,
          time: rt.time,
          enabled: rt.enabled,
        }));
        
        const scheduleFrequency = frequencyResult.find(
          f => f.schedule_id === schedule.id
        );
        
        let frequency = null;
        if (scheduleFrequency) {
          frequency = {
            id: scheduleFrequency.id,
            type: scheduleFrequency.type,
            interval: scheduleFrequency.interval,
            daysOfWeek: scheduleFrequency.days_of_week,
            specificDays: scheduleFrequency.specific_days,
          };
        }
        
        return {
          id: schedule.id,
          userId: schedule.user_id,
          medicineId: schedule.medicine_id,
          medicine: {
            id: schedule.medicine_id,
            name: schedule.medicine_name,
            category: schedule.medicine_category,
            description: schedule.medicine_description,
          },
          dosage: schedule.dosage,
          instructions: schedule.instructions,
          startDate: schedule.start_date,
          endDate: schedule.end_date,
          active: schedule.active,
          createdAt: schedule.created_at,
          reminderTimes: scheduleReminderTimes,
          frequency,
        };
      });
      
      return res.status(200).json({ reminders });
    } catch (error) {
      console.error("Error fetching reminders:", error);
      return res.status(500).json({ error: "Failed to fetch reminders" });
    }
  }
  
  // Handle POST request to create a new reminder
  else if (req.method === "POST") {
    try {
      // Implementation for creating a new reminder
      // This would parse the request body, validate it, and create a new reminder
      
      return res.status(501).json({ error: "Create reminder endpoint not implemented yet" });
    } catch (error) {
      console.error("Error creating reminder:", error);
      return res.status(500).json({ error: "Failed to create reminder" });
    }
  }
  
  // Handle other HTTP methods
  else {
    return res.status(405).json({ error: "Method not allowed" });
  }
}