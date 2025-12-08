const CreateTaskButton = ({ onClick }) => {
    return (
        <button
            onClick={onClick}
            className="w-full py-3 sm:py-4 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold rounded-lg sm:rounded-xl transition-all duration-200 shadow-lg hover:shadow-purple-500/25 hover:-translate-y-0.5 group cursor-pointer text-sm sm:text-base"
        >
            <div className="flex items-center justify-center">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-1.5 sm:mr-2 group-hover:scale-110 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Create New Task
            </div>
        </button>
    );
};

export default CreateTaskButton;