import { Line } from "react-chartjs-2"
import { getChartOptions, getChartData } from '../utils/chartConfig'

const DataVisualization = ({ dataPoints, metric }) => {
  if (!dataPoints || dataPoints.length === 0) {
    return (
      <div className="chart-card">
        <div className="card-header">
          <h2 className="card-title">Data Visualization</h2>
          <p className="card-description">Your data will appear here once fetched</p>
        </div>
        <div className="empty-state">
          <div className="empty-state-icon">📊</div>
          <p className="empty-state-text">No data to display</p>
          <p className="empty-state-subtext">Use the controls above to fetch your fitness data</p>
        </div>
      </div>
    )
  }

  const chartOptions = getChartOptions(metric)
  const chartData = getChartData(dataPoints, metric)

  return (
    <div className="chart-card">
      <div className="card-header">
        <h2 className="card-title">Data Visualization</h2>
        <p className="card-description">
          Showing {dataPoints.length} data points for {metric}
        </p>
      </div>
      <div className="chart-container">
        <Line options={chartOptions} data={chartData} />
      </div>
    </div>
  )
}

export default DataVisualization