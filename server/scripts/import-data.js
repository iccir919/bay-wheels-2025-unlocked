import fs from "fs";
import path from "path";
import { parse } from "csv-parse";
import db from "../db/index.js";

const DATA_FOLDER = "./data";
const BATCH_SIZE = 1000;

/**
 * Normalize station IDs so FK constraints are never violated
 */
function normalizeStationId(id) {
  const v = id?.trim();
  if (!v) return null;
  if (v.toLowerCase() === "null") return null;
  return v;
}

/**
 * PHASE 1: Sync all stations (start + end)
 */
async function syncAllStations(files) {
  let batch = [];
  const seenIds = new Set();

  for (const file of files) {
    const parser = fs.createReadStream(file).pipe(parse({ columns: true }));

    for await (const row of parser) {
      const candidates = [
        {
          id: row.start_station_id,
          name: row.start_station_name,
          lat: row.start_lat,
          lng: row.start_lng
        },
        {
          id: row.end_station_id,
          name: row.end_station_name,
          lat: row.end_lat,
          lng: row.end_lng
        }
      ];

      for (const s of candidates) {
        const stationId = normalizeStationId(s.id);
        if (!stationId || seenIds.has(stationId)) continue;

        batch.push({
          station_id: stationId,
          name: s.name?.trim() || "Unknown Station",
          latitude: parseFloat(s.lat) || null,
          longitude: parseFloat(s.lng) || null
        });

        seenIds.add(stationId);

        if (batch.length >= BATCH_SIZE) {
          await db.from("stations").upsert(batch, {
            onConflict: "station_id"
          });
          batch = [];
        }
      }
    }
  }

  if (batch.length) {
    await db.from("stations").upsert(batch, {
      onConflict: "station_id"
    });
  }
}

/**
 * PHASE 2: Import trips 
 */
async function importTrips(files) {
  let batch = [];
  const batchIds = new Set();

  for (const file of files) {
    const parser = fs.createReadStream(file).pipe(parse({ columns: true }));

    for await (const row of parser) {
      const rideId = row.ride_id?.trim();
      if (!rideId || batchIds.has(rideId)) continue;

      batch.push({
        ride_id: rideId,
        rideable_type: row.rideable_type,
        started_at: row.started_at,
        ended_at: row.ended_at,
        duration_seconds: Math.floor(
          (new Date(row.ended_at) - new Date(row.started_at)) / 1000
        ),

        start_station_id: normalizeStationId(row.start_station_id),
        end_station_id: normalizeStationId(row.end_station_id),

        start_station_name: row.start_station_name,
        end_station_name: row.end_station_name,

        start_lat: parseFloat(row.start_lat) || null,
        start_lng: parseFloat(row.start_lng) || null,
        end_lat: parseFloat(row.end_lat) || null,
        end_lng: parseFloat(row.end_lng) || null,

        member_casual: row.member_casual
      });

      batchIds.add(rideId);

      if (batch.length >= BATCH_SIZE) {
        const { error } = await db
          .from("trips")
          .upsert(batch, { onConflict: "ride_id" });

        if (error) console.error("Batch Error:", error.message);

        batch = [];
        batchIds.clear();
      }
    }
  }

  if (batch.length) {
    await db.from("trips").upsert(batch, {
      onConflict: "ride_id"
    });
  }
}

async function run() {
  const files = fs
    .readdirSync(DATA_FOLDER)
    .filter(f => f.endsWith(".csv"))
    .map(f => path.join(DATA_FOLDER, f));

  console.log("Phase 1: Syncing stations...");
  await syncAllStations(files);

  console.log("Phase 2: Importing trips...");
  await importTrips(files);

  console.log("✓ Import finished");
  if (db.end) await db.end();
}

run();
