// controllers/analyticsController.js
import db from '../../db/index.js';

// =======================
// STATION ENDPOINTS
// =======================

export async function getAllStations(req, res) {
  try {
    const { limit = 50 } = req.query;
    
    const result = await db.query(
      `SELECT * FROM station_activity_summary LIMIT $1`,
      [limit]
    );
    
    res.json({
      success: true,
      count: result.rows.length,
      data: result.rows
    });
  } catch (err) {
    console.error('Error in getAllStations:', err);
    res.status(500).json({ success: false, error: err.message });
  }
}

export async function getTopStations(req, res) {
  try {
    const { limit = 10, orderBy = 'total_activity' } = req.query;
    
    const validColumns = ['total_activity', 'trips_started', 'trips_ended', 'member_trips', 'casual_trips'];
    const column = validColumns.includes(orderBy) ? orderBy : 'total_activity';
    
    const result = await db.query(
      `SELECT * FROM station_activity_summary 
       ORDER BY ${column} DESC 
       LIMIT $1`,
      [limit]
    );
    
    res.json({
      success: true,
      count: result.rows.length,
      data: result.rows
    });
  } catch (err) {
    console.error('Error in getTopStations:', err);
    res.status(500).json({ success: false, error: err.message });
  }
}

export async function getStationDetail(req, res) {
  try {
    const { stationId } = req.params;
    
    const result = await db.query(
      `SELECT * FROM station_activity_summary WHERE station_id = $1`,
      [stationId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'Station not found' 
      });
    }
    
    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (err) {
    console.error('Error in getStationDetail:', err);
    res.status(500).json({ success: false, error: err.message });
  }
}

// =======================
// ROUTE/TRIP ENDPOINTS
// =======================

export async function getTopRoutes(req, res) {
  try {
    const { limit = 20, minTrips = 10 } = req.query;
    
    const result = await db.query(
      `SELECT * FROM route_detail_2025 
       WHERE total_trips >= $1
       ORDER BY total_trips DESC 
       LIMIT $2`,
      [minTrips, limit]
    );
    
    res.json({
      success: true,
      count: result.rows.length,
      data: result.rows
    });
  } catch (err) {
    console.error('Error in getTopRoutes:', err);
    res.status(500).json({ success: false, error: err.message });
  }
}

export async function getRouteMapData(req, res) {
  try {
    const { minTrips = 50, limit = 100 } = req.query;
    
    const result = await db.query(
      `SELECT 
        start_station_id,
        end_station_id,
        start_station_name,
        end_station_name,
        start_lat,
        start_lng,
        end_lat,
        end_lng,
        total_trips,
        distance_between_stations_miles,
        avg_duration_minutes
       FROM route_detail_2025
       WHERE total_trips >= $1
       ORDER BY total_trips DESC
       LIMIT $2`,
      [minTrips, limit]
    );
    
    res.json({
      success: true,
      count: result.rows.length,
      data: result.rows
    });
  } catch (err) {
    console.error('Error in getRouteMapData:', err);
    res.status(500).json({ success: false, error: err.message });
  }
}

// =======================
// SUMMARY ENDPOINTS
// =======================

export async function getMonthlySummary(req, res) {
  try {
    const result = await db.query(
      `SELECT 
        TO_CHAR(month, 'YYYY-MM') as month,
        total_trips,
        ROUND(avg_duration_seconds::numeric / 60, 1) as avg_duration_minutes,
        member_trips,
        casual_trips,
        ROUND((member_trips::numeric / NULLIF(total_trips, 0) * 100), 1) as member_percent
       FROM trips_monthly_summary
       ORDER BY month`
    );
    
    res.json({
      success: true,
      count: result.rows.length,
      data: result.rows
    });
  } catch (err) {
    console.error('Error in getMonthlySummary:', err);
    res.status(500).json({ success: false, error: err.message });
  }
}

