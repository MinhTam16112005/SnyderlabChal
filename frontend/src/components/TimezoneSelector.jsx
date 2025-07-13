import React, { useState, useRef, useEffect } from 'react'
import { useUserContext } from '../hooks/useUserContext'

const TimezoneSelector = () => {
  // Context hook for timezone management
  const { timezone, setTimezone, availableTimezones } = useUserContext()
  
  // Dropdown state and ref for click outside detection
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef(null)

  // Convert timezone code to user-friendly label
  const formatTimezoneLabel = (tz) => {
    const labels = {
      'America/Los_Angeles': 'Pacific (Los Angeles)',
      'America/New_York': 'Eastern (New York)',
      'America/Chicago': 'Central (Chicago)', 
      'America/Denver': 'Mountain (Denver)',
      'UTC': 'UTC (Universal)'
    }
    return labels[tz] || tz
  }

  // Get current time formatted for the given timezone
  const getCurrentTimeInTimezone = (tz) => {
    try {
      const now = new Date()
      const timeString = now.toLocaleTimeString('en-US', {
        timeZone: tz,
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      })
      return timeString
    } catch (error) {
      return ''
    }
  }

  // Handle timezone selection and close dropdown
  const handleSelect = (tz) => {
    setTimezone(tz)
    setIsOpen(false)
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  // Current selection display values
  const selectedLabel = timezone ? formatTimezoneLabel(timezone) : 'Choose timezone'
  const selectedTime = timezone ? getCurrentTimeInTimezone(timezone) : ''

  return (
    <div className="custom-timezone-selector" ref={dropdownRef}>
      {/* Custom dropdown button with current selection */}
      <button
        type="button"
        className={`timezone-button ${isOpen ? 'open' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="timezone-content">
          <div className="timezone-main">
            <span className="timezone-label">{selectedLabel}</span>
            {selectedTime && <span className="timezone-time">{selectedTime}</span>}
          </div>
          <svg 
            className={`timezone-arrow ${isOpen ? 'rotated' : ''}`}
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

      {/* Dropdown menu with timezone options */}
      {isOpen && (
        <div className="timezone-dropdown">
          <div className="dropdown-header">
            <span>Select Timezone</span>
          </div>
          <div className="timezone-options">
            {availableTimezones.map((tz) => (
              <div
                key={tz}
                className={`timezone-option ${timezone === tz ? 'selected' : ''}`}
                onClick={() => handleSelect(tz)}
              >
                <div className="option-content">
                  <div className="option-main">
                    <span className="option-label">{formatTimezoneLabel(tz)}</span>
                    <span className="option-time">{getCurrentTimeInTimezone(tz)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default TimezoneSelector