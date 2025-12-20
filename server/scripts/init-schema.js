import db from "../db/index.js";

/**
 * Enhanced schema with additional views for time-based analytics
 */
const MIGRATIONS = [
  // =========================
  // DROPS (Tables first - CASCADE will drop dependent views)
  // =========================
  `DROP TABLE IF EXISTS public.trips CASCADE`,
  `DROP TABLE IF EXISTS public.stations CASCADE`,

  `DROP FUNCTION IF EXISTS public.haversine_distance CASCADE`,

  `DROP VIEW IF EXISTS public.station_activity_summary CASCADE`,
  `DROP VIEW IF EXISTS public.rider_type_summary CASCADE`,
  `DROP VIEW IF EXISTS public.trips_monthly_summary CASCADE`,
  `DROP VIEW IF EXISTS public.route_detail_2025 CASCADE`,
  `DROP VIEW IF EXISTS public.trips_2025_summary CASCADE`,
  `DROP VIEW IF EXISTS public.hourly_usage_pattern CASCADE`,
  `DROP VIEW IF EXISTS public.daily_usage_pattern CASCADE`,
  `DROP VIEW IF EXISTS public.bike_type_performance CASCADE`,

  // =========================
  // TABLES
  // =========================
  `
  CREATE TABLE public.stations (
    station_id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION
  )
  `,

  `
  CREATE TABLE public.trips (
    ride_id TEXT PRIMARY KEY,
    rideable_type TEXT,
    started_at TIMESTAMP NOT NULL,
    ended_at TIMESTAMP NOT NULL,
    duration_seconds INT,
    start_station_name TEXT,
    end_station_name TEXT,
    start_station_id TEXT REFERENCES public.stations(station_id) ON DELETE SET NULL,
    end_station_id   TEXT REFERENCES public.stations(station_id) ON DELETE SET NULL,
    start_lat DOUBLE PRECISION,
    start_lng DOUBLE PRECISION,
    end_lat DOUBLE PRECISION,
    end_lng DOUBLE PRECISION,
    member_casual TEXT
  )
  `,

  // =========================
  // INDEXES
  // =========================
  `CREATE INDEX idx_trips_start_station_time ON public.trips(start_station_id, started_at)`,
  `CREATE INDEX idx_trips_end_station ON public.trips(end_station_id)`,
  `CREATE INDEX idx_trips_member_started_at ON public.trips(member_casual, started_at)`,
  `CREATE INDEX idx_trips_rideable_type ON public.trips(rideable_type)`,
  `CREATE INDEX idx_trips_started_at ON public.trips(started_at)`,

  // =========================
  // Functions
  // =========================
  `
  CREATE FUNCTION haversine_distance(lat1 float, lon1 float, lat2 float, lon2 float) 
  RETURNS float AS $$
    SELECT 3958.8 * 2 * ASIN(SQRT(
      POWER(SIN(RADIANS($3 - $1) / 2), 2) +
      COS(RADIANS($1)) * COS(RADIANS($3)) *
      POWER(SIN(RADIANS($4 - $2) / 2), 2)
    ));
  $$ LANGUAGE SQL IMMUTABLE;
  `,

  // =========================
  // VIEWS
  // =========================
  `
  CREATE VIEW public.station_activity_summary AS
  WITH start_counts AS (
    SELECT
      start_station_id,
      COUNT(*) AS started_count,
      COUNT(*) FILTER (WHERE member_casual = 'member') AS member_starts,
      COUNT(*) FILTER (WHERE member_casual = 'casual') AS casual_starts,
      COUNT(*) FILTER (WHERE rideable_type = 'electric_bike') AS electric_starts
    FROM public.trips
    WHERE start_station_id IS NOT NULL
    GROUP BY start_station_id
  ),
  end_counts AS (
    SELECT
      end_station_id,
      COUNT(*) AS ended_count
    FROM public.trips
    WHERE end_station_id IS NOT NULL
    GROUP BY end_station_id
  ),
  top_destinations AS (
    SELECT start_station_id,
           string_agg(destination, ', ' ORDER BY rank) AS top_3_destinations
    FROM (
      SELECT start_station_id,
             end_station_name AS destination,
             ROW_NUMBER() OVER (
               PARTITION BY start_station_id
               ORDER BY cnt DESC
             ) AS rank
      FROM (
        SELECT
          start_station_id,
          end_station_name,
          COUNT(*) AS cnt
        FROM public.trips
        WHERE start_station_id IS NOT NULL
          AND end_station_name IS NOT NULL
          AND end_station_name <> ''
        GROUP BY start_station_id, end_station_name
      ) t
    ) ranked
    WHERE rank <= 3
    GROUP BY start_station_id
  )
  SELECT
    s.station_id,
    s.name AS station_name,
    s.latitude,
    s.longitude,
    COALESCE(sc.started_count, 0) AS trips_started,
    COALESCE(ec.ended_count, 0) AS trips_ended,
    COALESCE(sc.started_count, 0) + COALESCE(ec.ended_count, 0) AS total_activity,
    COALESCE(sc.member_starts, 0) AS member_trips,
    COALESCE(sc.casual_starts, 0) AS casual_trips,
    ROUND(
      COALESCE(sc.member_starts, 0)::numeric /
      NULLIF(sc.member_starts + sc.casual_starts, 0) * 100, 1
    ) AS member_percent,
    COALESCE(sc.electric_starts, 0) AS electric_bike_starts,
    COALESCE(td.top_3_destinations, 'No frequent destinations') AS top_destinations
  FROM public.stations s
  LEFT JOIN start_counts sc ON s.station_id = sc.start_station_id
  LEFT JOIN end_counts ec ON s.station_id = ec.end_station_id
  LEFT JOIN top_destinations td ON s.station_id = td.start_station_id
  ORDER BY total_activity DESC
  `,

  `
  CREATE VIEW public.trips_monthly_summary AS
    SELECT
      DATE_TRUNC('month', started_at) AS month,
      COUNT(*) AS total_trips,
      AVG(duration_seconds) AS avg_duration_seconds,
      COUNT(*) FILTER (WHERE member_casual = 'member') AS member_trips,
      COUNT(*) FILTER (WHERE member_casual = 'casual') AS casual_trips,
      COUNT(*) FILTER (WHERE rideable_type = 'electric_bike') AS electric_trips,
      COUNT(*) FILTER (WHERE rideable_type = 'classic_bike') AS classic_trips
    FROM public.trips
    WHERE started_at >= '2025-01-01'
      AND started_at < '2026-01-01'
    GROUP BY 1
    ORDER BY 1
  `,

  `
  CREATE VIEW route_detail_2025 AS
  SELECT
      start_station_id,
      end_station_id,
      MAX(start_station_name) as start_station_name,
      MAX(end_station_name) as end_station_name,
      
      -- Mapping Coordinates
      AVG(start_lat) AS start_lat,
      AVG(start_lng) AS start_lng,
      AVG(end_lat) AS end_lat,
      AVG(end_lng) AS end_lng,
      
      -- Volume Metric
      COUNT(*) AS total_trips,
      
      -- Distance Metric
      ROUND(AVG(haversine_distance(start_lat, start_lng, end_lat, end_lng))::numeric, 2) as distance_between_stations_miles,
      
      -- Time Metric
      ROUND((AVG(duration_seconds) / 60.0)::numeric, 1) as avg_duration_minutes,
      
      -- User Breakdown
      COUNT(*) FILTER (WHERE member_casual = 'member') as member_count,
      COUNT(*) FILTER (WHERE member_casual = 'casual') as casual_count,
      ROUND((COUNT(*) FILTER (WHERE member_casual = 'member') * 100.0 / COUNT(*))::numeric, 1) as member_percent,
      
      -- Bike Type
      COUNT(*) FILTER (WHERE rideable_type = 'electric_bike') as electric_count,
      COUNT(*) FILTER (WHERE rideable_type = 'classic_bike') as classic_count
  FROM trips
  WHERE start_station_id IS NOT NULL 
    AND end_station_id IS NOT NULL 
    AND start_lat IS NOT NULL 
    AND end_lat IS NOT NULL
  GROUP BY 1, 2
  HAVING COUNT(*) > 5
  ORDER BY total_trips DESC
  `,

  // NEW: Hourly usage pattern
  `
  CREATE VIEW hourly_usage_pattern AS
  SELECT
    EXTRACT(HOUR FROM started_at) AS hour_of_day,
    COUNT(*) AS total_trips,
    COUNT(*) FILTER (WHERE member_casual = 'member') AS member_trips,
    COUNT(*) FILTER (WHERE member_casual = 'casual') AS casual_trips,
    COUNT(*) FILTER (WHERE rideable_type = 'electric_bike') AS electric_trips,
    COUNT(*) FILTER (WHERE rideable_type = 'classic_bike') AS classic_trips,
    ROUND(AVG(duration_seconds)::numeric / 60, 1) AS avg_duration_minutes
  FROM trips
  GROUP BY 1
  ORDER BY 1
  `,

  // NEW: Daily usage pattern (day of week)
  `
  CREATE VIEW daily_usage_pattern AS
  SELECT
    EXTRACT(DOW FROM started_at) AS day_of_week_num,
    TO_CHAR(started_at, 'Day') AS day_of_week_name,
    COUNT(*) AS total_trips,
    COUNT(*) FILTER (WHERE member_casual = 'member') AS member_trips,
    COUNT(*) FILTER (WHERE member_casual = 'casual') AS casual_trips,
    COUNT(*) FILTER (WHERE rideable_type = 'electric_bike') AS electric_trips,
    ROUND(AVG(duration_seconds)::numeric / 60, 1) AS avg_duration_minutes
  FROM trips
  GROUP BY 1, 2
  ORDER BY 1
  `,

  // NEW: Bike type performance comparison
  `
  CREATE VIEW bike_type_performance AS
  SELECT
    rideable_type,
    COUNT(*) AS total_trips,
    ROUND(AVG(duration_seconds)::numeric / 60, 1) AS avg_duration_minutes,
    ROUND(AVG(haversine_distance(start_lat, start_lng, end_lat, end_lng))::numeric, 2) AS avg_distance_miles,
    COUNT(*) FILTER (WHERE member_casual = 'member') AS member_usage,
    COUNT(*) FILTER (WHERE member_casual = 'casual') AS casual_usage,
    COUNT(DISTINCT start_station_id) AS unique_start_stations,
    COUNT(DISTINCT end_station_id) AS unique_end_stations
  FROM trips
  WHERE rideable_type IS NOT NULL
    AND start_lat IS NOT NULL
    AND end_lat IS NOT NULL
  GROUP BY rideable_type
  `
];

async function runMigrations() {
  console.log("🚀 Running database migrations...\n");

  for (let i = 0; i < MIGRATIONS.length; i++) {
    const sql = MIGRATIONS[i];

    try {
      await db.query(sql);
      console.log(`[${i + 1}/${MIGRATIONS.length}] Executed`);
    } catch (err) {
      console.error("\nMigration failed:");
      console.error(sql);
      console.error("\nError:", err.message);
      process.exit(1);
    }
  }

  console.log("\n✅ Migrations completed successfully.");
  await db.end();
}

runMigrations();