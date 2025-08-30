const LogsTable = ({ logs }) => {
  console.log("📋 LogsTable received logs:", logs);

  const getActionLabel = (log) => {
    if (!log || typeof log.action !== 'string' || !log.action.trim()) {
      console.warn("⚠️ Invalid log in getActionLabel:", log);
      return 'Unknown';
    }
    
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

  const getActionIcon = (action) => {
    switch (action) {
      case 'Add':
        return '➕';
      case 'Delete':
        return '🗑️';
      case 'Drag-Drop':
        return '🔄';
      case 'Assign':
        return '👤';
      case 'Edit Description':
      case 'Edit Title':
      case 'Edit Priority':
      case 'Edit':
      case 'Edit Multiple':
        return '✏️';
      default:
        return '📝';
    }
  };

  // Filter out invalid logs
  const validLogs = (logs || []).filter(log => {
    const isValid = log && 
      typeof log === 'object' && 
      log.action && 
      typeof log.action === 'string' && 
      log.action.trim() !== '';
    
    if (!isValid && log) {
      console.warn("⚠️ Filtering out invalid log:", log);
    }
    return isValid;
  });

  console.log("✅ Valid logs for display:", validLogs);

  return (
    <div className="bg-slate-800/50 backdrop-blur-sm border border-purple-500/20 rounded-xl shadow-lg h-full flex flex-col">
      {/* Header - Fixed */}
      <div className="p-6 border-b border-purple-500/20 flex-shrink-0">
        <h3 className="text-lg font-semibold text-white flex items-center">
          <svg className="w-5 h-5 mr-2 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          Activity Feed ({validLogs.length})
        </h3>
      </div>
      
      {/* Scrollable Content */}
      <div className="flex-1 p-6 overflow-y-auto activity-scroll">
        <div className="space-y-2">
          {validLogs.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              <div className="text-3xl mb-2">📝</div>
              <p className="text-sm">No activity yet</p>
              <p className="text-xs mt-1 opacity-75">Task activities will appear here</p>
            </div>
          ) : (
            validLogs.map((log, i) => (
              <div key={i} className="bg-slate-700/30 border border-slate-600/50 rounded-lg p-3 hover:bg-slate-700/50 transition-colors">
                <div className="flex items-start space-x-3">
                  <span className="text-lg flex-shrink-0 mt-0.5">
                    {getActionIcon(getActionLabel(log))}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-white truncate">
                        {log?.user || 'Unknown User'}
                      </p>
                      <time className="text-xs text-slate-400 flex-shrink-0 ml-2">
                        {log?.timestamp ? new Date(log.timestamp).toLocaleTimeString() : '--:--'}
                      </time>
                    </div>
                    <p className="text-xs text-slate-300 mt-1">
                      {getActionLabel(log)}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default LogsTable;
  