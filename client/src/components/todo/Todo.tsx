import { useState, useEffect } from 'react';
import API from '../../api';
import './Todo.css';

interface Todo {
  id: number;
  task: string;
  is_completed: boolean;
  created_at: string;
}

function Todo() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [newTask, setNewTask] = useState('');
  const [editId, setEditId] = useState<number | null>(null);
  const [editTask, setEditTask] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchTodos();
  }, []);

  const fetchTodos = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/todos`);
      const data = await res.json();
      setTodos(data);
    } catch {
      console.error('Failed to fetch todos');
    } finally {
      setLoading(false);
    }
  };

  const addTodo = async () => {
    if (!newTask.trim()) return;
    try {
      await fetch(`${API}/todos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ task: newTask }),
      });
      setNewTask('');
      fetchTodos();
    } catch {
      console.error('Failed to add todo');
    }
  };

  const deleteTodo = async (id: number) => {
    try {
      await fetch(`${API}/todos/${id}`, { method: 'DELETE' });
      fetchTodos();
    } catch {
      console.error('Failed to delete todo');
    }
  };

  const toggleComplete = async (id: number) => {
    try {
      await fetch(`${API}/todos/${id}/complete`, { method: 'PATCH' });
      fetchTodos();
    } catch {
      console.error('Failed to toggle todo');
    }
  };

  const startEdit = (todo: Todo) => {
    setEditId(todo.id);
    setEditTask(todo.task);
  };

  const saveEdit = async (id: number) => {
    if (!editTask.trim()) return;
    try {
      await fetch(`${API}/todos/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ task: editTask }),
      });
      setEditId(null);
      fetchTodos();
    } catch {
      console.error('Failed to save edit');
    }
  };

  const cancelEdit = () => {
    setEditId(null);
    setEditTask('');
  };

  const completedCount = todos.filter((t) => t.is_completed).length;

  return (
    <div className="todo-wrapper">
      <div className="todo-container">
        <div className="todo-header">
          <h1>My Todo List</h1>
          <span className="todo-count">
            {completedCount}/{todos.length} completed
          </span>
        </div>

        <div className="todo-input-row">
          <input
            type="text"
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addTodo()}
            placeholder="Add a new task..."
            className="todo-input"
          />
          <button onClick={addTodo} className="btn btn-add">
            Add
          </button>
        </div>

        {loading ? (
          <p className="loading-text">Loading...</p>
        ) : todos.length === 0 ? (
          <p className="empty-text">No tasks yet. Add one above!</p>
        ) : (
          <ul className="todo-list">
            {todos.map((todo) => (
              <li
                key={todo.id}
                className={`todo-item ${todo.is_completed ? 'completed' : ''}`}
              >
                <input
                  type="checkbox"
                  checked={todo.is_completed}
                  onChange={() => toggleComplete(todo.id)}
                  className="todo-checkbox"
                />

                {editId === todo.id ? (
                  <div className="edit-row">
                    <input
                      type="text"
                      value={editTask}
                      onChange={(e) => setEditTask(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && saveEdit(todo.id)}
                      className="edit-input"
                      autoFocus
                    />
                    <button onClick={() => saveEdit(todo.id)} className="btn btn-save">
                      Save
                    </button>
                    <button onClick={cancelEdit} className="btn btn-cancel">
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div className="task-row">
                    <span className="task-text">{todo.task}</span>
                    <div className="task-actions">
                      <button
                        onClick={() => startEdit(todo)}
                        className="btn btn-edit"
                        disabled={todo.is_completed}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => deleteTodo(todo.id)}
                        className="btn btn-delete"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default Todo;
