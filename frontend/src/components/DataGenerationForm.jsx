import { useState } from 'react'
import { useDataGeneration } from '../hooks/useDataGeneration'
import { getMaxEndDate, getMinStartDate, getMinEndDate, getMaxEndDateFromStart, validateDateRange } from '../utils/dateValidation'
import LogsDisplay from './LogsDisplay'
import Alert from './Alert'

const DataGenerationForm = () => {
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const { loading, error, success, logs, generateData } = useDataGeneration()

  const handleSubmit = async (e) => {
    e.preventDefault()
    const result = await generateData({ startDate, endDate })
    if (result) {
      setStartDate("")
      setEndDate("")
    }
  }

  const isFormValid = startDate && endDate && !validateDateRange(startDate, endDate)

  return (
    <div className="controls-card">
      <div className="card-header">
        <h2 className="card-title">Generate Test Data</h2>
        <p className="card-description">
          Generate synthetic test data for all metrics. Max range: 2 months. Latest data: current time - 2 hours (LA time).
        </p>
      </div>

      <form onSubmit={handleSubmit} className="controls-grid">
        <div className="input-group">
          <label htmlFor="gen-start-date" className="input-label">Start Date</label>
          <input
            id="gen-start-date"
            type="datetime-local"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            min={endDate ? getMinStartDate(endDate) : ""} // ✅ Start date can be 60 days before end date
            // ✅ Removed max restriction on start date
            className="input-field"
            required
          />
        </div>

        <div className="input-group">
          <label htmlFor="gen-end-date" className="input-label">End Date</label>
          <input
            id="gen-end-date"
            type="datetime-local"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            min={startDate ? getMinEndDate(startDate) : ""} // ✅ End date must be after start date
            max={startDate ? getMaxEndDateFromStart(startDate) : getMaxEndDate()} // ✅ End date limited by current time - 2 hours OR 60 days from start
            className="input-field"
            required
          />
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
                Generating...
              </>
            ) : (
              "Generate Data"
            )}
          </button>
        </div>
      </form>

      <Alert type="error" message={error} />
      <Alert type="success" message={success} />
      <LogsDisplay logs={logs} />
    </div>
  )
}

export default DataGenerationForm