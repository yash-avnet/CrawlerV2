// src/workers/crawler-worker.ts
import { Job } from 'bullmq';
import { randomUUID } from 'crypto'
import { createCrawlWorker, resultsQueue } from '../queue';
import { crawlProduct } from '../crawler';
import { saveCrawlLog } from '../db';
import { ProductInfo } from '../interface';

console.log('Crawler worker is running and waiting for jobs...');

const crawlerWorker = createCrawlWorker(async (job: Job) => {
    const mpn = job.data.mpn;
    const startedAt = new Date();
    const crawlId = randomUUID();
    console.log(`\nProcessing MPN: ${mpn} (Crawl ID: ${crawlId})`);

    // 1. Attach the crawlId back to the job object in the queue.
    // This makes it available later if the job fails.
    await job.updateData({ ...job.data, crawlId });

    // 2. Crawl and log the product.
    const productData = await crawlProduct(mpn, 'USD');
    const endedAt = new Date();

    if (!productData) {
        console.warn(`[SKIPPED] MPN: ${mpn} - No valid product found.`);
        await saveCrawlLog({
            crawlId,
            mpn,
            status: 'skipped',
            startedAt,
            endedAt,
        });
        return;
    }

    await saveCrawlLog({
        crawlId,
        mpn,
        status: 'success',
        startedAt,
        endedAt,
        distributorCount: productData.distributors?.length ?? 0,
    });

    // 3. On success, add the result to the 'results-queue'.
    const resultPayload: ProductInfo = { ...productData, crawlId };
    await resultsQueue.add('save-result', resultPayload);

    console.log(`Successfully crawled MPN: ${mpn}. Result passed to DB worker.`);
});

// This event fires only after a job has failed all of its retry attempts.
crawlerWorker.on('failed', async (job, error) => {
    if (job) {
        const { mpn, crawlId } = job.data;

        if (mpn) {
            console.error(`Job ${job.id} for MPN ${mpn} failed after retries: ${error.message}`);

            const startedAt = job.processedOn ? new Date(job.processedOn) : new Date();
            const endedAt = job.finishedOn ? new Date(job.finishedOn) : new Date();

            await saveCrawlLog({
                crawlId,
                mpn,
                status: 'failed',
                startedAt,
                endedAt,
                error: error.message,
            });
        }
    } else {
        console.error(`A job failed, but the job data was undefined. Error: ${error.message}`);
    }
});