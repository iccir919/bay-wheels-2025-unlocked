// Import Bay Wheels 2025 data from local CSV files into the configured DB (Supabase or Local PG)
// NOTE: Run 'node scripts/init-schema.js' first.
// Run: node scripts/import-data.js or DB_TARGET=local node scripts/import-data.js

import db from "../db/index.js"
import fs from "fs"
import csv from "csv-parser"
import path, { parse } from "path"

const BATCH_SIZE = 1000
const DATA_FOLDER = "./data"


function parseCSV(filepath) {
    return new Promise((resolve, reject) => {
        const results = []

        fs.createReadStream(filepath)
            .pipe(csv())
            .on("data", (row) => {
                results.push(row)
            })
            .on("end", () => {
                resolve(results)
            })
            .on("error", (err) => {
                reject(err)
            })
    })
}

// Helper function to calculate duration in seconds
function calculateDurationInSeconds(startedAt, endedAt) {
    if (!startedAt || !endedAt) return null;
    const start = new Date(startedAt);
    const end = new Date(endedAt);
    const diffSeconds = (end.getTime() - start.getTime()) / 1000;
    // Basic validation: must be positive and less than 1 day (86400 seconds)
    if (diffSeconds > 0 && diffSeconds < 86400) {
        return Math.floor(diffSeconds);
    }
    return 0; // Invalid/too long trip duration
}

function transformTrip(row) {
    const duration_seconds = calculateDurationInSeconds(row.started_at, row.ended_at)
    // Transform CSV row to match database schema
    return {
    ride_id: row.ride_id?.trim() || null,
    rideable_type: row.rideable_type?.trim() || null,
    started_at: row.started_at?.trim() || null,
    ended_at: row.ended_at?.trim() || null,
    duration_seconds: duration_seconds,
    start_station_name: row.start_station_name?.trim() || null,
    start_station_id: row.start_station_id?.trim() || null,
    end_station_name: row.end_station_name?.trim() || null,
    end_station_id: row.end_station_id?.trim() || null,
    start_lat: row.start_lat ? parseFloat(row.start_lat) : null,
    start_lng: row.start_lng ? parseFloat(row.start_lng) : null,
    end_lat: row.end_lat ? parseFloat(row.end_lat) : null,
    end_lng: row.end_lng ? parseFloat(row.end_lng) : null,
    member_casual: row.member_casual?.trim() || null
    };
}

async function insertBatch(table, data) {
    // Uses the generic 'db' object which abstracts Supabase or Local PG
    const { error, code } = await db
        .from(table)
        .insert(data)

    if (error) {
        // Check if error is due to duplicate key (Postgres/Supabase code '23505')
        if (code === "23505") {
            return { error: true, isDuplicate: true }
        }
        console.error("Error inserting batch:", error)
        throw error
    }
}

async function importTrips(filepath) {
    console.log(`\nParsing ${filepath}...`)
    const trips = await parseCSV(filepath)
    console.log(`Found ${trips.length} trips`)

    let successCount = 0
    let errorCount = 0
    let skippedDuplicates = 0

    for (let i = 0; i < trips.length; i += BATCH_SIZE) {
        const batch = trips.slice(i, i + BATCH_SIZE)
            .map(transformTrip)
            .filter(trip => {
                // Filter out invalid rows
                if (!trip.ride_id || !trip.started_at || !trip.ended_at) {
                    errorCount++
                    return false
                }
                return true
            })

        try {
            await insertBatch("trips", batch)
            successCount += batch.length
            console.log(`✓ Inserted ${successCount}/${trips.length} trips (${errorCount} invalid, ${skippedDuplicates} duplicates)`)
        } catch (result) {
            if (result.isDuplicate) {
                skippedDuplicates += batch.length
                console.log(`⚠ Skipped ${batch.length} duplicate trips`)
            } else {
                console.error(`✗ Failed to insert batch at position ${i}:`, result.error.message)
                errorCount += batch.length
            }
        }
    }

    return { successCount, errorCount, skippedDuplicates, totalCount: trips.length }
}

async function extractStationsFromCSVs(csvFiles) {
    console.log('\nExtracting unique stations from CSVs...');

    const stationsMap = new Map();

    for (const filepath of csvFiles) {
        const rows = await parseCSV(filepath);

        for (const row of rows) {
            const startId = row.start_station_id?.trim();
            if (startId) {
                stationsMap.set(startId, {
                    station_id: startId,
                    name: row.start_station_name?.trim() || null,
                    latitude: row.start_lat ? parseFloat(row.start_lat) : null,
                    longitude: row.start_lng ? parseFloat(row.start_lng) : null,
                });
            }

            const endId = row.end_station_id?.trim();
            if (endId) {
                stationsMap.set(endId, {
                    station_id: endId,
                    name: row.end_station_name?.trim() || null,
                    latitude: row.end_lat ? parseFloat(row.end_lat) : null,
                    longitude: row.end_lng ? parseFloat(row.end_lng) : null,
                });
            }
        }
    }

    const stations = Array.from(stationsMap.values());
    console.log(`Found ${stations.length} unique stations`);

    let insertedCount = 0;
    for (let i = 0; i < stations.length; i += BATCH_SIZE) {
        const batch = stations.slice(i, i + BATCH_SIZE);

        const { error } = await db
            .from('stations')
            .upsert(batch, { onConflict: 'station_id' });

        if (error) throw error;

        insertedCount += batch.length;
        console.log(`✓ Inserted ${insertedCount}/${stations.length} stations`);
    }

    return insertedCount;
}


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

        let totalTrips = 0
        let totalSuccess = 0
        let totalErrors = 0
        let totalDuplicates = 0

        // Extract and populate stations table
        const stationCount = await extractStationsFromCSVs(csvFiles);
        
        console.log('\n═══════════════════════════════════════════════');
        console.log('  Import Complete! ✓');
        console.log(`  ${stationCount} stations catalogued`);
        console.log('═══════════════════════════════════════════════\n');  

        for (const filepath of csvFiles) {
            const result = await importTrips(filepath)
            totalTrips += result.totalCount
            totalSuccess += result.successCount
            totalErrors += result.errorCount
            totalDuplicates += result.skippedDuplicates
        }

        console.log('\n───────────────────────────────────────────────')
        console.log('Trip Import Summary:')
        console.log(`  Total rows processed: ${totalTrips}`)
        console.log(`  Successfully imported: ${totalSuccess}`)
        console.log(`  Invalid/Skipped: ${totalErrors}`)
        console.log(`  Duplicates skipped: ${totalDuplicates}`)
        console.log('───────────────────────────────────────────────')
      
    } catch (error) {
        console.error('\n✗ Import failed:', error.message)
        process.exit(1)
    } finally {
        // Gracefully close the pool if the client exposes an 'end' method (Local PG, Direct Supabase PG)
        if (typeof db.end === "function") {
            await db.end()
        }
    }
}

// Run the import
await main()