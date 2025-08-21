import fs from "fs";
import path from "path";
import csv from "csv-parser";

/**
 * Reads MPNs from a CSV file.
 * Accepts column "mpn" in any case (mpn, MPN, Mpn, etc.).
 * @param filePath - Absolute path to the CSV file
 * @returns Array of MPN strings
 */
export async function readMPNfromfile(filePath: string): Promise<string[]> {
  const mpns: string[] = [];

  return new Promise((resolve, reject) => {
    fs.createReadStream(path.resolve(filePath))
      .pipe(csv())
      .on("data", (row) => {
        // Normalize all keys to lowercase for easier matching
        const normalizedRow: Record<string, any> = {};
        for (const key in row) {
          normalizedRow[key.toLowerCase()] = row[key];
        }

        const mpnValue = normalizedRow["mpn"];
        if (mpnValue && typeof mpnValue === "string") {
          const value = mpnValue.trim();
          if (value.length > 0) {
            mpns.push(value);
          }
        }
      })
      .on("end", () => {
        console.log(`[CSV] Loaded ${mpns.length} MPNs from file`);
        resolve(mpns);
      })
      .on("error", (error) => {
        console.error("[CSV Error] Failed to read MPNs from file:", error);
        reject(error);
      });
  });
}