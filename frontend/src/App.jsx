import { useState } from "react"
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js"
import Header from "./components/Header"
import DataGenerationForm from "./components/DataGenerationForm"
import DataFetchForm from "./components/DataFetchForm"
import DataVisualization from "./components/DataVisualization"
import StatsGrid from "./components/StatsGrid"
import "./App.css"

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend)

function App() {
  const [dataPoints, setDataPoints] = useState([])
  const [currentMetric, setCurrentMetric] = useState("")

  const handleDataFetched = (metric, data) => {
    setCurrentMetric(metric)
    setDataPoints(data)
  }

  return (
    <div className="app-container">
      <div className="dashboard">
        <Header />
        <DataGenerationForm />
        <DataFetchForm onDataFetched={handleDataFetched} />
        <DataVisualization dataPoints={dataPoints} metric={currentMetric} />
        <StatsGrid dataPoints={dataPoints} />
      </div>
    </div>
  )
}

export default App