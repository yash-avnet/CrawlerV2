# Octopart Crawler Project

This project is a Node.js/TypeScript-based web crawler designed to extract electronic component data from Octopart using the Zyte API. It parses product details, pricing, and distributor offers, and supports batch processing and database integration.

## High-Level Logic

1. **Environment Setup**
   - Loads environment variables (e.g., Zyte API key) from `.env`.
   - TypeScript configuration via `tsconfig.json`.

2. **Crawling Workflow**
   - **Input:** List of Manufacturer Part Numbers (MPNs) from a CSV file.
   - **Queue System:** MPNs are enqueued for processing using a job queue.
   - **Worker Processes:** Dedicated workers fetch and parse product data for each MPN.

3. **Data Extraction**
   - For each MPN:
     - Constructs a search URL for Octopart.
     - Uses Zyte API to fetch the HTML content of the search result page.
     - Parses the HTML with Cheerio to extract:
       - Product title, brand, and median price.
       - Distributor offers (name, SKU, stock, pricing tiers, etc.).

4. **Database Integration**
   - Parsed product and distributor data are stored in a database (via Supabase).

5. **Maintenance & Utilities**
   - Scripts for clearing queues, reading MPNs from files, and managing jobs.

## Project Structure

```
.
├── .env
├── package.json
├── tsconfig.json
├── src/
│   ├── crawler.ts              # Main crawling and parsing logic
│   ├── db.ts                   # Database connection and operations
│   ├── index.ts                # Entry point
│   ├── interface.ts            # TypeScript interfaces for data models
│   ├── queue.ts                # Job queue logic
│   ├── supabaseClient.ts       # Supabase client setup
│   ├── data/
│   │   └── mpns.csv            # Input list of MPNs
│   ├── maintenance/
│   │   └── clear-queues.ts     # Queue maintenance script
│   ├── producers/
│   │   └── enqueue-jobs.ts     # Job producer script
│   ├── utils/
│   │   └── readMPNfromfile.ts  # Utility to read MPNs from CSV
│   └── workers/
│       ├── crawler-worker.ts   # Worker for crawling jobs
│       └── database-worker.ts  # Worker for database jobs
```

## How It Works

1. **Start the Queue:**  
   The job producer reads MPNs from `mpns.csv` and enqueues them.

2. **Crawling:**  
   The crawler worker fetches and parses product data for each MPN using the Zyte API and Cheerio.

3. **Database Storage:**  
   Parsed data is sent to the database worker, which stores it in Supabase.

4. **Maintenance:**  
   Maintenance scripts help manage and clear job queues as needed.

---

For more detailed documentation or code-level explanations, please specify which files or modules you want to include.
