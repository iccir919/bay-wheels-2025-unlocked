import express from "express"
import * as tripsController from "../controllers/tripsController.js"

const router = express.Router()

// Summary/Aggregate Routes
router.get("/summary/yearly", tripsController.getYearlySummary)
router.get("/summary/monthly", tripsController.getMonthlySummaryData)

// Analytics Routes
router.get("/routes/top", tripsController.getTopRoutesData)

export default router