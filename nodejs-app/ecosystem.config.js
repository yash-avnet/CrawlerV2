module.exports = {
  apps: [
    {
      name: 'crawler-worker',
      script: 'dist/workers/crawler-worker.js',
      instances: 1,
      exec_mode: 'fork',
    },
    {
      name: 'database-worker',
      script: 'dist/workers/database-worker.js',
      instances: 1,
      exec_mode: 'fork',
    },
  ],
};