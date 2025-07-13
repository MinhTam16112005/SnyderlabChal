import { useUserContext } from '../hooks/useUserContext'
import UserSelector from './UserSelector'

const Header = () => {
  // Context hooks for user selection and timezone management
  const { selectedUser, timezone, selectUser, changeTimezone } = useUserContext()

  // Available timezone options for user selection
  const timezones = [
    'America/Los_Angeles',
    'America/New_York',
    'America/Chicago',
    'America/Denver',
    'UTC'
  ]

  return (
    <header className="header">
      {/* Main header section with title and description */}
      <div className="header-main">
        <h1>Fitbit Health Data Dashboard</h1>
        <p>Real-time health metrics visualization and analysis</p>
      </div>
      
      {/* Control section with user selector and timezone dropdown */}
      <div className="header-controls">
        {/* User selection component */}
        <div className="user-section">
          <UserSelector 
            selectedUser={selectedUser} 
            onUserSelect={selectUser} 
          />
        </div>
        
        {/* Timezone selection dropdown */}
        <div className="timezone-section">
          <label htmlFor="timezone-select">Timezone:</label>
          <select 
            id="timezone-select"
            value={timezone}
            onChange={(e) => changeTimezone(e.target.value)}
          >
            {timezones.map((tz) => (
              <option key={tz} value={tz}>
                {tz.replace('_', ' ')}
              </option>
            ))}
          </select>
        </div>
      </div>
      
      {/* Current user status display - only shown when user is selected */}
      {selectedUser && (
        <div className="current-user-display">
          <strong>Current User:</strong> {selectedUser.user_id} | 
          <strong> Timezone:</strong> {timezone}
        </div>
      )}
    </header>
  )
}

export default Header