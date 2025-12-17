import * as tripsService from "../services/tripsService.js"

/**
 * Handles GET /api/trips/summary/yearly - Retrieves the yearly aggregate summary data.
 */
export const getYearlySummary = async (req, res) => {
    try {
        const summary = await tripsService.getYearlySummary()
        res.status(200).json({ message: "Yearly trip summary retrieved.", data: summary })
    } catch (error) {
        console.error("Error fetching yearly summary:", error)
        res.status(500).json({ message: "Failed to generate summary.", data: error.message })
    }
}

/**
 * Handles GET /api/trips/summary/monthly - Retrieves the monthly trip summary data.
 */
export const getMonthlySummaryData = async (req, res) => {
    try {
        const summary = await tripsService.getMonthlySummaryData()
        res.status(200).json({ message: "Monthly trip summary retrieved.", data: summary })
    } catch (error) {
        console.error("Error fetching yearly summary:", error)
        res.status(500).json({ message: "Failed to generate summary.", data: error.message })
    }
}


/**
 * Handles GET /api/trips/routes/top - Retrieves the most popular routes.
 */
export const getTopRoutesData = async (req, res) => {
    try {
        const { limit = 20 } = req.query
        const routes = await tripsService.getTopRoutes(parseInt(limit))
        res.status(200).json({ message: `Top ${limit} popular routes retrieved`, data: routes })

    } catch (error) {
        res.status(500).json({ message: "Failed to retrieve top routes.", error: error.message })
    }
}

/**
 * Handles GET /api/trips/categories/distribution - Retrieves trip distribution by duration and user type.
 */
export const getDurationDistributionData = async (req, res) => {
    try {
        const distribution = await tripsService.getDurationDistribution()
        res.status(200).json({ message: 'Trip duration distribution retrieved.', data: distribution })
    } catch (error) {
        console.error('Error fetching duration distribution:', error)
        res.status(500).json({ message: 'Failed to retrieve distribution data.', error: error.message })
    }
}

/**
 * Handles GET /api/v1/trips/analytics/rideable-type-usage - Retrieves usage counts for each bike type.
 */
export const getRideableTypeUsageData = async (req, res) => {
    try {
        const usage = await tripsService.getRideableTypeUsage()
        res.status(200).json({ message: "Rideable type usage retrieved.", data: usage })
    } catch (error) {
        console.error('Error fetching duration distribution:', error)
        res.status(500).json({ message: 'Failed to retrieve distribution data.', error: error.message })
    }
}