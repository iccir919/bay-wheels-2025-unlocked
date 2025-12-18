const API_BASE_URL = "http://localhost:3000/api/trips"

export const fetchYearlySummary = async () => {
    const response = await fetch(`${API_BASE_URL}/summary/yearly`)
    const result = response.json()
    return result.data
}

export const fetchMonthlySummary = async () => {
    const response = await fetch(`${API_BASE_URL}/summary/monthly`)
    const result = await response.json()
    return result.data
}