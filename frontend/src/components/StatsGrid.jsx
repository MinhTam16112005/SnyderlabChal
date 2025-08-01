const StatsGrid = ({ dataPoints }) => {
  // Early return if no data available
  if (!dataPoints || dataPoints.length === 0) {
    return null
  }

  // Calculate statistical values from data points
  const values = dataPoints.map(d => d.value)
  const sum = values.reduce((a, b) => a + b, 0)
  const avg = sum / values.length
  const min = Math.min(...values)
  const max = Math.max(...values)

  // Statistical summary configuration
  const stats = [
    { label: "Total Points", value: dataPoints.length.toLocaleString() },
    { label: "Average", value: avg.toFixed(2) },
    { label: "Minimum", value: min.toFixed(2) },
    { label: "Maximum", value: max.toFixed(2) },
  ]

  return (
    <div className="stats-grid">
      {/* Render each statistic as a card */}
      {stats.map((stat, index) => (
        <div key={index} className="stat-card">
          <div className="stat-value">{stat.value}</div>
          <div className="stat-label">{stat.label}</div>
        </div>
      ))}
    </div>
  )
}

export default StatsGrid