import { useUserContext } from '../hooks/useUserContext'
import UserSelector from './UserSelector'

const Header = () => {
  const { selectedUser, timezone, selectUser, changeTimezone } = useUserContext()

  const timezones = [
    'America/Los_Angeles',
    'America/New_York',
    'America/Chicago',
    'America/Denver',
    'UTC'
  ]

  return (
    <header className="header">
      <div className="header-main">
        <h1>Fitbit Health Data Dashboard</h1>
        <p>Real-time health metrics visualization and analysis</p>
      </div>
      
      <div className="header-controls">
        <div className="user-section">
          <UserSelector 
            selectedUser={selectedUser} 
            onUserSelect={selectUser} 
          />
        </div>
        
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