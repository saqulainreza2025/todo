import React, { useEffect, useState, useCallback, memo, useMemo } from 'react';
import { addTodo, getTodos, deleteTodo as removeFromDb, updateTodoStatus, updateTodoText } from './services/todoService';
import './App.css';

interface Todo {
  id: string;
  text: string;
  completed: boolean;
}

// Memoized TodoItem component to prevent unnecessary re-renders
const TodoItem = memo(({ 
  todo, 
  onToggle, 
  onDelete, 
  onEdit, 
  isEditing, 
  editText, 
  setEditText, 
  onSave, 
  onCancel 
}: {
  todo: Todo;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (id: string, text: string) => void;
  isEditing: boolean;
  editText: string;
  setEditText: (text: string) => void;
  onSave: (id: string) => void;
  onCancel: () => void;
}) => (
  <li className={todo.completed ? 'completed' : ''}>
    <input
      type="checkbox"
      checked={todo.completed}
      onChange={() => onToggle(todo.id)}
    />
    {isEditing ? (
      <div className="edit-mode">
        <input
          type="text"
          value={editText}
          onChange={(e) => setEditText(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && onSave(todo.id)}
          autoFocus
        />
        <button className="save-btn" onClick={() => onSave(todo.id)}>Save</button>
        <button className="cancel-btn" onClick={onCancel}>Cancel</button>
      </div>
    ) : (
      <>
        <span>{todo.text}</span>
        <div className="button-group">
          <button className="edit-btn" onClick={() => onEdit(todo.id, todo.text)}>Edit</button>
          <button className="delete-btn" onClick={() => onDelete(todo.id)}>Delete</button>
        </div>
      </>
    )}
  </li>
));

function App() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [deletedTodos, setDeletedTodos] = useState<Todo[]>([]);
  const [input, setInput] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [showBin, setShowBin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Sort todos to move completed items to the bottom
  const sortedTodos = useMemo(() => {
    return [...todos].sort((a, b) => {
      if (a.completed === b.completed) {
        return 0;
      }
      return a.completed ? 1 : -1; // Move completed items to the bottom
    });
  }, [todos]);

  const fetchTodos = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getTodos();
      setTodos(data as Todo[]);
      setError(null);
    } catch (error) {
      console.error('Error fetching todos:', error);
      setError('Failed to load todos. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTodos();
  }, [fetchTodos]);

  const handleAddTodo = async () => {
    if (input.trim() !== '') {
      try {
        setLoading(true);
        await addTodo(input.trim());
        await fetchTodos();
        setInput('');
      } catch (error) {
        console.error('Error adding todo:', error);
        setError('Failed to add todo. Please try again.');
      } finally {
        setLoading(false);
      }
    }
  };

  const toggleTodo = async (id: string) => {
    try {
      const todo = todos.find(t => t.id === id);
      if (todo) {
        await updateTodoStatus(id, !todo.completed);
        await fetchTodos();
      }
    } catch (error) {
      console.error('Error toggling todo:', error);
      setError('Failed to update todo. Please try again.');
    }
  };

  const handleDeleteTodo = async (id: string) => {
    try {
      const todoToDelete = todos.find(todo => todo.id === id);
      if (todoToDelete) {
        setDeletedTodos(prev => [...prev, todoToDelete]);
        await removeFromDb(id);
        await fetchTodos();
      }
    } catch (error) {
      console.error('Error deleting todo:', error);
      setError('Failed to delete todo. Please try again.');
    }
  };

  const startEditing = (id: string, text: string) => {
    setEditingId(id);
    setEditText(text);
  };

  const handleSaveEdit = async (id: string) => {
    if (editText.trim() !== '') {
      try {
        setLoading(true);
        await updateTodoText(id, editText.trim());
        await fetchTodos();
        setEditingId(null);
        setEditText('');
      } catch (error) {
        console.error('Error updating todo:', error);
        setError('Failed to update todo. Please try again.');
      } finally {
        setLoading(false);
      }
    }
  };

  const restoreTodo = async (id: string) => {
    const todoToRestore = deletedTodos.find(todo => todo.id === id);
    if (todoToRestore) {
      try {
        await addTodo(todoToRestore.text);
        setDeletedTodos(prev => prev.filter(todo => todo.id !== id));
        await fetchTodos();
      } catch (error) {
        console.error('Error restoring todo:', error);
        setError('Failed to restore todo. Please try again.');
      }
    }
  };

  const permanentlyDeleteTodo = (id: string) => {
    setDeletedTodos(prev => prev.filter(todo => todo.id !== id));
  };

  if (loading && todos.length === 0) {
    return (
      <div className="loading-container">
        <div className="loading-spinner" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <p className="error-message">{error}</p>
        <button onClick={fetchTodos}>Retry</button>
      </div>
    );
  }

  return (
    <div className="App">
      <div className="header-section">
        <h1>Make Your Dreams Come True</h1>  
        <div className="counter-section">
          <span className="todo-counter">Active Todos ({todos.filter(t => !t.completed).length})</span>
          <button 
            className={`bin-tab ${showBin ? 'active' : ''}`} 
            onClick={() => setShowBin(!showBin)}
          >
            {showBin ? 'Back to Todos' : `Bin (${deletedTodos.length})`}
          </button>
        </div>
      </div>

      {!showBin ? (
        <>
          <div className="add-todo">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Add a new todo"
              onKeyPress={(e) => e.key === 'Enter' && handleAddTodo()}
              disabled={loading}
            />
            <button onClick={handleAddTodo} disabled={loading}>
              {loading ? '...' : 'Add'}
            </button>
          </div>
          <div className="todo-lists">
            <ul className="todo-list">
              {sortedTodos.map(todo => (
                <TodoItem
                  key={todo.id}
                  todo={todo}
                  onToggle={toggleTodo}
                  onDelete={handleDeleteTodo}
                  onEdit={startEditing}
                  isEditing={editingId === todo.id}
                  editText={editText}
                  setEditText={setEditText}
                  onSave={handleSaveEdit}
                  onCancel={() => setEditingId(null)}
                />
              ))}
            </ul>
          </div>
        </>
      ) : (
        <div className="bin-content">
          <h2>Deleted Items</h2>
          <ul className="todo-list deleted-list">
            {deletedTodos.map(todo => (
              <li key={todo.id} className={todo.completed ? 'completed' : ''}>
                <span>{todo.text}</span>
                <div className="button-group">
                  <button className="restore-btn" onClick={() => restoreTodo(todo.id)}>
                    Restore
                  </button>
                  <button 
                    className="permanent-delete-btn" 
                    onClick={() => permanentlyDeleteTodo(todo.id)}
                  >
                    Delete Permanently
                  </button>
                </div>
              </li>
            ))}
            {deletedTodos.length === 0 && (
              <li className="empty-bin">Bin is empty</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}

export default App; 