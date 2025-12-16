import * as tripsService from "../services/tripsService.js"

/**
 * Handles GET /api/v1/trips/summary/yearly - Retrieves the yearly aggregate summary data.
 */
export const getYearlySummary = async (req, res) => {
    try {
        const summary = await tripsService.getYearlySummary()
        res.status(200).json({ message: "Yearly trip summary retrieved.", data: summary })
    } catch (error) {
        res.status(500).json({ message: "Failed to generate summary.", data: error.message })
    }
}

/**
 * Handles GET /api/v1/trips/routes/top - Retrieves the most popular routes.
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