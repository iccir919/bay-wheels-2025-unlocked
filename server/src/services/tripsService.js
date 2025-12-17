import db from "../../db/index.js"

/**
 * Retrieves the high-level yearly summary using the V2 view.
 */
export async function getYearlySummary() {
    const sql = "SELECT * FROm trips_yearly_summary_2025;"
    const { data, error } = await db.query(sql)
    if (error) {
        throw new Error(`Database error retrieving yearly summary: ${error.message}`)
    }

    return data.length > 0 ? data[0] : null
}

/**
 * Retrieves the detailed monthly summary data using the V1 view.
 */
export async function getMonthlySummaryData() {
    const sql = "SELECT * FROM trips_monthly_summary_2025;"
    const { data, error } = await db.query(sql)
    if (error) {
        throw new Error(`Database error retrieving monthly summary: ${error.message}`)
    }
    return data
}


/**
 * Retrieves the top routes (start/end pair) based on trip count using the V3 view.
 */
export async function getTopRoutes(limit = 20) {
    const sql = `
        SELECT *
        FROM route_detail_2025
        ORDER BY trips_on_route DESC
        LIMIT $1;
    `
    const { data, error } = await db.query(sql, [limit])
    if (error) {
        throw new Error(`Database error retrieving top routes: ${error.message}`)
    }
    return data
}

/**
 * Retrieves trip distribution data segmented by duration category and user type using the V4 view.
 */
export async function getDurationDistribution() {
    const sql = "SELECT * FROM trips_category_distribution_2025;"
    const { data, error } = await db.query(sql)
    if (error) {
        throw new Error(`Database error retrieving duration distribution: ${error.message}`)
    }
    return data
}

/**
 * Retrieves usage counts for each rideable type, segmented by user type.
 */
export async function getRideableTypeUsage() {
    const sql = `
        SELECT 
            rideable_type,
            member_casual,
            COUNT(ride_id) AS total_trips
        FROM trips
        GROUP BY 1, 2
        ORDER BY total_trips DESC;
    `
    const { data, error } = await db.query(sql)
    if (error) {
        throw new Error(`Database error retrieving rideable type usage: ${error.message}`)
    }
    return data
}