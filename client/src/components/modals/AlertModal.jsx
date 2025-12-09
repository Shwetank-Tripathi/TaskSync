import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { CheckCircle2, XCircle, AlertTriangle, Info } from "lucide-react";

const AlertModal = ({ isOpen, onClose, title, message, type = "info", showCancel = false, onConfirm }) => {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted || !isOpen) return null;
  
    const getIcon = () => {
      switch (type) {
        case "success":
          return (
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-500/20 rounded-full flex items-center justify-center mb-3 sm:mb-4">
              <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6 text-green-400" />
            </div>
          );
        case "error":
          return (
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-red-500/20 rounded-full flex items-center justify-center mb-3 sm:mb-4">
              <XCircle className="w-5 h-5 sm:w-6 sm:h-6 text-red-400" />
            </div>
          );
        case "warning":
          return (
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-yellow-500/20 rounded-full flex items-center justify-center mb-3 sm:mb-4">
              <AlertTriangle className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-400" />
            </div>
          );
        case "confirm":
          return (
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-500/20 rounded-full flex items-center justify-center mb-3 sm:mb-4">
              <Info className="w-5 h-5 sm:w-6 sm:h-6 text-blue-400" />
            </div>
          );
        default:
          return (
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-500/20 rounded-full flex items-center justify-center mb-3 sm:mb-4">
              <Info className="w-5 h-5 sm:w-6 sm:h-6 text-blue-400" />
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
  
    return createPortal(
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[100] p-2 sm:p-4"
        onClick={handleBackdropClick}
      >
        <div className="bg-gray-900 border border-blue-600/30 rounded-xl sm:rounded-2xl p-4 sm:p-6 lg:p-8 max-w-xs sm:max-w-md w-full shadow-2xl animate-slide-in-right">
          <div className="text-center">
            {getIcon()}
            
            {title && (
              <h3 className="text-base sm:text-lg lg:text-xl font-bold text-white mb-2 sm:mb-4">
                {title}
              </h3>
            )}
            
            <p className="text-gray-300 mb-4 sm:mb-6 leading-relaxed text-sm sm:text-base">
              {message}
            </p>
            
            <div className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3 justify-center">
              {showCancel && (
                <button 
                  onClick={onClose}
                  className="px-4 sm:px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white font-medium rounded-lg transition-all duration-200 cursor-pointer text-sm sm:text-base"
                >
                  Cancel
                </button>
              )}
              <button 
                onClick={handleConfirm}
                className={`px-4 sm:px-6 py-2 font-medium rounded-lg transition-all duration-200 cursor-pointer text-sm sm:text-base ${
                  type === "error" 
                    ? "bg-red-500 hover:bg-red-600 text-white" 
                    : type === "warning"
                    ? "bg-yellow-500 hover:bg-yellow-600 text-white"
                    : "bg-blue-800 hover:bg-blue-900 text-white shadow-lg hover:shadow-blue-800/25"
                }`}
              >
                {showCancel ? "Confirm" : "OK"}
              </button>
            </div>
          </div>
        </div>
      </div>,
      document.body
    );
  };
  
  export default AlertModal;


