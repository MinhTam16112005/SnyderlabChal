import { useState, useEffect, useCallback } from 'react'
import { API_BASE_URL } from '../utils/constants'

export const useEnrollment = () => {
  // State management for enrollment operations
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [enrolledUsers, setEnrolledUsers] = useState([])

  // Fetch all enrolled users from the API
  const fetchEnrolledUsers = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/enrolled-users`)
      if (!response.ok) {
        throw new Error(`Failed to fetch enrolled users: ${response.status}`)
      }
      const data = await response.json()
      setEnrolledUsers(data.users || [])
    } catch (err) {
      console.error('Error fetching enrolled users:', err)
      setEnrolledUsers([])
    }
  }, [])

  // Enroll a new user with specified enrollment date
  const enrollUser = useCallback(async ({ userId, enrollmentDate }) => {
    // Reset states before starting enrollment
    setError(null)
    setSuccess(null)
    setLoading(true)

    try {
      const response = await fetch(`${API_BASE_URL}/enroll-user`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          enrollment_date: new Date(enrollmentDate).toISOString()
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.detail || 'Failed to enroll user')
      }

      setSuccess(`Successfully enrolled user "${userId}"`)
      await fetchEnrolledUsers() // Refresh the list
      return data

    } catch (err) {
      console.error('Error enrolling user:', err)
      setError(err.message)
      return null
    } finally {
      setLoading(false)
    }
  }, [fetchEnrolledUsers])

  // Delete a user by user ID
  const deleteUser = useCallback(async (userId) => {
    // Reset states before starting deletion
    setError(null)
    setSuccess(null)
    setLoading(true)

    try {
      const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.detail || 'Failed to delete user')
      }

      setSuccess(`Successfully deleted user "${userId}"`)
      await fetchEnrolledUsers() // Refresh the list
      return true

    } catch (err) {
      console.error('Error deleting user:', err)
      setError(err.message)
      return false
    } finally {
      setLoading(false)
    }
  }, [fetchEnrolledUsers])

  // Fetch enrolled users on component mount
  useEffect(() => {
    fetchEnrolledUsers()
  }, [fetchEnrolledUsers])

  return {
    loading,
    error,
    success,
    enrolledUsers,
    enrollUser,
    deleteUser,
    refetch: fetchEnrolledUsers
  }
}