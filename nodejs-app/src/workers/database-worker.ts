// src/workers/database-worker.ts
import { resultsQueue } from '../queue';
import { saveProductsToDB } from '../db';
import { ProductInfo } from '../interface';

const BATCH_INTERVAL_MS = 30 * 1000;

console.log('DB worker started. Checking for results every 30 seconds.');

async function processResultsBatch() {
  // Fetch up to 100 jobs waiting in the results queue.
  const jobs = await resultsQueue.getWaiting(0, 99);

  if (jobs.length === 0) {
    return;
  }

  console.log(`\nFound ${jobs.length} new results. Preparing to save...`);

  const resultsToSave: ProductInfo[] = jobs.map(job => job.data);

  try {
    await saveProductsToDB(resultsToSave);

    await Promise.all(jobs.map(job => job.remove()));

    console.log(`Successfully saved ${jobs.length} results and removed jobs from queue.`);

  } catch (err: any) {
    console.error(`❌ DB Save Error: ${err.message}. Jobs will be retried on next interval.`);
  }
}

// Run the batch processing function on a timer.
processResultsBatch();
setInterval(processResultsBatch, BATCH_INTERVAL_MS);