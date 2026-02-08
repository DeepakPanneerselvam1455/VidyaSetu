
import React, { useState } from 'react';
import { Task, Subtask } from '../types';

interface TaskItemProps {
  task: Task;
  onToggleTask: (id: string) => void;
  onDeleteTask: (id: string) => void;
  onAddSubtask: (taskId: string, title: string) => void;
  onToggleSubtask: (taskId: string, subtaskId: string) => void;
  onDeleteSubtask: (taskId: string, subtaskId: string) => void;
}

const TaskItem: React.FC<TaskItemProps> = ({ 
  task, 
  onToggleTask, 
  onDeleteTask, 
  onAddSubtask, 
  onToggleSubtask, 
  onDeleteSubtask 
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');

  const handleAddSubtask = (e: React.FormEvent) => {
    e.preventDefault();
    if (newSubtaskTitle.trim()) {
      onAddSubtask(task.id, newSubtaskTitle);
      setNewSubtaskTitle('');
    }
  };

  const completedSubtasks = task.subtasks?.filter(st => st.completed).length || 0;
  const totalSubtasks = task.subtasks?.length || 0;
  const progress = totalSubtasks === 0 ? 0 : Math.round((completedSubtasks / totalSubtasks) * 100);

  return (
    <div className={`border rounded-lg p-4 mb-2 ${task.completed ? 'bg-gray-50' : 'bg-white'} shadow-sm`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 flex-1">
          <input
            type="checkbox"
            checked={task.completed}
            onChange={() => onToggleTask(task.id)}
            className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span className={`text-lg ${task.completed ? 'line-through text-gray-500' : 'text-gray-900'}`}>
            {task.title}
          </span>
        </div>
        
        <div className="flex items-center gap-2">
          {totalSubtasks > 0 && (
            <div className="text-sm text-gray-500 mr-2 flex items-center gap-2">
              <div className="w-20 bg-gray-200 rounded-full h-2.5">
                <div 
                  className="bg-blue-600 h-2.5 rounded-full transition-all duration-300" 
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
              <span>{completedSubtasks}/{totalSubtasks}</span>
            </div>
          )}
          
          <button 
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-gray-500 hover:text-blue-600 px-2 py-1 rounded transition-colors"
          >
            {isExpanded ? 'Hide Subtasks' : totalSubtasks > 0 ? `Show Subtasks (${totalSubtasks})` : 'Add Subtasks'}
          </button>
          
          <button 
            onClick={() => onDeleteTask(task.id)}
            className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50 transition-colors"
            title="Delete task"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="mt-4 ml-8 pl-4 border-l-2 border-gray-200 space-y-3">
          {/* Subtasks List */}
          {task.subtasks && task.subtasks.length > 0 && (
            <div className="space-y-2">
              {task.subtasks.map(subtask => (
                <div key={subtask.id} className="flex items-center justify-between group">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={subtask.completed}
                      onChange={() => onToggleSubtask(task.id, subtask.id)}
                      className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className={`text-sm ${subtask.completed ? 'line-through text-gray-500' : 'text-gray-700'}`}>
                      {subtask.title}
                    </span>
                  </div>
                  <button
                    onClick={() => onDeleteSubtask(task.id, subtask.id)}
                    className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                    title="Delete subtask"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Add Subtask Form */}
          <form onSubmit={handleAddSubtask} className="flex gap-2 mt-2">
            <input
              type="text"
              value={newSubtaskTitle}
              onChange={(e) => setNewSubtaskTitle(e.target.value)}
              placeholder="Add a subtask..."
              className="flex-1 text-sm px-3 py-1.5 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
            <button
              type="submit"
              disabled={!newSubtaskTitle.trim()}
              className="text-sm px-3 py-1.5 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Add
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default TaskItem;
    