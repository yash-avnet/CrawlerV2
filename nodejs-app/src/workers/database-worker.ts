import { resultsQueue } from '../queue';
import { saveProductsToDB } from '../db';
import { ProductInfo } from '../interface';

const BATCH_SIZE = 200;
const BATCH_INTERVAL_MS = 30 * 1000;

console.log(`DB worker is running and checking for results every ${BATCH_INTERVAL_MS / 1000}s...`);

/**
 * Fetch a batch of jobs from the results queue and save them in bulk.
 */
async function processResultsBatch() {
  try {
    const jobs = await resultsQueue.getWaiting(0, BATCH_SIZE - 1);

    if (jobs.length === 0) {
      return;
    }

    console.log(`Found ${jobs.length} results. Preparing to save in DB...`);

    const resultsToSave: ProductInfo[] = jobs.map((job) => job.data);

    try {
      await saveProductsToDB(resultsToSave);
      await Promise.all(jobs.map((job) => job.remove()));

      console.log(`Successfully saved ${jobs.length} results and cleared them from queue.`);
    } catch (dbErr: any) {
      console.error(`DB Save Error: ${dbErr.message}. Jobs will remain in queue for retry.`);
    }
  } catch (queueErr: any) {
    console.error(`Queue Fetch Error: ${queueErr.message}`);
  }
}

/**
 * Starts the batching loop.
 */
function startDBWorker() {
  processResultsBatch();
  setInterval(processResultsBatch, BATCH_INTERVAL_MS);
}

startDBWorker();