export async function getOverview(req, res) {
  try {
    const result = await db.query(`
      SELECT 
        COUNT(*) as total_trips,
        COUNT(DISTINCT start_station_id) as unique_stations,
        ROUND(AVG(duration_seconds)::numeric / 60, 1) as avg_trip_duration_minutes,
        COUNT(*) FILTER (WHERE member_casual = 'member') as total_member_trips,
        COUNT(*) FILTER (WHERE member_casual = 'casual') as total_casual_trips,
        COUNT(*) FILTER (WHERE rideable_type = 'electric_bike') as electric_bike_trips,
        COUNT(*) FILTER (WHERE rideable_type = 'classic_bike') as classic_bike_trips,
        MIN(started_at) as earliest_trip,
        MAX(started_at) as latest_trip
      FROM trips
    `);
    
    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (err) {
    console.error('Error in getOverview:', err);
    res.status(500).json({ success: false, error: err.message });
  }
}

export async function getRiderTypeSummary(req, res) {
  try {
    const result = await db.query(`
      SELECT 
        member_casual as rider_type,
        COUNT(*) as total_trips,
        ROUND(AVG(duration_seconds)::numeric / 60, 1) as avg_duration_minutes,
        COUNT(DISTINCT start_station_id) as stations_used,
        COUNT(*) FILTER (WHERE rideable_type = 'electric_bike') as electric_trips,
        COUNT(*) FILTER (WHERE rideable_type = 'classic_bike') as classic_trips
      FROM trips
      WHERE member_casual IS NOT NULL
      GROUP BY member_casual
    `);
    
    res.json({
      success: true,
      data: result.rows
    });
  } catch (err) {
    console.error('Error in getRiderTypeSummary:', err);
    res.status(500).json({ success: false, error: err.message });
  }
}

// =======================
// BIKE TYPE ANALYTICS
// =======================

export async function getBikeTypePerformance(req, res) {
  try {
    const result = await db.query(`
      SELECT * FROM bike_type_performance
      ORDER BY total_trips DESC
    `);
    
    res.json({
      success: true,
      data: result.rows
    });
  } catch (err) {
    console.error('Error in getBikeTypePerformance:', err);
    res.status(500).json({ success: false, error: err.message });
  }
}

// =======================
// TIME-BASED ANALYTICS
// =======================

export async function getHourlyPattern(req, res) {
  try {
    const result = await db.query(`
      SELECT * FROM hourly_usage_pattern
      ORDER BY hour_of_day
    `);
    
    res.json({
      success: true,
      data: result.rows
    });
  } catch (err) {
    console.error('Error in getHourlyPattern:', err);
    res.status(500).json({ success: false, error: err.message });
  }
}

export async function getDailyPattern(req, res) {
  try {
    const result = await db.query(`
      SELECT * FROM daily_usage_pattern
      ORDER BY day_of_week_num
    `);
    
    res.json({
      success: true,
      data: result.rows
    });
  } catch (err) {
    console.error('Error in getDailyPattern:', err);
    res.status(500).json({ success: false, error: err.message });
  }
}

// =======================
// TRIP SEARCH/FILTER
// =======================

export async function searchTrips(req, res) {
  try {
    const {
      startStation,
      endStation,
      riderType,
      bikeType,
      startDate,
      endDate,
      limit = 100,
      offset = 0
    } = req.query;
    
    let conditions = ['1=1'];
    let params = [];
    let paramIndex = 1;
    
    if (startStation) {
      conditions.push(`start_station_id = $${paramIndex++}`);
      params.push(startStation);
    }
    
    if (endStation) {
      conditions.push(`end_station_id = $${paramIndex++}`);
      params.push(endStation);
    }
    
    if (riderType) {
      conditions.push(`member_casual = $${paramIndex++}`);
      params.push(riderType);
    }
    
    if (bikeType) {
      conditions.push(`rideable_type = $${paramIndex++}`);
      params.push(bikeType);
    }
    
    if (startDate) {
      conditions.push(`started_at >= $${paramIndex++}`);
      params.push(startDate);
    }
    
    if (endDate) {
      conditions.push(`started_at <= $${paramIndex++}`);
      params.push(endDate);
    }
    
    params.push(limit, offset);
    
    const query = `
      SELECT 
        ride_id,
        rideable_type,
        started_at,
        ended_at,
        duration_seconds,
        start_station_name,
        end_station_name,
        member_casual,
        ROUND((duration_seconds::numeric / 60), 1) as duration_minutes
      FROM trips
      WHERE ${conditions.join(' AND ')}
      ORDER BY started_at DESC
      LIMIT $${paramIndex++} OFFSET $${paramIndex++}
    `;
    
    const result = await db.query(query, params);
    
    res.json({
      success: true,
      count: result.rows.length,
      data: result.rows
    });
  } catch (err) {
    console.error('Error in searchTrips:', err);
    res.status(500).json({ success: false, error: err.message });
  }
}