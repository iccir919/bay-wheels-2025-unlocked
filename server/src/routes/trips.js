import express from "express"
import * as tripsController from "../controllers/tripsController.js"

const router = express.Router()

// Summary/Aggregate Routes
router.get("/summary/yearly", tripsController.getYearlySummary)

// Analytics Routes
router.get("/routes/top", tripsController.getTopRoutesData)

export default router