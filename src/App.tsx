
import React, { useState } from 'react';
import TaskList from './components/TaskList';
import AddTaskForm from './components/AddTaskForm';
import TaskItem from './components/TaskItem';
import { Task, Subtask } from './types';
import { v4 as uuidv4 } from 'uuid'; // Assuming you use uuid or similar for IDs

const App: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);

  // ... existing task handlers (addTask, toggleTask, deleteTask) ...

  const addTask = (title: string) => {
    const newTask: Task = {
      id: uuidv4(),
      title,
      completed: false,
      subtasks: []
    };
    setTasks([...tasks, newTask]);
  };

  const toggleTask = (id: string) => {
    setTasks(tasks.map(task => 
      task.id === id ? { ...task, completed: !task.completed } : task
    ));
  };

  const deleteTask = (id: string) => {
    setTasks(tasks.filter(task => task.id !== id));
  };

  // --- New Subtask Handlers ---

  const addSubtask = (taskId: string, title: string) => {
    setTasks(tasks.map(task => {
      if (task.id === taskId) {
        const newSubtask: Subtask = {
          id: uuidv4(),
          title,
          completed: false
        };
        return {
          ...task,
          subtasks: [...(task.subtasks || []), newSubtask]
        };
      }
      return task;
    }));
  };

  const toggleSubtask = (taskId: string, subtaskId: string) => {
    setTasks(tasks.map(task => {
      if (task.id === taskId) {
        return {
          ...task,
          subtasks: task.subtasks?.map(st => 
            st.id === subtaskId ? { ...st, completed: !st.completed } : st
          )
        };
      }
      return task;
    }));
  };

  const deleteSubtask = (taskId: string, subtaskId: string) => {
    setTasks(tasks.map(task => {
      if (task.id === taskId) {
        return {
          ...task,
          subtasks: task.subtasks?.filter(st => st.id !== subtaskId)
        };
      }
      return task;
    }));
  };

  return (
    <div className="container mx-auto p-4 max-w-2xl">
      <h1 className="text-3xl font-bold text-center mb-8 text-gray-800">Task Master</h1>
      
      <AddTaskForm onAdd={addTask} />
      
      <div className="mt-8 space-y-4">
        {tasks.length === 0 ? (
          <p className="text-center text-gray-500 py-8">No tasks yet. Add one above!</p>
        ) : (
          tasks.map(task => (
            <TaskItem
              key={task.id}
              task={task}
              onToggleTask={toggleTask}
              onDeleteTask={deleteTask}
              onAddSubtask={addSubtask}
              onToggleSubtask={toggleSubtask}
              onDeleteSubtask={deleteSubtask}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default App;