import React, { useState, useEffect, useRef } from 'react'
import { useUserContext } from '../hooks/useUserContext'
import { useDataGeneration } from '../hooks/useDataGeneration'
import { useEnrollment } from '../hooks/useEnrollment'
import { validateDateRange } from '../utils/dateValidation'
import Alert from './Alert'
import './IngestionPage.css'

const IngestionPage = () => {
  // Context hooks for timezone and date management
  const { 
    timezone, 
    getMaxDateTimeLocal, 
    getMinEndDateFromStart, 
    getMaxEndDateFromStart,
    formatDateTimeInTimezone
  } = useUserContext()
  
  // Form state management
  const [selectedUserId, setSelectedUserId] = useState("")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  
  // UI state for popup and dropdown
  const [showSuccessPopup, setShowSuccessPopup] = useState(false)
  const [generationDetails, setGenerationDetails] = useState(null)
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false)
  
  // Ref for dropdown click outside detection
  const userDropdownRef = useRef(null)
  
  // Hooks for data generation and user management
  const { loading, error, generateData } = useDataGeneration()
  const { enrolledUsers } = useEnrollment()

  // Get selected user data and enrollment constraints
  const selectedUser = enrolledUsers.find(user => user.user_id === selectedUserId)
  const enrollmentDate = selectedUser ? selectedUser.enrollment_date : null
  
  // Convert enrollment date to datetime-local format for form validation
  const getEnrollmentDateForInput = () => {
    if (!enrollmentDate) return ""
    
    try {
      const date = new Date(enrollmentDate)
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      const hours = String(date.getHours()).padStart(2, '0')
      const minutes = String(date.getMinutes()).padStart(2, '0')
      return `${year}-${month}-${day}T${hours}:${minutes}`
    } catch (error) {
      return ""
    }
  }

  // Auto-select first user when users are loaded
  useEffect(() => {
    if (enrolledUsers.length > 0 && !selectedUserId) {
      setSelectedUserId(enrolledUsers[0].user_id)
    }
  }, [enrolledUsers, selectedUserId])

  // Reset date fields when user changes
  useEffect(() => {
    setStartDate("")
    setEndDate("")
  }, [selectedUserId])

  // Handle clicks outside dropdown to close it
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target)) {
        setIsUserDropdownOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  // Handle form submission and show success popup
  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!startDate || !endDate) {
      return
    }
    
    const result = await generateData({ 
      startDate, 
      endDate, 
      userId: selectedUserId 
    })
    
    if (result) {
      setGenerationDetails({
        userId: selectedUserId,
        startDate: formatDateTimeInTimezone(new Date(startDate)),
        endDate: formatDateTimeInTimezone(new Date(endDate)),
        recordsGenerated: result.total_points || 'Unknown',
        dateRange: calculateDateRange(startDate, endDate)
      })
      setShowSuccessPopup(true)
      
      // Reset form
      setStartDate("")
      setEndDate("")
      
      // Auto-hide popup after 4 seconds
      setTimeout(() => {
        setShowSuccessPopup(false)
      }, 4000)
    }
  }

  // Calculate human-readable date range
  const calculateDateRange = (start, end) => {
    const startDate = new Date(start)
    const endDate = new Date(end)
    const diffTime = Math.abs(endDate - startDate)
    const diffHours = Math.ceil(diffTime / (1000 * 60 * 60))
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffHours === 1) return '1 hour'
    if (diffHours < 24) return `${diffHours} hours`
    if (diffDays === 1) return '1 day'
    if (diffDays === 7) return '1 week'
    if (diffDays === 30) return '1 month'
    if (diffDays > 30) return `${Math.floor(diffDays / 30)} months`
    return `${diffDays} days`
  }

  // Popup and dropdown handlers
  const closePopup = () => setShowSuccessPopup(false)
  const handleUserSelect = (userId) => {
    setSelectedUserId(userId)
    setIsUserDropdownOpen(false)
  }

  // Enhanced form validation including enrollment date constraints
  const enrollmentDateError = (() => {
    if (!startDate || !selectedUser) return null
    
    const enrollmentDateInput = getEnrollmentDateForInput()
    if (!enrollmentDateInput) return null
    
    if (startDate < enrollmentDateInput) {
      return `Start date cannot be before user's enrollment date (${formatDateTimeInTimezone(new Date(enrollmentDate))})`
    }
    return null
  })()

  const isFormValid = selectedUserId && startDate && endDate && 
                     !validateDateRange(startDate, endDate, timezone) && 
                     !enrollmentDateError

  // Quick date setting helpers
  const setToEnrollmentDate = () => {
    const enrollmentInput = getEnrollmentDateForInput()
    if (enrollmentInput) {
      setStartDate(enrollmentInput)
    }
  }

  const setOneHour = () => {
    if (!startDate) return
    
    const start = new Date(startDate)
    const oneHourLater = new Date(start.getTime() + (1 * 60 * 60 * 1000))
    
    const maxAllowedStr = getMaxDateTimeLocal()
    const maxAllowed = new Date(maxAllowedStr)
    
    const endTime = oneHourLater <= maxAllowed ? oneHourLater : maxAllowed
    
    const year = endTime.getFullYear()
    const month = String(endTime.getMonth() + 1).padStart(2, '0')
    const day = String(endTime.getDate()).padStart(2, '0')
    const hours = String(endTime.getHours()).padStart(2, '0')
    const minutes = String(endTime.getMinutes()).padStart(2, '0')
    
    const formattedEndDate = `${year}-${month}-${day}T${hours}:${minutes}`
    setEndDate(formattedEndDate)
  }

  const setLastWeek = () => {
    if (!startDate) return
    
    const start = new Date(startDate)
    const weekLater = new Date(start.getTime() + (7 * 24 * 60 * 60 * 1000))
    
    const maxAllowedStr = getMaxDateTimeLocal()
    const maxAllowed = new Date(maxAllowedStr)
    
    const endTime = weekLater <= maxAllowed ? weekLater : maxAllowed
    
    const year = endTime.getFullYear()
    const month = String(endTime.getMonth() + 1).padStart(2, '0')
    const day = String(endTime.getDate()).padStart(2, '0')
    const hours = String(endTime.getHours()).padStart(2, '0')
    const minutes = String(endTime.getMinutes()).padStart(2, '0')
    
    const formattedEndDate = `${year}-${month}-${day}T${hours}:${minutes}`
    setEndDate(formattedEndDate)
  }

  // Available metrics that will be generated
  const generatedMetrics = [
    { name: 'Heart Rate', description: 'Intraday heart rate measurements' },
    { name: 'Breath Rate', description: 'Intraday breathing rate data' },
    { name: 'Active Zone Minutes', description: 'Time spent in active zones' },
    { name: 'Activity', description: 'Intraday activity levels' },
    { name: 'Heart Rate Variability', description: 'HRV measurements' },
    { name: 'SpO2', description: 'Blood oxygen saturation levels' }
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
      {/* Success notification popup */}
      {showSuccessPopup && generationDetails && (
        <div className="popup-overlay" onClick={closePopup}>
          <div className="success-popup" onClick={(e) => e.stopPropagation()}>
            <div className="popup-header">
              <h3>Data Generated Successfully!</h3>
              <button className="close-button" onClick={closePopup}>×</button>
            </div>
            <div className="popup-content">
              <div className="success-icon">✓</div>
              <p>Successfully generated data for <strong>{generationDetails.userId}</strong></p>
              <div className="generation-details">
                <div className="detail-row">
                  <span className="detail-label">Period:</span>
                  <span className="detail-value">{generationDetails.dateRange}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Start:</span>
                  <span className="detail-value">{generationDetails.startDate}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">End:</span>
                  <span className="detail-value">{generationDetails.endDate}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Metrics:</span>
                  <span className="detail-value">{generatedMetrics.length} types generated</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main data ingestion form */}
      <div className="controls-card">
        <div className="card-header">
          <h2 className="card-title">Data Ingestion</h2>
          <p className="card-description">
            Generate synthetic Fitbit data for enrolled users. Choose any date range after user enrollment - now supports any duration from 1 hour to 60 days!
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="ingestion-form-container">
            {/* User selection with custom dropdown */}
            <div className="user-selection-row">
              <div className="input-group">
                <label htmlFor="user-select" className="input-label">Select User</label>
                {enrolledUsers.length === 0 ? (
                  <div className="no-users-message">
                    No users enrolled. Please enroll users first.
                  </div>
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
                            {selectedUserId ? selectedUserId : 'Select a user'}
                          </span>
                          {selectedUser && (
                            <span className="user-time">
                              Enrolled: {formatDateTimeInTimezone(new Date(selectedUser.enrollment_date)).split(',')[0]}
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
                          {enrolledUsers.map((user) => (
                            <div
                              key={user.user_id}
                              className={`user-option ${selectedUserId === user.user_id ? 'selected' : ''}`}
                              onClick={() => handleUserSelect(user.user_id)}
                            >
                              <div className="option-content">
                                <div className="option-main">
                                  <span className="option-label">{user.user_id}</span>
                                  <span className="option-time">
                                    Enrolled: {formatDateTimeInTimezone(new Date(user.enrollment_date)).split(',')[0]}
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
                <small>Choose from enrolled users</small>
              </div>

              {/* User info display when selected */}
              {selectedUser && (
                <div className="user-info-box">
                  <div className="user-info-header">User: {selectedUser.user_id}</div>
                  <div className="user-info-details">
                    <div>Enrolled: {formatDateTimeInTimezone(new Date(selectedUser.enrollment_date))}</div>
                    {selectedUser.total_records > 0 && (
                      <div>Total {selectedUser.total_records} records | {selectedUser.metrics_count} metrics</div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Start date input with enrollment date button */}
            <div className="date-button-row">
              <div className="date-input-container">
                <div className="input-group">
                  <label htmlFor="gen-start-date" className="input-label">Start Date</label>
                  <input
                    id="gen-start-date"
                    type="datetime-local"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    min={getEnrollmentDateForInput()}
                    max={getMaxDateTimeLocal()}
                    className="input-field"
                    required
                    disabled={!selectedUserId}
                    style={{ 
                      padding: '16px 20px', 
                      fontSize: '1.1rem',
                      height: '56px'
                    }}
                  />
                  <small>
                    {selectedUser 
                      ? `Min: enrollment date (${formatDateTimeInTimezone(new Date(selectedUser.enrollment_date))})`
                      : "Select a user first"
                    }
                  </small>
                </div>
              </div>
              
              <div className="current-time-button-container">
                <button
                  type="button"
                  onClick={setToEnrollmentDate}
                  className="enrollment-time-button"
                  disabled={!selectedUserId || !selectedUser}
                >
                  Set to Enrollment Date
                </button>
              </div>
            </div>

            {/* End date input with quick time buttons */}
            <div className="end-date-row">
              <div className="input-group end-date-group">
                <label htmlFor="gen-end-date" className="input-label">End Date</label>
                <input
                  id="gen-end-date"
                  type="datetime-local"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  max={startDate ? getMaxEndDateFromStart(startDate) : getMaxDateTimeLocal()}
                  className="input-field"
                  required
                  disabled={!startDate}
                  style={{ 
                    padding: '16px 20px', 
                    fontSize: '1.1rem',
                    height: '56px'
                  }}
                />
                <small>Max: current time in {timezone}</small>
              </div>

              <div className="quick-time-buttons">
                <button
                  type="button"
                  onClick={setOneHour}
                  className="quick-time-btn"
                  disabled={!startDate}
                >
                  +1 Hour
                </button>
                <button
                  type="button"
                  onClick={setLastWeek}
                  className="quick-time-btn"
                  disabled={!startDate}
                >
                  +1 Week
                </button>
              </div>
            </div>

            {/* Current time reference */}
            <div className="current-time-display">
              <strong>Current time in {timezone}:</strong> {formatDateTimeInTimezone(new Date())}
            </div>

            {/* Form submission button */}
            <div className="generate-button-row">
              <button
                type="submit"
                disabled={loading || !isFormValid}
                className={`generate-button ${loading || !isFormValid ? "disabled" : ""}`}
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
          </div>
        </form>

        {/* Error messages only - logs removed */}
        <Alert type="error" message={error} />

        {/* Form validation error display */}
        {((startDate && endDate && validateDateRange(startDate, endDate, timezone)) || enrollmentDateError) && (
          <div style={{
            marginTop: '10px',
            padding: '10px 15px',
            background: '#ffebee',
            border: '1px solid #ffcdd2',
            borderRadius: '6px',
            fontSize: '14px',
            color: '#c62828'
          }}>
            <strong>Validation Error:</strong> {validateDateRange(startDate, endDate, timezone) || enrollmentDateError}
          </div>
        )}

        {/* Available metrics information section */}
        <div style={{ 
          marginTop: '30px', 
          padding: '25px', 
          background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)', 
          borderRadius: '12px',
          border: '1px solid #dee2e6'
        }}>
          <h3 style={{ 
            margin: '0 0 25px 0', 
            color: '#495057',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            Generated Metrics
            <span style={{ 
              fontSize: '14px', 
              background: '#28a745', 
              color: 'white', 
              padding: '4px 8px', 
              borderRadius: '12px',
              fontWeight: 'normal'
            }}>
              {generatedMetrics.length} metrics
            </span>
          </h3>
          
          <div className="generated-metrics-grid">
            {generatedMetrics.map((metric, index) => (
              <div key={index} className="metric-card">
                <div style={{ 
                  fontWeight: '600', 
                  color: '#495057',
                  marginBottom: '8px',
                  fontSize: '15px'
                }}>
                  {metric.name}
                </div>
                <div style={{ 
                  fontSize: '13px', 
                  color: '#6c757d',
                  lineHeight: '1.4'
                }}>
                  {metric.description}
                </div>
              </div>
            ))}
          </div>
          
          <div style={{ 
            marginTop: '20px', 
            padding: '12px 18px', 
            background: '#d1ecf1', 
            border: '1px solid #bee5eb',
            borderRadius: '8px',
            fontSize: '14px',
            color: '#0c5460'
          }}>
            <strong>Note:</strong> Data is generated hourly for all metrics within the specified date range. Now supports any duration - from 1 hour to 60 days!
          </div>
        </div>
      </div>
    </div>
  )
}

export default IngestionPage