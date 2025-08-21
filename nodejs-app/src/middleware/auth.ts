// src/middleware/auth.ts
import { supabase } from "../supabaseClient";
import { Request, Response, NextFunction } from "express";

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
  };
}

export async function authMiddleware(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const token = req.headers.authorization?.replace("Bearer ", "");
    if (!token) {
      return res.status(401).json({ error: "Missing access token" });
    }

    const { data, error } = await supabase.auth.getUser(token);

    if (error || !data.user) {
      return res.status(401).json({ error: "Invalid or expired token" });
    }

    req.user = {
      id: data.user.id,
      email: data.user.email ?? "",
    };

    next();
  } catch (err) {
    console.error("Auth error:", err);
    return res.status(500).json({ error: "Auth check failed" });
  }
}