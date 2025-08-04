import { supabase } from "./supabaseClient";
import { ProductInfo } from "./interface";

export async function saveProductsToDB(products: ProductInfo[]): Promise<void> {
  console.log(`\n[DB] Saving ${products.length} products to database...`);

  if (products.length === 0) return;

  try {
    const now = new Date().toISOString();
    const productRows = products.map((p) => ({
      mpn: p.mpn,
      title: p.title,
      brand: p.brand,
      median_price: p.medianPrice,
      created_at: now,
    }));

    const { data: insertedProducts, error: insertError } = await supabase
      .from("products")
      .insert(productRows)
      .select("id, mpn, title, brand, median_price");

    if (insertError) {
      // This now throws an error to allow the worker to retry the batch
      console.error(`[DB ERROR] Product insert failed: ${insertError.message}`);
      throw new Error(`Product insert failed: ${insertError.message}`);
    }

    // Use a reliable map from MPN to the new product ID
    const mpnToIdMap = new Map(insertedProducts.map((p) => [p.mpn, p.id]));
    const updateLogPromises: any[] = [];
    
    const allDistributorRows = products.flatMap((p) => {
      const productId = mpnToIdMap.get(p.mpn);
      if (!productId) {
        console.warn(`Could not find a new product ID for MPN ${p.mpn}. Skipping associated distributors and log link.`);
        return [];
      }

      // Prepare the command to link the crawl_log to this new product
      updateLogPromises.push(
        supabase
          .from("crawl_logs")
          .update({ product_id: productId })
          .eq("crawl_id", p.crawlId)
      );

      if (!p.distributors) return [];

      return p.distributors.map((dist) => ({
        product_id: productId,
        name: dist.name,
        sku: dist.sku,
        stock: dist.stock,
        min: dist.min,
        pkg: dist.pkg,
        currency: dist.currency,
        updated: dist.updated,
        price_1: dist.prices["1"] || null,
        price_10: dist.prices["10"] || null,
        price_100: dist.prices["100"] || null,
        price_1000: dist.prices["1000"] || null,
        price_10000: dist.prices["10000"] || null,
      }));
    });

    if (allDistributorRows.length > 0) {
      const { error: distError } = await supabase
        .from("distributors")
        .insert(allDistributorRows);

      if (distError) {
        console.error(`[DB ERROR] Inserting distributors failed: ${distError.message}`);
        throw new Error(`Inserting distributors failed: ${distError.message}`);
      } else {
        console.log(`[DB] Inserted ${allDistributorRows.length} distributors`);
      }
    }

    // Execute all the log update commands concurrently
    await Promise.all(updateLogPromises);

    console.log(`[DB] All products and distributors saved successfully.`);
  } catch (err: any) {
    console.error(`[DB EXCEPTION] While saving products: ${err.message}`);
    // Re-throw the error to ensure the DB worker retries the entire batch
    throw err;
  }
}

export async function saveCrawlLog({
  crawlId,
  mpn,
  status,
  startedAt,
  endedAt,
  error,
  distributorCount,
  productId,
}: {
  crawlId: string;
  mpn: string;
  status: "success" | "failed" | "skipped";
  startedAt: Date;
  endedAt: Date;
  error?: string;
  distributorCount?: number;
  productId?: string;
}) {
  const durationSec = (endedAt.getTime() - startedAt.getTime()) / 1000;

  const { error: logError } = await supabase.from("crawl_logs").insert([
    {
      crawl_id: crawlId,
      mpn,
      status,
      started_at: startedAt.toISOString(),
      ended_at: endedAt.toISOString(),
      duration_sec: durationSec,
      error_message: error || null,
      distributor_count: distributorCount ?? null,
      product_id: productId ?? null,
    },
  ]);

  if (logError) {
    console.error(`[DB ERROR] Failed to insert crawl log for ${mpn}:`, logError.message);
  } else {
    console.log(`[LOG] Crawl log saved for ${mpn}`);
  }
}