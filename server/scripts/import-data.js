// Import Bay Wheels 2025 data from local CSV files into the configured DB (Supabase or Local PG)
// NOTE: Run 'node scripts/init-schema.js' first.
// Run: node scripts/import-data.js or DB_TARGET=local node scripts/import-data.js

import db from "../db/index.js"
import fs from "fs"
import csv from "csv-parser"
import path from "path"

const BATCH_SIZE = 1000
const DATA_FOLDER = "./data"

async function getCSVFiles() {
    // Check if data folder exists
    if (!fs.existsSync(DATA_FOLDER)) {
        throw new Error(`Data folder not found: ${DATA_FOLDER}`)
    }

    // Get all CSV files in the data folder
    const files = fs.readdirSync(DATA_FOLDER)
        .filter(file => file.endsWith(".csv"))
        .map(file => path.join(DATA_FOLDER, file))
        .sort()
    
    if (files.length === 0) {
        throw new Error(`No CSV files found in ${DATA_FOLDER}`)
    }

    return files
}

async function main() {
    try {
        const target = process.env.DB_TARGET || 'Local';
        console.log('═══════════════════════════════════════════════');
        console.log(`  Bay Wheels 2025 Data Import Tool (Target: ${target.toUpperCase()})`);
        console.log('═══════════════════════════════════════════════\n');

        // Get all CSV files
        const csvFiles = await getCSVFiles()
        console.log(`Found ${csvFiles.length} CSV files(s) to process:`)
        csvFiles.forEach(file => console.log(` - ${path.basename(file)}`))
    } catch (error) {
        console.error('\n✗ Import failed:', error.message);
        process.exit(1)
    }
}

// Run the import
await main()