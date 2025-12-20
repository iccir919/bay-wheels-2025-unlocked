# Bike Share Dashboard API Documentation

Base URL: `http://localhost:5000/api`

## 📍 Station Endpoints

### Get All Stations
```
GET /stations?limit=50
```
Returns station activity summary with trip counts and user demographics.

**Query Parameters:**
- `limit` (optional, default: 50) - Number of stations to return

**Response:**
```json
{
  "success": true,
  "count": 50,
  "data": [
    {
      "station_id": "123",
      "station_name": "Michigan Ave & Oak St",
      "latitude": 41.9008,
      "longitude": -87.6236,
      "trips_started": 1250,
      "trips_ended": 1180,
      "total_activity": 2430,
      "member_trips": 980,
      "casual_trips": 270,
      "member_percent": 78.4,
      "electric_bike_starts": 450,
      "top_destinations": "Navy Pier, Millennium Park, Grant Park"
    }
  ]
}
```

### Get Top Stations
```
GET /stations/top?limit=10&orderBy=total_activity
```
Returns top performing stations sorted by specified metric.

**Query Parameters:**
- `limit` (optional, default: 10)
- `orderBy` (optional, default: 'total_activity') - Options: `total_activity`, `trips_started`, `trips_ended`, `member_trips`, `casual_trips`

### Get Station Detail
```
GET /stations/:stationId
```
Returns detailed information for a specific station.

---

## 🚴 Route Endpoints

### Get Top Routes
```
GET /routes/top?limit=20&minTrips=10
```
Returns most popular routes between stations.

**Query Parameters:**
- `limit` (optional, default: 20)
- `minTrips` (optional, default: 10) - Minimum trip count to include

**Response:**
```json
{
  "success": true,
  "count": 20,
  "data": [
    {
      "start_station_id": "123",
      "end_station_id": "456",
      "start_station_name": "Michigan Ave & Oak St",
      "end_station_name": "Navy Pier",
      "start_lat": 41.9008,
      "start_lng": -87.6236,
      "end_lat": 41.8919,
      "end_lng": -87.6051,
      "total_trips": 542,
      "distance_between_stations_miles": 1.23,
      "avg_duration_minutes": 12.5,
      "member_count": 410,
      "casual_count": 132,
      "member_percent": 75.6,
      "electric_count": 280,
      "classic_count": 262
    }
  ]
}
```

### Get Route Map Data
```
GET /routes/map-data?minTrips=50&limit=100
```
Returns route data optimized for map visualization (with coordinates).

---

## 📊 Summary Endpoints

### Get Monthly Summary
```
GET /summary/monthly
```
Returns aggregated trip statistics by month for 2025.

**Response:**
```json
{
  "success": true,
  "count": 12,
  "data": [
    {
      "month": "2025-01",
      "total_trips": 45230,
      "avg_duration_minutes": 14.2,
      "member_trips": 35400,
      "casual_trips": 9830,
      "member_percent": 78.3,
      "electric_trips": 22100,
      "classic_trips": 23130
    }
  ]
}
```

### Get Overview
```
GET /summary/overview
```
Returns high-level system statistics.

**Response:**
```json
{
  "success": true,
  "data": {
    "total_trips": 542000,
    "unique_stations": 847,
    "avg_trip_duration_minutes": 15.3,
    "total_member_trips": 425000,
    "total_casual_trips": 117000,
    "electric_bike_trips": 268000,
    "classic_bike_trips": 274000,
    "earliest_trip": "2025-01-01T00:05:12Z",
    "latest_trip": "2025-12-15T23:58:45Z"
  }
}
```

