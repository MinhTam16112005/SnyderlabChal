import { useState, useCallback } from 'react'
import { API_URL, DEFAULT_USER_ID } from '../utils/constants'
import { validateDateRange } from '../utils/dateValidation'

export const useDataGeneration = () => {
  // State management for data generation process
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [logs, setLogs] = useState([])

  // Main function to generate data with date range validation
  const generateData = useCallback(async ({ startDate, endDate, userId = DEFAULT_USER_ID }) => {
    // Reset all states before starting generation
    setError(null)
    setSuccess(null)
    setLogs([])
    setLoading(true)

    // Validate date range before proceeding
    const validationError = validateDateRange(startDate, endDate)
    if (validationError) {
      setError(validationError)
      setLoading(false)
      return null
    }

    try {
      // Convert dates to ISO format for API compatibility
      const isoStart = new Date(startDate).toISOString()
      const isoEnd = new Date(endDate).toISOString()

      console.log("Starting data generation...")
      console.log("Date range:", { start: isoStart, end: isoEnd })

      // Make API request to generate data
      const response = await fetch(`${API_URL}/generate-data`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          start_date: isoStart,
          end_date: isoEnd,
          user_id: userId,
        }),
      })

      const data = await response.json()
      console.log("Raw response:", data)

      // Handle API error responses
      if (!response.ok) {
        let errorMessage = "Unknown error"
        let errorLogs = []
        
        // Parse error details from response
        if (data.detail) {
          if (typeof data.detail === "string") {
            errorMessage = data.detail
          } else if (data.detail.error) {
            errorMessage = data.detail.error
            errorLogs = data.detail.logs || []
          }
        }
        
        setLogs(errorLogs)
        console.error("Generate error:", errorMessage)
        throw new Error(errorMessage)
      }

      // Set success message with generation statistics
      setSuccess(`Successfully generated ${data.total_points} data points (${data.saved_points} new records saved)`)
      
      // Store backend logs if available
      if (data.logs && data.logs.length > 0) {
        setLogs(data.logs)
        console.log("Backend logs:", data.logs)
      }
      
      console.log("Data generation successful:", {
        totalPoints: data.total_points,
        savedPoints: data.saved_points,
        importSuccess: data.import_success
      })
      
      return data
    } catch (e) {
      console.error("Generate error:", e)
      setError(e.message)
      return null
    } finally {
      // Always reset loading state when complete
      setLoading(false)
    }
  }, [])

  return { loading, error, success, logs, generateData }
}