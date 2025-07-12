const LogsTable = ({ logs }) => {
  // Map backend action to user-friendly label
  const getActionLabel = (log) => {
    console.log('Log object received:', log);
    console.log('Log action:', log?.action);
    console.log('Log action type:', typeof log?.action);
    if (!log || typeof log.action !== 'string') {
      console.log('Returning Unknown because:', { hasLog: !!log, actionType: typeof log?.action });
      return 'Unknown';
    }
    
    // Handle different action types
    switch (log.action) {
      case 'create':
        return 'Add';
      case 'delete':
        return 'Delete';
      case 'update':
        // Check if there are changes to determine specific update type
        if (log.changes) {
          const changedFields = Object.keys(log.changes).filter(key => 
            key !== 'version' && log.changes[key] !== undefined
          );
          
          if (changedFields.length === 1) {
            switch (changedFields[0]) {
              case 'status':
                return 'Drag-Drop';
              case 'assignedUser':
                return 'Assign';
              case 'description':
                return 'Edit Description';
              case 'title':
                return 'Edit Title';
              case 'priority':
                return 'Edit Priority';
              default:
                return 'Edit';
            }
          } else if (changedFields.length > 1) {
            return 'Edit Multiple';
          }
        }
        return 'Edit';
      default:
        // For any other action, capitalize the first letter
        return log.action.charAt(0).toUpperCase() + log.action.slice(1);
    }
  };

  return (
    <div className="log-table">
      <h3>Activity Logs</h3>
      <table>
        <thead>
          <tr>
            <th>User</th>
            <th>Action</th>
            <th>Time</th>
          </tr>
        </thead>
        <tbody>
          {(logs || []).map((log, i) => (
            <tr key={i} className="log-row">
              <td>{log?.user || 'Unknown User'}</td>
              <td>{getActionLabel(log)}</td>
              <td>{log?.timestamp ? new Date(log.timestamp).toLocaleString() : 'Unknown Time'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default LogsTable;
  