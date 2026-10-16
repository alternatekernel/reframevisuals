import { Router } from 'express';
import { prisma } from '../database';

const router = Router();

// ─────────────────────────────────────────────────────────────
// GET /api/tasks
// Returns all tasks grouped by status
// ─────────────────────────────────────────────────────────────

router.get('/', async (req, res) => {
  try {
    const { status, assignee, priority } = req.query;

    const where: any = {};
    if (status && status !== 'all') where.status = status as string;
    if (assignee) where.assignees = { contains: assignee as string };
    if (priority && priority !== 'all') where.priority = priority as string;

    const tasks = await prisma.task.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    // Group by status
    const grouped = {
      todo: tasks.filter((t: any) => t.status === 'todo'),
      inProgress: tasks.filter((t: any) => t.status === 'in_progress'),
      review: tasks.filter((t: any) => t.status === 'review'),
      done: tasks.filter((t: any) => t.status === 'done'),
    };

    return res.json({
      tasks,
      grouped,
      totalCount: tasks.length,
    });
  } catch (error: any) {
    return res.status(500).json({
      error: { code: 'TASKS_ERROR', message: error.message },
    });
  }
});

// ─────────────────────────────────────────────────────────────
// POST /api/tasks
// Create a new task
// ─────────────────────────────────────────────────────────────

router.post('/', async (req, res) => {
  try {
    const { title, description, assignees, priority, dueDate, labels } = req.body;

    const task = await prisma.task.create({
      data: {
        title,
        description,
        assignees: assignees ? JSON.stringify(assignees) : null,
        priority: priority || 'medium',
        dueDate: dueDate ? new Date(dueDate) : null,
        labels: labels ? JSON.stringify(labels) : null,
        status: 'todo',
      },
    });

    return res.status(201).json({ task, message: 'Task created successfully' });
  } catch (error: any) {
    return res.status(400).json({
      error: { code: 'CREATE_TASK_ERROR', message: error.message },
    });
  }
});

// ─────────────────────────────────────────────────────────────
// PATCH /api/tasks/:id
// Update task (status, assignees, etc.)
// ─────────────────────────────────────────────────────────────

router.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, assignees, priority, dueDate, labels, title, description } = req.body;

    const updateData: any = {};
    if (status) updateData.status = status;
    if (assignees) updateData.assignees = JSON.stringify(assignees);
    if (priority) updateData.priority = priority;
    if (dueDate) updateData.dueDate = new Date(dueDate);
    if (labels) updateData.labels = JSON.stringify(labels);
    if (title) updateData.title = title;
    if (description) updateData.description = description;

    const task = await prisma.task.update({
      where: { id },
      data: updateData,
    });

    return res.json({ task, message: 'Task updated successfully' });
  } catch (error: any) {
    return res.status(400).json({
      error: { code: 'UPDATE_TASK_ERROR', message: error.message },
    });
  }
});

// ─────────────────────────────────────────────────────────────
// DELETE /api/tasks/:id
// Delete a task
// ─────────────────────────────────────────────────────────────

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.task.delete({ where: { id } });
    return res.json({ message: 'Task deleted successfully' });
  } catch (error: any) {
    return res.status(400).json({
      error: { code: 'DELETE_TASK_ERROR', message: error.message },
    });
  }
});

export default router;
