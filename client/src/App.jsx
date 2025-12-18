
import React, { useState, useEffect } from "react"
import StatCard from "./components/StatCard.jsx"
import './App.css'

const API_BASE_URL = "http://localhost:3000/api"

function BayWheelsUnlocked() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [data, setData] = useState({ 
      yearly: null, 
      topRoutes: []
    })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)

      const [yearlyRes, routesRes] = await Promise.all([
        fetch(`${API_BASE_URL}/trips/summary/yearly`),
        fetch(`${API_BASE_URL}/trips/routes/top?limit=10`)
      ])

      const yearly = await yearlyRes.json()
      const routes = await routesRes.json()

      setData({
        yearly: yearly.data,
        topRoutes: routes.data
      })

    } catch (err) {
      setError("There has been an error:", err.message)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-xl">Loading Bay Wheels 2025 data...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-xl text-red-600">Error: {error}</p>
        </div>
      </div>
    )
  }

  const { yearly } = data


  const formatNumber = (num) => {
    return new Intl.NumberFormat('en-US').format(num);
  }

  const formatDuration = (minutes) => {
    if (minutes < 60) return `${Math.round(minutes)}m`;
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return `${hours}h ${mins}m`;
  }

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <header className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">🚲 Bay Wheels Unlocked 2025</h1>
          <p className="text-lg text-gray-600">Analysis and insight for January to October 2025</p>
        </header>

        {/* Yearly Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard 
            title="Total Trips"
            value={formatNumber(yearly.total_trips)}
            icon="🚴"
          />

          <StatCard
            title="Total Distance"
            value={`${formatNumber(Math.round(yearly.total_distance_miles))} mi`}
            icon="📍"
          />

          <StatCard
            title="Avg Duration"
            value={formatDuration(yearly.avg_duration_minutes)}
            icon="⏱️"
          />

          <StatCard
            title="Unique Stations"
            value={formatNumber(yearly.unique_stations)}
            icon="🏢"
          />

        </div>

      </div>
    </div>
  )
}

export default BayWheelsUnlocked
