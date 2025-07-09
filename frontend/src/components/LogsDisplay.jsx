const LogsDisplay = ({ logs }) => {
    if (!logs || logs.length === 0) return null
  
    return (
      <div className="logs-container" style={{
        backgroundColor: '#f8f9fa',
        border: '1px solid #dee2e6',
        borderRadius: '8px',
        padding: '16px',
        marginTop: '16px',
        maxHeight: '400px',
        overflowY: 'auto'
      }}>
        <h3 style={{
          margin: '0 0 12px 0',
          fontSize: '14px',
          fontWeight: 'bold',
          color: '#495057'
        }}>Backend Logs:</h3>
        <div style={{
          fontFamily: 'monospace',
          fontSize: '12px',
          lineHeight: '1.4'
        }}>
          {logs.map((log, index) => (
            <div key={index} style={{
              padding: '2px 0',
              color: log.includes('ERROR') ? '#dc3545' : 
                     log.includes('SUCCESS') || log.includes('✅') ? '#28a745' : 
                     log.includes('WARNING') || log.includes('⚠️') ? '#ffc107' : 
                     '#6c757d'
            }}>
              {index + 1}: {log}
            </div>
          ))}
        </div>
      </div>
    )
  }
  
  export default LogsDisplay