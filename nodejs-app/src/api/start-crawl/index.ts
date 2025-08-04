import { Router, Request, Response } from "express";
import multer from "../../middleware/multer";
import { readMPNfromfile } from "../../utils/readMPNfromfile";
import { enqueueJobs } from "../../producers/enqueue-jobs";
import path from "path";
import fs from "fs";

const router = Router();

// Route: POST /api/start-crawl
router.post("/", multer.single("file"), async (req: Request, res: Response) => {
  try {
    const file = req.file;

    if (!file) {
      return res.status(400).json({ error: "CSV file is required" });
    }

    const filePath = path.resolve(file.path);

    // Extract MPNs
    const mpns = await readMPNfromfile(filePath);

    if (mpns.length === 0) {
      fs.unlinkSync(filePath);
      return res.status(400).json({ error: "CSV contains no valid MPNs" });
    }

    // Enqueue jobs
    const batchId = await enqueueJobs(mpns);
    
    // Clean up temp file
    fs.unlinkSync(filePath);

    return res.status(200).json({
      message: "Crawl started",
      batchId,
      count: mpns.length,
    });
  } catch (err) {
    console.error("❌ Error in /start-crawl:", err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

export default router;