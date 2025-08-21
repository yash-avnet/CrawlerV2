import { Router, Response } from "express";
import multer from "../../middleware/multer";
import { readMPNfromfile } from "../../utils/readMPNfromfile";
import { enqueueJobs } from "../../producers/enqueue-jobs";
import path from "path";
import fs from "fs";
import { supabaseAdmin, supabase } from "../../supabaseClient";
import { authMiddleware, AuthenticatedRequest } from "../../middleware/auth";

const router = Router();

router.post("/", authMiddleware, multer.single("file"), async (req: AuthenticatedRequest, res: Response) => {
  let filePath: string | undefined;

  try {
    const file = req.file;
    const user = req.user;
    const { name: RequestName, currency } = req.body;

    if (!file) {
      return res.status(400).json({ error: "CSV file is required" });
    }
    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    filePath = path.resolve(file.path);

    // 1. Extract MPNs
    const mpns = await readMPNfromfile(filePath);
    if (mpns.length === 0) {
      return res.status(400).json({ error: "CSV contains no valid MPNs" });
    }

    // 2. Read file into a Buffer (avoids duplex issue)
    const fileBuffer = fs.readFileSync(filePath);
    // console.log("MPNs : ", mpns);

    // 3. Upload file to Supabase Storage
    const storagePath = `uploads/${user.id}/${Date.now()}-${file.originalname}`;
    const { error: uploadError } = await supabaseAdmin.storage
      .from("crawler-files")
      .upload(storagePath, fileBuffer, {
        contentType: file.mimetype,
      });
    if (uploadError) throw uploadError;

    // 4. Insert into crawl_batches table
    const { data: batch, error: insertError } = await supabase
      .from("crawl_batches")
      .insert({
        request_name: `${RequestName}_${new Date().toISOString().replace(/[:.]/g, "-")}`,
        file_name: file.originalname,
        file_path: storagePath,
        total_mpns: mpns.length,
        user_email: user.email,
        created_by: user.id,
        currency,
        status: "pending",
      })
      .select()
      .single();
    if (insertError) throw insertError;

    const batchId = batch.id;

    // 5. Enqueue jobs with batchId
    let addedCount = 0;
    try {
      addedCount = await enqueueJobs(mpns, batchId, currency);

      // if (addedCount !== mpns.length) {
      //   // Safety: partial enqueue
      //   await supabaseAdmin
      //     .from("crawl_batches")
      //     .update({
      //       status: "failed",
      //       completed_at: new Date().toISOString(),
      //     })
      //     .eq("id", batchId);

      //   return res.status(500).json({
      //     error: `Failed to enqueue all MPNs (added=${addedCount}, expected=${mpns.length}). Batch marked as failed.`,
      //   });
      // }

    } catch (enqueueErr: any) {
      console.error("Enqueue error:", enqueueErr);

      await supabase
        .from("crawl_batches")
        .update({
          status: "failed",
          completed_at: new Date().toISOString(),
        })
        .eq("id", batchId);

      return res.status(500).json({
        error: "Failed to enqueue jobs. Batch marked as failed.",
        details: enqueueErr.message,
      });
    }

    return res.status(200).json({
      message: `Crawling has begun for ${addedCount}/${mpns.length} MPNs`,
      batchId,
      count: addedCount,
    });
  } catch (err) {
    console.error("❌ Error in /start-crawl:", err);
    return res.status(500).json({ error: "Internal Server Error" });
  } finally {
    if (filePath && fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }
});

export default router;