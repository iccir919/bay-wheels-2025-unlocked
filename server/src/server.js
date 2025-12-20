import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import analyticsRoutes from './routes/analyticsRoutes.js';

// 1. Load Environment Variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// 2. Global Middleware
app.use(cors({
    origin: "*"
})); 
app.use(express.json()); // Allows the server to parse JSON in request bodies

// 3. Health Check Route (Good practice for debugging)
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 4. Mount Analytics Routes
// This means all routes in analyticsRoutes.js will start with /api
app.use('/api', analyticsRoutes);

// 5. Error Handling Middleware (Catches any stray errors)
app.use((err, req, res, next) => {
  console.error('Server Error:', err.stack);
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message
  });
});

// 6. Start Server
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
  console.log(`📊 Analytics API: http://localhost:${PORT}/api/trips/routes/top`);
});