import { crawlQueue } from '../queue';

/**
 * Enqueues crawl jobs to BullMQ queue in bulk
 * @param mpns - List of MPN strings
 * @param batchId - ID of the crawl batch
 * @returns Array of enqueued job IDs
 */
export async function enqueueJobs(mpns: string[], batchId: string, currency: string): Promise<number> {
  console.log(`[Enqueue] Starting to enqueue ${mpns.length} MPNs with batch ID: ${batchId}\n`);

  const chunkSize = 5000;
  let totalAdded = 0;

  try {
    for (let i = 0; i < mpns.length; i += chunkSize) {
      const chunk = mpns.slice(i, i + chunkSize).map(mpn => ({
        name: 'crawl-mpn',
        data: { mpn, batchId, currency },
      }));

      const addedJobs = await crawlQueue.addBulk(chunk);
      totalAdded += addedJobs.length;
    }

    console.log(`[Enqueue] Successfully enqueued ${totalAdded} out of ${mpns.length} MPNs`);
  } catch (error) {
    console.error(`[Enqueue Error] Failed to enqueue batch ${batchId}:`, error);
    throw error;
  }

  // Guard against partial enqueue. This makes enqueue atomic from the API's perspective.
  if (totalAdded !== mpns.length) {
    const msg = `Partial enqueue detected: added=${totalAdded}, expected=${mpns.length}`;
    console.error(`[Enqueue Error] ${msg}`);
    throw new Error(msg);
  }

  return totalAdded;
}