### Get Rider Type Summary
```
GET /summary/rider-types
```
Compares member vs casual rider behavior.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "rider_type": "member",
      "total_trips": 425000,
      "avg_duration_minutes": 12.8,
      "stations_used": 680,
      "electric_trips": 210000,
      "classic_trips": 215000
    },
    {
      "rider_type": "casual",
      "total_trips": 117000,
      "avg_duration_minutes": 24.5,
      "stations_used": 520,
      "electric_trips": 58000,
      "classic_trips": 59000
    }
  ]
}
```

---

## ⏰ Time Pattern Endpoints

### Get Hourly Usage Pattern
```
GET /patterns/hourly
```
Returns trip distribution by hour of day (0-23).

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "hour_of_day": 0,
      "total_trips": 2340,
      "member_trips": 1820,
      "casual_trips": 520,
      "electric_trips": 1200,
      "classic_trips": 1140,
      "avg_duration_minutes": 18.2
    }
  ]
}
```

### Get Daily Usage Pattern
```
GET /patterns/daily
```
Returns trip distribution by day of week.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "day_of_week_num": 0,
      "day_of_week_name": "Sunday",
      "total_trips": 65000,
      "member_trips": 42000,
      "casual_trips": 23000,
      "electric_trips": 33000,
      "avg_duration_minutes": 19.5
    }
  ]
}
```

---

## 🚲 Bike Type Endpoints

### Get Bike Type Performance
```
GET /bikes/performance
```
Compares electric vs classic bike usage and performance.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "rideable_type": "electric_bike",
      "total_trips": 268000,
      "avg_duration_minutes": 13.2,
      "avg_distance_miles": 2.15,
      "member_usage": 210000,
      "casual_usage": 58000,
      "unique_start_stations": 820,
      "unique_end_stations": 815
    },
    {
      "rideable_type": "classic_bike",
      "total_trips": 274000,
      "avg_duration_minutes": 16.8,
      "avg_distance_miles": 1.92,
      "member_usage": 215000,
      "casual_usage": 59000,
      "unique_start_stations": 825,
      "unique_end_stations": 820
    }
  ]
}
```

---

## 🔍 Trip Search Endpoint

### Search Trips
```
GET /trips/search?startStation=123&riderType=member&limit=100
```
Searches trips with multiple filter options.

**Query Parameters:**
- `startStation` (optional) - Start station ID
- `endStation` (optional) - End station ID
- `riderType` (optional) - `member` or `casual`
- `bikeType` (optional) - `electric_bike` or `classic_bike`
- `startDate` (optional) - ISO timestamp (e.g., `2025-01-01`)
- `endDate` (optional) - ISO timestamp
- `limit` (optional, default: 100) - Results per page
- `offset` (optional, default: 0) - Pagination offset

**Response:**
```json
{
  "success": true,
  "count": 100,
  "data": [
    {
      "ride_id": "ABC123",
      "rideable_type": "electric_bike",
      "started_at": "2025-03-15T08:23:45Z",
      "ended_at": "2025-03-15T08:38:12Z",
      "duration_seconds": 867,
      "start_station_name": "Michigan Ave & Oak St",
      "end_station_name": "Navy Pier",
      "member_casual": "member",
      "duration_minutes": 14.5
    }
  ]
}
```

---

## 🏥 Health Check

### Health Check
```
GET /health
```
Returns server status.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2025-12-19T10:30:00.000Z"
}
```

---

## 🎯 Common Use Cases

### Dashboard Overview Page
```javascript
// Fetch key metrics
const overview = await fetch('/api/summary/overview');
const monthly = await fetch('/api/summary/monthly');
const topStations = await fetch('/api/stations/top?limit=5');
```

### Station Detail Page
```javascript
// Get specific station + its top routes
const station = await fetch('/api/stations/123');
const routes = await fetch('/api/routes/top?minTrips=20');
```

### Analytics Charts
```javascript
// Time-based usage charts
const hourly = await fetch('/api/patterns/hourly');
const daily = await fetch('/api/patterns/daily');
const bikeTypes = await fetch('/api/bikes/performance');
```

### Map Visualization
```javascript
// Get route data for map overlay
const mapData = await fetch('/api/routes/map-data?minTrips=100&limit=200');
```

---

## 🛠️ Error Responses

All endpoints return consistent error responses:

```json
{
  "success": false,
  "error": "Error message here"
}
```

**HTTP Status Codes:**
- `200` - Success
- `404` - Resource not found
- `500` - Internal server error