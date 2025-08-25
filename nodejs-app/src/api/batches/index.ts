// api/batches/index.ts
import { Router, Response } from "express";
import { supabase } from "../../supabaseClient";
import { authMiddleware, AuthenticatedRequest } from "../../middleware/auth";

const router = Router();

/**
 * GET /api/batch/:id
 * Fetch details of a single crawl batch (with its current status & counts).
 */
router.get("/", authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { data: batches, error } = await supabase
      .from("crawl_batches")
      .select("id, request_name, file_name, status, created_at, total_mpns, success_count, failed_count, skipped_count, completed_at")
      .eq("created_by", user.id)
      .order("created_at", { ascending: false });

    if (error) throw error;

    return res.status(200).json(batches);
  } catch (err) {
    console.error("❌ Error in GET /api/batches:", err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

export default router;