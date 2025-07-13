import { useState, useEffect, useRef } from 'react'
import { useMetrics } from '../hooks/useMetrics'
import { useHealthData } from '../hooks/useHealthData'
import { useUsers } from '../hooks/useUsers'
import { useUserContext } from '../hooks/useUserContext'
import { validateDateRange } from '../utils/dateValidation'
import Alert from './Alert'

const DataFetchForm = ({ timezone, onDataFetched }) => {
  // Form data state
  const [formData, setFormData] = useState({
    startDate: "",
    endDate: "",
    userId: "",
    metric: ""
  })
  
  // Gap handling option - mutually exclusive: 'none', 'connect', 'imputed'
  const [gapOption, setGapOption] = useState('none')
  
  // UI state
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false)
  const [isMetricDropdownOpen, setIsMetricDropdownOpen] = useState(false)
  
  // Refs for dropdown click outside detection
  const userDropdownRef = useRef(null)
  const metricDropdownRef = useRef(null)
  
  // Context and hooks
  const { 
    timezone: userTimezone, 
    getMaxDateTimeLocal, 
    getMinEndDateFromStart, 
    getMaxEndDateFromStart,
    formatDateTimeInTimezone
  } = useUserContext()
  const { metrics, loading: metricsLoading } = useMetrics()
  const { users, loading: usersLoading } = useUsers()

  // Auto-select first user when users load
  useEffect(() => {
    if (users.length > 0 && !formData.userId) {
      setFormData(prev => ({ ...prev, userId: users[0].user_id }))
    }
  }, [users, formData.userId])

  // Auto-select first metric when metrics load
  useEffect(() => {
    if (metrics.length > 0 && !formData.metric) {
      setFormData(prev => ({ ...prev, metric: metrics[0] }))
    }
  }, [metrics, formData.metric])

  // Handle clicks outside dropdowns to close them
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target)) {
        setIsUserDropdownOpen(false)
      }
      if (metricDropdownRef.current && !metricDropdownRef.current.contains(event.target)) {
        setIsMetricDropdownOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  // Generic form input handler
  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (error) setError(null)
  }

  // User dropdown handlers
  const handleUserSelect = (userId) => {
    handleInputChange('userId', userId)
    setIsUserDropdownOpen(false)
  }

  // Metric dropdown handlers
  const handleMetricSelect = (metric) => {
    handleInputChange('metric', metric)
    setIsMetricDropdownOpen(false)
  }

  // Handle mutually exclusive gap option checkboxes
  const handleGapOptionChange = (option, checked) => {
    if (checked) {
      setGapOption(option)
    } else {
      setGapOption('none')
    }
  }

  // Main form submission handler
  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.startDate || !formData.endDate || !formData.userId || !formData.metric) {
      setError("All fields are required")
      return
    }
    
    // Derive boolean flags from gap option state
    const connectGaps = gapOption === 'connect'
    const showImputedData = gapOption === 'imputed'
    
    setLoading(true)
    setError(null)
    
    try {
      const startISO = new Date(formData.startDate).toISOString()
      const endISO = new Date(formData.endDate).toISOString()
      
      // Build API request parameters - only showImputedData affects backend
      const params = new URLSearchParams({
        start_date: startISO,
        end_date: endISO,
        user_id: formData.userId,
        metric: formData.metric,
        include_imputed: showImputedData.toString(),
        apply_imputation: showImputedData.toString(),
        per_page: '10000'
      })
      
      const response = await fetch(`http://localhost:5001/data?${params.toString()}`)
      
      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`API Error: ${response.status} - ${errorText}`)
      }
      
      const result = await response.json()
      
      // Prepare data for chart component
      const dataToPass = {
        dataPoints: result.data || [],
        gapsDetected: result.gaps_detected || [],
        dataSummary: result.data_summary || {},
        imputationApplied: result.imputation_applied || false,
        connectGaps: connectGaps, // Frontend-only flag for line connections
        metric: formData.metric,
        dateRange: {
          start: formData.startDate,
          end: formData.endDate
        }
      }
      
      if (onDataFetched) {
        onDataFetched(dataToPass)
      }
      
    } catch (error) {
      setError(error.message || 'Failed to fetch data. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Quick date range setters
  const setLastWeek = () => {
    const now = new Date()
    const weekAgo = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000))
    
    const endDate = now.toISOString().slice(0, 16)
    const startDate = weekAgo.toISOString().slice(0, 16)
    
    setFormData(prev => ({ ...prev, startDate, endDate }))
  }

  const setLast24Hours = () => {
    const now = new Date()
    const dayAgo = new Date(now.getTime() - (24 * 60 * 60 * 1000))
    
    const endDate = now.toISOString().slice(0, 16)
    const startDate = dayAgo.toISOString().slice(0, 16)
    
    setFormData(prev => ({ ...prev, startDate, endDate }))
  }

  // Computed values for UI state
  const selectedUser = users.find(user => user.user_id === formData.userId)
  const selectedMetric = metrics.find(metric => metric === formData.metric)
  const dateValidationError = validateDateRange(formData.startDate, formData.endDate, userTimezone)
  const isFormValid = formData.startDate && formData.endDate && formData.userId && formData.metric && !dateValidationError

  return (
    <div className="controls-card">
      {/* Header section */}
      <div className="card-header">
        <h2 className="card-title">Data Analysis</h2>
        <p className="card-description">
          Fetch and analyze health data with advanced gap detection and imputation capabilities.
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="analysis-form-container">
          
          {/* User selection dropdown */}
          <div className="user-selection-row">
            <div className="input-group">
              <label htmlFor="user-select" className="input-label">Select User</label>
              {usersLoading ? (
                <div className="loading-placeholder">Loading users...</div>
              ) : users.length === 0 ? (
                <div className="no-data-message">No users available. Please enroll users first.</div>
              ) : (
                <div className="custom-user-selector" ref={userDropdownRef}>
                  <button
                    type="button"
                    className={`user-button ${isUserDropdownOpen ? 'open' : ''}`}
                    onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
                  >
                    <div className="user-content">
                      <div className="user-main">
                        <span className="user-label">
                          {formData.userId ? formData.userId : 'Select a user'}
                        </span>
                        {selectedUser && (
                          <span className="user-time">
                            {selectedUser.total_records} records, {selectedUser.metrics_count} metrics
                          </span>
                        )}
                      </div>
                      <svg 
                        className={`user-arrow ${isUserDropdownOpen ? 'rotated' : ''}`}
                        width="16" 
                        height="16" 
                        viewBox="0 0 16 16"
                      >
                        <path 
                          d="M4 6l4 4 4-4" 
                          stroke="currentColor" 
                          strokeWidth="2" 
                          fill="none" 
                          strokeLinecap="round" 
                          strokeLinejoin="round"
                        />
                      </svg>
                    </div>
                  </button>

                  {isUserDropdownOpen && (
                    <div className="user-dropdown">
                      <div className="dropdown-header">
                        <span>Select User</span>
                      </div>
                      <div className="user-options">
                        {users.map((user) => (
                          <div
                            key={user.user_id}
                            className={`user-option ${formData.userId === user.user_id ? 'selected' : ''}`}
                            onClick={() => handleUserSelect(user.user_id)}
                          >
                            <div className="option-content">
                              <div className="option-main">
                                <span className="option-label">{user.user_id}</span>
                                <span className="option-time">
                                  {user.total_records} records, {user.metrics_count} metrics
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
              <small>Choose from available users with data</small>
            </div>
          </div>

          {/* Metric selection dropdown */}
          <div className="input-group">
            <label htmlFor="metric-select" className="input-label">Select Metric</label>
            {metricsLoading ? (
              <div className="loading-placeholder">Loading metrics...</div>
            ) : metrics.length === 0 ? (
              <div className="no-data-message">No metrics available.</div>
            ) : (
              <div className="custom-user-selector" ref={metricDropdownRef}>
                <button
                  type="button"
                  className={`user-button ${isMetricDropdownOpen ? 'open' : ''}`}
                  onClick={() => setIsMetricDropdownOpen(!isMetricDropdownOpen)}
                >
                  <div className="user-content">
                    <div className="user-main">
                      <span className="user-label">
                        {formData.metric ? formData.metric : 'Select a metric'}
                      </span>
                    </div>
                    <svg 
                      className={`user-arrow ${isMetricDropdownOpen ? 'rotated' : ''}`}
                      width="16" 
                      height="16" 
                      viewBox="0 0 16 16"
                    >
                      <path 
                        d="M4 6l4 4 4-4" 
                        stroke="currentColor" 
                        strokeWidth="2" 
                        fill="none" 
                        strokeLinecap="round" 
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                </button>

                {isMetricDropdownOpen && (
                  <div className="user-dropdown">
                    <div className="dropdown-header">
                      <span>Select Metric</span>
                    </div>
                    <div className="user-options">
                      {metrics.map((metric) => (
                        <div
                          key={metric}
                          className={`user-option ${formData.metric === metric ? 'selected' : ''}`}
                          onClick={() => handleMetricSelect(metric)}
                        >
                          <div className="option-content">
                            <div className="option-main">
                              <span className="option-label">{metric}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
            <small>Choose the health metric to analyze</small>
          </div>

          {/* Date range inputs */}
          <div className="date-button-row">
            <div className="date-input-container">
              <div className="input-group">
                <label htmlFor="start-date" className="input-label">Start Date</label>
                <input
                  id="start-date"
                  type="datetime-local"
                  value={formData.startDate}
                  onChange={(e) => handleInputChange('startDate', e.target.value)}
                  max={formData.endDate ? getMinEndDateFromStart(formData.endDate) : getMaxDateTimeLocal()}
                  className="input-field"
                  required
                  style={{ 
                    padding: '16px 20px', 
                    fontSize: '1.1rem',
                    height: '56px'
                  }}
                />
                <small>Select the start date and time for analysis</small>
              </div>
            </div>
          </div>

          <div className="date-button-row">
            <div className="date-input-container">
              <div className="input-group">
                <label htmlFor="end-date" className="input-label">End Date</label>
                <input
                  id="end-date"
                  type="datetime-local"
                  value={formData.endDate}
                  onChange={(e) => handleInputChange('endDate', e.target.value)}
                  min={formData.startDate ? getMinEndDateFromStart(formData.startDate) : ""}
                  max={formData.startDate ? getMaxEndDateFromStart(formData.startDate) : getMaxDateTimeLocal()}
                  className="input-field"
                  required
                  style={{ 
                    padding: '16px 20px', 
                    fontSize: '1.1rem',
                    height: '56px'
                  }}
                />
                <small>Max: current time in {userTimezone}</small>
              </div>
            </div>
          </div>

          {/* Quick date selection buttons */}
          <div className="quick-date-buttons">
            <button type="button" onClick={setLast24Hours} className="quick-date-btn">
              Last 24 Hours
            </button>
            <button type="button" onClick={setLastWeek} className="quick-date-btn">
              Last Week
            </button>
          </div>

          {/* Gap handling options - mutually exclusive checkboxes */}
          <div className="gap-controls">
            <h4 className="controls-title">Gap Detection & Imputation</h4>
            
            <div className="checkbox-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={gapOption === 'connect'}
                  onChange={(e) => handleGapOptionChange('connect', e.target.checked)}
                  className="checkbox-input"
                />
                <span className="checkbox-text">Connect Gaps with Lines</span>
                <small className="checkbox-description">
                  Draw connecting lines across data gaps for trend visualization (no new data points created)
                </small>
              </label>
            </div>

            <div className="checkbox-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={gapOption === 'imputed'}
                  onChange={(e) => handleGapOptionChange('imputed', e.target.checked)}
                  className="checkbox-input"
                />
                <span className="checkbox-text">Show Imputed Data Points</span>
                <small className="checkbox-description">
                  Display previously computed imputed values to fill gaps in the data
                </small>
              </label>
            </div>
          </div>

          {/* Current time display */}
          <div className="current-time-display">
            <strong>Current time in {userTimezone}:</strong> {formatDateTimeInTimezone(new Date())}
          </div>

          {/* Submit button */}
          <div className="fetch-button-row">
            <button
              type="submit"
              disabled={loading || !isFormValid}
              className={`fetch-button ${loading || !isFormValid ? "disabled" : ""}`}
            >
              {loading ? (
                <>
                  <span className="spinner"></span>
                  Fetching Data...
                </>
              ) : (
                "Fetch & Analyze Data"
              )}
            </button>
          </div>
        </div>
      </form>

      {/* Validation and error messages */}
      {dateValidationError && (
        <div className="validation-error">
          <strong>Date Validation Error:</strong> {dateValidationError}
        </div>
      )}

      {error && (
        <Alert type="error" message={error} />
      )}
    </div>
  )
}

export default DataFetchForm