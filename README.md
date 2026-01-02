# 🚲 Bay Wheels Unlocked 2025

An end-to-end data platform for analyzing San Francisco's bike-sharing ecosystem. This project transforms raw trip data into an interactive visual dashboard using a custom **Node.js/PGlite ETL pipeline** and a **React/Tailwind frontend**.

---

## 🏗️ Project Architecture

The project is structured as a monorepo with two distinct environments:

1. **The Data Pipeline (`/scripts`)**: A high-performance Node.js environment that uses **PGlite** (a WASM-based PostgreSQL) to ingest and analyze millions of rows of CSV data.
2. **The Dashboard (`/frontend`)**: A modern **Vite + React** application that visualizes the aggregated metrics stored in a derived JSON file.

---

## 🚀 Quick Start

### 1. Process the Raw Data

Ensure your raw Bay Wheels CSV files are placed in the `/data/raw/` directory.

```bash
cd scripts
npm install
node run-pipeline.js
```

This script automates database initialization, station ingestion, trip processing, indexing, and final analysis.

### 2. Launch the Dashboard

Once the pipeline generates `master_analysis.json` in the `/data/derived/` folder:

```bash
cd ../frontend
npm install
npm run dev
```

---

## ⚙️ Data Engineering (The Pipeline)

The pipeline utilizes **SQL Transactions** and **Functional Indexes** to handle large datasets efficiently within a local file-based database.

- **Ingestion**: Streams CSV data to calculate trip durations on-the-fly without overloading memory.
- **Geospatial Analysis**: Calculates travel distances using the Haversine formula directly in SQL.
- **Temporal Patterns**: Extracts hourly and daily trends to identify peak usage times.
- **Optimization**: Uses B-Tree and Functional indexes on `started_at` and `member_casual` fields to ensure dashboard queries run in milliseconds.
- **Testing**: Debug specific SQL queries using the test runner: `node scripts/test-queries.js <queryName> <limit>`.

---

## 📊 Frontend Analytics

The React dashboard is decoupled from the database for maximum performance. It provides:

- **Geospatial Flow**: Interactive map using `react-leaflet` showing the top 40 busiest routes and station hotspots.
- **KPI Tracking**: Real-time metrics for total trips, average duration, electrification rates, and subscriber growth.
- **Visual Trends**: Monthly growth charts and peak demand area charts powered by `recharts`.
- **Leaderboards**: Performance tracking for the top stations, including member-vs-casual usage ratios.

---

## 📁 Repository Structure

```
├── data/
│   ├── raw/                # Input: Raw CSV files from Lyft/Bay Wheels
│   └── derived/            # Output: master_analysis.json (processed data)
├── db/
│   ├── pglite/             # Local database storage files
│   ├── schema.sql          # SQL Table definitions
│   └── indexes.sql         # SQL Performance optimizations
├── scripts/                # ETL Pipeline (Node.js)
│   ├── queries.js          # Master SQL query library
│   └── run-pipeline.js     # Orchestration script for the ETL process
└── frontend/               # React Dashboard (Vite)
    ├── src/components/     # Modular UI Components (KpiCard, Section)
    └── App.jsx             # Main Dashboard entry point and data mapping
```

---

## 🎯 Key Features

- **Scalable ETL**: Processes millions of records using streaming and indexed SQL operations
- **Zero-Config Database**: PGlite runs entirely in-process with no external database server required
- **Production-Ready Analytics**: Pre-aggregated data ensures sub-second dashboard load times
- **Modern Stack**: Built with Vite, React, Tailwind CSS, and industry-standard data visualization libraries

---

## 🛠️ Tech Stack

**Backend/ETL:**
- Node.js
- PGlite (WASM PostgreSQL)
- CSV parsing and streaming

**Frontend:**
- React + Vite
- Tailwind CSS
- react-leaflet (mapping)
- recharts (data visualization)

---

**Developed for the SF Cycling Community** 🌉
