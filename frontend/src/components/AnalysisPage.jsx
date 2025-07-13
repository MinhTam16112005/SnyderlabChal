import { useState } from 'react'
import { useUserContext } from '../hooks/useUserContext'
import DataFetchForm from './DataFetchForm'
import DataVisualization from './DataVisualization'
import './AnalysisPage.css'

const AnalysisPage = () => {
  // Get user timezone from context
  const { timezone } = useUserContext()
  
  // State for chart data and visualization options
  const [currentMetric, setCurrentMetric] = useState("")
  const [dataPoints, setDataPoints] = useState([])
  const [gapsDetected, setGapsDetected] = useState([])
  const [dataSummary, setDataSummary] = useState({})
  const [imputationApplied, setImputationApplied] = useState(false)
  const [connectGaps, setConnectGaps] = useState(false)

  // Handle data fetched from the form component
  const handleDataFetched = (fetchedData) => {
    setCurrentMetric(fetchedData.metric)
    setDataPoints(fetchedData.dataPoints)
    setGapsDetected(fetchedData.gapsDetected || [])
    setDataSummary(fetchedData.dataSummary || {})
    setImputationApplied(fetchedData.imputationApplied || false)
    setConnectGaps(fetchedData.connectGaps || false)
  }

  return (
    <div className="analysis-page">
      {/* Data fetch form with user selection and gap handling options */}
      <DataFetchForm 
        timezone={timezone} 
        onDataFetched={handleDataFetched}
      />
      
      {/* Show visualization only when data is available */}
      {dataPoints.length > 0 && (
        <div className="analysis-results">
          <DataVisualization 
            metric={currentMetric}
            dataPoints={dataPoints}
            timezone={timezone}
            gapsDetected={gapsDetected}
            dataSummary={dataSummary}
            imputationApplied={imputationApplied}
            connectGaps={connectGaps}
          />
        </div>
      )}
    </div>
  )
}

export default AnalysisPage