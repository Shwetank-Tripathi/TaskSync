import { useMessage } from "../hooks/useMessage";

const GlobalMessageDisplay = () => {
    const { message, type } = useMessage();
    if (!message) return null;

    const getIcon = (type) => {
        switch (type) {
            case 'success': return '✅';
            case 'error': return '❌';
            case 'info': return 'ℹ️';
            default: return '📝';
        }
    };

    const baseStyle = "fixed top-4 right-4 px-6 py-4 rounded-xl shadow-2xl z-50 animate-slide-in-right text-white text-sm max-w-sm border backdrop-blur-lg";
    const variantStyle = {
        success: "bg-green-500/90 border-green-400/50 shadow-green-500/25",
        error: "bg-red-500/90 border-red-400/50 shadow-red-500/25",
        info: "bg-blue-500/90 border-blue-400/50 shadow-blue-500/25",
    }

    return (
        <div className={`${baseStyle} ${variantStyle[type] || "bg-slate-800/90 border-slate-600/50"}`}>
            <div className="flex items-center space-x-3">
                <span className="text-lg">{getIcon(type)}</span>
                <p className="font-medium">{message}</p>
            </div>
        </div>
    );
};

export default GlobalMessageDisplay;