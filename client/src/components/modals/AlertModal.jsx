const AlertModal = ({ isOpen, onClose, title, message, type = "info", showCancel = false, onConfirm }) => {
    if (!isOpen) return null;
  
    const getIcon = () => {
      switch (type) {
        case "success":
          return (
            <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          );
        case "error":
          return (
            <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
          );
        case "warning":
          return (
            <div className="w-12 h-12 bg-yellow-500/20 rounded-full flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.664-.833-2.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
          );
        case "confirm":
          return (
            <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          );
        default:
          return (
            <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          );
      }
    };
  
    const handleBackdropClick = (e) => {
      if (e.target === e.currentTarget) {
        onClose();
      }
    };
  
    const handleConfirm = () => {
      if (onConfirm) {
        onConfirm();
      }
      onClose();
    };
  
    return (
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        onClick={handleBackdropClick}
      >
        <div className="bg-slate-800 border border-purple-500/30 rounded-2xl p-8 max-w-md w-full shadow-2xl animate-slide-in-right">
          <div className="text-center">
            {getIcon()}
            
            {title && (
              <h3 className="text-xl font-bold text-white mb-4">
                {title}
              </h3>
            )}
            
            <p className="text-slate-300 mb-6 leading-relaxed">
              {message}
            </p>
            
            <div className="flex gap-3 justify-center">
              {showCancel && (
                <button 
                  onClick={onClose}
                  className="px-6 py-2 bg-slate-600 hover:bg-slate-500 text-white font-medium rounded-lg transition-all duration-200"
                >
                  Cancel
                </button>
              )}
              <button 
                onClick={handleConfirm}
                className={`px-6 py-2 font-medium rounded-lg transition-all duration-200 ${
                  type === "error" 
                    ? "bg-red-500 hover:bg-red-600 text-white" 
                    : type === "warning"
                    ? "bg-yellow-500 hover:bg-yellow-600 text-white"
                    : "bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-lg hover:shadow-purple-500/25"
                }`}
              >
                {showCancel ? "Confirm" : "OK"}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };
  
  export default AlertModal;


