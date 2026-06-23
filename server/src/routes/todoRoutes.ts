import { Router } from 'express';
import {
  getAllTodos,
  createTodo,
  updateTodo,
  toggleComplete,
  deleteTodo,
} from '../controllers/todoController';

const router = Router();

router.get('/', getAllTodos);
router.post('/', createTodo);
router.put('/:id', updateTodo);
router.patch('/:id/complete', toggleComplete);
router.delete('/:id', deleteTodo);

export default router;
