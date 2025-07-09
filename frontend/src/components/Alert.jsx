const Alert = ({ type, message }) => {
    if (!message) return null
  
    const alertClass = type === 'error' ? 'error-alert' : 'success-alert'
    const icon = type === 'error' ? 'Warning' : 'Success'
  
    return (
      <div className={alertClass}>
        <span>{icon}</span>
        <span>{message}</span>
      </div>
    )
  }
  
  export default Alert