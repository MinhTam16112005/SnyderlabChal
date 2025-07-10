import { useUsers } from '../hooks/useUsers'

const UserSelector = ({ selectedUser, onUserSelect }) => {
  const { users, loading, error } = useUsers()

  if (loading) {
    return <div className="user-selector loading">Loading users...</div>
  }

  if (error) {
    return <div className="user-selector error">Error loading users: {error}</div>
  }

  if (users.length === 0) {
    return <div className="user-selector empty">
      No users found. Generate some data first using the API or restart your backend.
    </div>
  }

  return (
    <div className="user-selector">
      <label htmlFor="user-select">Select User:</label>
      <select 
        id="user-select"
        value={selectedUser?.user_id || ''}
        onChange={(e) => {
          const userId = e.target.value
          if (userId === '') {
            onUserSelect(null) // Allow clearing selection
            return
          }
          const user = users.find(u => u.user_id === userId)
          if (user) {
            onUserSelect(user)
          }
        }}
      >
        <option value="">Choose a user...</option>
        {users.map((user) => (
          <option key={user.user_id} value={user.user_id}>
            {user.user_id} ({user.total_records} records)
          </option>
        ))}
      </select>
      
      {selectedUser && (
        <div className="user-info">
          <small>
            📊 {selectedUser.metrics_count} metrics | 
            📅 {selectedUser.days_with_data} days | 
            📈 {selectedUser.total_records} total records
          </small>
        </div>
      )}
    </div>
  )
}

export default UserSelector