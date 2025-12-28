import { useEffect, useState } from "react";


function App() {

  const [data, setData] = useState(null);

  useEffect(() => {
    fetch("/data/master_analysis.json")
      .then(res => res.json())
      .then(setData)
      .catch(err => console.error("Failed to load data", err));
  }, [])

  if (!data) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-pink-500"></div>
        <span className="ml-4 text-lg text-slate-600">Loading data...</span>
      </div>
    )
  }

  const {
    overview
  } = data.results;

  const kpi = overview[0];
  console.log(kpi)



  return (
    <div className="min-h-screen p-6">

      {/* Header */}
      <header className="mb-8">
        <h1 className="text-3xl font-bold">🚲 Bay Wheels Unlocked 2025</h1>
        <p className="text-slate-500 mt-1">System-wide usage review of data between January and October 2025.</p>
      </header>

      {/* KPIs */}
    </div>
  )
}

export default App
