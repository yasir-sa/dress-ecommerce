import { Request, Response } from 'express';
import pool from '../config/db';

export const getAllTodos = async (_req: Request, res: Response): Promise<void> => {
  try {
    const result = await pool.query('SELECT * FROM todo ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch todos' });
  }
};

export const createTodo = async (req: Request, res: Response): Promise<void> => {
  const { task } = req.body;
  if (!task || !task.trim()) {
    res.status(400).json({ error: 'Task is required' });
    return;
  }
  try {
    const result = await pool.query(
      'INSERT INTO todo (task) VALUES ($1) RETURNING *',
      [task.trim()]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create todo' });
  }
};

export const updateTodo = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { task } = req.body;
  if (!task || !task.trim()) {
    res.status(400).json({ error: 'Task is required' });
    return;
  }
  try {
    const result = await pool.query(
      'UPDATE todo SET task = $1 WHERE id = $2 RETURNING *',
      [task.trim(), id]
    );
    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Todo not found' });
      return;
    }
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update todo' });
  }
};

export const toggleComplete = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      'UPDATE todo SET is_completed = NOT is_completed WHERE id = $1 RETURNING *',
      [id]
    );
    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Todo not found' });
      return;
    }
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to toggle todo' });
  }
};

export const deleteTodo = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  try {
    const result = await pool.query('DELETE FROM todo WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Todo not found' });
      return;
    }
    res.json({ message: 'Todo deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete todo' });
  }
};
