import { Request, Response, Router } from 'express';
import { crawlQueue } from '../../queue';

const router = Router();

/**
 * GET /api/status/:id
 * Returns status of a given jobId (MPN crawl).
 */
router.get('/:id', async (req: Request, res: Response) => {
  const jobId = req.params.id;

  try {
    const job = await crawlQueue.getJob(jobId);

    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    const state = await job.getState();
    const progress = job.progress || 0;

    res.status(200).json({
      jobId: job.id,
      state,           // 'waiting', 'active', 'completed', 'failed', etc.
      progress,
      data: job.data,  // Contains mpn and crawlId if updated in worker
      returnValue: job.returnvalue ?? null,
      attemptsMade: job.attemptsMade,
      failedReason: job.failedReason ?? null,
    });
  } catch (err) {
    console.error('Error fetching job status:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;