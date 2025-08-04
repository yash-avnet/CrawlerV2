import { crawlQueue, resultsQueue, connection  } from '../queue';

async function clearAllQueues() {
  console.log('Clearing all queues...');

  try {
    // Permanently deletes the queue and all its jobs
    await crawlQueue.obliterate({ force: true });
    console.log('Crawl queue obliterated.');

    await resultsQueue.obliterate({ force: true });
    console.log('Results queue obliterated.');

  } catch (err: any) {
    console.error('Error clearing queues:', err.message);
  } finally {
    connection.disconnect();
    console.log('Redis connection closed.');
  }
}

clearAllQueues();