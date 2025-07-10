import { useState, useEffect } from "react"
import { useUserContext } from "./hooks/useUserContext"
import Header from "./components/Header"
import DataGenerationForm from "./components/DataGenerationForm"
import DataFetchForm from "./components/DataFetchForm"
import DataVisualization from "./components/DataVisualization"
import StatsGrid from "./components/StatsGrid"
import "./App.css"

function App() {
  const [dataPoints, setDataPoints] = useState([])
  const [currentMetric, setCurrentMetric] = useState("")
  
  // User context for global user state
  const { selectedUser, timezone } = useUserContext()

  // Debug logging
  useEffect(() => {
    console.log('🎯 App - selectedUser changed:', selectedUser)
    console.log('🎯 App - timezone:', timezone)
  }, [selectedUser, timezone])

  const handleDataFetched = (metric, data) => {
    setCurrentMetric(metric)
    setDataPoints(data)
  }

  console.log('🎯 App render - selectedUser:', selectedUser ? selectedUser.user_id : 'null')

  return (
    <div className="app-container">
      <div className="dashboard">
        <Header />
        
        {!selectedUser && (
          <div className="no-user-selected">
            <p>👆 Please select a user to get started</p>
          </div>
        )}
        
        {selectedUser && (
          <div className="dashboard-content">
            <h3>Dashboard for {selectedUser.user_id}</h3>
            <DataGenerationForm selectedUser={selectedUser} />
            <DataFetchForm 
              selectedUser={selectedUser} 
              timezone={timezone}
              onDataFetched={handleDataFetched} 
            />
            <DataVisualization 
              dataPoints={dataPoints} 
              metric={currentMetric}
              timezone={timezone}
            />
            <StatsGrid dataPoints={dataPoints} />
          </div>
        )}
      </div>
    </div>
  )
}

// Add this line at the end:
export default App