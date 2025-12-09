import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { LayoutDashboard, Info } from "lucide-react";
import Column from "./Column";

const KanbanBoard = ({ tasks, roomId, socketId, userId, members, onTaskUpdated, onTaskDeleted }) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const [mounted, setMounted] = useState(false);
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const buttonRef = useRef(null);
  const tooltipRef = useRef(null);

  useEffect(() => {
    setMounted(true);
    setIsTouchDevice('ontouchstart' in window || navigator.maxTouchPoints > 0);
  }, []);

  // Close tooltip when clicking outside on mobile
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        isTouchDevice &&
        showTooltip &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target) &&
        tooltipRef.current &&
        !tooltipRef.current.contains(event.target)
      ) {
        setShowTooltip(false);
      }
    };

    if (isTouchDevice && showTooltip) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isTouchDevice, showTooltip]);

  useEffect(() => {
    const updateTooltipPosition = () => {
      if (buttonRef.current) {
        const rect = buttonRef.current.getBoundingClientRect();
        setTooltipPosition({
          top: rect.top,
          left: rect.left + rect.width / 2,
        });
      }
    };

    if (showTooltip) {
      updateTooltipPosition();
      window.addEventListener('scroll', updateTooltipPosition, true);
      window.addEventListener('resize', updateTooltipPosition);
    }

    return () => {
      window.removeEventListener('scroll', updateTooltipPosition, true);
      window.removeEventListener('resize', updateTooltipPosition);
    };
  }, [showTooltip]);
  const columns = [
    { 
      status: "todo", 
      title: "To-Do", 
      color: "from-gray-700 to-gray-600",
      bgColor: "bg-gray-800/50",
      borderColor: "border-blue-800/20",
      icon: "📋"
    },
    { 
      status: "inProgress", 
      title: "In Progress", 
      color: "from-gray-700 to-gray-600",
      bgColor: "bg-gray-800/50", 
      borderColor: "border-amber-800/20",
      icon: "⚡"
    },
    { 
      status: "done", 
      title: "Done", 
      color: "from-gray-700 to-gray-600",
      bgColor: "bg-gray-800/50",
      borderColor: "border-green-800/20", 
      icon: "✅"
    }
  ];

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 mb-3 sm:mb-4 xl:mb-6">
        <h2 className="text-lg sm:text-xl xl:text-2xl font-bold text-white mb-1 sm:mb-2 flex items-center">
          <LayoutDashboard className="w-5 h-5 sm:w-6 sm:h-6 mr-2 sm:mr-3 text-blue-400" />
          Task Board
        </h2>
        <p className="text-gray-400 text-xs sm:text-sm xl:text-base flex items-center gap-2">
          Manage and track your project tasks
          <button
            ref={buttonRef}
            className="relative inline-flex items-center justify-center text-gray-400 hover:text-blue-400 transition-colors cursor-pointer focus:outline-none"
            style={{ touchAction: 'manipulation' }}
            onMouseEnter={() => !isTouchDevice && setShowTooltip(true)}
            onMouseLeave={() => !isTouchDevice && setShowTooltip(false)}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setShowTooltip(!showTooltip);
            }}
            onTouchStart={(e) => {
              e.stopPropagation();
            }}
            aria-label="Show usage tips"
          >
            <Info className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </p>
        {mounted && showTooltip && buttonRef.current && createPortal(
          <div 
            ref={tooltipRef}
            className="fixed w-64 sm:w-80 bg-gray-800 border border-blue-600/30 rounded-lg p-3 shadow-xl z-[100] animate-fade-in"
            style={{
              top: `${tooltipPosition.top}px`,
              left: `${tooltipPosition.left}px`,
              transform: 'translate(-50%, -100%)',
              pointerEvents: isTouchDevice ? 'auto' : 'none',
              marginTop: '-8px',
            }}
          >
            <div className="space-y-2 text-xs sm:text-sm text-gray-300">
              <div className="flex items-start gap-2">
                <span className="text-blue-400 mt-0.5">•</span>
                <span>Drag and drop tasks to move them between columns</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-blue-400 mt-0.5">•</span>
                <span>Click on any value to edit it</span>
              </div>
            </div>
            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-gray-800 border-r border-b border-blue-600/30 transform rotate-45"></div>
          </div>,
          document.body
        )}
      </div>
      
      {/* Columns Container */}
      {/* Below xl: vertical stack, xl+: horizontal flex row */}
      <div className="flex-1 min-h-0 overflow-hidden">
        <div className="h-full flex flex-col lg:flex-row gap-3 sm:gap-4 lg:gap-6 overflow-y-auto lg:overflow-y-hidden lg:overflow-x-auto pb-2 lg:pb-0">
          {columns.map(col => (
            <Column
              key={col.status}
              title={col.title}
              status={col.status}
              color={col.color}
              bgColor={col.bgColor}
              borderColor={col.borderColor}
              icon={col.icon}
              tasks={tasks.filter(task => task.status === col.status)}
              allTasks={tasks}
              roomId={roomId}
              socketId={socketId}
              userId={userId}
              members={members}
              onTaskUpdated={onTaskUpdated}
              onTaskDeleted={onTaskDeleted}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default KanbanBoard;
