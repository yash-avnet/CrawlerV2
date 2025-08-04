// src/queue.ts
import { Queue, Worker, Job } from 'bullmq';
import IORedis from 'ioredis';
import dotenv from 'dotenv';
import { ProductInfo } from './interface';

dotenv.config();

const CRAWL_QUEUE_NAME = 'crawl-jobs';
const RESULTS_QUEUE_NAME = 'results-queue';

// --- Upstash Redis Connection using ioredis ---
const redisUrl = process.env.UPSTASH_IOREDIS_URL;
if (!redisUrl) {
  throw new Error('UPSTASH_IOREDIS_URL not found in .env file');
}

export const connection = new IORedis(redisUrl, {
  maxRetriesPerRequest: null,
});

// --- Queue & Worker Definitions ---

// The Crawl Queue
export const crawlQueue = new Queue(CRAWL_QUEUE_NAME, {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000,
    },
  },
});

// The Results Queue (doesn't need retry logic)
export const resultsQueue = new Queue<ProductInfo>(RESULTS_QUEUE_NAME, {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 10000,
    },
  },
});

/**
 * Create a worker to process crawl jobs.
 * Handles jobs where job.name === 'crawl-mpn'.
 */
export const createCrawlWorker = (processor: (job: Job) => Promise<void>) => {
  return new Worker(
    CRAWL_QUEUE_NAME,
    async (job: Job) => {
      if (job.name !== 'crawl-mpn') {
        throw new Error(`Unexpected job name: ${job.name}`);
      }
      await processor(job);
    },
    {
      connection,
      concurrency: 20,
    }
  );
};

/**
 * Create a worker to process result-saving jobs.
 * Handles jobs where job.name === 'save-result'.
 */
export const createResultsWorker = (processor: (job: Job<ProductInfo>) => Promise<void>) => {
  return new Worker(
    RESULTS_QUEUE_NAME,
    async (job: Job<ProductInfo>) => {
      if (job.name !== 'save-result') {
        throw new Error(`Unexpected job name: ${job.name}`);
      }
      await processor(job);
    },
    {
      connection,
      concurrency: 2, // Tune concurrency separately if needed
    }
  );
};