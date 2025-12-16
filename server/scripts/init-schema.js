// Sets up the database schema (tables, indices) for the configured DB_TARGET.
// This script EXECUTES the SQL for BOTH Supabase and Local PostgreSQL.
// Run: node scripts/init-schema.js or DB_TARGET=local node scripts/init-schema.js

import db from "../db/index.js"

// PostgreSQL Schema Definition (works for both Supabase and Local PG)
const SCHEMA_SQL = `
-- ============================================
-- 1. SCHEMA TEARDOWN (DROP OBJECTS)
-- Order of Drop: Functions, then Views, then Tables.
-- This is the safest way to tear down a schema.
-- ============================================


-- Drop Views (CASCADE is added here for maximum safety,
-- but the table drops below would also handle it)
DROP VIEW IF EXISTS trips_2025_summary CASCADE;
DROP VIEW IF EXISTS station_popularity CASCADE;
DROP VIEW IF EXISTS analysis_top_routes CASCADE;
DROP VIEW IF EXISTS stations_summary;

-- Drop Tables (CASCADE is CRITICAL here to remove all FKs and associated dependent objects like the views above)
DROP TABLE IF EXISTS trips CASCADE;
DROP TABLE IF EXISTS stations CASCADE;

-- ============================================
-- 2. TABLES (Creation)
-- ============================================

-- Table for Unique Station Data
CREATE TABLE stations (
    station_id TEXT PRIMARY KEY,
    name TEXT,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table for Bike Trip Data
CREATE TABLE trips (
    ride_id TEXT PRIMARY KEY,
    rideable_type TEXT,
    started_at TIMESTAMP WITH TIME ZONE NOT NULL,
    ended_at TIMESTAMP WITH TIME ZONE NOT NULL,
    duration_seconds INTEGER GENERATED ALWAYS AS (EXTRACT(EPOCH FROM (ended_at - started_at))) STORED,
    start_station_name TEXT,
    start_station_id TEXT,
    end_station_name TEXT,
    end_station_id TEXT,
    start_lat DOUBLE PRECISION,
    start_lng DOUBLE PRECISION,
    end_lat DOUBLE PRECISION,
    end_lng DOUBLE PRECISION,
    member_casual TEXT
);

-- ============================================
-- 3. INDEXES
-- ============================================

-- Index for faster filtering and joins
CREATE INDEX idx_trips_start_station_id ON trips (start_station_id);
CREATE INDEX idx_trips_end_station_id ON trips (end_station_id);
CREATE INDEX idx_trips_started_at ON trips (started_at);

-- ============================================
-- 4. VIEWS
-- ============================================


-- View for 2025 monthly summary (Using the new duration_seconds column)
CREATE OR REPLACE VIEW trips_2025_summary AS
SELECT 
  DATE_TRUNC('month', started_at) as month,
  COUNT(*) as total_trips,
  AVG(duration_seconds) as avg_duration_seconds,
  COUNT(DISTINCT start_station_id) as unique_start_stations,
  COUNT(DISTINCT end_station_id) as unique_end_stations,
  COUNT(DISTINCT rideable_type) as unique_bike_types,
  COUNT(*) FILTER (WHERE member_casual = 'member') as member_trips,
  COUNT(*) FILTER (WHERE member_casual = 'casual') as casual_trips
FROM trips
WHERE EXTRACT(YEAR FROM started_at) = 2025
GROUP BY DATE_TRUNC('month', started_at)
ORDER BY month;

-- View for station popularity
CREATE OR REPLACE VIEW station_popularity AS
SELECT 
  s.station_id,
  s.name,
  s.latitude,
  s.longitude,
  COUNT(DISTINCT t1.ride_id) + COUNT(DISTINCT t2.ride_id) as total_trips,
  COUNT(DISTINCT t1.ride_id) as trips_started,
  COUNT(DISTINCT t2.ride_id) as trips_ended
FROM stations s
LEFT JOIN trips t1 ON s.station_id = t1.start_station_id
LEFT JOIN trips t2 ON s.station_id = t2.end_station_id
GROUP BY s.station_id, s.name, s.latitude, s.longitude
ORDER BY total_trips DESC;

-- View for the top 10 Most Popular Routes (Using the new duration_seconds column)
CREATE OR REPLACE VIEW analysis_top_routes AS
SELECT
    start_station_name,
    end_station_name,
    COUNT(ride_id) AS route_count,
    ROUND(AVG(duration_seconds) / 60.0) AS avg_duration_minutes
FROM trips
WHERE start_station_name IS NOT NULL AND end_station_name IS NOT NULL
GROUP BY 1, 2
ORDER BY route_count DESC
LIMIT 10;
`

async function initSchema() {
    const target = process.env.DB_TARGET || 'local'
    
    console.log('====================================================')
    console.log(`        Executing Schema Initialization for Target: ${target.toUpperCase()}`)
    console.log('====================================================')
    
    if (typeof db.runSQL !== 'function') {
        console.error('\n✗ ERROR: The selected database client did not expose a runSQL method for schema initialization.')
        process.exit(1)
    }

    const { error } = await db.runSQL(SCHEMA_SQL);

    if (error) {
        console.error(`\n✗ Schema Initialization Failed for ${target.toUpperCase()}:`, error.message)
        process.exit(1)
    } else {
        console.log(`\n✓ ${target.toUpperCase()} Schema initialized successfully!`)
    }

    // Close the connection pool if the method exists
    if (typeof db.end === 'function') {
        await db.end()
    }
    
    console.log('====================================================')
    console.log('Setup complete. Run: node scripts/import-data.js')
}

initSchema();