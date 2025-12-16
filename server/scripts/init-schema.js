// Sets up the database schema (tables, indices) for the configured DB_TARGET.
// This script EXECUTES the SQL for BOTH Supabase and Local PostgreSQL.
// Run: node scripts/init-schema.js or DB_TARGET=local node scripts/init-schema.js

import db from "../db/index.js"

// PostgreSQL Schema Definition (works for both Supabase and Local PG)
const SCHEMA_SQL = `
-- ============================================
-- DROP EXISTING TABLES 
-- ============================================
DROP TABLE IF EXISTS trips CASCADE;
DROP TABLE IF EXISTS stations CASCADE;

-- ============================================
-- TABLES
-- ============================================

-- Stations table
CREATE TABLE IF NOT EXISTS stations (
  station_id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Trips table (core data, holds only 2025 data)
CREATE TABLE IF NOT EXISTS trips (
  trip_id BIGSERIAL PRIMARY KEY,
  ride_id TEXT UNIQUE NOT NULL,
  rideable_type TEXT,
  started_at TIMESTAMP NOT NULL,
  ended_at TIMESTAMP NOT NULL,
  duration_seconds INT,  -- NEW: Pre-calculated duration
  start_station_name TEXT,
  -- Added ON DELETE SET NULL for better data management
  start_station_id TEXT REFERENCES stations(station_id) ON DELETE SET NULL, 
  end_station_name TEXT,
  end_station_id TEXT REFERENCES stations(station_id) ON DELETE SET NULL, 
  start_lat DECIMAL(10, 8),
  start_lng DECIMAL(11, 8),
  end_lat DECIMAL(10, 8),
  end_lng DECIMAL(11, 8),
  member_casual TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================

-- Time-based indexes
CREATE INDEX IF NOT EXISTS idx_trips_started_at ON trips(started_at);
CREATE INDEX IF NOT EXISTS idx_trips_ended_at ON trips(ended_at);
CREATE INDEX IF NOT EXISTS idx_trips_started_at_month ON trips (DATE_TRUNC('month', started_at));

-- Station indexes
-- Speeds up lookups on trips table using foreign keys
CREATE INDEX IF NOT EXISTS idx_trips_start_station ON trips(start_station_id);
CREATE INDEX IF NOT EXISTS idx_trips_end_station ON trips(end_station_id);

-- Composite index for common time/station queries (e.g., "how many trips started at station X in month Y")
CREATE INDEX IF NOT EXISTS idx_trips_started_at_station ON trips(started_at, start_station_id);

-- Filter indexes (Speeds up queries filtered by user type or bike type)
CREATE INDEX IF NOT EXISTS idx_trips_member_casual ON trips(member_casual);
CREATE INDEX IF NOT EXISTS idx_trips_rideable_type ON trips(rideable_type);
-- Speeds up queries that look at specific routes (start_id -> end_id)
CREATE INDEX IF NOT EXISTS idx_trips_start_end_stations ON trips(start_station_id, end_station_id);


-- ============================================
-- FUNCTIONS (Utility for Views and Queries)
-- ============================================

-- 1. Format duration in seconds into HH:MI:SS string (Updated to handle negative/null)
CREATE OR REPLACE FUNCTION format_duration(seconds_input INT)
RETURNS TEXT AS $$
SELECT
    CASE 
        WHEN seconds_input IS NULL OR seconds_input < 0 THEN '00:00:00'
        ELSE 
            TO_CHAR((seconds_input / 3600), 'FM00') || ':' ||
            TO_CHAR(((seconds_input % 3600) / 60), 'FM00') || ':' ||
            TO_CHAR((seconds_input % 60), 'FM00')
    END;
$$ LANGUAGE SQL IMMUTABLE;

-- 2. Calculate Haversine distance between two points (Updated to handle NULL coordinates)
CREATE OR REPLACE FUNCTION haversine_distance(
    lat1 DOUBLE PRECISION, lon1 DOUBLE PRECISION,  -- CHANGED FROM DECIMAL
    lat2 DOUBLE PRECISION, lon2 DOUBLE PRECISION,  -- CHANGED FROM DECIMAL
    units TEXT DEFAULT 'miles'
)
RETURNS NUMERIC AS $$
DECLARE
    r NUMERIC;
    phi1 NUMERIC;
    phi2 NUMERIC;
    d_phi NUMERIC;
    d_lambda NUMERIC;
    a NUMERIC;
    c NUMERIC;
BEGIN
    -- Return NULL if any coordinate is NULL
    IF lat1 IS NULL OR lon1 IS NULL OR lat2 IS NULL OR lon2 IS NULL THEN
        RETURN NULL;
    END IF;

    r := CASE WHEN units = 'km' THEN 6371.0 ELSE 3958.8 END;
    phi1 := RADIANS(lat1);
    phi2 := RADIANS(lat2);
    d_phi := RADIANS(lat2 - lat1);
    d_lambda := RADIANS(lon2 - lon1);
    a := SIN(d_phi / 2) * SIN(d_phi / 2) + COS(phi1) * COS(phi2) * SIN(d_lambda / 2) * SIN(d_lambda / 2);
    c := 2 * ATAN2(SQRT(a), SQRT(1 - a));
    RETURN r * c;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 3. Trip Categorization (Classify trip length for analysis)
CREATE OR REPLACE FUNCTION categorize_trip_duration(duration_seconds INT)
RETURNS TEXT AS $$
BEGIN
    IF duration_seconds <= 600 THEN
        RETURN '0-10 Min (Short)';
    ELSIF duration_seconds <= 1800 THEN
        RETURN '10-30 Min (Medium)';
    ELSIF duration_seconds <= 3600 THEN
        RETURN '30-60 Min (Long)';
    ELSE
        RETURN '> 60 Min (Extended)';
    END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;


-- ============================================
-- VIEWS (Standard, On-Demand Calculation)
-- ============================================

-- V1. Monthly Summary View 
CREATE OR REPLACE VIEW trips_monthly_summary_2025 AS
SELECT
    DATE_TRUNC('month', started_at) AS month,
    COUNT(*) AS total_trips,
    AVG(duration_seconds) AS avg_duration_seconds, -- NEW
    format_duration(CAST(AVG(duration_seconds) AS INT)) AS avg_duration_formatted, 
    PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY duration_seconds) AS median_duration_seconds, 
    COUNT(*) FILTER (WHERE member_casual = 'member') AS member_trips,
    COUNT(*) FILTER (WHERE member_casual = 'casual') AS casual_trips,
    (COUNT(*) FILTER (WHERE member_casual = 'member') * 100.0 / COUNT(*)) AS member_trip_percentage,
    AVG(haversine_distance(start_lat, start_lng, end_lat, end_lng, 'miles')) AS avg_trip_distance_miles,
    MODE() WITHIN GROUP (ORDER BY EXTRACT(HOUR FROM started_at)) AS most_popular_start_hour_24h
FROM trips
GROUP BY 1
ORDER BY month;

-- V2. Yearly Summary View 
CREATE OR REPLACE VIEW trips_yearly_summary_2025 AS
SELECT
    EXTRACT(YEAR FROM started_at) AS year,
    COUNT(*) AS total_trips,
    AVG(duration_seconds) AS avg_duration_seconds, -- NEW
    format_duration(CAST(AVG(duration_seconds) AS INT)) AS avg_duration_formatted, 
    PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY duration_seconds) AS median_duration_seconds, 
    COUNT(*) FILTER (WHERE member_casual = 'member') AS member_trips,
    COUNT(*) FILTER (WHERE member_casual = 'casual') AS casual_trips,
    (COUNT(*) FILTER (WHERE member_casual = 'member') * 100.0 / COUNT(*)) AS member_trip_percentage,
    AVG(haversine_distance(start_lat, start_lng, end_lat, end_lng, 'miles')) AS avg_trip_distance_miles,
    COUNT(DISTINCT start_station_id) AS unique_start_stations,
    COUNT(DISTINCT end_station_id) AS unique_end_stations
FROM trips
WHERE EXTRACT(YEAR FROM started_at) = 2025
GROUP BY 1; 

-- V3. Route Detail View
CREATE OR REPLACE VIEW route_detail_2025 AS
SELECT
    start_station_name,
    end_station_name,
    start_station_id,
    end_station_id,
    COUNT(ride_id) AS trips_on_route,
    AVG(EXTRACT(EPOCH FROM (ended_at - started_at))) AS avg_duration_seconds,
    AVG(haversine_distance(start_lat, start_lng, end_lat, end_lng, 'miles')) AS avg_distance_miles,
    COUNT(*) FILTER (WHERE member_casual = 'member') AS member_trips,
    COUNT(*) FILTER (WHERE member_casual = 'casual') AS casual_trips
FROM trips
WHERE
    start_station_id IS NOT NULL AND end_station_id IS NOT NULL
GROUP BY 1, 2, 3, 4
HAVING COUNT(ride_id) > 10
ORDER BY trips_on_route DESC;

-- V4. Trip Category Distribution View (NEW: Segment trips by duration category and user type)
CREATE OR REPLACE VIEW trips_category_distribution_2025 AS
SELECT
    categorize_trip_duration(duration_seconds) AS trip_duration_category,
    member_casual,
    COUNT(ride_id) AS total_trips_in_segment,
    ROUND(
        COUNT(ride_id) * 100.0 / SUM(COUNT(ride_id)) OVER (PARTITION BY member_casual),
        2
    ) AS percentage_of_customer_trips
FROM trips
WHERE
    EXTRACT(EPOCH FROM (ended_at - started_at)) BETWEEN 60 AND 86400 -- Filter for valid durations
GROUP BY 1, 2
ORDER BY member_casual, total_trips_in_segment DESC;
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