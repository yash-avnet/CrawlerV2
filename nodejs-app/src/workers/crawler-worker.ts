import { Job } from 'bullmq';
import { createCrawlWorker, resultsQueue } from '../queue';
import { crawlProduct } from '../crawler';
import { saveCrawlLog } from '../db';
import { ProductInfo } from '../interface';
import { supabaseAdmin } from "../supabaseClient";

console.log('Crawler worker is running and waiting for jobs...');

const crawlerWorker = createCrawlWorker(async (job: Job) => {
    const { mpn, batchId: crawlId, currency } = job.data;
    const startedAt = new Date();

    // Flip status to in_progress if still pending
    await supabaseAdmin.rpc("set_batch_in_progress",{
        batch_id: crawlId
    });

    console.log(`\nProcessing MPN: ${mpn} (Crawl ID: ${crawlId})`);

    // Crawl and log the product.
    const productData = await crawlProduct(mpn, currency);
    const endedAt = new Date();

    if (!productData) {
        await saveCrawlLog({
            crawlId,
            mpn,
            status: 'skipped',
            startedAt,
            endedAt,
        });

        // NEW: increment skipped counter in crawl_batches
        await supabaseAdmin.rpc("increment_crawl_batch_count", {
            batch_id: crawlId,
            status: "skipped",
        });


        console.warn(`[SKIPPED] MPN: ${mpn} - No valid product found.`);
    }

    else {
        // On success, add the result to the 'results-queue'.
        const resultPayload: ProductInfo = { ...productData, crawlId };
        await resultsQueue.add('save-result', resultPayload);

        await saveCrawlLog({
            crawlId,
            mpn,
            status: 'success',
            startedAt,
            endedAt,
            distributorCount: productData.distributors?.length ?? 0,
        });

        // NEW: increment success counter
        await supabaseAdmin.rpc("increment_crawl_batch_count", {
            batch_id: crawlId,
            status: "success",
        });

        console.log(`Successfully crawled MPN: ${mpn}. Result passed to DB worker.`);
    }
});

crawlerWorker.on("failed", async (job, error) => {
    if (job) {
        const { mpn, batchId: crawlId } = job.data;
        // Run only if it's the last attempt
        if (job.attemptsMade === job.opts.attempts) {
            console.error(`Job ${job.id} for MPN ${job.data.mpn} failed permanently: ${error.message}`);

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

            // NEW: increment failed counter
            await supabaseAdmin.rpc("increment_crawl_batch_count", {
                batch_id: crawlId,
                status: "failed",
            });

        } else {
            console.warn(`Job ${job.id} for MPN ${job.data.mpn} failed attempt ${job.attemptsMade}, retrying...`);
        }
    } else {
        console.error(`A job failed, but the job data was undefined. Error: ${error.message}`);
    }
});