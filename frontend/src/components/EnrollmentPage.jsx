import React, { useState } from 'react'
import { useUserContext } from '../hooks/useUserContext'
import { useEnrollment } from '../hooks/useEnrollment'
import Alert from './Alert'
import './Enrollment.css'

const EnrollmentPage = () => {
  // Context and hooks for user management
  const { timezone, getMaxDateTimeLocal, formatDateTimeInTimezone } = useUserContext()
  const { loading, error, success, enrollUser, enrolledUsers, deleteUser } = useEnrollment()
  
  // Form state
  const [userId, setUserId] = useState("")
  const [enrollmentDate, setEnrollmentDate] = useState("")
  
  // UI state for popups and interactions
  const [showSuccessPopup, setShowSuccessPopup] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [enrolledUserId, setEnrolledUserId] = useState("")
  const [userToDelete, setUserToDelete] = useState("")

  // Handle user enrollment form submission
  const handleSubmit = async (e) => {
    e.preventDefault()
    const result = await enrollUser({ userId, enrollmentDate })
    if (result) {
      // Show success notification
      setEnrolledUserId(userId)
      setShowSuccessPopup(true)
      
      // Reset form
      setUserId("")
      setEnrollmentDate("")
      
      // Auto-hide popup after 3 seconds
      setTimeout(() => {
        setShowSuccessPopup(false)
      }, 3000)
    }
  }

  // Initialize user deletion process
  const handleDeleteUser = (userIdToDelete) => {
    setUserToDelete(userIdToDelete)
    setShowDeleteConfirm(true)
  }

  // Confirm and execute user deletion
  const confirmDelete = async () => {
    await deleteUser(userToDelete)
    setShowDeleteConfirm(false)
    setUserToDelete("")
  }

  // Cancel user deletion
  const cancelDelete = () => {
    setShowDeleteConfirm(false)
    setUserToDelete("")
  }

  // Utility functions
  const isFormValid = userId.trim() && enrollmentDate
  const setCurrentTime = () => setEnrollmentDate(getMaxDateTimeLocal())
  const closePopup = () => setShowSuccessPopup(false)

  return (
    <div className="enrollment-page">
      {/* Success notification popup */}
      {showSuccessPopup && (
        <div className="popup-overlay" onClick={closePopup}>
          <div className="success-popup" onClick={(e) => e.stopPropagation()}>
            <div className="popup-header">
              <h3>Success!</h3>
              <button className="close-button" onClick={closePopup}>×</button>
            </div>
            <div className="popup-content">
              <div className="success-icon">✓</div>
              <p>Successfully enrolled <strong>{enrolledUserId}</strong></p>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirmation popup */}
      {showDeleteConfirm && (
        <div className="popup-overlay" onClick={cancelDelete}>
          <div className="delete-popup" onClick={(e) => e.stopPropagation()}>
            <div className="popup-header">
              <h3>Confirm Deletion</h3>
              <button className="close-button" onClick={cancelDelete}>×</button>
            </div>
            <div className="popup-content">
              <div className="warning-icon">⚠</div>
              <p>Are you sure you want to delete user <strong>{userToDelete}</strong>?</p>
              <p className="warning-text">This action will permanently remove all their data and cannot be undone.</p>
              <div className="popup-buttons">
                <button className="cancel-button" onClick={cancelDelete}>
                  Cancel
                </button>
                <button className="confirm-delete-button" onClick={confirmDelete}>
                  Delete User
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* User enrollment form */}
      <div className="controls-card">
        <div className="card-header">
          <h2 className="card-title">User Enrollment</h2>
          <p className="card-description">
            Enroll new users with their start date. This date will be used as the minimum start date for data ingestion.
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="enrollment-form-container">
            {/* User ID input field */}
            <div className="input-group">
              <label htmlFor="user-id" className="input-label">User ID</label>
              <input
                id="user-id"
                type="text"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                placeholder="Enter user ID (e.g., user_1, patient_001)"
                className="input-field"
                style={{ 
                  padding: '16px 20px', 
                  fontSize: '1.1rem',
                  height: '56px'
                }}
                required
              />
              <small>Unique identifier for the new user</small>
            </div>

            {/* Date input with quick set button */}
            <div className="date-button-row">
              <div className="date-input-container">
                <div className="input-group">
                  <label htmlFor="enrollment-date" className="input-label">Enrollment Date</label>
                  <input
                    id="enrollment-date"
                    type="datetime-local"
                    value={enrollmentDate}
                    onChange={(e) => setEnrollmentDate(e.target.value)}
                    max={getMaxDateTimeLocal()}
                    className="input-field"
                    style={{ 
                      padding: '16px 20px', 
                      fontSize: '1.1rem',
                      height: '56px'
                    }}
                    required
                  />
                  <small>Cannot be in the future ({timezone})</small>
                </div>
              </div>
              
              <div className="current-time-button-container">
                <button
                  type="button"
                  onClick={setCurrentTime}
                  className="current-time-button"
                >
                  Set Current Time
                </button>
              </div>
            </div>

            {/* Current time display for reference - moved above submit button */}
            <div className="current-time-display">
              <strong>Current time in {timezone}:</strong> {formatDateTimeInTimezone(new Date())}
            </div>

            {/* Form submission button */}
            <div className="submit-button-row">
              <button
                type="submit"
                disabled={loading || !isFormValid}
                className={`enroll-user-button ${loading || !isFormValid ? "disabled" : ""}`}
              >
                {loading ? (
                  <>
                    <span className="spinner"></span>
                    Enrolling User...
                  </>
                ) : (
                  "Enroll User"
                )}
              </button>
            </div>
          </div>
        </form>

        {/* Error messages only - success handled by popup */}
        <Alert type="error" message={error} />
      </div>

      {/* Enrolled users list with scrollable container */}
      <div className="controls-card">
        <div className="card-header">
          <h2 className="card-title">Enrolled Users</h2>
          <p className="card-description">
            Currently enrolled users and their enrollment dates
            {enrolledUsers.length > 6 && (
              <span style={{ color: '#667eea', fontWeight: '600', marginLeft: '8px' }}>
                ({enrolledUsers.length} users - scroll to see all)
              </span>
            )}
          </p>
        </div>

        {enrolledUsers.length === 0 ? (
          <div className="empty-state">
            <h3 className="empty-state-title">No Users Enrolled</h3>
            <p className="empty-state-description">
              Enroll your first user above to get started with data generation
            </p>
          </div>
        ) : (
          <div className="users-grid-container">
            <div className="users-grid">
              {enrolledUsers.map((user) => (
                <div key={user.user_id} className="user-card">
                  <div className="user-card-header">
                    <h4 className="user-card-title">{user.user_id}</h4>
                    <button
                      onClick={() => handleDeleteUser(user.user_id)}
                      className="delete-button"
                    >
                      Delete
                    </button>
                  </div>
                  
                  <div className="user-card-content">
                    <div className="enrollment-date">
                      <strong>Enrolled:</strong> {formatDateTimeInTimezone(new Date(user.enrollment_date))}
                    </div>
                    
                    {user.total_records > 0 ? (
                      <div className="data-status has-data">
                        <strong>Data Generated:</strong><br />
                        {user.total_records} records | {user.metrics_count} metrics
                      </div>
                    ) : (
                      <div className="data-status no-data">
                        <strong>Status:</strong> No data generated yet
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
            
            {/* Scroll indicator for large user lists */}
            {enrolledUsers.length > 6 && (
              <div className="scroll-indicator">
                ↕ Scroll to see more users
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default EnrollmentPage