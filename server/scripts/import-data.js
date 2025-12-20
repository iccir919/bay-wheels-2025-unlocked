import fs from "fs";
import path from "path";
import { parse } from "csv-parse";
import db from "../db/index.js";

const DATA_FOLDER = "./data";
const BATCH_SIZE = 1000;

function normalizeStationId(id) {
  const v = id?.trim();
  if (!v || v.toLowerCase() === "null") return null;
  return v;
}

// Helper: Upsert batch of stations
async function upsertStations(batch) {
  if (!batch.length) return;

  const values = batch
    .map(
      (_, i) =>
        `($${i * 4 + 1}, $${i * 4 + 2}, $${i * 4 + 3}, $${i * 4 + 4})`
    )
    .join(", ");

  const params = batch.flatMap((s) => [s.station_id, s.name, s.latitude, s.longitude]);

  const sql = `
    INSERT INTO stations (station_id, name, latitude, longitude)
    VALUES ${values}
    ON CONFLICT (station_id) DO UPDATE 
      SET name = EXCLUDED.name,
          latitude = EXCLUDED.latitude,
          longitude = EXCLUDED.longitude
  `;

  await db.query(sql, params);
}

// PHASE 1: Sync stations
async function syncAllStations(files) {
  let batch = [];
  const seenIds = new Set();

  for (const file of files) {
    const parser = fs.createReadStream(file).pipe(parse({ columns: true }));

    for await (const row of parser) {
      const candidates = [
        { id: row.start_station_id, name: row.start_station_name, lat: row.start_lat, lng: row.start_lng },
        { id: row.end_station_id, name: row.end_station_name, lat: row.end_lat, lng: row.end_lng },
      ];

      for (const s of candidates) {
        const id = normalizeStationId(s.id);
        if (!id || seenIds.has(id)) continue;

        batch.push({
          station_id: id,
          name: s.name?.trim() || "Unknown Station",
          latitude: parseFloat(s.lat) || null,
          longitude: parseFloat(s.lng) || null,
        });
        seenIds.add(id);

        if (batch.length >= BATCH_SIZE) {
          await upsertStations(batch);
          batch = [];
        }
      }
    }
  }

  if (batch.length) await upsertStations(batch);
}

// Helper: Upsert trips batch
async function upsertTrips(batch) {
  if (!batch.length) return;

  const values = batch
    .map(
      (_, i) =>
        `($${i * 14 + 1}, $${i * 14 + 2}, $${i * 14 + 3}, $${i * 14 + 4}, $${i * 14 + 5}, $${i * 14 + 6}, $${i * 14 + 7}, $${i * 14 + 8}, $${i * 14 + 9}, $${i * 14 + 10}, $${i * 14 + 11}, $${i * 14 + 12}, $${i * 14 + 13}, $${i * 14 + 14})`
    )
    .join(", ");

  const params = batch.flatMap((t) => [
    t.ride_id,
    t.rideable_type,
    t.started_at,
    t.ended_at,
    t.duration_seconds,
    t.start_station_id,
    t.end_station_id,
    t.start_station_name,
    t.end_station_name,
    t.start_lat,
    t.start_lng,
    t.end_lat,
    t.end_lng,
    t.member_casual,
  ]);

  const sql = `
    INSERT INTO trips (
      ride_id, rideable_type, started_at, ended_at, duration_seconds,
      start_station_id, end_station_id,
      start_station_name, end_station_name,
      start_lat, start_lng, end_lat, end_lng,
      member_casual
    )
    VALUES ${values}
    ON CONFLICT (ride_id) DO UPDATE
      SET rideable_type = EXCLUDED.rideable_type,
          started_at = EXCLUDED.started_at,
          ended_at = EXCLUDED.ended_at,
          duration_seconds = EXCLUDED.duration_seconds,
          start_station_id = EXCLUDED.start_station_id,
          end_station_id = EXCLUDED.end_station_id,
          start_station_name = EXCLUDED.start_station_name,
          end_station_name = EXCLUDED.end_station_name,
          start_lat = EXCLUDED.start_lat,
          start_lng = EXCLUDED.start_lng,
          end_lat = EXCLUDED.end_lat,
          end_lng = EXCLUDED.end_lng,
          member_casual = EXCLUDED.member_casual
  `;

  await db.query(sql, params);
}

// PHASE 2: Import trips
async function importTrips(files) {
  let batch = [];
  for (const file of files) {
    const parser = fs.createReadStream(file).pipe(parse({ columns: true }));

    for await (const row of parser) {
      const rideId = row.ride_id?.trim();
      if (!rideId) continue;

      batch.push({
        ride_id: rideId,
        rideable_type: row.rideable_type,
        started_at: row.started_at,
        ended_at: row.ended_at,
        duration_seconds: Math.floor((new Date(row.ended_at) - new Date(row.started_at)) / 1000),
        start_station_id: normalizeStationId(row.start_station_id),
        end_station_id: normalizeStationId(row.end_station_id),
        start_station_name: row.start_station_name,
        end_station_name: row.end_station_name,
        start_lat: parseFloat(row.start_lat) || null,
        start_lng: parseFloat(row.start_lng) || null,
        end_lat: parseFloat(row.end_lat) || null,
        end_lng: parseFloat(row.end_lng) || null,
        member_casual: row.member_casual,
      });

      if (batch.length >= BATCH_SIZE) {
        await upsertTrips(batch);
        batch = [];
      }
    }
  }

  if (batch.length) await upsertTrips(batch);
}

// Run import
async function run() {
  const files = fs.readdirSync(DATA_FOLDER)
    .filter(f => f.endsWith(".csv"))
    .map(f => path.join(DATA_FOLDER, f));

  console.log("Syncing stations...");
  await syncAllStations(files);

  console.log("Importing trips...");
  await importTrips(files);

  console.log("✓ Import finished");
  if (db.end) await db.end();
}

run();