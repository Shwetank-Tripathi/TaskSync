import { useMessage } from "../hooks/useMessage";

const GlobalMessageDisplay = () => {
    // Assuming useError returns an object with an error property
    const { message, type } = useMessage();
    if (!message) return null;

    const baseStyle = "fixed bottom-5 left-5 px-4 py-2 rounded shadow-lg z-50 animate-fade-in text-white text-sm";
    const variantStyle = {
        success: "bg-green-600",
        error: "bg-red-600",
        info: "bg-blue-600",
    }

    return (
        <div className={`${baseStyle} ${variantStyle[type] || "bg-gray-800"} `}>
            <p>{message}</p>
        </div>
    );
};

export default GlobalMessageDisplay;