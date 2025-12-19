import db from "../db/index.js";

const SCHEMA_SQL = `
-- =========================
-- 1. DROP EXISTING OBJECTS
-- =========================
DROP VIEW IF EXISTS data_quality_summary CASCADE;
DROP VIEW IF EXISTS ride_length_distribution CASCADE;
DROP VIEW IF EXISTS weekday_usage_summary CASCADE;
DROP VIEW IF EXISTS hourly_usage_summary CASCADE;
DROP VIEW IF EXISTS station_rider_type_summary CASCADE;
DROP VIEW IF EXISTS station_bike_type_summary CASCADE;
DROP VIEW IF EXISTS station_activity_summary CASCADE;
DROP VIEW IF EXISTS bike_type_by_rider_type CASCADE;
DROP VIEW IF EXISTS rider_type_summary CASCADE;
DROP VIEW IF EXISTS trips_yearly_monthly_summary CASCADE;
DROP VIEW IF EXISTS route_detail_2025 CASCADE;

DROP TABLE IF EXISTS trips CASCADE;
DROP TABLE IF EXISTS stations CASCADE;

-- =========================
-- 2. TABLES
-- =========================

CREATE TABLE stations (
  station_id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION
);

CREATE TABLE trips (
  ride_id TEXT PRIMARY KEY,
  rideable_type TEXT,
  started_at TIMESTAMP NOT NULL,
  ended_at TIMESTAMP NOT NULL,
  duration_seconds INT,
  start_station_name TEXT,
  end_station_name TEXT,

  -- Foreign keys must allow NULL
  start_station_id TEXT REFERENCES stations(station_id) ON DELETE SET NULL,
  end_station_id   TEXT REFERENCES stations(station_id) ON DELETE SET NULL,

  start_lat DOUBLE PRECISION,
  start_lng DOUBLE PRECISION,
  end_lat DOUBLE PRECISION,
  end_lng DOUBLE PRECISION,
  member_casual TEXT
);

-- =========================
-- 3. CORE DASHBOARD VIEWS
-- =========================

-- 3.1 Yearly + Monthly KPI summary (TOP OF DASHBOARD)
CREATE VIEW trips_yearly_monthly_summary AS
SELECT
  DATE_TRUNC('year', started_at) AS year,
  DATE_TRUNC('month', started_at) AS month,
  COUNT(*) AS total_trips,
  AVG(duration_seconds) AS avg_duration_seconds,
  SUM(duration_seconds) / 3600.0 AS total_hours,
  COUNT(*) FILTER (WHERE member_casual = 'member') AS member_trips,
  COUNT(*) FILTER (WHERE member_casual = 'casual') AS casual_trips
FROM trips
GROUP BY 1, 2
ORDER BY 1, 2;

-- =========================
-- 4. ROUTES (SECOND DASHBOARD SECTION)
-- =========================

CREATE VIEW route_detail_2025 AS
SELECT
  start_station_id,
  end_station_id,
  MAX(start_station_name) AS start_station_name,
  MAX(end_station_name) AS end_station_name,
  AVG(start_lat) AS start_lat,
  AVG(start_lng) AS start_lng,
  AVG(end_lat) AS end_lat,
  AVG(end_lng) AS end_lng,
  COUNT(*) AS trips_on_route,
  AVG(duration_seconds) AS avg_duration_seconds
FROM trips
WHERE start_station_id IS NOT NULL
  AND end_station_id IS NOT NULL
GROUP BY 1, 2
HAVING COUNT(*) > 5
ORDER BY trips_on_route DESC;

-- =========================
-- 5. RIDERS & BIKES
-- =========================

CREATE VIEW rider_type_summary AS
SELECT
  member_casual,
  COUNT(*) AS total_trips,
  AVG(duration_seconds) AS avg_duration_seconds,
  SUM(duration_seconds) / 3600.0 AS total_hours
FROM trips
GROUP BY member_casual;

CREATE VIEW bike_type_by_rider_type AS
SELECT
  rideable_type,
  member_casual,
  COUNT(*) AS total_trips,
  AVG(duration_seconds) AS avg_duration_seconds
FROM trips
GROUP BY rideable_type, member_casual
ORDER BY rideable_type, member_casual;

-- =========================
-- 6. STATIONS
-- =========================

CREATE VIEW station_activity_summary AS
SELECT
  station_id,
  station_name,
  SUM(trips_started) AS trips_started,
  SUM(trips_ended) AS trips_ended,
  SUM(trips_started + trips_ended) AS total_activity
FROM (
  SELECT
    start_station_id AS station_id,
    MAX(start_station_name) AS station_name,
    COUNT(*) AS trips_started,
    0 AS trips_ended
  FROM trips
  WHERE start_station_id IS NOT NULL
  GROUP BY start_station_id

  UNION ALL

  SELECT
    end_station_id AS station_id,
    MAX(end_station_name) AS station_name,
    0 AS trips_started,
    COUNT(*) AS trips_ended
  FROM trips
  WHERE end_station_id IS NOT NULL
  GROUP BY end_station_id
) s
GROUP BY station_id, station_name
ORDER BY total_activity DESC;

CREATE VIEW station_bike_type_summary AS
SELECT
  start_station_id AS station_id,
  MAX(start_station_name) AS station_name,
  rideable_type,
  COUNT(*) AS total_trips
FROM trips
WHERE start_station_id IS NOT NULL
GROUP BY start_station_id, rideable_type;

CREATE VIEW station_rider_type_summary AS
SELECT
  start_station_id AS station_id,
  MAX(start_station_name) AS station_name,
  member_casual,
  COUNT(*) AS total_trips,
  AVG(duration_seconds) AS avg_duration_seconds
FROM trips
WHERE start_station_id IS NOT NULL
GROUP BY start_station_id, member_casual;

-- =========================
-- 7. TIME ANALYSIS
-- =========================

CREATE VIEW hourly_usage_summary AS
SELECT
  EXTRACT(HOUR FROM started_at) AS hour_of_day,
  COUNT(*) AS total_trips,
  AVG(duration_seconds) AS avg_duration_seconds
FROM trips
GROUP BY hour_of_day
ORDER BY hour_of_day;

CREATE VIEW weekday_usage_summary AS
SELECT
  EXTRACT(DOW FROM started_at) AS day_of_week,
  COUNT(*) AS total_trips,
  AVG(duration_seconds) AS avg_duration_seconds
FROM trips
GROUP BY day_of_week
ORDER BY day_of_week;

-- =========================
-- 8. DISTRIBUTIONS & QA
-- =========================

CREATE VIEW ride_length_distribution AS
SELECT
  CASE
    WHEN duration_seconds < 300 THEN 'Under 5 min'
    WHEN duration_seconds < 900 THEN '5–15 min'
    WHEN duration_seconds < 1800 THEN '15–30 min'
    WHEN duration_seconds < 3600 THEN '30–60 min'
    ELSE 'Over 1 hour'
  END AS duration_bucket,
  COUNT(*) AS total_trips
FROM trips
GROUP BY duration_bucket
ORDER BY total_trips DESC;

CREATE VIEW data_quality_summary AS
SELECT
  COUNT(*) FILTER (WHERE start_station_id IS NULL) AS trips_missing_start_station,
  COUNT(*) FILTER (WHERE end_station_id IS NULL) AS trips_missing_end_station,
  COUNT(*) FILTER (WHERE duration_seconds <= 0) AS invalid_durations,
  COUNT(*) AS total_trips
FROM trips;
`;

async function init() {
  const { error } = await db.runSQL(SCHEMA_SQL);
  if (error) console.error("Init Error:", error.message);
  else console.log("✓ Schema & dashboard views ready.");
  if (db.end) await db.end();
}

init();
