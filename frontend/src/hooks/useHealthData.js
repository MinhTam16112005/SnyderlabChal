import { useState, useCallback } from 'react'
import { API_URL, DEFAULT_PAGE_SIZE } from '../utils/constants'

export const useHealthData = () => {
  const [dataPoints, setDataPoints] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const fetchData = useCallback(async ({ startDate, endDate, userId, metric }) => {
    setError(null)
    setLoading(true)
    setDataPoints([])

    try {
      const params = new URLSearchParams({
        start_date: new Date(startDate).toISOString(),
        end_date: new Date(endDate).toISOString(),
        user_id: userId,
        metric,
        page: "1",
        per_page: DEFAULT_PAGE_SIZE.toString(),
      })

      const url = `${API_URL}/data?${params.toString()}`
      console.log("Fetching URL:", url)

      const response = await fetch(url)
      const data = await response.json()
      console.log("Raw response:", data)

      if (!response.ok) {
        throw new Error(data.detail || `HTTP ${response.status}`)
      }

      const points = Array.isArray(data.data) ? data.data : []
      setDataPoints(points)
      return points
    } catch (e) {
      console.error("Fetch error:", e)
      setError(e.message)
      setDataPoints([])
      return []
    } finally {
      setLoading(false)
    }
  }, [])

  const clearData = useCallback(() => {
    setDataPoints([])
    setError(null)
  }, [])

  return { dataPoints, loading, error, fetchData, clearData }
}