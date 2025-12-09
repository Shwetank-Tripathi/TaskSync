import { Plus } from "lucide-react";

const CreateTaskButton = ({ onClick }) => {
    return (
        <button
            onClick={onClick}
            className="w-full py-3 sm:py-4 bg-blue-800 hover:bg-blue-900 text-white font-semibold rounded-lg sm:rounded-xl transition-all duration-200 shadow-lg hover:shadow-blue-800/25 hover:-translate-y-0.5 group cursor-pointer text-sm sm:text-base"
        >
            <div className="flex items-center justify-center">
                <Plus className="w-4 h-4 sm:w-5 sm:h-5 mr-1.5 sm:mr-2 group-hover:scale-110 transition-transform duration-200" />
                Create New Task
            </div>
        </button>
    );
};

export default CreateTaskButton;