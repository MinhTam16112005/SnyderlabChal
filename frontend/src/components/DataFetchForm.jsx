import { useState } from 'react'
import { useMetrics } from '../hooks/useMetrics'
import { useHealthData } from '../hooks/useHealthData'
import Alert from './Alert'

const DataFetchForm = ({ onDataFetched }) => {
  const [formData, setFormData] = useState({
    startDate: "",
    endDate: "",
    userId: "",
    metric: ""
  })
  
  const { metrics } = useMetrics()
  const { loading, error, fetchData } = useHealthData()

  const handleInputChange = (field) => (e) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const dataPoints = await fetchData(formData)
    onDataFetched?.(formData.metric, dataPoints)
  }

  const isFormValid = Object.values(formData).every(value => value.trim() !== "")

  return (
    <div className="controls-card">
      <div className="card-header">
        <h2 className="card-title">Data Controls</h2>
        <p className="card-description">Select your parameters to fetch and visualize your fitness data</p>
      </div>

      <form onSubmit={handleSubmit} className="controls-grid">
        <div className="input-group">
          <label htmlFor="start-date" className="input-label">Start Date</label>
          <input
            id="start-date"
            type="datetime-local"
            value={formData.startDate}
            onChange={handleInputChange('startDate')}
            className="input-field"
            required
          />
        </div>

        <div className="input-group">
          <label htmlFor="end-date" className="input-label">End Date</label>
          <input
            id="end-date"
            type="datetime-local"
            value={formData.endDate}
            onChange={handleInputChange('endDate')}
            className="input-field"
            required
          />
        </div>

        <div className="input-group">
          <label htmlFor="user-id" className="input-label">User ID</label>
          <input
            id="user-id"
            type="text"
            placeholder="Enter User ID"
            value={formData.userId}
            onChange={handleInputChange('userId')}
            className="input-field"
            required
          />
        </div>

        <div className="input-group">
          <label htmlFor="metric" className="input-label">Metric</label>
          <select 
            id="metric" 
            value={formData.metric} 
            onChange={handleInputChange('metric')} 
            className="select-field"
            required
          >
            <option value="">Select Metric</option>
            {metrics.map((metric) => (
              <option key={metric} value={metric}>{metric}</option>
            ))}
          </select>
        </div>

        <div className="button-group">
          <button
            type="submit"
            disabled={loading || !isFormValid}
            className={`fetch-button ${loading || !isFormValid ? "disabled" : ""}`}
          >
            {loading ? (
              <>
                <span className="spinner"></span>
                Loading...
              </>
            ) : (
              "Fetch Data"
            )}
          </button>
        </div>
      </form>

      <Alert type="error" message={error} />
    </div>
  )
}

export default DataFetchForm