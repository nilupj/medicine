import type { NextApiRequest, NextApiResponse } from "next";
import { hash } from "bcryptjs";
import { neon } from "@neondatabase/serverless";
import { z } from "zod";

const registerSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  email: z.string().email("Invalid email format"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Only allow POST requests
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    // Validate input
    const validationResult = registerSchema.safeParse(req.body);
    
    if (!validationResult.success) {
      return res.status(400).json({
        message: "Validation failed",
        errors: validationResult.error.errors,
      });
    }
    
    const { username, email, password } = validationResult.data;
    
    // Connect to database
    const sql = neon(process.env.DATABASE_URL || "");
    
    // Check if user already exists
    const checkUserQuery = `
      SELECT id FROM users 
      WHERE username = '${username}' OR email = '${email}'
      LIMIT 1
    `;
    
    const existingUsers = await sql(checkUserQuery);
    
    if (existingUsers.length > 0) {
      return res.status(409).json({
        message: "Username or email already exists",
      });
    }
    
    // Hash password
    const passwordHash = await hash(password, 10);
    
    // Insert user
    const insertUserQuery = `
      INSERT INTO users (username, email, passwordHash, role, createdAt)
      VALUES ('${username}', '${email}', '${passwordHash}', 'user', NOW())
      RETURNING id, username, email, role
    `;
    
    const result = await sql(insertUserQuery);
    const user = result[0];
    
    // Return success without exposing sensitive data
    return res.status(201).json({
      message: "User created successfully",
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error: any) {
    console.error("Registration error:", error);
    
    // Send appropriate error response
    return res.status(500).json({
      message: "Registration failed",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
}