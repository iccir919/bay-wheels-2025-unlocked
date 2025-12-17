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