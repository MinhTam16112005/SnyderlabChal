import React, { createContext, useState, useEffect } from 'react'

const UserContext = createContext()

export const UserProvider = ({ children }) => {
  // Core state for timezone and time management
  const [timezone, setTimezone] = useState('America/Los_Angeles')
  const [currentTime, setCurrentTime] = useState(new Date())

  // Available timezone options for user selection
  const availableTimezones = [
    'America/Los_Angeles',
    'America/New_York', 
    'America/Chicago',
    'America/Denver',
    'UTC'
  ]

  // Load saved timezone from localStorage on component mount
  useEffect(() => {
    const savedTimezone = localStorage.getItem('selectedTimezone')
    if (savedTimezone) {
      setTimezone(savedTimezone)
    }
  }, [])

  // Save timezone to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('selectedTimezone', timezone)
  }, [timezone])

  // Update current time every minute for real-time displays
  useEffect(() => {
    const updateCurrentTime = () => {
      setCurrentTime(new Date())
    }

    // Update immediately
    updateCurrentTime()

    // Set up interval to update every minute
    const interval = setInterval(updateCurrentTime, 60000)

    return () => clearInterval(interval)
  }, [])

  // Get current time formatted for the selected timezone
  const getCurrentTimeInTimezone = () => {
    try {
      return new Date().toLocaleString('en-US', {
        timeZone: timezone,
        hour12: true
      })
    } catch (error) {
      return new Date()
    }
  }

  // Format date and time in 12-hour format for the selected timezone
  const formatDateTimeInTimezone = (date) => {
    try {
      return date.toLocaleString('en-US', {
        timeZone: timezone,
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      })
    } catch (error) {
      return date.toLocaleString()
    }
  }

  // Format time only in 12-hour format for the selected timezone
  const formatTimeInTimezone = (date) => {
    try {
      return date.toLocaleTimeString('en-US', {
        timeZone: timezone,
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      })
    } catch (error) {
      return date.toLocaleTimeString()
    }
  }

  // Get maximum datetime-local value (current time in selected timezone)
  const getMaxDateTimeLocal = () => {
    const now = new Date()
    
    try {
      // Use Intl.DateTimeFormat to get current time in selected timezone
      const formatter = new Intl.DateTimeFormat('sv-SE', {
        timeZone: timezone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      })
      
      // Extract date/time parts and format for datetime-local input
      const parts = formatter.formatToParts(now)
      const year = parts.find(p => p.type === 'year').value
      const month = parts.find(p => p.type === 'month').value
      const day = parts.find(p => p.type === 'day').value
      const hour = parts.find(p => p.type === 'hour').value
      const minute = parts.find(p => p.type === 'minute').value
      
      return `${year}-${month}-${day}T${hour}:${minute}`
    } catch (error) {
      return now.toISOString().slice(0, 16)
    }
  }

  // Get minimum end date (start date + 1 minute) for form validation
  const getMinEndDateFromStart = (startDateString) => {
    if (!startDateString) return ''
    const start = new Date(startDateString)
    const minEnd = new Date(start.getTime() + 60000) // Add 1 minute
    return minEnd.toISOString().slice(0, 16)
  }

  // Get maximum end date (start + 60 days or current time, whichever is earlier)
  const getMaxEndDateFromStart = (startDateString) => {
    if (!startDateString) return getMaxDateTimeLocal()
    
    const start = new Date(startDateString)
    const maxFromStart = new Date(start.getTime() + (60 * 24 * 60 * 60 * 1000)) // Add 60 days
    const currentMax = new Date()
    
    const maxAllowed = maxFromStart < currentMax ? maxFromStart : currentMax
    return maxAllowed.toISOString().slice(0, 16)
  }

  // Context value object with all timezone and date utilities
  const value = {
    timezone,
    setTimezone,
    availableTimezones,
    currentTime,
    getCurrentTimeInTimezone,
    formatDateTimeInTimezone,
    formatTimeInTimezone,
    getMaxDateTimeLocal,
    getMinEndDateFromStart,
    getMaxEndDateFromStart
  }

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  )
}

export { UserContext }