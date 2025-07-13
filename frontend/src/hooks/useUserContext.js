import { useContext } from 'react'
import { UserContext } from '../contexts/UserContext.jsx'

export const useUserContext = () => {
  // Access the UserContext and validate it exists
  const context = useContext(UserContext)
  
  // Ensure hook is used within UserProvider
  if (context === undefined) {
    throw new Error('useUserContext must be used within a UserProvider')
  }
  
  return context
}