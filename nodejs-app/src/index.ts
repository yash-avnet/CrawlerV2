// import { crawlProduct } from "./crawler";
// import { saveProductsToDB, saveCrawlLog } from "./db";
// import { readMPNfromfile } from "./utils/readMPNfromfile";
// import pLimit from "p-limit";

// const currency: string = "USD";
// const CONCURRENCY_LIMIT = 10;
// const MAX_RETRIES = 2;
// const RETRY_DELAY_MS = 2000;

// // Retry fn
// async function withRetry<T>(fn: () => Promise<T>): Promise<T> {
//   let attempt = 0;
//   while (attempt <= MAX_RETRIES) {
//     try {
//       return await fn();
//     } catch (error: any) {
//       attempt++;
//       console.warn(`⚠️ Attempt ${attempt} failed. Retrying...`, error.message);
//       if (attempt === MAX_RETRIES) throw error;
//       await new Promise((res) => setTimeout(res, RETRY_DELAY_MS)); // wait before retry
//     }
//   }
//   throw new Error("Unreachable retry failure");
// }

// async function main() {
//   // const MPNs = await readMPNfromfile("src/data/mpns.csv");
//   // const limit = pLimit(CONCURRENCY_LIMIT);

//   // const crawl_start = Date.now();

//   // const crawlResults = await Promise.all(
//   //   MPNs.map((mpn) =>
//   //     limit(async () => {
//   //       const startedAt = new Date();
//   //       console.log(`\n🚀 Crawling mpn: ${mpn}`);
//   //       const result = await withRetry(() => crawlProduct(mpn, currency));
//   //       const endedAt = new Date();

//   //       if (result.error) {
//   //         await saveCrawlLog({
//   //           mpn,
//   //           status: "failed",
//   //           startedAt,
//   //           endedAt,
//   //           error: result.error,
//   //         });
//   //         console.error(`❌ Error in mpn ${mpn}: ${result.error}`);
//   //         return null;
//   //       }

//   //       await saveCrawlLog({
//   //         mpn,
//   //         status: "success",
//   //         startedAt,
//   //         endedAt,
//   //         distributorCount: result.distributors?.length ?? 0,
//   //       });

//   //       return result;
//   //     })
//   //   )
//   // );

//   // const finalResult = crawlResults.filter((res): res is NonNullable<typeof res> => !!res);
//   // await saveProductsToDB(finalResult);
//   // const crawl_end = Date.now();
//   // console.log('\nTime Taken : ', (((crawl_end-crawl_start)/1000)/60).toFixed(2), ' minutes');
// }

// main();