import axios from "axios";
import * as cheerio from "cheerio";
import dotenv from "dotenv";
import { ProductInfo } from "./interface";
import { DistributorInfo } from "./interface";

dotenv.config();

const ZYTE_API_KEY = process.env.ZYTE_API_KEY as string;

if (!ZYTE_API_KEY) {
    throw new Error("ZYTE_API_KEY not found in environment variables");
}

// Get HTML from Zyte
async function fetchProductHtml(url: string, mpn: string): Promise<string> {
    try {
        console.log(`[INFO] Fetching HTML data for product : ${mpn}`);
        const response = await axios.post(
            "https://api.zyte.com/v1/extract",
            {
                url,
                browserHtml: true,
                javascript: false,
                actions: [
                    {
                        action: 'click',
                        selector: {
                            type: "css",
                            value: '[data-testid="show-all-button"]'
                        },
                        delay: Math.floor(Math.random() * 2) + 1
                    },
                ],
            },
            {
                auth: {
                    username: ZYTE_API_KEY,
                    password: "", // Only username (API Key) is required
                },
                headers: {
                    "Content-Type": "application/json",
                },
                timeout: 30000,
            }
        );

        const html = response.data.browserHtml;

        if (!html) {
            throw new Error("Empty HTML response from Zyte");
        }

        return html;
    } catch (error: any) {
        throw new Error(error?.response?.data?.detail || error.message);
    }
}

// Parse Cheerio HTML and extract product details
function parseProductHtml(mpn: string, url: string, html: string): ProductInfo {
    console.log(`\n[INFO] Parsing HTML for product : ${mpn}`);

    const $ = cheerio.load(html);

    const firstResult = $('[data-testid="prices-view-part"]').first();

    const title = firstResult.find('[data-sentry-component="Description"]').text().trim();
    const brand = firstResult.find('[data-testid="serp-part-header-manufacturer"]').text().trim();
    const medianPrice = firstResult.find('[data-testid="serp-part-header-median-price"]').text().trim();

    const distributors: DistributorInfo[] = [];
    const distributorRows = firstResult.find("tr[data-testid='offer-row']");

    distributorRows.each((_, row) => {
        try {
            const cells = $(row).find("td");
            const prices: Record<string, number> = {};

            const name = cells.eq(1).text().trim();
            const distributorSku = cells.eq(3).text().trim();
            const stock = parseInt(cells.eq(4).text().replace(/,/g, "")) || 0;
            const min = parseInt(cells.eq(5).text().trim()) || 0;
            const pkg = cells.eq(6).text().trim();
            const currency = cells.eq(7).text().trim();

            [8, 9, 10, 11, 12].forEach((i, idx) => {
                const priceText = cells.eq(i)?.text().trim();
                if (priceText) {
                    const qty = ["1", "10", "100", "1000", "10000"][idx];
                    prices[qty] = parseFloat(priceText);
                }
            });

            const updated = cells.last().text().trim();

            distributors.push({
                name,
                sku: distributorSku,
                stock,
                min,
                pkg,
                currency,
                prices,
                updated,
            });
        } catch (err) {
            console.warn(`Skipping invalid distributor row: ${err}`);
        }
    });

    return {
        mpn,
        url,
        title,
        brand,
        medianPrice,
        distributors,
    };
}

// Main entry function
export async function crawlProduct(mpn: string, currency: string): Promise<ProductInfo | null> {
    const url = `https://octopart.com/search?q=${encodeURIComponent(mpn)}&currency=${currency}`;

    try {
        const html = await fetchProductHtml(url, mpn);
        const productData = parseProductHtml(mpn, url, html);

        const {title, brand, medianPrice, distributors} = productData;
        if (!title && !brand && !medianPrice && !distributors) {
            return null;
        }

        return productData;
    } catch (error: any) {
        console.error(`[ERROR] Failed to crawl product ${mpn}:`, error.message);
        throw new Error(error.message);
    }
}
