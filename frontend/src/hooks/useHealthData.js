import { useState } from 'react'

const API_BASE_URL = 'http://localhost:5001'

export const useHealthData = () => {
  // State management for health data operations
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Fetch health data with date range, user ID, and metric filters
  const fetchData = async ({ startDate, endDate, userId, metric }) => {
    setLoading(true)
    setError(null)

    try {
      // Map frontend metric names to backend metric names
      const metricMapping = {
        'intraday_heart_rate': 'intraday_heart_rate',
        'heartrate': 'intraday_heart_rate', 
        'heart_rate': 'intraday_heart_rate',
        'spo2': 'intraday_spo2',
        'intraday_active_zone_minutes': 'intraday_active_zone_minutes',
        'breath_rate': 'intraday_breath_rate',
        'hrv': 'intraday_hrv',
        'daily_steps': 'daily_steps',
        'steps': 'daily_steps',
        'sleep_duration': 'sleep_duration',
        'sleep': 'sleep_duration',
        'calories_burned': 'calories_burned',
        'calories': 'calories_burned',
        'distance_traveled': 'distance_traveled',
        'distance': 'distance_traveled',
        'activity_minutes': 'intraday_activity',
        'active_minutes': 'intraday_activity'
      }

      // Map the metric to the correct backend name
      const backendMetric = metricMapping[metric] || metric
      
      console.log(`Original metric: "${metric}" → Backend metric: "${backendMetric}"`)

      // Build query parameters for API request
      const params = new URLSearchParams({
        start_date: new Date(startDate).toISOString(),
        end_date: new Date(endDate).toISOString(),
        user_id: userId,
        metric: backendMetric,
        page: '1',
        per_page: '1000'
      })

      const url = `${API_BASE_URL}/data?${params}`
      console.log('Fetching URL:', url)

      const response = await fetch(url)
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error('API Error Response:', errorData)
        throw new Error(`HTTP error! status: ${response.status} - ${errorData.detail || 'Unknown error'}`)
      }

      const result = await response.json()
      
      console.log('Data fetch result:', {
        dataSource: result.data_source,
        dateRangeDays: result.date_range_days,
        totalPoints: result.total,
        returnedPoints: result.returned
      })

      const fetchedData = result.data || []
      setData(fetchedData)
      return fetchedData
      
    } catch (err) {
      console.error('Error fetching data:', err)
      setError(err.message)
      setData([])
      return []
    } finally {
      setLoading(false)
    }
  }

  return {
    data,
    loading,
    error,
    fetchData
  }
}