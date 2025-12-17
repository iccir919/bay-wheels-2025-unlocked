
import React, { useState, useEffect } from "react"
import './App.css'

const API_BASE_URL = "http://localhost:3000/api"

function BayWheelsUnlocked() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [data, setData] = useState({
    yearly: null,
    monthly: [],
    tripRoutes: [],
    distribution: [],
    rideableTypes: []
  })

  if (loading) {
    return (
      <div>
        <p>Loading Bay Wheels data...</p>
      </div>
    )
  }

  return (

    <>

    </>
  )
}

export default BayWheelsUnlocked
