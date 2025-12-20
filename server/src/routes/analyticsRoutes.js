// routes/analyticsRoutes.js
import express from 'express';
import * as analyticsController from '../controllers/analyticsController.js';

const router = express.Router();

// =======================
// STATION ENDPOINTS
// =======================
router.get('/stations', analyticsController.getAllStations);
router.get('/stations/top', analyticsController.getTopStations);
router.get('/stations/:stationId', analyticsController.getStationDetail);

// =======================
// ROUTE/TRIP ENDPOINTS
// =======================
router.get('/routes/top', analyticsController.getTopRoutes);
router.get('/routes/map-data', analyticsController.getRouteMapData);

// =======================
// SUMMARY ENDPOINTS
// =======================
router.get('/summary/monthly', analyticsController.getMonthlySummary);
router.get('/summary/overview', analyticsController.getOverview);
router.get('/summary/rider-types', analyticsController.getRiderTypeSummary);

// =======================
// TIME-BASED ANALYTICS
// =======================
router.get('/patterns/hourly', analyticsController.getHourlyPattern);
router.get('/patterns/daily', analyticsController.getDailyPattern);

// =======================
// BIKE TYPE ANALYTICS
// =======================
router.get('/bikes/performance', analyticsController.getBikeTypePerformance);

// =======================
// TRIP SEARCH/FILTER
// =======================
router.get('/trips/search', analyticsController.searchTrips);

export default router;