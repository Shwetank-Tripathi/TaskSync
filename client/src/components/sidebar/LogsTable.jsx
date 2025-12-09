import { Activity, Plus, Trash2, RefreshCw, User, Pencil, FileText } from "lucide-react";

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
        return <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />;
      case 'Delete':
        return <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />;
      case 'Drag-Drop':
        return <RefreshCw className="w-3.5 h-3.5 sm:w-4 sm:h-4" />;
      case 'Assign':
        return <User className="w-3.5 h-3.5 sm:w-4 sm:h-4" />;
      case 'Edit Description':
      case 'Edit Title':
      case 'Edit Priority':
      case 'Edit':
      case 'Edit Multiple':
        return <Pencil className="w-3.5 h-3.5 sm:w-4 sm:h-4" />;
      default:
        return <FileText className="w-3.5 h-3.5 sm:w-4 sm:h-4" />;
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
    <div className="bg-gray-800 backdrop-blur-sm border border-gray-700 rounded-lg sm:rounded-xl shadow-lg h-full flex flex-col">
      {/* Header - Fixed */}
      <div className="p-3 sm:p-4 lg:p-6 border-b border-gray-700 flex-shrink-0">
        <h3 className="text-sm sm:text-base lg:text-lg font-semibold text-white flex items-center">
          <Activity className="w-4 h-4 sm:w-5 sm:h-5 mr-1.5 sm:mr-2 text-blue-400" />
          Activity ({validLogs.length})
        </h3>
      </div>
      
      {/* Scrollable Content */}
      <div className="flex-1 p-3 sm:p-4 lg:p-6 overflow-y-auto activity-scroll min-h-0">
        <div className="space-y-1.5 sm:space-y-2">
          {validLogs.length === 0 ? (
            <div className="text-center py-6 sm:py-8 text-gray-400">
              <FileText className="w-8 h-8 sm:w-12 sm:h-12 mx-auto mb-2 text-gray-500" />
              <p className="text-xs sm:text-sm">No activity yet</p>
              <p className="text-[10px] sm:text-xs mt-1 opacity-75">Task activities will appear here</p>
            </div>
          ) : (
            validLogs.map((log, i) => (
              <div key={i} className="bg-gray-700/30 border border-gray-600/50 rounded-md sm:rounded-lg p-2 sm:p-3 hover:bg-gray-700/50 transition-colors">
                <div className="flex items-start space-x-2 sm:space-x-3">
                  <span className="flex-shrink-0 mt-0.5 text-blue-400">
                    {getActionIcon(getActionLabel(log))}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <p className="text-xs sm:text-sm font-medium text-white truncate">
                        {log?.user || 'Unknown User'}
                      </p>
                      <time className="text-[10px] sm:text-xs text-gray-400 flex-shrink-0">
                        {log?.timestamp ? new Date(log.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '--:--'}
                      </time>
                    </div>
                    <p className="text-[10px] sm:text-xs text-gray-300 mt-0.5 sm:mt-1">
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
  