import { crawlQueue } from '../queue';

/**
 * Enqueues crawl jobs to BullMQ queue
 * @param mpns - List of MPN strings
 * @returns Array of enqueued job IDs
 */
export async function enqueueJobs(mpns: string[]) {
  const jobIds: string[] = [];

  console.log(`[Enqueue] Starting to enqueue ${mpns.length} MPNs`);

  for (const mpn of mpns) {
    try {
      const job = await crawlQueue.add('crawl-mpn', { mpn });
      jobIds.push(job.id as string);
    } catch (error) {
      console.error(`[Enqueue Error] Failed to enqueue MPN "${mpn}":`, error);
    }
  }

  console.log(`[Enqueue] Successfully enqueued ${jobIds.length} out of ${mpns.length} MPNs`);
  return jobIds;
}