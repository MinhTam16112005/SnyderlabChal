import { useState, useEffect } from 'react'
import { API_URL } from '../utils/constants'

export const useMetrics = () => {
  const [metrics, setMetrics] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const response = await fetch(`${API_URL}/metrics`)
        if (!response.ok) throw new Error('Failed to fetch metrics')
        const data = await response.json()
        setMetrics(data)
      } catch (err) {
        console.error('Error fetching metrics:', err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchMetrics()
  }, [])

  return { metrics, loading, error }
}