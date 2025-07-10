import { useState, useEffect } from 'react'

export const useUserContext = () => {
  const [selectedUser, setSelectedUser] = useState(null)
  const [timezone, setTimezone] = useState('America/Los_Angeles')

  // Debug logging
  useEffect(() => {
    console.log('🚀 useUserContext - selectedUser changed:', selectedUser)
  }, [selectedUser])

  useEffect(() => {
    console.log('🌍 useUserContext - timezone changed:', timezone)
  }, [timezone])

  // Load from localStorage on mount
  useEffect(() => {
    console.log('📱 useUserContext - Component mounted')
    try {
      const savedTimezone = localStorage.getItem('selectedTimezone')
      if (savedTimezone) {
        console.log('📱 Loaded saved timezone:', savedTimezone)
        setTimezone(savedTimezone)
      }
    } catch (error) {
      console.error('Error loading saved timezone:', error)
    }
  }, [])

  // Save timezone to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('selectedTimezone', timezone)
      console.log('💾 Saved timezone to localStorage:', timezone)
    } catch (error) {
      console.error('Error saving timezone:', error)
    }
  }, [timezone])

  const selectUser = (user) => {
    console.log('👤 selectUser called with:', user)
    setSelectedUser(user)
  }

  const changeTimezone = (newTimezone) => {
    console.log('🌍 changeTimezone called with:', newTimezone)
    setTimezone(newTimezone)
  }

  return {
    selectedUser,
    timezone,
    selectUser,
    changeTimezone
  }
}